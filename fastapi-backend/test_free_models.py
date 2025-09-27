import asyncio
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

async def test_free_models():
    """Test free tier models that might have available quota"""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ No API key found")
        return False
    
    genai.configure(api_key=api_key)
    
    # Try models that might have better free tier availability
    free_models_to_try = [
        'gemini-1.5-flash-8b',           # Smaller, more efficient model
        'gemini-2.5-flash',              # Latest flash model
        'gemini-2.0-flash',              # New generation model
        'gemini-flash-latest',           # Latest stable flash
        'gemma-3-1b-it',                 # Very small Gemma model
        'gemma-3-4b-it',                 # Small Gemma model
        'learnlm-2.0-flash-experimental' # Experimental model
    ]
    
    print(f"Testing with API key: {api_key[:10]}...{api_key[-5:]}")
    print(f"\n🔍 Testing {len(free_models_to_try)} potentially available free models...\n")
    
    for model_name in free_models_to_try:
        print(f"🧪 Testing {model_name}...")
        try:
            model = genai.GenerativeModel(model_name)
            
            # Use a very short prompt to minimize token usage
            response = await model.generate_content_async("Hello")
            
            if response and response.text:
                print(f"  ✅ SUCCESS! {model_name} is working!")
                print(f"  Response: {response.text.strip()}")
                
                # Test with agriculture prompt
                print(f"  🌱 Testing agriculture prompt...")
                ag_response = await model.generate_content_async(
                    "Name 2 common tomato diseases."
                )
                print(f"  🌱 Ag Response: {ag_response.text[:100]}...")
                
                return model_name  # Return the working model
            else:
                print(f"  ⚠️ Empty response from {model_name}")
                
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                print(f"  ❌ Quota exceeded for {model_name}")
            elif "404" in error_str:
                print(f"  ❌ Model {model_name} not found")
            elif "403" in error_str:
                print(f"  ❌ Permission denied for {model_name}")
            else:
                print(f"  ❌ Error with {model_name}: {e}")
            continue
    
    print("\n❌ No free tier models are currently available")
    print("\n💡 Your options:")
    print("1. Wait for quota reset (usually resets daily)")
    print("2. Enable billing to get higher quotas")
    print("3. Create a new Google account/project for fresh quotas")
    return None

async def main():
    working_model = await test_free_models()
    
    if working_model:
        print(f"\n🎉 Found working model: {working_model}")
        print(f"\nUpdating your gemini_service.py to use {working_model}...")
        
        # We'll update the service to use the working model
        return working_model
    else:
        print("\n🕐 Quota exhausted. Try again later or enable billing.")
        return None

if __name__ == "__main__":
    working_model = asyncio.run(main())
    if working_model:
        print(f"\nNext: I'll update your service to use {working_model}")
    else:
        print("\nCheck back later when quotas reset, or enable billing.")