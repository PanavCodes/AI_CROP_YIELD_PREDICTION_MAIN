#!/usr/bin/env python3
"""
Simple endpoint test using TestClient (no server needed)
"""

from fastapi.testclient import TestClient
from main import app

def test_endpoints():
    """Test the main endpoints"""
    client = TestClient(app)
    
    print("🚀 Testing FastAPI Endpoints")
    print("=" * 50)
    
    # Test health endpoint
    print("1. Testing Health Endpoint...")
    try:
        response = client.get("/health")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   App Status: {data.get('status')}")
            print("   ✅ Health endpoint working!")
        else:
            print(f"   ❌ Health endpoint failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Health endpoint error: {e}")
    
    # Test AI chat endpoint
    print("\n2. Testing AI Chat Endpoint...")
    try:
        response = client.post("/api/ai/chat", json={
            "message": "How to grow tomatoes in monsoon?",
            "location": "Karnataka, India",
            "crops": "Tomato"
        })
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success')}")
            print(f"   AI Service: {data.get('ai_service')}")
            if data.get('success'):
                print(f"   Response Preview: {data.get('response', '')[:100]}...")
                print("   ✅ AI Chat endpoint working!")
            else:
                print(f"   ❌ Chat failed: {data.get('error')}")
        else:
            print(f"   ❌ AI Chat endpoint failed: {response.text}")
    except Exception as e:
        print(f"   ❌ AI Chat endpoint error: {e}")
    
    # Test test chat endpoint  
    print("\n3. Testing Test Chat Endpoint...")
    try:
        response = client.post("/api/test/chat", json={
            "text": "What fertilizer for rice?",
            "location": "Punjab, India",
            "crops": "Rice"
        })
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success')}")
            if data.get('success'):
                print(f"   AI Service: {data.get('ai_service')}")
                print("   ✅ Test Chat endpoint working!")
            else:
                print(f"   ❌ Test Chat failed: {data.get('error')}")
        else:
            print(f"   ❌ Test Chat endpoint failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Test Chat endpoint error: {e}")
    
    print("\n🏁 Endpoint test completed!")

if __name__ == "__main__":
    test_endpoints()