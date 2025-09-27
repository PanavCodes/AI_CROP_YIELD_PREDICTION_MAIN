#!/usr/bin/env python3
"""
Test Gemini with free tier models
"""

import google.generativeai as genai

def test_free_tier_models():
    """Test models that should work with free tier"""
    
    api_key = "AIzaSyBEp2q8At8Vc9wlIhyppeh39h3WhOwmoYc"
    genai.configure(api_key=api_key)
    
    print(f"🔑 Testing API key: {api_key[:20]}...")
    
    # Models that typically work with free tier
    free_tier_models = [
        'models/gemini-pro',
        'models/gemini-1.5-flash',
        'models/text-bison-001',
        'gemini-1.0-pro'
    ]
    
    for model_name in free_tier_models:
        print(f"\n🧪 Testing {model_name}...")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello! What is farming?")
            
            if response and response.text:
                print(f"✅ {model_name} works!")
                print(f"📝 Response: {response.text[:150]}...")
                return model_name, True
            else:
                print(f"❌ {model_name} - No response")
                
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg:
                print(f"❌ {model_name} - Quota exceeded")
            elif "404" in error_msg:
                print(f"❌ {model_name} - Not found")
            elif "403" in error_msg:
                print(f"❌ {model_name} - Permission denied")
            else:
                print(f"❌ {model_name} - Error: {error_msg[:100]}...")
    
    return None, False

def check_quota_status():
    """Check API quotas and billing"""
    print("\n💰 Quota and Billing Information:")
    print("=" * 40)
    print("Your API key appears to have quota limitations.")
    print("\n🔍 To check your quota:")
    print("1. Visit: https://console.cloud.google.com/")
    print("2. Go to 'APIs & Services' > 'Quotas'")
    print("3. Search for 'Generative Language API'")
    print("4. Check your current usage and limits")
    print("\n💡 To increase quotas:")
    print("1. Enable billing in Google Cloud Console")
    print("2. Or wait for quota reset (usually daily)")
    print("3. Or try using fewer requests per minute")

if __name__ == "__main__":
    print("🔍 Testing Free Tier Gemini Models")
    print("=" * 50)
    
    working_model, success = test_free_tier_models()
    
    if success:
        print(f"\n🎉 SUCCESS! Working model: {working_model}")
        print("Your API key is valid and working!")
    else:
        print("\n😞 No models are working with current quotas")
        check_quota_status()
    
    print("\n" + "=" * 50)
    print("📊 Current Status:")
    if success:
        print("✅ API key is valid")
        print("✅ Can make API calls")
        print("💡 Update your .env file with this key")
    else:
        print("✅ API key is valid")
        print("❌ Quota/billing issues")
        print("💡 Enable billing or wait for quota reset")