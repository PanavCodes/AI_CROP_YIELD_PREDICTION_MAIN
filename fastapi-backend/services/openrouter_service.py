"""
OpenRouter API Service
Provides agricultural chatbot functionality using OpenRouter's API
"""

import logging
import os
import httpx
from typing import Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class OpenRouterService:
    """OpenRouter API service for agricultural chatbot"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "x-ai/grok-4-fast:free"  # Free model
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",  # Your app's URL
            "X-Title": "Crop Prediction App"  # Your app's name
        }
        self.is_initialized = self._check_initialization()
    
    def _check_initialization(self) -> bool:
        """Check if OpenRouter service is properly initialized"""
        if not self.api_key:
            logger.error("❌ OPENROUTER_API_KEY not found!")
            logger.info("💡 Get your API key from https://openrouter.ai/")
            return False
        
        if not self.api_key.startswith('sk-or-v1-'):
            logger.error("❌ Invalid OpenRouter API key format!")
            return False
        
        logger.info(f"✅ OpenRouter service initialized with key: {self.api_key[:20]}...")
        return True
    
    async def get_agricultural_advice(
        self, 
        question: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get agricultural advice using OpenRouter API
        """
        try:
            if not self.is_initialized:
                return self._error_response("OpenRouter service not initialized")
            
            # Build the agricultural prompt
            prompt = self._build_agricultural_prompt(question, context or {})
            
            # Make request to OpenRouter
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an expert agricultural advisor specializing in Indian farming. Provide practical, actionable advice with proper formatting using markdown. Focus on crop management, pest control, fertilization, irrigation, and market guidance."
                            },
                            {
                                "role": "user", 
                                "content": prompt
                            }
                        ],
                        "temperature": 0.7,
                        "max_tokens": 2048,
                        "top_p": 0.9
                    }
                )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('choices') and len(data['choices']) > 0:
                    content = data['choices'][0]['message']['content']
                    
                    return {
                        "success": True,
                        "response": content,
                        "ai_service": f"OpenRouter ({self.model})",
                        "confidence": "high",
                        "formatted": True,
                        "question_category": self._categorize_question(question),
                        "timestamp": datetime.utcnow().isoformat(),
                        "usage": data.get('usage', {})
                    }
                else:
                    return self._error_response("No response generated from model")
            
            elif response.status_code == 401:
                logger.error("❌ OpenRouter API key is invalid or expired")
                return self._error_response("Invalid API key")
            
            elif response.status_code == 429:
                logger.warning("⚠️ OpenRouter rate limit reached")
                return self._error_response("Rate limit reached, please try again later")
            
            else:
                error_msg = f"OpenRouter API error: {response.status_code}"
                logger.error(error_msg)
                return self._error_response(error_msg)
                
        except httpx.TimeoutException:
            logger.error("❌ OpenRouter API timeout")
            return self._error_response("Request timeout")
        
        except Exception as e:
            logger.error(f"❌ OpenRouter service error: {str(e)}")
            return self._error_response(str(e))
    
    def _build_agricultural_prompt(self, question: str, context: Dict[str, Any]) -> str:
        """Build a comprehensive agricultural prompt"""
        current_month = datetime.now().strftime("%B")
        current_season = self._get_current_season()
        
        # Build context
        farming_context = {
            "location": context.get("location", "India"),
            "state": context.get("state", "General Region"),
            "crops": context.get("crops", "Mixed crops"),
            "farm_size": context.get("farm_size", "Small-Medium"),
            "soil_type": context.get("soil_type", "Not specified"),
            "irrigation": context.get("irrigation", "Available"),
            "current_month": current_month,
            "current_season": current_season,
        }
        
        prompt = f"""You are an expert agricultural advisor specializing in Indian farming. 
Provide practical, actionable advice with PROPER FORMATTING using markdown.

FARMING CONTEXT:
📍 Location: {farming_context['location']}
🌾 Primary Crops: {farming_context['crops']}
📏 Farm Size: {farming_context['farm_size']}
🌱 Soil Type: {farming_context['soil_type']}
💧 Irrigation: {farming_context['irrigation']}
📅 Current Season: {farming_context['current_season']}
🗓️ Current Month: {farming_context['current_month']}

FARMER'S QUESTION: {question}

PROVIDE A WELL-FORMATTED RESPONSE WITH:

1. **Direct Answer** - Clear, concise answer to the question
2. **Detailed Explanation** - Why this advice matters
3. **Step-by-Step Actions** - Numbered practical steps
4. **Best Practices** - Bullet points of key recommendations
5. **Timing & Schedule** - When to perform actions
6. **Cost Considerations** - Budget-friendly options
7. **Expected Results** - What outcomes to expect
8. **Common Mistakes** - What to avoid
9. **Additional Resources** - Where to get more help

FORMAT YOUR RESPONSE USING:
- **Bold** for important points
- *Italics* for emphasis
- Bullet points (•) for lists
- Numbered lists for steps
- 🌱🌾💧🌞⚠️📅💰🔍 emojis for visual appeal
- Clear section headers
- Tables where appropriate (using markdown table format)

Keep response focused on practical Indian farming conditions.
Include traditional wisdom alongside modern techniques.
Mention relevant government schemes if applicable.
"""
        return prompt
    
    def _get_current_season(self) -> str:
        """Get current agricultural season in India"""
        month = datetime.now().month
        if month in [6, 7, 8, 9, 10]:
            return "Kharif (Monsoon Season)"
        elif month in [10, 11, 12, 1, 2, 3]:
            return "Rabi (Winter Season)"
        else:
            return "Zaid (Summer Season)"
    
    def _categorize_question(self, question: str) -> str:
        """Categorize the agricultural question"""
        question_lower = question.lower()
        
        categories = {
            "crop_selection": ["which crop", "what to plant", "crop selection", "best crop"],
            "pest_management": ["pest", "insect", "attack", "infestation"],
            "disease_control": ["disease", "yellow", "wilting", "rot", "fungus"],
            "fertilizer": ["fertilizer", "nutrient", "npk", "urea", "dap"],
            "irrigation": ["water", "irrigation", "drought", "moisture"],
            "harvest": ["harvest", "when to harvest", "maturity"],
            "market": ["price", "sell", "market", "mandi"],
            "weather": ["weather", "rain", "climate"],
            "soil": ["soil", "ph", "testing", "quality"],
            "general": ["how to", "what is", "why", "when"]
        }
        
        for category, keywords in categories.items():
            if any(keyword in question_lower for keyword in keywords):
                return category
        
        return "general_farming"
    
    def _error_response(self, error_msg: str) -> Dict[str, Any]:
        """Generate error response"""
        return {
            "success": False,
            "response": f"""## ⚠️ **Service Temporarily Unavailable**

I encountered an issue: {error_msg}

### 📞 **Alternative Help:**

• **Kisan Call Center:** 1800-180-1551 (Toll-free)
• **Local Agriculture Officer:** Contact your block/district office  
• **Krishi Vigyan Kendra:** Nearest KVK for expert advice

### 💡 **Meanwhile:**

1. Check the **Kisan Suvidha** app
2. Visit **farmer.gov.in** portal
3. Contact local successful farmers

**Please try again in a few moments.** 🌾""",
            "ai_service": "OpenRouter (Error)",
            "confidence": "low",
            "formatted": True,
            "error": error_msg,
            "timestamp": datetime.utcnow().isoformat()
        }

# Export the class
__all__ = ['OpenRouterService']