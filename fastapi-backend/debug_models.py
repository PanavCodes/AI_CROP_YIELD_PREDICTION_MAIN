#!/usr/bin/env python3
"""
Debug script to check model loading issues
"""
import os
import joblib
import pandas as pd

def debug_models():
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    print(f"Models directory: {models_dir}")
    print(f"Directory exists: {os.path.exists(models_dir)}")
    
    if os.path.exists(models_dir):
        print(f"Contents of models directory:")
        for item in os.listdir(models_dir):
            item_path = os.path.join(models_dir, item)
            print(f"  - {item} ({'file' if os.path.isfile(item_path) else 'directory'}) - size: {os.path.getsize(item_path) if os.path.isfile(item_path) else 'N/A'}")
    
    # Try to load each model individually
    model_files = [
        'yield_model_from_csv.joblib',
        'crop_model.joblib', 
        'crop_imputer.joblib'
    ]
    
    for model_file in model_files:
        model_path = os.path.join(models_dir, model_file)
        print(f"\n🔍 Testing {model_file}:")
        print(f"   Path: {model_path}")
        print(f"   Exists: {os.path.exists(model_path)}")
        
        if os.path.exists(model_path):
            try:
                print(f"   File size: {os.path.getsize(model_path)} bytes")
                model = joblib.load(model_path)
                print(f"   ✅ Loaded successfully: {type(model)}")
                
                # Test with sample data if it's yield model
                if 'yield' in model_file:
                    try:
                        # Create sample data for yield prediction
                        sample_data = {
                            'Year': [2024],
                            'rainfall_mm': [150.0],
                            'pesticides_tonnes': [0.1],
                            'avg_temp': [25.0],
                            'Area': ['Punjab'],
                            'Item': ['Rice']
                        }
                        df = pd.DataFrame(sample_data)
                        prediction = model.predict(df)
                        print(f"   🎯 Sample prediction: {prediction[0]} (hg/ha = {prediction[0]/10:.2f} quintals/ha)")
                    except Exception as e:
                        print(f"   ⚠️ Prediction test failed: {e}")
                        
            except Exception as e:
                print(f"   ❌ Failed to load: {e}")

if __name__ == "__main__":
    debug_models()