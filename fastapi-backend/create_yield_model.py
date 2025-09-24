#!/usr/bin/env python3
"""
Create a simple but functional yield prediction model
"""
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import os

def create_yield_prediction_model():
    """Create a simple yield prediction model with synthetic training data"""
    print("🚀 Creating yield prediction model...")
    
    # Generate synthetic training data similar to real agricultural data
    np.random.seed(42)
    n_samples = 1000
    
    # Features as defined in Agrisense
    years = np.random.randint(2015, 2025, n_samples)
    rainfall = np.random.normal(800, 300, n_samples)  # mm
    rainfall = np.clip(rainfall, 200, 2000)  # reasonable range
    
    pesticides = np.random.exponential(0.5, n_samples)  # tonnes
    pesticides = np.clip(pesticides, 0, 2.0)
    
    avg_temp = np.random.normal(25, 8, n_samples)  # Celsius
    avg_temp = np.clip(avg_temp, 10, 45)
    
    # Areas (states) - encode as numbers for model
    areas = np.random.choice(['Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Maharashtra', 
                             'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'West Bengal', 'Bihar'], n_samples)
    
    # Crops
    crops = np.random.choice(['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Sugarcane'], n_samples)
    
    # Create synthetic yield data with realistic relationships
    base_yields = {
        'Rice': 45, 'Wheat': 35, 'Maize': 40, 'Cotton': 25, 
        'Soybean': 20, 'Sugarcane': 80
    }
    
    # High-yield states
    state_factors = {
        'Punjab': 1.3, 'Haryana': 1.25, 'Uttar Pradesh': 1.1,
        'Rajasthan': 0.8, 'Maharashtra': 1.0, 'Karnataka': 0.9,
        'Tamil Nadu': 1.1, 'Andhra Pradesh': 1.05, 'West Bengal': 1.0, 'Bihar': 0.85
    }
    
    yields_hg_ha = []  # hectograms per hectare (multiply by 10 to get quintals)
    
    for i in range(n_samples):
        base = base_yields[crops[i]]
        state_factor = state_factors[areas[i]]
        
        # Weather factors
        temp_factor = 1.0 if 20 <= avg_temp[i] <= 30 else 0.7 if avg_temp[i] < 15 or avg_temp[i] > 40 else 0.9
        rain_factor = 1.0 if 400 <= rainfall[i] <= 1200 else 0.6 if rainfall[i] < 200 else 0.8
        
        # Pesticide factor (diminishing returns)
        pest_factor = min(1.0 + pesticides[i] * 0.1, 1.2)
        
        # Calculate yield in hectograms per hectare
        yield_val = base * state_factor * temp_factor * rain_factor * pest_factor * 10  # Convert to hg/ha
        
        # Add some noise
        yield_val *= np.random.normal(1.0, 0.15)
        yield_val = max(yield_val, 50)  # Minimum yield
        
        yields_hg_ha.append(yield_val)
    
    # Encode categorical variables
    area_encoder = LabelEncoder()
    area_encoded = area_encoder.fit_transform(areas)
    
    crop_encoder = LabelEncoder()
    crop_encoded = crop_encoder.fit_transform(crops)
    
    # Create DataFrame
    data = pd.DataFrame({
        'Year': years,
        'rainfall_mm': rainfall,
        'pesticides_tonnes': pesticides,
        'avg_temp': avg_temp,
        'Area': area_encoded,
        'Item': crop_encoded,
        'yield_hg_ha': yields_hg_ha
    })
    
    print(f"📊 Generated {len(data)} training samples")
    print(f"   Yield range: {data['yield_hg_ha'].min():.1f} - {data['yield_hg_ha'].max():.1f} hg/ha")
    print(f"   ({data['yield_hg_ha'].min()/10:.1f} - {data['yield_hg_ha'].max()/10:.1f} quintals/ha)")
    
    # Prepare features and target
    features = ['Year', 'rainfall_mm', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item']
    X = data[features]
    y = data['yield_hg_ha']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Create and train model
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    model.fit(X_train, y_train)
    
    # Evaluate model
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    
    print(f"📈 Model performance:")
    print(f"   Training R²: {train_score:.3f}")
    print(f"   Test R²: {test_score:.3f}")
    
    # Save model
    models_dir = 'models'
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, 'yield_model_from_csv.joblib')
    joblib.dump(model, model_path)
    
    # Save encoders for later use
    encoders = {
        'area_encoder': area_encoder,
        'crop_encoder': crop_encoder,
        'area_classes': list(area_encoder.classes_),
        'crop_classes': list(crop_encoder.classes_)
    }
    
    encoders_path = os.path.join(models_dir, 'yield_encoders.joblib')
    joblib.dump(encoders, encoders_path)
    
    print(f"💾 Model saved to: {model_path}")
    print(f"💾 Encoders saved to: {encoders_path}")
    
    # Test the saved model
    print("🧪 Testing saved model...")
    loaded_model = joblib.load(model_path)
    loaded_encoders = joblib.load(encoders_path)
    
    # Test prediction
    test_data = pd.DataFrame({
        'Year': [2024],
        'rainfall_mm': [800.0],
        'pesticides_tonnes': [0.2],
        'avg_temp': [25.0],
        'Area': [0],  # First area in encoder
        'Item': [0]   # First crop in encoder
    })
    
    test_prediction = loaded_model.predict(test_data)
    print(f"✅ Test prediction: {test_prediction[0]:.1f} hg/ha ({test_prediction[0]/10:.1f} quintals/ha)")
    print(f"   For: {loaded_encoders['crop_classes'][0]} in {loaded_encoders['area_classes'][0]}")

if __name__ == "__main__":
    create_yield_prediction_model()