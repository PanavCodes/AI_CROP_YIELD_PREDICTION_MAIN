#!/usr/bin/env python3
"""
Test API Endpoints
Quick test to verify all OpenRouter-based API endpoints work correctly
"""

import asyncio
import requests
import json

BASE_URL = "http://localhost:8000"

def test_ai_chat():
    """Test the main AI chat endpoint"""
    print("🧪 Testing /api/ai/chat endpoint...")
    
    url = f"{BASE_URL}/api/ai/chat"
    data = {
        "message": "My tomato plants have yellow spots on leaves. What should I do?",
        "location": "Maharashtra, India",
        "crops": "Tomato",
        "soil_type": "Loam",
        "farm_size": "2 acres"
    }
    
    try:
        response = requests.post(url, json=data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ AI Chat endpoint working!")
                print(f"🤖 AI Service: {result.get('ai_service')}")
                print(f"📄 Response preview: {result.get('response', '')[:100]}...")
                return True
            else:
                print("❌ AI Chat returned unsuccessful response")
                print(f"Error: {result.get('error', 'Unknown')}")
        else:
            print(f"❌ AI Chat endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ AI Chat endpoint error: {str(e)}")
    
    return False

def test_crop_advice():
    """Test the crop advice endpoint"""
    print("\n🧪 Testing /api/ai/crop-advice endpoint...")
    
    url = f"{BASE_URL}/api/ai/crop-advice"
    params = {
        "query": "Best practices for wheat farming in winter",
        "context": json.dumps({
            "location": "Punjab, India",
            "crops": "Wheat", 
            "season": "Winter"
        })
    }
    
    try:
        response = requests.post(url, params=params, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Crop advice endpoint working!")
                print(f"🤖 AI Service: {result.get('ai_service')}")
                return True
            else:
                print("❌ Crop advice returned unsuccessful response")
        else:
            print(f"❌ Crop advice endpoint failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Crop advice endpoint error: {str(e)}")
    
    return False

def test_chat_clear():
    """Test the chat clear endpoint"""
    print("\n🧪 Testing /api/chat/clear endpoint...")
    
    url = f"{BASE_URL}/api/chat/clear"
    data = {"session_id": "test_session"}
    
    try:
        response = requests.post(url, json=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Chat clear endpoint working!")
                return True
            else:
                print("❌ Chat clear returned unsuccessful response")
        else:
            print(f"❌ Chat clear endpoint failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Chat clear endpoint error: {str(e)}")
    
    return False

def test_health():
    """Test the health endpoint"""
    print("\n🧪 Testing /health endpoint...")
    
    url = f"{BASE_URL}/health"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print("✅ Health endpoint working!")
            print(f"📊 Status: {result.get('status')}")
            return True
        else:
            print(f"❌ Health endpoint failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {str(e)}")
    
    return False

def main():
    """Run all tests"""
    print("🚀 API Endpoints Test Suite")
    print("=" * 50)
    
    # Test all endpoints
    results = {
        "Health Check": test_health(),
        "AI Chat": test_ai_chat(),
        "Crop Advice": test_crop_advice(),
        "Chat Clear": test_chat_clear()
    }
    
    # Summary
    print("\n" + "=" * 50)
    print("🏁 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nTests Passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 All API endpoints are working correctly!")
        print("✅ OpenRouter integration is successful!")
        print("✅ Chat management endpoints are functional!")
        print("\n💡 Your AI chatbot is ready for production use!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the server configuration.")
        if passed > 0:
            print(f"✅ {passed} endpoint(s) are working correctly.")

if __name__ == "__main__":
    main()