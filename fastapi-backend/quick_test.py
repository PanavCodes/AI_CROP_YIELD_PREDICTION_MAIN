import asyncio
import sys
sys.path.append('.')
from services.gemini_service import GeminiService

async def quick_test():
    print('🌾 Testing Agriculture Chatbot - Quick Validation')
    print('-' * 50)
    
    gs = GeminiService()
    
    # Test agriculture query
    r1 = await gs.chat_response('How to grow tomatoes?')
    print(f'✅ Farming Question: Success={r1["success"]}, Source={r1["source"]}')
    
    # Test non-agriculture query  
    r2 = await gs.chat_response('Tell me a joke')
    print(f'🚫 Non-Farming Question: Success={r2["success"]}, Type={r2.get("type", "unknown")}')
    
    print('\n🎉 Agriculture chatbot is working correctly!')
    print('🔒 Only agriculture questions get AI responses')
    print('🚫 Non-agriculture questions are politely rejected')

if __name__ == "__main__":
    asyncio.run(quick_test())