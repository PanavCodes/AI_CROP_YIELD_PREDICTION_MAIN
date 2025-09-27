#!/usr/bin/env python3
"""
Simple test for crop recommendation API endpoints
"""

import httpx
import asyncio
import json

async def test_crop_suggestions_endpoint():
    """Test the crop suggestions endpoint"""
    
    # Test data (rice conditions)
    test_data = {
        "N": 90,
        "P": 42,
        "K": 43,
        "temperature": 20.9,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 203.0
    }
    
    base_url = "http://localhost:8000"
    endpoint = "/api/crop-suggestions"
    
    print("🌾 Testing Crop Suggestions API Endpoint")
    print("=" * 50)
    print(f"URL: {base_url}{endpoint}")
    print(f"Test data: {test_data}")
    print()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}{endpoint}",
                params=test_data,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print("✅ API Response received successfully!")
                print(f"Status Code: {response.status_code}")
                print()
                print("📊 Response Data:")
                print(f"  - Success: {result.get('success', 'N/A')}")
                print(f"  - Recommended Crop: {result.get('recommended_crop', 'N/A')}")
                print(f"  - Confidence: {result.get('confidence', 'N/A')}")
                print(f"  - Top Suggestions: {result.get('suggestions', 'N/A')}")
                print()
                print("🎯 Formatted Response:")
                print(json.dumps(result, indent=2))
                
                return True
            else:
                print(f"❌ API Error - Status Code: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except httpx.ConnectError:
        print("❌ Connection Error: Could not connect to the API server.")
        print("💡 Make sure the FastAPI server is running on localhost:8000")
        print("   To start the server, run: uvicorn main:app --reload --port 8000")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {str(e)}")
        return False

async def test_multiple_conditions():
    """Test multiple crop conditions"""
    
    test_cases = [
        {
            "name": "Rice Conditions",
            "data": {"N": 90, "P": 42, "K": 43, "temperature": 20.9, "humidity": 82.0, "ph": 6.5, "rainfall": 203.0}
        },
        {
            "name": "Wheat Conditions", 
            "data": {"N": 50, "P": 30, "K": 30, "temperature": 20.0, "humidity": 50.0, "ph": 6.8, "rainfall": 100.0}
        },
        {
            "name": "Cotton Conditions",
            "data": {"N": 60, "P": 25, "K": 50, "temperature": 25.0, "humidity": 55.0, "ph": 7.0, "rainfall": 80.0}
        }
    ]
    
    base_url = "http://localhost:8000"
    endpoint = "/api/crop-suggestions"
    
    print("\n🧪 Testing Multiple Crop Conditions")
    print("=" * 50)
    
    try:
        async with httpx.AsyncClient() as client:
            for test_case in test_cases:
                print(f"\n📝 Testing {test_case['name']}:")
                
                response = await client.post(
                    f"{base_url}{endpoint}",
                    params=test_case['data'],
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"   ✅ Recommended: {result.get('recommended_crop', 'N/A')}")
                    print(f"   📊 Confidence: {result.get('confidence', 'N/A')}")
                    print(f"   🏆 Top 3: {result.get('suggestions', 'N/A')}")
                else:
                    print(f"   ❌ Failed - Status: {response.status_code}")
                    
        return True
        
    except httpx.ConnectError:
        print("❌ Connection Error: Server not running")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

async def main():
    """Run API tests"""
    print("🚀 Crop Recommendation API Test")
    print("=" * 60)
    
    # Test basic endpoint
    success1 = await test_crop_suggestions_endpoint()
    
    # Test multiple conditions
    if success1:
        success2 = await test_multiple_conditions()
    else:
        success2 = False
    
    print("\n" + "=" * 60)
    if success1 and success2:
        print("🎉 All API tests passed!")
        print("✅ The crop suggestions endpoint is working correctly")
        print("🌐 You can now use this endpoint in your frontend application")
    else:
        print("⚠️ Some API tests failed")
        print("💡 Make sure the FastAPI server is running: uvicorn main:app --reload --port 8000")

if __name__ == "__main__":
    asyncio.run(main())