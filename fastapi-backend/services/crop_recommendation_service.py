"""
AgriSens Crop Recommendation Service
Integrates the working crop recommendation model from AgriSens
"""

import os
import pickle
import numpy as np
import pandas as pd
import logging
from typing import Dict, Any, List, Optional
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger(__name__)

class CropRecommendationService:
    """Real crop recommendation service using AgriSens model"""
    
    def __init__(self):
        self.model = None
        self.is_initialized = False
        self.models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        self.supported_crops = [
            'apple', 'banana', 'blackgram', 'chickpea', 'coconut', 'coffee', 
            'cotton', 'grapes', 'jute', 'kidneybeans', 'lentil', 'maize', 
            'mango', 'mothbeans', 'mungbean', 'muskmelon', 'orange', 'papaya', 
            'pigeonpeas', 'pomegranate', 'rice', 'watermelon'
        ]
        
        # Crop feature requirements for validation
        self.feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        
    async def initialize(self):
        """Initialize the crop recommendation model"""
        try:
            logger.info("🌾 Initializing Crop Recommendation Service...")
            
            # Try to load the pre-trained model
            model_path = os.path.join(self.models_dir, 'RF.pkl')
            
            if os.path.exists(model_path):
                try:
                    self.model = pickle.load(open(model_path, 'rb'))
                    logger.info("✅ AgriSens crop recommendation model loaded successfully")
                    self.is_initialized = True
                    return True
                except Exception as e:
                    logger.warning(f"⚠️ Error loading pre-trained model: {e}")
                    return await self._train_new_model()
            else:
                logger.warning("⚠️ Pre-trained model not found, training new model...")
                return await self._train_new_model()
                
        except Exception as e:
            logger.error(f"❌ Crop recommendation service initialization failed: {str(e)}")
            self.is_initialized = False
            return False
    
    async def _train_new_model(self):
        """Train a new model from the dataset if pre-trained model is not available"""
        try:
            # Load the dataset
            dataset_path = os.path.join(self.models_dir, 'Crop_recommendation.csv')
            
            if not os.path.exists(dataset_path):
                logger.error(f"❌ Dataset not found at {dataset_path}")
                return False
            
            df = pd.read_csv(dataset_path)
            logger.info(f"✅ Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
            
            # Prepare features and target
            X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
            y = df['label']
            
            # Train Random Forest model
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
            self.model.fit(X, y)
            
            # Save the new model
            new_model_path = os.path.join(self.models_dir, 'RF_new.pkl')
            pickle.dump(self.model, open(new_model_path, 'wb'))
            
            logger.info("✅ New crop recommendation model trained and saved")
            self.is_initialized = True
            return True
            
        except Exception as e:
            logger.error(f"❌ Error training new model: {str(e)}")
            return False
    
    async def recommend_crop(self, N: float, P: float, K: float, 
                           temperature: float, humidity: float, 
                           ph: float, rainfall: float) -> Dict[str, Any]:
        """
        Recommend optimal crop based on soil and environmental parameters
        Returns only the crop recommendation without description (as requested)
        """
        try:
            if not self.is_initialized or self.model is None:
                raise Exception("Crop recommendation service not initialized")
            
            # Validate input parameters
            self._validate_inputs(N, P, K, temperature, humidity, ph, rainfall)
            
            # Prepare input for model
            input_data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
            
            # Make prediction
            predicted_crop = self.model.predict(input_data)[0]
            
            # Get prediction probabilities for confidence
            if hasattr(self.model, 'predict_proba'):
                probabilities = self.model.predict_proba(input_data)[0]
                crop_classes = self.model.classes_
                
                # Create confidence scores for all crops
                crop_probabilities = {}
                for i, crop in enumerate(crop_classes):
                    crop_probabilities[crop] = float(probabilities[i])
                
                # Get top 3 recommendations
                top_crops = sorted(crop_probabilities.items(), 
                                 key=lambda x: x[1], reverse=True)[:3]
                
                confidence = crop_probabilities[predicted_crop]
            else:
                confidence = 0.85
                top_crops = [(predicted_crop, confidence)]
            
            # Analyze soil conditions
            soil_analysis = self._analyze_soil_conditions(N, P, K, ph)
            
            # Analyze environmental conditions
            environmental_analysis = self._analyze_environmental_conditions(
                temperature, humidity, rainfall)
            
            return {
                "success": True,
                "recommended_crop": predicted_crop,
                "confidence": round(confidence, 3),
                "top_3_recommendations": [
                    {
                        "crop": crop,
                        "confidence": round(prob, 3)
                    } for crop, prob in top_crops
                ],
                "soil_analysis": soil_analysis,
                "environmental_analysis": environmental_analysis,
                "input_parameters": {
                    "nitrogen": N,
                    "phosphorus": P,
                    "potassium": K,
                    "temperature": temperature,
                    "humidity": humidity,
                    "ph": ph,
                    "rainfall": rainfall
                },
                "model_type": "AgriSens Random Forest",
                "supported_crops": len(self.supported_crops)
            }
            
        except Exception as e:
            logger.error(f"❌ Crop recommendation error: {str(e)}")
            raise
    
    async def get_crop_recommendations_batch(self, 
                                           conditions_list: List[Dict[str, float]]) -> List[Dict[str, Any]]:
        """Get crop recommendations for multiple sets of conditions"""
        try:
            if not self.is_initialized or self.model is None:
                raise Exception("Crop recommendation service not initialized")
            
            results = []
            
            for conditions in conditions_list:
                try:
                    result = await self.recommend_crop(
                        N=conditions['N'],
                        P=conditions['P'],
                        K=conditions['K'],
                        temperature=conditions['temperature'],
                        humidity=conditions['humidity'],
                        ph=conditions['ph'],
                        rainfall=conditions['rainfall']
                    )
                    results.append(result)
                except Exception as e:
                    results.append({
                        "success": False,
                        "error": str(e),
                        "conditions": conditions
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Batch crop recommendation error: {str(e)}")
            raise
    
    def _validate_inputs(self, N: float, P: float, K: float, 
                        temperature: float, humidity: float, 
                        ph: float, rainfall: float):
        """Validate input parameters"""
        
        # Define reasonable ranges based on the dataset
        validations = [
            (N, 0, 140, "Nitrogen"),
            (P, 5, 145, "Phosphorus"),
            (K, 5, 205, "Potassium"),
            (temperature, 8, 50, "Temperature"),
            (humidity, 14, 100, "Humidity"),
            (ph, 3.5, 10, "pH"),
            (rainfall, 20, 300, "Rainfall")
        ]
        
        for value, min_val, max_val, name in validations:
            if not isinstance(value, (int, float)):
                raise ValueError(f"{name} must be a number")
            if not (min_val <= value <= max_val):
                logger.warning(f"{name} value {value} is outside typical range [{min_val}, {max_val}]")
    
    def _analyze_soil_conditions(self, N: float, P: float, K: float, ph: float) -> Dict[str, str]:
        """Analyze soil conditions and provide status"""
        
        def get_nutrient_level(value: float, low_threshold: float, high_threshold: float) -> str:
            if value < low_threshold:
                return "Low"
            elif value > high_threshold:
                return "High"
            else:
                return "Optimal"
        
        def get_ph_status(ph_value: float) -> str:
            if ph_value < 6.0:
                return "Acidic"
            elif ph_value > 7.5:
                return "Alkaline"
            else:
                return "Neutral"
        
        return {
            "nitrogen_status": get_nutrient_level(N, 40, 120),
            "phosphorus_status": get_nutrient_level(P, 20, 80),
            "potassium_status": get_nutrient_level(K, 30, 150),
            "ph_status": get_ph_status(ph),
            "overall_soil_health": "Good" if all([
                40 <= N <= 120,
                20 <= P <= 80,
                30 <= K <= 150,
                6.0 <= ph <= 7.5
            ]) else "Needs Attention"
        }
    
    def _analyze_environmental_conditions(self, temperature: float, 
                                        humidity: float, 
                                        rainfall: float) -> Dict[str, str]:
        """Analyze environmental conditions"""
        
        def get_temp_status(temp: float) -> str:
            if temp < 15:
                return "Cold"
            elif temp > 35:
                return "Hot"
            else:
                return "Optimal"
        
        def get_humidity_status(hum: float) -> str:
            if hum < 40:
                return "Low"
            elif hum > 85:
                return "High"
            else:
                return "Good"
        
        def get_rainfall_status(rain: float) -> str:
            if rain < 50:
                return "Low"
            elif rain > 200:
                return "High"
            else:
                return "Adequate"
        
        return {
            "temperature_status": get_temp_status(temperature),
            "humidity_status": get_humidity_status(humidity),
            "rainfall_status": get_rainfall_status(rainfall),
            "overall_climate": "Favorable" if all([
                15 <= temperature <= 35,
                40 <= humidity <= 85,
                50 <= rainfall <= 200
            ]) else "Challenging"
        }
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get information about the service"""
        return {
            "service_name": "AgriSens Crop Recommendation Service",
            "is_initialized": self.is_initialized,
            "model_loaded": self.model is not None,
            "supported_crops": self.supported_crops,
            "feature_names": self.feature_names,
            "models_directory": self.models_dir,
            "total_crops": len(self.supported_crops)
        }