# 🔑 How to Get Gemini AI API Key

## 🎯 **What You Currently Have vs What You Need**

### ❌ **Current (OAuth Client ID):**
```
322723756678-clqi490hkof9mvpodojui3uv1bbmfinb.apps.googleusercontent.com
```
**Purpose:** User authentication (Sign in with Google)
**Not suitable for:** Direct AI API calls

### ✅ **Need (Gemini API Key):**
```
AIzaSy... (39 characters total)
```
**Purpose:** Direct API calls to Gemini AI
**Required for:** Chatbot, AI responses

## 🚀 **Step-by-Step: Get Gemini API Key**

### **Method 1: Google AI Studio (Recommended)**

1. **Visit Google AI Studio**
   ```
   https://aistudio.google.com/
   ```

2. **Sign in**
   - Use your Google account
   - Same account as your OAuth client ID is fine

3. **Get API Key**
   - Look for "Get API Key" button (usually top-right)
   - Click "Create API Key"
   - Choose "Create API key in new project" or existing project
   - Copy the generated key (starts with `AIzaSy...`)

4. **Test the API Key**
   - Try generating some content in the studio
   - Make sure it works before using in your app

### **Method 2: Google Cloud Console**

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Select/Create Project**
   - Use existing project or create new one
   - Enable billing if required

3. **Enable Generative AI API**
   - Go to "APIs & Services" > "Library"
   - Search for "Generative Language API"
   - Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated key

5. **Restrict the API Key (Recommended)**
   - Click on the API key to edit
   - Add restrictions to "Generative Language API"
   - Add website/IP restrictions for security

## 🔧 **Update Your Environment**

1. **Update .env file:**
```bash
# In fastapi-backend/.env
GEMINI_API_KEY=AIzaSy[YOUR_NEW_API_KEY_HERE]
```

2. **For system environment:**
```powershell
# In PowerShell
$env:GEMINI_API_KEY = "AIzaSy[YOUR_NEW_API_KEY_HERE]"
```

## 🧪 **Test the New API Key**

Create a simple test file:

```python
# test_new_key.py
import os
import google.generativeai as genai

# Set your new API key
api_key = "AIzaSy[YOUR_NEW_API_KEY_HERE]"  # Replace with actual key
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("What is agriculture in one sentence?")
    print("✅ Success!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
```

Run it:
```bash
python test_new_key.py
```

## 🔐 **Security Best Practices**

1. **Keep API Key Secret**
   - Never commit to version control
   - Use environment variables
   - Don't share publicly

2. **Add to .gitignore**
```gitignore
.env
*.env
*api_key*
```

3. **Use Restrictions**
   - Limit to specific APIs
   - Add website restrictions
   - Monitor usage quotas

## 💰 **Billing Information**

- **Free Tier**: Usually includes generous free quotas
- **Pay-per-use**: After free tier
- **Monitor usage**: In Google Cloud Console

## 🛠️ **If You Get Errors:**

### **"API key not valid"**
- Regenerate the API key
- Make sure you copied it completely
- Check if the API is enabled

### **"Quota exceeded"**
- Check usage in Google Cloud Console
- Enable billing if needed
- Wait for quota reset

### **"Permission denied"**
- Enable the Generative Language API
- Check project billing status
- Verify API key restrictions

## 🎉 **Expected Result**

Once you have the correct API key, you should see:

```
✅ Gemini AI configured successfully
✅ Model initialized successfully
✅ Response generated successfully!
📝 Response: Agriculture is the practice of cultivating plants and livestock...
```

## 📞 **Still Having Issues?**

1. **Double-check the API key format**
   - Should start with `AIzaSy...`
   - Should be exactly 39 characters
   - No extra spaces or characters

2. **Try different models**
   - `gemini-pro`
   - `gemini-1.5-flash`
   - `gemini-1.5-pro`

3. **Check Google AI Studio first**
   - Always test there before using in app
   - Verify your account has access

---

**🚨 Important Note:** Your OAuth Client ID is still useful for user authentication features, but it's not what we need for the AI chatbot functionality. You'll need both for a complete application!