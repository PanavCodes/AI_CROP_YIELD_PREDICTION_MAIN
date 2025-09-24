#!/usr/bin/env python3
"""
Test the FastAPI yield prediction endpoint
"""
import requests
import json

def test_yield_prediction_endpoint():
    """Test the simple yield prediction endpoint"""
    print("🧪 Testing FastAPI yield prediction endpoint...")
    
    # Test data
    test_cases = [
        {
            "crop": "Rice",
            "state": "Punjab", 
            "rainfall": 800.0,
            "temperature": 25.0,
            "area": 2.5,
            "pesticides": 0.1,
            "year": 2024
        },
        {
            "crop": "Wheat",
            "state": "Haryana",
            "rainfall": 600.0,
            "temperature": 22.0,
            "area": 1.0,
            "pesticides": 0.05,
            "year": 2024
        },
        {
            "crop": "Maize",
            "state": "Karnataka",
            "rainfall": 1000.0,
            "temperature": 28.0,
            "area": 3.0,
            "pesticides": 0.2,
            "year": 2024
        }
    ]
    
    base_url = "http://localhost:8000"
    endpoint = "/api/predict/simple-yield"
    
    print(f"🔗 Testing endpoint: {base_url}{endpoint}")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📊 Test case {i}: {test_case['crop']} in {test_case['state']}")
        
        try:
            # Make POST request
            response = requests.post(
                f"{base_url}{endpoint}",
                params=test_case,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Success!")
                print(f"   Predicted yield: {result['predicted_yield']} quintals/hectare")
                print(f"   Total production: {result['total_production']} quintals")
                print(f"   Model type: {result['model_type']}")
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection failed - FastAPI server might not be running")
            print("   Start it with: python main.py")
            break
        except Exception as e:
            print(f"❌ Request failed: {e}")

def test_health_endpoint():
    """Test the health endpoint"""
    print("\n🩺 Testing health endpoint...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check passed")
            print(f"   Status: {result['status']}")
            print(f"   ML Service: {result['ml_service_status']}")
            print(f"   Database: {result['database_status']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

if __name__ == "__main__":
    test_health_endpoint()
    test_yield_prediction_endpoint()