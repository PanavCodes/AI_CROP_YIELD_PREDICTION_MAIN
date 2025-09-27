#!/usr/bin/env python3
"""
Test environment variable loading and API connectivity
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_env_loading():
    """Test environment variable loading"""
    print("=" * 50)
    print("TESTING ENVIRONMENT VARIABLE LOADING")
    print("=" * 50)
    
    # Check current directory
    print(f"Current directory: {os.getcwd()}")
    
    # Check if .env file exists
    env_file = Path(".env")
    print(f".env file exists: {env_file.exists()}")
    
    if env_file.exists():
        print(f".env file path: {env_file.absolute()}")
        with open(env_file, 'r') as f:
            lines = f.readlines()[:10]  # First 10 lines
            print(f".env file content (first 10 lines):")
            for i, line in enumerate(lines, 1):
                print(f"  {i}: {line.strip()}")
    
    # Load environment variables
    print("\nLoading .env file...")
    load_dotenv()
    
    # Check environment variables
    print("\nChecking API keys:")
    gemini_key = os.getenv('GEMINI_API_KEY')
    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    weather_key = os.getenv('WEATHER_API_KEY')
    
    print(f"GEMINI_API_KEY: {'Set' if gemini_key else 'Not set'}")
    if gemini_key:
        print(f"  Value: {gemini_key[:20]}...")
    
    print(f"OPENROUTER_API_KEY: {'Set' if openrouter_key else 'Not set'}")
    if openrouter_key:
        print(f"  Value: {openrouter_key[:20]}...")
    
    print(f"WEATHER_API_KEY: {'Set' if weather_key else 'Not set'}")
    if weather_key:
        print(f"  Value: {weather_key[:20]}...")
    
    return gemini_key, openrouter_key

def test_gemini_api(api_key):
    """Test Gemini API connectivity"""
    print("\n" + "=" * 50)
    print("TESTING GEMINI API CONNECTIVITY")
    print("=" * 50)
    
    if not api_key:
        print("❌ No Gemini API key found")
        return False
    
    try:
        import google.generativeai as genai
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        print(f"✅ Gemini API key configured: {api_key[:20]}...")
        
        # Test different models
        models = ['gemini-1.5-flash-8b', 'gemini-1.5-flash', 'gemini-pro']
        
        for model_name in models:
            try:
                print(f"\n🔄 Testing model: {model_name}")
                model = genai.GenerativeModel(model_name)
                
                # Simple test
                response = model.generate_content("Hello! Can you help with farming advice?")
                
                if response and response.text:
                    print(f"✅ {model_name} - Working!")
                    print(f"  Response: {response.text[:100]}...")
                    return True
                else:
                    print(f"❌ {model_name} - No response")
                    
            except Exception as e:
                print(f"❌ {model_name} - Error: {str(e)}")
                continue
        
        return False
        
    except Exception as e:
        print(f"❌ Gemini API test failed: {str(e)}")
        return False

def test_openrouter_api(api_key):
    """Test OpenRouter API connectivity"""
    print("\n" + "=" * 50)
    print("TESTING OPENROUTER API CONNECTIVITY")
    print("=" * 50)
    
    if not api_key:
        print("❌ No OpenRouter API key found")
        return False
    
    try:
        import httpx
        import asyncio
        
        async def test_api():
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Crop Prediction App"
            }
            
            data = {
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": "Hello! Can you help with farming advice?"}
                ],
                "max_tokens": 100
            }
            
            print(f"✅ OpenRouter API key configured: {api_key[:20]}...")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=data
                )
                
                print(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('choices') and len(result['choices']) > 0:
                        content = result['choices'][0]['message']['content']
                        print(f"✅ OpenRouter API - Working!")
                        print(f"  Response: {content[:100]}...")
                        return True
                    else:
                        print("❌ OpenRouter API - No choices in response")
                        return False
                else:
                    print(f"❌ OpenRouter API - HTTP {response.status_code}")
                    print(f"  Error: {response.text}")
                    return False
        
        return asyncio.run(test_api())
        
    except Exception as e:
        print(f"❌ OpenRouter API test failed: {str(e)}")
        return False

def test_agriculture_chatbot():
    """Test the agriculture chatbot service"""
    print("\n" + "=" * 50)
    print("TESTING AGRICULTURE CHATBOT SERVICE")
    print("=" * 50)
    
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        import asyncio
        
        async def test_chatbot():
            chatbot = AgricultureChatbot()
            
            print(f"OpenRouter initialized: {chatbot.openrouter_service.is_initialized}")
            print(f"Gemini initialized: {chatbot.is_initialized}")
            
            # Test agricultural question
            test_question = "What are the best practices for growing tomatoes in monsoon season?"
            context = {
                "location": "Karnataka, India",
                "crops": "Tomato, Onion",
                "farm_size": "2 hectares"
            }
            
            print(f"\nTesting question: {test_question}")
            
            result = await chatbot.get_agricultural_advice(test_question, context)
            
            print(f"Success: {result['success']}")
            if result['success']:
                print(f"AI Service: {result.get('ai_service', 'Unknown')}")
                print(f"Response: {result['response'][:200]}...")
                return True
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
                return False
        
        return asyncio.run(test_chatbot())
        
    except Exception as e:
        print(f"❌ Agriculture chatbot test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 Starting Crop Prediction App API Tests")
    
    # Test environment loading
    gemini_key, openrouter_key = test_env_loading()
    
    # Test APIs
    gemini_works = test_gemini_api(gemini_key) if gemini_key else False
    openrouter_works = test_openrouter_api(openrouter_key) if openrouter_key else False
    
    # Test agriculture chatbot
    chatbot_works = test_agriculture_chatbot()
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    print(f"Environment variables loaded: {'✅' if (gemini_key or openrouter_key) else '❌'}")
    print(f"Gemini API working: {'✅' if gemini_works else '❌'}")
    print(f"OpenRouter API working: {'✅' if openrouter_works else '❌'}")
    print(f"Agriculture chatbot working: {'✅' if chatbot_works else '❌'}")
    
    if chatbot_works:
        print("\n🎉 Chatbot is working! The issue might be with the frontend integration.")
    elif gemini_works or openrouter_works:
        print("\n🔧 APIs work but chatbot has issues. Check chatbot service code.")
    else:
        print("\n❌ No APIs are working. Check API keys and network connectivity.")

if __name__ == "__main__":
    main()