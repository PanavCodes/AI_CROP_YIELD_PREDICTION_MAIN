#!/usr/bin/env python3
"""
Optimized Yield Prediction ML Service
Keeps the model loaded in memory for faster predictions
"""

import sys
import json
import os
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
import time

# Global variable to hold the loaded model
_GLOBAL_MODEL_DATA = None

# Model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'yield_model_compatible.joblib')

def load_model_if_needed():
    """Load the model only once and keep it in memory"""
    global _GLOBAL_MODEL_DATA
    
    if _GLOBAL_MODEL_DATA is None:
        try:
            start_time = time.time()
            model_data = joblib.load(MODEL_PATH)
            load_time = time.time() - start_time
            
            if isinstance(model_data, dict):
                _GLOBAL_MODEL_DATA = {
                    'model': model_data['model'],
                    'label_encoders': model_data.get('label_encoders', {}),
                    'feature_columns': model_data.get('feature_columns', ['Year', 'rainfall_mm', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item']),
                    'model_type': model_data.get('model_type', 'Unknown'),
                    'performance': model_data.get('performance', {}),
                    'load_time': load_time
                }
                print(f"✅ ML model loaded in {load_time:.3f}s from {MODEL_PATH}", file=sys.stderr)
                print(f"📊 Model type: {_GLOBAL_MODEL_DATA['model_type']}", file=sys.stderr)
                if 'performance' in _GLOBAL_MODEL_DATA and _GLOBAL_MODEL_DATA['performance']:
                    perf = _GLOBAL_MODEL_DATA['performance']
                    r2 = perf.get('r2_score', 'N/A')
                    rmse = perf.get('rmse', 'N/A')
                    if isinstance(r2, (int, float)) and isinstance(rmse, (int, float)):
                        print(f"🎯 Model performance: R²={r2:.3f}, RMSE={rmse:.2f}", file=sys.stderr)
                    else:
                        print(f"🎯 Model performance: R²={r2}, RMSE={rmse}", file=sys.stderr)
            else:
                # Backward compatibility
                _GLOBAL_MODEL_DATA = {
                    'model': model_data,
                    'label_encoders': {},
                    'feature_columns': ['Year', 'rainfall_mm', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item'],
                    'model_type': 'Legacy',
                    'performance': {},
                    'load_time': load_time
                }
                print(f"✅ ML model loaded (legacy format) in {load_time:.3f}s", file=sys.stderr)
                
        except Exception as e:
            print(f"❌ Error loading ML model: {e}", file=sys.stderr)
            _GLOBAL_MODEL_DATA = None
            raise
    
    return _GLOBAL_MODEL_DATA

def predict_yield_optimized(input_data):
    """
    Optimized yield prediction using pre-loaded model
    """
    try:
        start_time = time.time()
        
        # Load model if needed (only happens once)
        model_data = load_model_if_needed()
        if model_data is None:
            raise Exception("Model not available")
        
        # Prepare features for the model
        features = {
            'Year': input_data.get('year', datetime.now().year),
            'rainfall_mm': input_data.get('rainfall', 100.0),
            'pesticides_tonnes': input_data.get('pesticides_tonnes', 0.0),
            'avg_temp': input_data.get('temperature', 25.0),
            'Area': input_data.get('state', 'Unknown'),
            'Item': input_data.get('crop', 'Rice')
        }
        
        # Create DataFrame with the required features
        df = pd.DataFrame([features], columns=model_data['feature_columns'])
        
        # Apply label encoding if available
        if model_data['label_encoders']:
            for column, encoder in model_data['label_encoders'].items():
                if column in df.columns:
                    try:
                        df[column] = encoder.transform(df[column])
                    except ValueError:
                        # Handle unseen labels by using the most frequent label (encoded as 0)
                        print(f"⚠️ Unknown label for {column}: {df[column].iloc[0]}, using fallback", file=sys.stderr)
                        df[column] = 0
        
        # Make prediction
        prediction_raw = model_data['model'].predict(df)[0]
        predicted_yield = float(prediction_raw)
        
        prediction_time = time.time() - start_time
        
        print(f"🔮 Optimized prediction: {predicted_yield:.2f} quintals/ha in {prediction_time:.3f}s", file=sys.stderr)
        
        return {
            "predicted_yield_quintal_per_hectare": round(predicted_yield, 2),
            "features_used": features,
            "model_type": "OPTIMIZED_ML_MODEL",
            "raw_prediction": prediction_raw,
            "performance_metrics": {
                "prediction_time_seconds": round(prediction_time, 3),
                "model_load_time_seconds": model_data.get('load_time', 0),
                "model_performance": model_data.get('performance', {})
            },
            "note": "Prediction generated using optimized ML model with in-memory caching"
        }
        
    except Exception as e:
        print(f"❌ Optimized ML prediction failed: {e}", file=sys.stderr)
        # Fallback to basic rule-based prediction
        return get_fallback_prediction(input_data)

def get_fallback_prediction(input_data):
    """Fallback prediction when ML model fails"""
    crop = input_data.get('crop', 'Rice')
    state = input_data.get('state', 'Unknown')
    temperature = input_data.get('temperature', 25.0)
    rainfall = input_data.get('rainfall', 100.0)
    pesticides_tonnes = input_data.get('pesticides_tonnes', 0.0)
    
    # Base yields for different crops (quintals per hectare)
    base_yields = {
        'Rice': 35.0, 'Wheat': 30.0, 'Maize': 25.0, 'Cotton': 15.0,
        'Sugarcane': 70.0, 'Soybean': 12.0, 'Groundnut': 18.0,
        'Sunflower': 14.0, 'Jowar': 10.0, 'Bajra': 12.0,
        'Barley': 28.0, 'Gram': 10.0
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
        "performance_metrics": {
            "prediction_time_seconds": 0.001,
            "model_load_time_seconds": 0,
            "model_performance": {}
        },
        "note": "Prediction generated using rule-based fallback (optimized ML model unavailable)"
    }

def main():
    """Main function to handle command line input"""
    try:
        # Read input from stdin (sent by Node.js)
        input_data = json.loads(sys.stdin.read())
        
        # Make optimized prediction
        result = predict_yield_optimized(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        # Return error as JSON
        error_result = {
            "error": str(e),
            "model_type": "ERROR",
            "predicted_yield_quintal_per_hectare": 0,
            "features_used": {},
            "performance_metrics": {
                "prediction_time_seconds": 0,
                "model_load_time_seconds": 0,
                "model_performance": {}
            },
            "note": f"Optimized prediction failed: {str(e)}"
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()