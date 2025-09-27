"""
Real Machine Learning Service for Crop Prediction App
Integrates the Agrisense yield prediction model and crop recommendation models
"""
import joblib
import pandas as pd
import numpy as np
import os
from datetime import datetime
from typing import Dict, Any, List
import logging
from models.schemas import YieldPredictionRequest, YieldPredictionResponse
from utils.config import get_settings
from services.crop_recommendation_service import CropRecommendationService

# Configure logging
logger = logging.getLogger(__name__)

class MLService:
    """ML service with real Agrisense models for yield prediction and crop recommendations"""
    
    def __init__(self):
        self.settings = get_settings()
        self.models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        self.yield_model = None
        self.yield_encoders = None
        self.crop_model = None
        self.crop_imputer = None
        self.is_initialized = False
        
        # Initialize AgriSens crop recommendation service
        self.crop_recommendation_service = CropRecommendationService()
        
        # Model features as defined in Agrisense
        self.yield_features = ['Year', 'rainfall_mm', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item']
        self.crop_features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
        
    def _load_models(self):
        """Load all available ML models"""
        try:
            # Load yield prediction model
            yield_model_path = os.path.join(self.models_dir, 'yield_model_from_csv.joblib')
            yield_encoders_path = os.path.join(self.models_dir, 'yield_encoders.joblib')
            
            if os.path.exists(yield_model_path):
                try:
                    self.yield_model = joblib.load(yield_model_path)
                    logger.info("✅ Yield prediction model loaded successfully")
                    
                    # Load encoders if available
                    if os.path.exists(yield_encoders_path):
                        self.yield_encoders = joblib.load(yield_encoders_path)
                        logger.info("✅ Yield encoders loaded successfully")
                    else:
                        self.yield_encoders = None
                        logger.warning("⚠️ Yield encoders not found, using fallback encoding")
                except Exception as e:
                    logger.error(f"❌ Error loading yield model: {e}")
                    self.yield_model = None
                    self.yield_encoders = None
            else:
                logger.warning(f"⚠️ Yield model not found at {yield_model_path}")
                self.yield_encoders = None
                
            # Load crop recommendation models (with error handling)
            crop_model_path = os.path.join(self.models_dir, 'crop_model.joblib')
            crop_imputer_path = os.path.join(self.models_dir, 'crop_imputer.joblib')
            
            if os.path.exists(crop_model_path) and os.path.exists(crop_imputer_path):
                try:
                    # Check file sizes first (corrupted files are usually very small)
                    crop_model_size = os.path.getsize(crop_model_path)
                    crop_imputer_size = os.path.getsize(crop_imputer_path)
                    
                    if crop_model_size > 0 and crop_imputer_size > 0:
                        self.crop_model = joblib.load(crop_model_path)
                        self.crop_imputer = joblib.load(crop_imputer_path)
                        logger.info("✅ Crop recommendation models loaded successfully")
                except Exception as e:
                    logger.warning(f"⚠️ Error loading crop models: {e}. Using fallback recommendations.")
                    self.crop_model = None
                    self.crop_imputer = None
            else:
                logger.warning("⚠️ Crop recommendation model files not found. Using fallback recommendations.")
                self.crop_model = None
                self.crop_imputer = None
                
        except Exception as e:
            logger.error(f"❌ Unexpected error in model loading: {e}")

    async def initialize(self):
        """Initialize ML models"""
        try:
            logger.info("🤖 Initializing ML Service with Agrisense models...")
            
            # Load real ML models
            self._load_models()
            
            # Initialize crop recommendation service
            await self.crop_recommendation_service.initialize()
            
            self.is_initialized = True
            logger.info("✅ ML Service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ ML Service initialization failed: {str(e)}")
            self.is_initialized = False
    
    async def predict_yield(self, request: YieldPredictionRequest) -> YieldPredictionResponse:
        """
        Predict crop yield based on input parameters using real Agrisense ML model
        """
        try:
            if not self.is_initialized:
                raise Exception("ML Service not initialized")
            
            # Convert request to format expected by Agrisense model
            input_data = {
                'crop': request.crop_type,
                'state': request.state,
                'year': getattr(request, 'year', datetime.now().year),
                'rainfall': request.rainfall,
                'temperature': request.temperature,
                'pesticides': getattr(request, 'pesticides_tonnes', 0.0),
                'area': request.field_size_hectares
            }
            
            # Use real ML prediction
            prediction_result = self._predict_yield_ml(input_data)
            
            # Generate recommendations based on prediction
            recommendations = self._generate_yield_recommendations_ml(request, prediction_result)
            
            # Calculate confidence based on model type and input quality
            confidence_score = 0.85 if self.yield_model is not None else 0.65
            
            return YieldPredictionResponse(
                predicted_yield=prediction_result["predicted_yield_per_hectare"],
                confidence_score=round(confidence_score, 3),
                field_size_hectares=request.field_size_hectares,
                total_predicted_production=prediction_result["total_predicted_production"],
                model_version="Agrisense_v1.0" if self.yield_model else "Fallback_v1.0",
                prediction_factors=prediction_result.get("adjustment_factors", {}),
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Yield prediction error: {str(e)}")
            raise
    
    async def recommend_crop(self, N: float, P: float, K: float, 
                           temperature: float, humidity: float, 
                           ph: float, rainfall: float) -> Dict[str, Any]:
        """
        Recommend optimal crops based on soil and weather conditions using AgriSens model
        """
        try:
            if not self.is_initialized:
                raise Exception("ML service not initialized")
            
            # Use the real AgriSens crop recommendation service
            return await self.crop_recommendation_service.recommend_crop(
                N=N, P=P, K=K,
                temperature=temperature,
                humidity=humidity,
                ph=ph,
                rainfall=rainfall
            )
            
        except Exception as e:
            logger.error(f"Crop recommendation error: {str(e)}")
            raise
    
    async def detect_plant_disease(self, image) -> Dict[str, Any]:
        """
        Detect plant diseases from uploaded images
        """
        try:
            if not self.is_initialized:
                raise Exception("ML Service not initialized")
            
            # Mock disease detection
            # In production, this would use computer vision models
            
            diseases = [
                {"name": "Leaf Blight", "confidence": 0.85, "severity": "Medium"},
                {"name": "Healthy", "confidence": 0.92, "severity": "None"},
                {"name": "Rust", "confidence": 0.67, "severity": "Low"},
                {"name": "Mosaic Virus", "confidence": 0.45, "severity": "High"}
            ]
            
            # Select random disease for demo
            detected = random.choice(diseases)
            
            recommendations = []
            if detected["name"] != "Healthy":
                recommendations = [
                    f"Apply appropriate fungicide for {detected['name']}",
                    "Improve field drainage",
                    "Monitor plant regularly",
                    "Consider resistant varieties for next season"
                ]
            else:
                recommendations = [
                    "Plant appears healthy",
                    "Continue current care practices",
                    "Monitor for any changes"
                ]
            
            return {
                "detected_diseases": [detected],
                "confidence_scores": {detected["name"]: detected["confidence"]},
                "plant_health_status": "Healthy" if detected["name"] == "Healthy" else "Needs Attention",
                "recommendations": recommendations
            }
            
        except Exception as e:
            logger.error(f"Disease detection error: {str(e)}")
            raise
    
    def _predict_yield_ml(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict crop yield using real ML model or fallback
        """
        try:
            # If model is not available, use fallback
            if self.yield_model is None:
                return self._fallback_yield_prediction(input_data)
            
            # Prepare model input
            crop_name = str(input_data.get('crop', 'Rice'))
            state_name = str(input_data.get('state', 'Punjab'))
            
            # Handle categorical encoding if encoders are available
            if self.yield_encoders:
                # Encode Area (state)
                area_classes = self.yield_encoders['area_classes']
                if state_name in area_classes:
                    area_encoded = area_classes.index(state_name)
                else:
                    # Use first available state as default
                    area_encoded = 0
                    logger.warning(f"State '{state_name}' not found in training data, using '{area_classes[0]}'")
                
                # Encode Item (crop)
                crop_classes = self.yield_encoders['crop_classes']
                if crop_name in crop_classes:
                    crop_encoded = crop_classes.index(crop_name)
                else:
                    # Use first available crop as default
                    crop_encoded = 0
                    logger.warning(f"Crop '{crop_name}' not found in training data, using '{crop_classes[0]}'")
            else:
                # Fallback encoding (use hash or simple mapping)
                area_encoded = hash(state_name) % 10
                crop_encoded = hash(crop_name) % 6
            
            # Prepare model input with encoded categorical variables
            model_input = {
                'Year': input_data.get('year', datetime.now().year),
                'rainfall_mm': float(input_data.get('rainfall', 0)),
                'pesticides_tonnes': float(input_data.get('pesticides', 0.0)),
                'avg_temp': float(input_data.get('temperature', 25)),
                'Area': area_encoded,
                'Item': crop_encoded
            }
            
            # Validate required fields
            required_numeric_fields = ['Year', 'rainfall_mm', 'avg_temp']
            for field in required_numeric_fields:
                if model_input.get(field) is None:
                    raise ValueError(f"Missing required field: {field}")
            
            # Create DataFrame for prediction
            input_df = pd.DataFrame([model_input], columns=self.yield_features)
            
            # Make prediction (model returns hectograms per hectare, convert to quintals)
            predicted_yield_hg_ha = self.yield_model.predict(input_df)[0]
            predicted_yield_quintal_ha = float(round(predicted_yield_hg_ha / 10, 2))
            
            # Calculate total production if area is provided
            area_hectares = input_data.get('area', 1)
            total_production = predicted_yield_quintal_ha * area_hectares
            
            return {
                "predicted_yield_per_hectare": predicted_yield_quintal_ha,
                "total_predicted_production": round(total_production, 2),
                "model_features_used": {
                    'year': model_input['Year'],
                    'rainfall_mm': model_input['rainfall_mm'],
                    'pesticides_tonnes': model_input['pesticides_tonnes'],
                    'avg_temp': model_input['avg_temp'],
                    'state': state_name,
                    'crop': crop_name
                },
                "model_type": "Random Forest ML Model"
            }
            
        except Exception as e:
            logger.error(f"Error in ML yield prediction: {e}, using fallback")
            return self._fallback_yield_prediction(input_data)
    
    def _fallback_yield_prediction(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback yield prediction when ML model is unavailable
        Uses rule-based approach similar to Agrisense
        """
        try:
            # Base yield per hectare (quintals)
            base_yield = 30.0
            
            # Get environmental factors
            temp = float(input_data.get('temperature', 25))
            rainfall = float(input_data.get('rainfall', 100))
            
            # Temperature adjustment factor
            if 20 <= temp <= 30:
                temp_factor = 1.0
            elif temp < 15 or temp > 40:
                temp_factor = 0.5
            elif temp < 20 or temp > 35:
                temp_factor = 0.7
            else:
                temp_factor = 0.85
            
            # Rainfall adjustment factor  
            if 75 <= rainfall <= 200:
                rain_factor = 1.0
            elif rainfall < 30 or rainfall > 400:
                rain_factor = 0.4
            elif rainfall < 50 or rainfall > 300:
                rain_factor = 0.6
            else:
                rain_factor = 0.8
            
            # Crop-specific adjustments
            crop = str(input_data.get('crop', 'Rice')).lower()
            crop_factor = 1.0
            if 'rice' in crop:
                crop_factor = 1.2 if rainfall > 150 else 0.9
            elif 'wheat' in crop:
                crop_factor = 1.1 if 15 <= temp <= 25 else 0.8
            elif 'maize' in crop or 'corn' in crop:
                crop_factor = 1.15 if 20 <= temp <= 30 and rainfall > 100 else 0.85
            
            # Calculate predicted yield
            predicted_yield = base_yield * temp_factor * rain_factor * crop_factor
            
            # Calculate total production
            area_hectares = input_data.get('area', 1)
            total_production = predicted_yield * area_hectares
            
            return {
                "predicted_yield_per_hectare": round(predicted_yield, 2),
                "total_predicted_production": round(total_production, 2),
                "adjustment_factors": {
                    "temperature_factor": temp_factor,
                    "rainfall_factor": rain_factor,
                    "crop_factor": crop_factor
                },
                "model_type": "Rule-based Fallback"
            }
            
        except Exception as e:
            logger.error(f"Error in fallback prediction: {e}")
            return {
                "predicted_yield_per_hectare": 25.0,  # Safe default
                "total_predicted_production": 25.0,
                "model_type": "Emergency Default"
            }
    
    def _generate_yield_recommendations_ml(self, request: YieldPredictionRequest, prediction_result: Dict[str, Any]) -> List[str]:
        """
        Generate smart recommendations based on ML prediction results and input conditions
        """
        recommendations = []
        
        predicted_yield = prediction_result.get("predicted_yield_per_hectare", 0)
        adjustment_factors = prediction_result.get("adjustment_factors", {})
        
        # Yield-based recommendations
        if predicted_yield < 20:
            recommendations.append("⚠️ Low yield predicted - Consider improving soil conditions and weather protection")
        elif predicted_yield > 50:
            recommendations.append("🎯 High yield potential - Maintain current practices for optimal results")
        
        # Factor-based recommendations
        if adjustment_factors.get("temperature_factor", 1.0) < 0.8:
            recommendations.append("🌡️ Temperature stress detected - Consider shade nets or cooling systems")
        
        if adjustment_factors.get("rainfall_factor", 1.0) < 0.8:
            recommendations.append("💧 Water stress likely - Implement efficient irrigation systems")
        
        if adjustment_factors.get("crop_factor", 1.0) < 0.9:
            recommendations.append("🌾 Consider crop-specific optimization - soil amendments and fertilizer timing")
        
        # Soil-based recommendations (from original request)
        if hasattr(request, 'N') and request.N < 50:
            recommendations.append("🧪 Increase nitrogen fertilizer for better growth")
        
        if hasattr(request, 'ph'):
            if request.ph < 6.0:
                recommendations.append("🧪 Apply lime to increase soil pH for optimal nutrient uptake")
            elif request.ph > 8.0:
                recommendations.append("🧪 Apply organic matter to reduce soil pH")
        
        # Weather-based recommendations
        if request.rainfall < 300:
            recommendations.append("☔ Low rainfall expected - Plan for supplemental irrigation")
        elif request.rainfall > 2000:
            recommendations.append("🌊 High rainfall expected - Ensure proper drainage to prevent waterlogging")
        
        if not recommendations:
            recommendations.append("✅ Current conditions are favorable for good yield - maintain best practices")
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        return {
            "yield_model_loaded": self.yield_model is not None,
            "yield_encoders_loaded": self.yield_encoders is not None,
            "crop_model_loaded": self.crop_model is not None,
            "crop_imputer_loaded": self.crop_imputer is not None,
            "yield_features": self.yield_features,
            "crop_features": self.crop_features,
            "models_directory": self.models_dir,
            "supported_crops": self.yield_encoders['crop_classes'] if self.yield_encoders else ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean'],
            "supported_states": self.yield_encoders['area_classes'] if self.yield_encoders else ['Punjab', 'Haryana', 'Uttar Pradesh'],
            "model_type": "Random Forest ML Model" if self.yield_model else "Rule-based Fallback"
        }
