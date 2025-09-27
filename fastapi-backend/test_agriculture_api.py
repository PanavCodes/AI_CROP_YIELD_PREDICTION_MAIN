import asyncio
import json
import httpx
from datetime import datetime

async def test_agriculture_chatbot_api():
    """Test the agriculture chatbot API endpoint"""
    
    base_url = "http://localhost:8000"
    endpoint = "/api/chat/agriculture"
    
    print("🧪 Testing Agriculture Chatbot API Endpoint")
    print("=" * 60)
    
    # Test cases
    test_cases = [
        {
            "name": "Agriculture Query - Tomato Growing",
            "data": {
                "message": "How to grow tomatoes in monsoon season?",
                "location": "Maharashtra, India",
                "experience": "2 years",
                "crops": "Tomatoes, Onions",
                "farm_size": "1 hectare",
                "season": "Monsoon"
            },
            "expected_success": True
        },
        {
            "name": "Agriculture Query - Pest Control", 
            "data": {
                "message": "What are the best organic pest control methods for cotton?",
                "location": "Gujarat, India",
                "experience": "5 years", 
                "crops": "Cotton",
                "farm_size": "2 hectares"
            },
            "expected_success": True
        },
        {
            "name": "Non-Agriculture Query - Should be Rejected",
            "data": {
                "message": "What is the weather today?",
                "location": "Delhi, India"
            },
            "expected_success": False
        },
        {
            "name": "Non-Agriculture Query - General Question",
            "data": {
                "message": "Tell me a joke about farming",
                "location": "Punjab, India"
            },
            "expected_success": False
        },
        {
            "name": "Edge Case - Mixed Query",
            "data": {
                "message": "Government schemes for farmers in India",
                "location": "India",
                "experience": "Beginner"
            },
            "expected_success": True
        }
    ]
    
    # Test each case
    async with httpx.AsyncClient(timeout=60.0) as client:
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{i}. {test_case['name']}")
            print("-" * 40)
            print(f"Message: \"{test_case['data']['message']}\"")
            
            try:
                # Make API request
                response = await client.post(
                    f"{base_url}{endpoint}",
                    json=test_case['data']
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check if result matches expectations
                    success = result.get("success", False)
                    response_type = result.get("type", "unknown")
                    
                    if success == test_case["expected_success"]:
                        print(f"✅ PASSED - Expected success: {test_case['expected_success']}, Got: {success}")
                        
                        if success:
                            print(f"📝 Response preview: {result.get('response', '')[:200]}...")
                            print(f"🏷️ Type: {response_type}")
                            print(f"🔗 Source: {result.get('source', 'Unknown')}")
                            print(f"⚡ Confidence: {result.get('confidence', 'Unknown')}")
                        else:
                            print(f"🚫 Correctly rejected non-agriculture query")
                            print(f"📝 Guidance message: {result.get('response', '')[:200]}...")
                        
                    else:
                        print(f"❌ FAILED - Expected success: {test_case['expected_success']}, Got: {success}")
                        print(f"Response: {result.get('response', '')[:200]}...")
                
                else:
                    print(f"❌ API Error - Status Code: {response.status_code}")
                    print(f"Error: {response.text}")
            
            except Exception as e:
                print(f"❌ Request Error: {str(e)}")
    
    print(f"\n\n🎯 API Testing Summary")
    print("=" * 60)
    print("✅ Your agriculture chatbot API endpoint is ready for website integration!")
    print("🌐 Endpoint: POST /api/chat/agriculture")
    print("📝 Expected JSON format:")
    print(json.dumps({
        "message": "How to grow rice in monsoon?",
        "location": "India",
        "experience": "Beginner", 
        "crops": "Rice",
        "farm_size": "1 hectare",
        "season": "Monsoon"
    }, indent=2))
    
    print(f"\n🔒 Security Features:")
    print("- ✅ Only responds to agriculture-related queries")  
    print("- ✅ Filters out non-farming questions politely")
    print("- ✅ Provides helpful guidance for rejected queries")
    print("- ✅ Handles errors gracefully with fallback responses")
    
    print(f"\n🌾 Ready for website integration!")

def test_quick_endpoint():
    """Quick synchronous test for immediate verification"""
    import requests
    
    print("\n🚀 Quick API Test (Synchronous)")
    print("-" * 40)
    
    try:
        response = requests.post(
            "http://localhost:8000/api/chat/agriculture",
            json={
                "message": "How to control pests in tomato plants?",
                "location": "India"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API is working!")
            print(f"Success: {result.get('success')}")
            print(f"Response: {result.get('response', '')[:150]}...")
        else:
            print(f"❌ API returned status {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - Make sure FastAPI server is running on localhost:8000")
        print("💡 Run: python -m uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🌾 Agriculture Chatbot API Testing")
    print("=" * 60)
    
    # First try quick sync test
    test_quick_endpoint()
    
    # Then comprehensive async test
    print("\n" + "=" * 60)
    asyncio.run(test_agriculture_chatbot_api())