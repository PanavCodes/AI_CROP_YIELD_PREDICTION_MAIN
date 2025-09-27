#!/usr/bin/env python3
"""
Test OpenRouter Chatbot Integration
Quick test to verify OpenRouter API is working for agricultural chatbot
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path so we can import our modules
sys.path.append(str(Path(__file__).parent))

from services.openrouter_service import OpenRouterService
from services.agriculture_chatbot import AgricultureChatbot

async def test_openrouter_direct():
    """Test OpenRouter service directly"""
    print("🧪 Testing OpenRouter Service Directly...")
    print("=" * 50)
    
    service = OpenRouterService()
    
    if not service.is_initialized:
        print("❌ OpenRouter service not initialized!")
        return False
    
    # Test question
    question = "My wheat crop leaves are turning yellow. What should I do?"
    context = {
        "location": "Punjab, India",
        "crops": "Wheat",
        "soil_type": "Alluvial",
        "farm_size": "5 acres"
    }
    
    print(f"📝 Question: {question}")
    print(f"🌍 Context: {context}")
    print("\n⏳ Getting response from OpenRouter...")
    
    try:
        response = await service.get_agricultural_advice(question, context)
        
        if response["success"]:
            print("✅ OpenRouter Response Successful!")
            print(f"🤖 AI Service: {response['ai_service']}")
            print(f"📊 Category: {response['question_category']}")
            print(f"⏰ Timestamp: {response['timestamp']}")
            if 'usage' in response:
                print(f"💰 Usage: {response['usage']}")
            print("\n📄 Response Content:")
            print("-" * 50)
            print(response["response"][:500] + "..." if len(response["response"]) > 500 else response["response"])
            print("-" * 50)
            return True
        else:
            print("❌ OpenRouter Response Failed!")
            print(f"🚫 Error: {response.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        return False

async def test_agriculture_chatbot():
    """Test agriculture chatbot with OpenRouter integration"""
    print("\n🌾 Testing Agriculture Chatbot with OpenRouter...")
    print("=" * 50)
    
    chatbot = AgricultureChatbot()
    
    print(f"🔧 OpenRouter initialized: {chatbot.openrouter_service.is_initialized}")
    print(f"🔧 Gemini initialized: {chatbot.is_initialized}")
    
    # Test question
    question = "Which fertilizer should I use for rice crop in monsoon season?"
    context = {
        "location": "West Bengal, India",
        "crops": "Rice",
        "soil_type": "Clay",
        "farm_size": "3 acres"
    }
    
    print(f"📝 Question: {question}")
    print(f"🌍 Context: {context}")
    print("\n⏳ Getting response from Agriculture Chatbot...")
    
    try:
        response = await chatbot.get_agricultural_advice(question, context)
        
        if response["success"]:
            print("✅ Chatbot Response Successful!")
            print(f"🤖 AI Service: {response['ai_service']}")
            print(f"📊 Category: {response['question_category']}")
            print(f"⏰ Timestamp: {response['timestamp']}")
            print("\n📄 Response Content:")
            print("-" * 50)
            print(response["response"][:500] + "..." if len(response["response"]) > 500 else response["response"])
            print("-" * 50)
            return True
        else:
            print("❌ Chatbot Response Failed!")
            print(f"🚫 Error: {response.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        return False

async def main():
    """Run all tests"""
    print("🚀 OpenRouter Agricultural Chatbot Test Suite")
    print("=" * 60)
    
    # Check environment
    api_key = os.getenv('OPENROUTER_API_KEY')
    if api_key:
        print(f"✅ OPENROUTER_API_KEY found: {api_key[:20]}...")
    else:
        print("❌ OPENROUTER_API_KEY not found in environment!")
        print("💡 Please set the environment variable and try again.")
        return
    
    print()
    
    # Test 1: Direct OpenRouter service
    test1_result = await test_openrouter_direct()
    
    # Test 2: Agriculture chatbot integration
    test2_result = await test_agriculture_chatbot()
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST SUMMARY")
    print("=" * 60)
    print(f"OpenRouter Direct Test: {'✅ PASSED' if test1_result else '❌ FAILED'}")
    print(f"Agriculture Chatbot Test: {'✅ PASSED' if test2_result else '❌ FAILED'}")
    
    if test1_result and test2_result:
        print("\n🎉 All tests passed! OpenRouter chatbot is ready to use.")
    else:
        print("\n⚠️ Some tests failed. Please check the configuration.")
        
    print("\n💡 Next steps:")
    print("1. Start your FastAPI server: python -m uvicorn main:app --reload")
    print("2. Test the chatbot endpoint: POST /api/chatbot/ask")
    print("3. The chatbot will use OpenRouter as the primary AI service!")

if __name__ == "__main__":
    asyncio.run(main())