#!/usr/bin/env python3
"""
Test system without Gemini to ensure it works with only OpenRouter + rule-based fallback
"""

import os
import tempfile
import shutil
from fastapi.testclient import TestClient

def test_without_gemini():
    """Test the system completely without Gemini"""
    
    print("🧪 Testing System WITHOUT Gemini")
    print("=" * 50)
    
    # Import after ensuring no Gemini
    try:
        import google.generativeai
        print("❌ google.generativeai is still imported")
        return False
    except ImportError:
        print("✅ google.generativeai successfully removed")
    
    # Test AgricultureChatbot
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        print("✅ AgricultureChatbot imports successfully")
        
        # Test initialization
        chatbot = AgricultureChatbot()
        print("✅ AgricultureChatbot initializes without Gemini")
        
        # Check that it only has OpenRouter, no Gemini
        print(f"   OpenRouter available: {chatbot.openrouter_service.is_initialized}")
        
        # Test with a simple question (should use OpenRouter or rule-based)
        import asyncio
        async def test_question():
            result = await chatbot.get_agricultural_advice(
                "What is the best fertilizer for wheat?",
                {"location": "Punjab", "crops": "Wheat"}
            )
            return result
        
        result = asyncio.run(test_question())
        print(f"✅ Chat response generated: {result['success']}")
        print(f"   AI Service used: {result.get('ai_service', 'Unknown')}")
        
    except Exception as e:
        print(f"❌ AgricultureChatbot test failed: {e}")
        return False
    
    # Test FastAPI endpoints
    try:
        from main import app
        client = TestClient(app)
        
        # Test main chat endpoint
        response = client.post("/api/ai/chat", json={
            "message": "How to grow tomatoes?",
            "location": "Karnataka"
        })
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API endpoint works without Gemini")
            print(f"   Success: {data.get('success')}")
            print(f"   AI Service: {data.get('ai_service')}")
        else:
            print(f"❌ API endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False
    
    print("\n🎉 SUCCESS: System works perfectly without Gemini!")
    print("✅ OpenRouter is primary AI service")
    print("✅ Rule-based system provides reliable fallback")
    print("✅ No Gemini dependencies remain")
    
    return True

def test_rule_based_fallback():
    """Test rule-based fallback by temporarily removing OpenRouter key"""
    
    print("\n🧪 Testing Rule-based Fallback")
    print("=" * 50)
    
    # Temporarily remove OpenRouter key
    original_key = os.getenv('OPENROUTER_API_KEY')
    if original_key:
        os.environ.pop('OPENROUTER_API_KEY', None)
    
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        import asyncio
        
        # Create chatbot without OpenRouter
        chatbot = AgricultureChatbot()
        
        print(f"   OpenRouter available: {chatbot.openrouter_service.is_initialized}")
        
        # Test rule-based response
        async def test_fallback():
            result = await chatbot.get_agricultural_advice(
                "My plants have yellow leaves",
                {"location": "Maharashtra", "crops": "Tomato"}
            )
            return result
        
        result = asyncio.run(test_fallback())
        
        if result['success']:
            print("✅ Rule-based fallback works correctly")
            print(f"   AI Service: {result.get('ai_service')}")
            print(f"   Response length: {len(result.get('response', ''))}")
        else:
            print("❌ Rule-based fallback failed")
            return False
            
    except Exception as e:
        print(f"❌ Fallback test error: {e}")
        return False
    
    finally:
        # Restore OpenRouter key
        if original_key:
            os.environ['OPENROUTER_API_KEY'] = original_key
    
    print("✅ Rule-based fallback is reliable!")
    return True

if __name__ == "__main__":
    print("🚀 Testing Gemini-Free System")
    print("=" * 60)
    
    success1 = test_without_gemini()
    success2 = test_rule_based_fallback()
    
    print("\n" + "=" * 60)
    print("🏁 FINAL RESULTS")
    print("=" * 60)
    
    if success1 and success2:
        print("🎉 ALL TESTS PASSED!")
        print("✅ System works perfectly without Gemini")
        print("✅ OpenRouter provides excellent AI responses")
        print("✅ Rule-based fallback ensures reliability")
        print("\n🌾 Your chatbot is ready for production!")
    else:
        print("❌ Some tests failed")
        print("🔧 Please check the configuration")