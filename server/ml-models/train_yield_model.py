#!/usr/bin/env python3
"""
Train a new yield prediction model that's compatible with current scikit-learn
This replaces the incompatible model from Agrisense
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

def create_synthetic_training_data(n_samples=5000):
    """
    Create synthetic but realistic crop yield training data
    Based on Indian agricultural data patterns
    """
    np.random.seed(42)  # For reproducible results
    
    crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut', 'Sunflower', 'Jowar', 'Bajra', 'Barley', 'Gram']
    states = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Tamil Nadu', 'Kerala', 'West Bengal', 'Bihar', 'Odisha']
    
    # Base yields for different crops (quintals per hectare)
    base_yields = {
        'Rice': 35.0, 'Wheat': 30.0, 'Maize': 25.0, 'Cotton': 15.0, 'Sugarcane': 70.0,
        'Soybean': 12.0, 'Groundnut': 18.0, 'Sunflower': 14.0, 'Jowar': 10.0, 
        'Bajra': 12.0, 'Barley': 28.0, 'Gram': 10.0
    }
    
    # State productivity factors
    state_factors = {
        'Punjab': 1.3, 'Haryana': 1.2, 'Uttar Pradesh': 1.1, 'Maharashtra': 1.0,
        'Karnataka': 0.95, 'Andhra Pradesh': 0.9, 'Telangana': 0.9, 'Gujarat': 1.05,
        'Rajasthan': 0.8, 'Madhya Pradesh': 0.9, 'Tamil Nadu': 0.95, 'Kerala': 0.85,
        'West Bengal': 1.0, 'Bihar': 0.8, 'Odisha': 0.85
    }
    
    data = []
    
    for _ in range(n_samples):
        crop = np.random.choice(crops)
        state = np.random.choice(states)
        year = np.random.randint(2015, 2025)
        
        # Generate realistic environmental conditions
        if crop in ['Rice', 'Sugarcane']:
            rainfall = np.random.normal(150, 50)  # High water requirement
            temperature = np.random.normal(28, 4)
        elif crop in ['Wheat', 'Barley', 'Gram']:
            rainfall = np.random.normal(80, 30)   # Lower water requirement
            temperature = np.random.normal(22, 3)
        else:
            rainfall = np.random.normal(100, 40)  # Medium water requirement
            temperature = np.random.normal(25, 4)
        
        # Ensure realistic bounds
        rainfall = max(20, min(300, rainfall))
        temperature = max(10, min(45, temperature))
        
        # Pesticide usage (tonnes per hectare)
        pesticides_tonnes = max(0, np.random.exponential(0.02))
        
        # Calculate yield based on factors
        base_yield = base_yields[crop]
        state_factor = state_factors[state]
        
        # Environmental factors
        temp_optimal = {'Rice': 28, 'Wheat': 20, 'Maize': 25, 'Cotton': 30}.get(crop, 25)
        temp_factor = 1.0 - abs(temperature - temp_optimal) * 0.02
        temp_factor = max(0.5, min(1.2, temp_factor))
        
        rain_optimal = {'Rice': 150, 'Wheat': 75, 'Sugarcane': 200}.get(crop, 100)
        rain_factor = 1.0 - abs(rainfall - rain_optimal) * 0.001
        rain_factor = max(0.4, min(1.3, rain_factor))
        
        # Pesticide factor (too much or too little hurts yield)
        pest_factor = 1.0 if pesticides_tonnes < 0.01 else (1.1 if pesticides_tonnes < 0.05 else 0.9)
        
        # Year trend (slight improvement over time)
        year_factor = 1.0 + (year - 2015) * 0.01
        
        # Random noise
        noise_factor = np.random.normal(1.0, 0.15)
        
        # Calculate final yield
        predicted_yield = (base_yield * state_factor * temp_factor * 
                         rain_factor * pest_factor * year_factor * noise_factor)
        predicted_yield = max(5, min(150, predicted_yield))  # Realistic bounds
        
        data.append({
            'Year': year,
            'rainfall_mm': round(rainfall, 1),
            'pesticides_tonnes': round(pesticides_tonnes, 4),
            'avg_temp': round(temperature, 1),
            'Area': state,
            'Item': crop,
            'yield_quintals_per_hectare': round(predicted_yield, 2)
        })
    
    return pd.DataFrame(data)

def train_yield_model():
    """Train the yield prediction model"""
    print("🌾 Generating synthetic training data...")
    df = create_synthetic_training_data(10000)
    
    print(f"📊 Training data shape: {df.shape}")
    print("📋 Sample data:")
    print(df.head())
    
    # Prepare features and target
    feature_columns = ['Year', 'rainfall_mm', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item']
    target_column = 'yield_quintals_per_hectare'
    
    X = df[feature_columns].copy()
    y = df[target_column]
    
    # Encode categorical variables
    label_encoders = {}
    for col in ['Area', 'Item']:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        label_encoders[col] = le
    
    print("🏗️ Feature engineering complete")
    print(f"Features: {feature_columns}")
    print(f"Target: {target_column}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    print("🤖 Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"📈 Model Performance:")
    print(f"   Mean Squared Error: {mse:.2f}")
    print(f"   R² Score: {r2:.3f}")
    print(f"   RMSE: {np.sqrt(mse):.2f} quintals/hectare")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("🎯 Feature Importance:")
    print(feature_importance)
    
    # Save model and encoders
    model_data = {
        'model': model,
        'label_encoders': label_encoders,
        'feature_columns': feature_columns,
        'model_type': 'RandomForestRegressor',
        'performance': {
            'mse': mse,
            'r2': r2,
            'rmse': np.sqrt(mse)
        }
    }
    
    model_path = os.path.join(os.path.dirname(__file__), 'yield_model_compatible.joblib')
    joblib.dump(model_data, model_path)
    
    print(f"💾 Model saved to: {model_path}")
    return model_data

def test_model():
    """Test the trained model with sample data"""
    model_path = os.path.join(os.path.dirname(__file__), 'yield_model_compatible.joblib')
    
    if not os.path.exists(model_path):
        print("❌ Model not found. Please train first.")
        return
    
    print("🔍 Loading and testing model...")
    model_data = joblib.load(model_path)
    model = model_data['model']
    label_encoders = model_data['label_encoders']
    
    # Test with sample data
    test_cases = [
        {'Year': 2024, 'rainfall_mm': 150.0, 'pesticides_tonnes': 0.05, 'avg_temp': 28.0, 'Area': 'Punjab', 'Item': 'Rice'},
        {'Year': 2024, 'rainfall_mm': 80.0, 'pesticides_tonnes': 0.02, 'avg_temp': 22.0, 'Area': 'Punjab', 'Item': 'Wheat'},
        {'Year': 2024, 'rainfall_mm': 100.0, 'pesticides_tonnes': 0.03, 'avg_temp': 25.0, 'Area': 'Maharashtra', 'Item': 'Cotton'},
    ]
    
    print("🧪 Test Predictions:")
    for i, test_case in enumerate(test_cases, 1):
        # Prepare input
        input_df = pd.DataFrame([test_case])
        
        # Encode categorical variables
        for col in ['Area', 'Item']:
            if test_case[col] in label_encoders[col].classes_:
                input_df[col] = label_encoders[col].transform([test_case[col]])
            else:
                # Handle unseen categories
                input_df[col] = 0  # Default encoding
        
        # Predict
        prediction = model.predict(input_df)[0]
        
        print(f"   Test {i}: {test_case['Item']} in {test_case['Area']} -> {prediction:.2f} quintals/hectare")

if __name__ == "__main__":
    print("🚀 Training new compatible yield prediction model...")
    train_yield_model()
    print("\n" + "="*60 + "\n")
    test_model()
    print("\n✅ Training complete! Model is ready for use.")