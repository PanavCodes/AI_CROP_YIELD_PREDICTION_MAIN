#!/usr/bin/env python3
"""
Quick test for new Gemini API key
Replace YOUR_API_KEY_HERE with your actual key
"""

import os
import google.generativeai as genai

def test_gemini_key():
    """Test your new Gemini API key"""
    
    # 🔑 Your new API key
    api_key = "AIzaSyBEp2q8At8Vc9wlIhyppeh39h3WhOwmoYc"
    
    # Alternative: Use environment variable
    # api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key or api_key == "AIzaSy[YOUR_NEW_API_KEY_HERE]":
        print("❌ Please set your API key in this script or environment variable")
        print("💡 Get it from: https://aistudio.google.com/")
        return False
    
    print(f"🔑 Testing API key: {api_key[:20]}...")
    
    try:
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Test with different models
        models_to_test = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']
        
        for model_name in models_to_test:
            print(f"\n🧪 Testing {model_name}...")
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("What is sustainable agriculture? Answer in one sentence.")
                
                if response and response.text:
                    print(f"✅ {model_name} works!")
                    print(f"📝 Response: {response.text}")
                    print(f"\n🎉 SUCCESS! Your API key works with {model_name}")
                    return True
                else:
                    print(f"❌ {model_name} - No response")
                    
            except Exception as e:
                error_msg = str(e)
                if "404" in error_msg:
                    print(f"❌ {model_name} - Model not found")
                elif "403" in error_msg:
                    print(f"❌ {model_name} - Permission denied")
                else:
                    print(f"❌ {model_name} - Error: {error_msg[:100]}...")
        
        print("\n💥 None of the models worked!")
        print("🔍 Possible issues:")
        print("   1. API key is invalid")
        print("   2. Billing not enabled")
        print("   3. API not enabled in Google Cloud")
        print("   4. Regional restrictions")
        
        return False
        
    except Exception as e:
        print(f"❌ Configuration failed: {str(e)}")
        return False

def show_instructions():
    """Show instructions for getting API key"""
    print("🚀 How to get your Gemini API key:")
    print("   1. Go to https://aistudio.google.com/")
    print("   2. Sign in with your Google account")
    print("   3. Click 'Get API Key'")
    print("   4. Click 'Create API key in new project'")
    print("   5. Copy the key (starts with 'AIzaSy...')")
    print("   6. Replace the API key in this script")
    print("   7. Run the script again")
    print()

if __name__ == "__main__":
    print("🔍 Gemini API Key Tester")
    print("=" * 50)
    
    show_instructions()
    
    success = test_gemini_key()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Your Gemini AI is ready to use!")
        print("💡 Now update your .env file:")
        print("   GEMINI_API_KEY=your_working_api_key")
        print("   Then restart your FastAPI server")
    else:
        print("😞 API key needs to be fixed")
        print("📖 Check the instructions above")
        print("🔗 Visit: https://aistudio.google.com/")