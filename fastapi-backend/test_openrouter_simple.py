"""
Simple OpenRouter API Test
Test basic connectivity and find available free models
"""

import asyncio
import os
import httpx

async def test_openrouter_connection():
    """Test basic OpenRouter API connection"""
    api_key = os.getenv('OPENROUTER_API_KEY')
    
    if not api_key:
        print("❌ OPENROUTER_API_KEY not found!")
        return
    
    print(f"🔑 Using API key: {api_key[:20]}...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Crop Prediction App"
    }
    
    # Test 1: Get available models
    print("\n🔍 Testing model availability...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                "https://openrouter.ai/api/v1/models",
                headers=headers
            )
            
            if response.status_code == 200:
                models = response.json()
                print("✅ Successfully connected to OpenRouter!")
                
                # Find free models
                free_models = []
                if 'data' in models:
                    for model in models['data']:
                        pricing = model.get('pricing', {})
                        if (pricing.get('prompt', '0') == '0' and 
                            pricing.get('completion', '0') == '0'):
                            free_models.append(model['id'])
                
                print(f"🆓 Found {len(free_models)} free models:")
                for model in free_models[:10]:  # Show first 10
                    print(f"   • {model}")
                
                return free_models[0] if free_models else None
                
            else:
                print(f"❌ Failed to get models: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Connection error: {str(e)}")
            return None

async def test_chat_completion(model_id):
    """Test chat completion with a specific model"""
    api_key = os.getenv('OPENROUTER_API_KEY')
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Crop Prediction App"
    }
    
    print(f"\n🧪 Testing chat completion with model: {model_id}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json={
                    "model": model_id,
                    "messages": [
                        {
                            "role": "user",
                            "content": "What is the best fertilizer for wheat crops? Give a brief answer."
                        }
                    ],
                    "max_tokens": 150,
                    "temperature": 0.7
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('choices'):
                    content = data['choices'][0]['message']['content']
                    print("✅ Chat completion successful!")
                    print(f"📄 Response: {content[:200]}...")
                    return True
                else:
                    print("❌ No response content")
                    return False
            else:
                print(f"❌ Chat completion failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Chat completion error: {str(e)}")
            return False

async def main():
    """Run the tests"""
    print("🚀 OpenRouter Simple Connection Test")
    print("=" * 50)
    
    # Test connection and get free models
    free_model = await test_openrouter_connection()
    
    if free_model:
        # Test chat completion
        success = await test_chat_completion(free_model)
        
        if success:
            print(f"\n✅ OpenRouter is working! Recommended model: {free_model}")
            print("💡 Update your openrouter_service.py to use this model.")
        else:
            print("\n❌ Chat completion failed, but connection is working.")
    else:
        print("\n❌ Could not find working free models.")

if __name__ == "__main__":
    asyncio.run(main())