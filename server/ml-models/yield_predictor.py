#!/usr/bin/env python3
"""
Yield Prediction ML Service
Uses the actual trained model from Agrisense project

Features used by the model:
['Year', 'rainfall_mm', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item']
"""

import sys
import json
import os
import pandas as pd
import numpy as np
import joblib
from datetime import datetime

# Model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'yield_model_compatible.joblib')

class YieldPredictor:
    def __init__(self):
        # Features expected by the model (from Agrisense)
        self.YIELD_FEATURES = ['Year', 'rainfall_mm', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item']
        
        self.model = None
        self.label_encoders = None
        self.feature_columns = None
        self.load_model()
        
    def load_model(self):
        """Load the trained ML model"""
        try:
            if os.path.exists(MODEL_PATH):
                model_data = joblib.load(MODEL_PATH)
                if isinstance(model_data, dict):
                    self.model = model_data['model']
                    self.label_encoders = model_data.get('label_encoders', {})
                    self.feature_columns = model_data.get('feature_columns', self.YIELD_FEATURES)
                    print(f"✅ ML model loaded successfully from {MODEL_PATH}", file=sys.stderr)
                    print(f"📊 Model type: {model_data.get('model_type', 'Unknown')}", file=sys.stderr)
                else:
                    # Backward compatibility for direct model files
                    self.model = model_data
                    self.label_encoders = {}
                    self.feature_columns = self.YIELD_FEATURES
                    print(f"✅ ML model loaded (legacy format) from {MODEL_PATH}", file=sys.stderr)
            else:
                print(f"❌ Model file not found at {MODEL_PATH}", file=sys.stderr)
                self.model = None
        except Exception as e:
            print(f"❌ Error loading ML model: {e}", file=sys.stderr)
            self.model = None
    
    def predict_yield(self, input_data):
        """
        Predict yield using the ML model
        
        Expected input_data format:
        {
            'crop': 'Rice',
            'state': 'Punjab', 
            'year': 2024,
            'rainfall': 150.0,
            'temperature': 28.5,
            'pesticides_tonnes': 0.05,
            'areaHectare': 2.5
        }
        """
        try:
            if self.model is None:
                return self.fallback_prediction(input_data)
            
            # Prepare features for the model
            features = {
                'Year': input_data.get('year', datetime.now().year),
                'rainfall_mm': input_data.get('rainfall', 100.0),
                'pesticides_tonnes': input_data.get('pesticides_tonnes', 0.0),
                'avg_temp': input_data.get('temperature', 25.0),
                'Area': input_data.get('state', 'Unknown'),
                'Item': input_data.get('crop', 'Rice')
            }
            
            print(f"📊 ML Model Features: {features}", file=sys.stderr)
            
            # Create DataFrame with the required features
            df = pd.DataFrame([features], columns=self.feature_columns or self.YIELD_FEATURES)
            
            # Apply label encoding if available
            if self.label_encoders:
                for column, encoder in self.label_encoders.items():
                    if column in df.columns:
                        try:
                            df[column] = encoder.transform(df[column])
                        except ValueError as e:
                            # Handle unseen labels by using the most frequent label
                            print(f"⚠️ Unknown label for {column}: {df[column].iloc[0]}, using fallback", file=sys.stderr)
                            df[column] = 0  # Use first encoded value as fallback
            
            print(f"🔧 Processed DataFrame:\n{df}", file=sys.stderr)
            
            # Make prediction
            # Note: Model output might be in hectograms per hectare, convert to quintals
            prediction_raw = self.model.predict(df)[0]
            
            # Convert hectograms to quintals (1 quintal = 100 kg = 1000 hectograms)
            # If the model predicts in hectograms/ha, divide by 10 to get quintals/ha
            if prediction_raw > 1000:  # Likely in hectograms
                predicted_yield = float(prediction_raw / 10.0)  # Convert to quintals/ha
            else:
                predicted_yield = float(prediction_raw)  # Already in quintals/ha
            
            print(f"🔮 ML Prediction: {prediction_raw} -> {predicted_yield} quintals/ha", file=sys.stderr)
            
            return {
                "predicted_yield_quintal_per_hectare": round(predicted_yield, 2),
                "features_used": features,
                "model_type": "ML_MODEL",
                "raw_prediction": prediction_raw,
                "note": "Prediction generated using trained machine learning model from Agrisense"
            }
            
        except Exception as e:
            print(f"❌ ML prediction failed: {e}", file=sys.stderr)
            return self.fallback_prediction(input_data)
    
    def fallback_prediction(self, input_data):
        """Fallback rule-based prediction when ML model fails"""
        crop = input_data.get('crop', 'Rice')
        state = input_data.get('state', 'Unknown')
        temperature = input_data.get('temperature', 25.0)
        rainfall = input_data.get('rainfall', 100.0)
        pesticides_tonnes = input_data.get('pesticides_tonnes', 0.0)
        
        # Base yields for different crops (quintals per hectare)
        base_yields = {
            'Rice': 35.0,
            'Wheat': 30.0,
            'Maize': 25.0,
            'Cotton': 15.0,
            'Sugarcane': 70.0,
            'Soybean': 12.0,
            'Groundnut': 18.0,
            'Sunflower': 14.0,
            'Jowar': 10.0,
            'Bajra': 12.0,
            'Barley': 28.0,
            'Gram': 10.0
        }
        
        base_yield = base_yields.get(crop, 25.0)
        
        # Simple environmental factors
        temp_factor = 1.0 if 20 <= temperature <= 35 else 0.8
        rain_factor = 1.0 if 75 <= rainfall <= 200 else 0.8
        pesticide_factor = 1.0 if pesticides_tonnes <= 0.1 else 0.9
        
        predicted_yield = base_yield * temp_factor * rain_factor * pesticide_factor
        
        features_used = {
            'Year': input_data.get('year', datetime.now().year),
            'rainfall_mm': rainfall,
            'pesticides_tonnes': pesticides_tonnes,
            'avg_temp': temperature,
            'Area': state,
            'Item': crop
        }
        
        return {
            "predicted_yield_quintal_per_hectare": round(predicted_yield, 2),
            "features_used": features_used,
            "model_type": "FALLBACK_RULES",
            "note": "Prediction generated using rule-based fallback (ML model unavailable)"
        }

def main():
    """Main function to handle command line input"""
    try:
        # Read input from stdin (sent by Node.js)
        input_data = json.loads(sys.stdin.read())
        
        # Create predictor and make prediction
        predictor = YieldPredictor()
        result = predictor.predict_yield(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        # Return error as JSON
        error_result = {
            "error": str(e),
            "model_type": "ERROR",
            "predicted_yield_quintal_per_hectare": 0,
            "features_used": {},
            "note": f"Prediction failed: {str(e)}"
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()