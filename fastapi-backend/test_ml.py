#!/usr/bin/env python3
"""
Test script to verify ML model integration with Agrisense models
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.ml_service import MLService

def test_ml_service():
    """Test ML service initialization and prediction"""
    print("🧪 Testing ML Service with Agrisense models...")
    
    # Initialize ML service
    ml_service = MLService()
    
    # Load models
    print("📦 Loading models...")
    ml_service._load_models()
    
    # Check model status
    model_info = ml_service.get_model_info()
    print(f"📊 Model Status:")
    print(f"   - Yield model loaded: {model_info['yield_model_loaded']}")
    print(f"   - Crop model loaded: {model_info['crop_model_loaded']}")
    print(f"   - Crop imputer loaded: {model_info['crop_imputer_loaded']}")
    print(f"   - Models directory: {model_info['models_directory']}")
    
    # Test yield prediction
    print("\n🌾 Testing yield prediction...")
    test_input = {
        'crop': 'Rice',
        'state': 'Punjab', 
        'year': 2024,
        'rainfall': 150.0,
        'temperature': 25.0,
        'pesticides': 0.1,
        'area': 2.5
    }
    
    try:
        prediction_result = ml_service._predict_yield_ml(test_input)
        print(f"✅ Prediction successful!")
        print(f"   - Predicted yield: {prediction_result['predicted_yield_per_hectare']} quintals/hectare")
        print(f"   - Total production: {prediction_result['total_predicted_production']} quintals") 
        print(f"   - Model type: {prediction_result['model_type']}")
        
        if 'adjustment_factors' in prediction_result:
            print(f"   - Adjustment factors: {prediction_result['adjustment_factors']}")
            
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
    
    print("\n🔬 Testing with different crops...")
    test_crops = ['Wheat', 'Maize', 'Cotton', 'Soybean']
    
    for crop in test_crops:
        test_input_crop = test_input.copy()
        test_input_crop['crop'] = crop
        
        try:
            result = ml_service._predict_yield_ml(test_input_crop)
            print(f"   {crop}: {result['predicted_yield_per_hectare']} quintals/hectare ({result['model_type']})")
        except Exception as e:
            print(f"   {crop}: Error - {e}")

if __name__ == "__main__":
    test_ml_service()