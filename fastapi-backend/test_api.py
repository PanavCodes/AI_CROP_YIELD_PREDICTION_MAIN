"""
Test script for FastAPI endpoints
"""

import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_health_endpoint():
    """Test the health check endpoint"""
    print("🔍 Testing health endpoint...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            print(f"Health Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check passed: {data['status']}")
                print(f"   Database: {data['database_status']}")
                print(f"   ML Service: {data['ml_service_status']}")
            else:
                print(f"❌ Health check failed: {response.text}")
        except Exception as e:
            print(f"❌ Health check error: {str(e)}")

async def test_login_endpoint():
    """Test the login endpoint"""
    print("\n🔍 Testing login endpoint...")
    
    async with httpx.AsyncClient() as client:
        try:
            login_data = {
                "email": "demo@farmer.com",
                "password": "password123"
            }
            response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
            print(f"Login Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful: {data['user_id']}")
                print(f"   Token: {data['access_token'][:20]}...")
                return data['access_token']
            else:
                print(f"❌ Login failed: {response.text}")
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
    
    return None

async def test_yield_prediction():
    """Test yield prediction endpoint"""
    print("\n🔍 Testing yield prediction endpoint...")
    
    async with httpx.AsyncClient() as client:
        try:
            prediction_data = {
                "crop_type": "Rice",
                "field_size_hectares": 2.5,
                "state": "Punjab",
                "district": "Amritsar",
                "season": "Kharif",
                "N": 80,
                "P": 40,
                "K": 40,
                "ph": 6.5,
                "temperature": 28,
                "humidity": 75,
                "rainfall": 1200
            }
            
            response = await client.post(f"{BASE_URL}/api/predict/yield", json=prediction_data)
            print(f"Prediction Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Yield prediction successful")
                print(f"   Predicted Yield: {data['predicted_yield']} quintal/hectare")
                print(f"   Total Production: {data['total_predicted_production']} quintals")
                print(f"   Confidence: {data['confidence_score']}")
            else:
                print(f"❌ Yield prediction failed: {response.text}")
        except Exception as e:
            print(f"❌ Yield prediction error: {str(e)}")

async def test_crop_recommendation():
    """Test crop recommendation endpoint"""
    print("\n🔍 Testing crop recommendation endpoint...")
    
    async with httpx.AsyncClient() as client:
        try:
            params = {
                "N": 80,
                "P": 40,
                "K": 40,
                "temperature": 25,
                "humidity": 65,
                "ph": 6.8,
                "rainfall": 800
            }
            
            response = await client.post(f"{BASE_URL}/api/predict/crop-recommendation", params=params)
            print(f"Recommendation Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Crop recommendation successful")
                print(f"   Top recommended crop: {data['recommended_crops'][0]['crop']}")
                print(f"   Suitability score: {data['recommended_crops'][0]['suitability_score']}")
            else:
                print(f"❌ Crop recommendation failed: {response.text}")
        except Exception as e:
            print(f"❌ Crop recommendation error: {str(e)}")

async def test_crop_statistics():
    """Test crop statistics endpoint"""
    print("\n🔍 Testing crop statistics endpoint...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/api/crop-data/statistics")
            print(f"Statistics Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Statistics retrieved")
                print(f"   Total records: {data['total_records']}")
                print(f"   Average yield: {data['avg_yield']} quintal/hectare")
            else:
                print(f"❌ Statistics failed: {response.text}")
        except Exception as e:
            print(f"❌ Statistics error: {str(e)}")

async def main():
    """Run all tests"""
    print("🚀 FastAPI Crop Prediction Backend - API Tests\n")
    print("=" * 50)
    
    # Test health endpoint
    await test_health_endpoint()
    
    # Test login
    token = await test_login_endpoint()
    
    # Test ML endpoints
    await test_yield_prediction()
    await test_crop_recommendation()
    
    # Test analytics
    await test_crop_statistics()
    
    print("\n" + "=" * 50)
    print("🎉 API testing completed!")
    
    if token:
        print("\n💡 API Documentation available at:")
        print(f"   Swagger UI: {BASE_URL}/docs")
        print(f"   ReDoc: {BASE_URL}/redoc")

if __name__ == "__main__":
    asyncio.run(main())