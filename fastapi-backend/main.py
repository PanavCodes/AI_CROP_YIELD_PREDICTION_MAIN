"""
FastAPI Backend for Crop Prediction App
Integrates with existing Node.js Express backend
"""

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager
from datetime import datetime
import os
from typing import Optional, List
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Local imports (will create these modules)
from database.mongodb import get_database, close_database_connection
from models.schemas import (
    HealthResponse, 
    CropDataResponse,
    YieldPredictionRequest,
    YieldPredictionResponse,
    AuthRequest,
    AuthResponse
)
from services.ml_service import MLService
from services.auth_service import AuthService
from services.crop_analytics import CropAnalyticsService
from utils.config import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
settings = get_settings()
ml_service = MLService()
auth_service = AuthService()
analytics_service = CropAnalyticsService()

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting FastAPI Crop Prediction Backend...")
    
    # Initialize database connection
    await get_database()
    
    # Initialize ML models
    await ml_service.initialize()
    
    logger.info("✅ FastAPI application started successfully")
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down FastAPI application...")
    
    # Close database connections
    await close_database_connection()
    
    logger.info("✅ FastAPI application shutdown complete")

# Create FastAPI instance
app = FastAPI(
    title="Crop Prediction API",
    description="""
    **FastAPI Backend for Agricultural Crop Prediction and Analytics**
    
    This API provides:
    - **Crop Data Analytics** - CSV upload, processing, and statistical analysis
    - **ML Yield Prediction** - Machine learning-based crop yield forecasting
    - **Plant Disease Detection** - AI-powered image analysis
    - **Weather Integration** - Real-time weather data for agricultural insights
    - **MongoDB Integration** - Advanced analytics using aggregation pipelines
    
    Built to complement the existing Node.js Express backend.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration - allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5000",  # Node.js backend
        "http://localhost:5173",  # Vite dev server default port
        "http://localhost:5174",  # Vite dev server alternate port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*"  # Allow all origins in development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and get current user"""
    token = credentials.credentials
    user = await auth_service.verify_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint with database and service status"""
    try:
        # Check database connection
        db = await get_database()
        db_status = "connected" if db is not None else "disconnected"
        
        # Check ML service status
        ml_status = "ready" if ml_service.is_initialized else "initializing"
        
        return HealthResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            database_status=db_status,
            ml_service_status=ml_status,
            version="1.0.0"
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

# Authentication endpoints
@app.post("/auth/login", response_model=AuthResponse, tags=["Authentication"])
async def login(auth_request: AuthRequest):
    """Authenticate user and return JWT token"""
    try:
        result = await auth_service.authenticate_user(auth_request.email, auth_request.password)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

# Crop data endpoints
@app.get("/api/crop-data", response_model=List[CropDataResponse], tags=["Crop Data"])
async def get_crop_data(
    limit: int = 100,
    offset: int = 0,
    crop_type: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None
):
    """Get paginated crop data with optional filters"""
    try:
        filters = {}
        if crop_type:
            filters["crop_type"] = crop_type
        if state:
            filters["state"] = state
        if district:
            filters["district"] = district
            
        data = await analytics_service.get_crop_data(
            filters=filters,
            limit=limit,
            offset=offset
        )
        return data
    except Exception as e:
        logger.error(f"Error fetching crop data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch crop data")

@app.get("/api/crop-data/statistics", tags=["Analytics"])
async def get_crop_statistics():
    """Get comprehensive crop data statistics"""
    try:
        stats = await analytics_service.get_comprehensive_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

# ML Prediction endpoints
@app.post("/api/predict/yield", response_model=YieldPredictionResponse, tags=["Machine Learning"])
async def predict_yield(prediction_request: YieldPredictionRequest):
    """Predict crop yield using ML models"""
    try:
        if not ml_service.is_initialized:
            raise HTTPException(
                status_code=503, 
                detail="ML service is still initializing. Please try again in a moment."
            )
        
        prediction = await ml_service.predict_yield(prediction_request)
        return prediction
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Yield prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Yield prediction failed")

@app.post("/api/predict/simple-yield", tags=["Machine Learning"])
async def predict_simple_yield(
    crop: str,
    state: str,
    rainfall: float,
    temperature: float,
    area: float = 1.0,
    pesticides: float = 0.0,
    year: int = None
):
    """Simple yield prediction endpoint for direct user input from data input page"""
    try:
        if not ml_service.is_initialized:
            raise HTTPException(
                status_code=503,
                detail="ML service is still initializing. Please try again in a moment."
            )
        
        # Prepare input data for ML prediction
        input_data = {
            'crop': crop,
            'state': state,
            'year': year if year else datetime.now().year,
            'rainfall': rainfall,
            'temperature': temperature,
            'pesticides': pesticides,
            'area': area
        }
        
        # Get prediction using the real ML service
        prediction_result = ml_service._predict_yield_ml(input_data)
        
        return {
            "success": True,
            "predicted_yield": prediction_result["predicted_yield_per_hectare"],
            "total_production": prediction_result["total_predicted_production"],
            "unit": "quintals",
            "input_data": {
                "crop": crop,
                "state": state,
                "rainfall_mm": rainfall,
                "temperature_celsius": temperature,
                "area_hectares": area,
                "pesticides_tonnes": pesticides,
                "year": input_data['year']
            },
            "model_type": prediction_result.get("model_type", "Agrisense ML"),
            "prediction_timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simple yield prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Yield prediction failed")

@app.post("/api/predict/crop-recommendation", tags=["Machine Learning"])
async def recommend_crop(
    N: float,
    P: float, 
    K: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float
):
    """Recommend optimal crop based on soil and weather conditions using AgriSens ML model"""
    try:
        if not ml_service.is_initialized:
            raise HTTPException(
                status_code=503,
                detail="ML service is still initializing. Please try again in a moment."
            )
        
        recommendation = await ml_service.recommend_crop(
            N=N, P=P, K=K,
            temperature=temperature,
            humidity=humidity,
            ph=ph,
            rainfall=rainfall
        )
        
        # Return clean response without descriptions (as requested)
        return {
            "success": recommendation["success"],
            "recommended_crop": recommendation["recommended_crop"],
            "confidence": recommendation["confidence"],
            "top_3_recommendations": recommendation["top_3_recommendations"],
            "soil_analysis": recommendation["soil_analysis"],
            "environmental_analysis": recommendation["environmental_analysis"],
            "model_info": {
                "model_type": recommendation["model_type"],
                "supported_crops": recommendation["supported_crops"]
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Crop recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Crop recommendation failed")

@app.post("/api/crop-suggestions", tags=["Machine Learning", "Suggestions"])
async def get_crop_suggestions(
    N: float,
    P: float, 
    K: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float
):
    """Get simple crop suggestions for the suggestions page (no descriptions)"""
    try:
        if not ml_service.is_initialized:
            raise HTTPException(
                status_code=503,
                detail="ML service is still initializing. Please try again in a moment."
            )
        
        recommendation = await ml_service.recommend_crop(
            N=N, P=P, K=K,
            temperature=temperature,
            humidity=humidity,
            ph=ph,
            rainfall=rainfall
        )
        
        # Return only the essential crop suggestions without descriptions
        return {
            "success": True,
            "recommended_crop": recommendation["recommended_crop"],
            "confidence": recommendation["confidence"],
            "suggestions": [
                crop["crop"] for crop in recommendation["top_3_recommendations"]
            ],
            "confidence_scores": {
                crop["crop"]: crop["confidence"] 
                for crop in recommendation["top_3_recommendations"]
            },
            "input_data": {
                "nitrogen": N,
                "phosphorus": P,
                "potassium": K,
                "temperature": temperature,
                "humidity": humidity,
                "ph": ph,
                "rainfall": rainfall
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Crop suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get crop suggestions")

# File upload endpoints
@app.post("/api/upload/csv", tags=["Data Upload"])
async def upload_csv(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload and process CSV file for crop data"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        result = await analytics_service.process_csv_upload(file, current_user["user_id"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="CSV upload failed")

# Disease detection endpoint
@app.post("/api/ai/detect-disease", tags=["AI Services"])
async def detect_plant_disease(
    image: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Detect plant diseases from uploaded images"""
    try:
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        result = await ml_service.detect_plant_disease(image)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Disease detection error: {str(e)}")
        raise HTTPException(status_code=500, detail="Disease detection failed")

# Weather integration endpoint
@app.get("/api/weather/{location}", tags=["Weather"])
async def get_weather_data(location: str):
    """Get weather data for agricultural insights"""
    try:
        from services.weather_service import WeatherService
        weather_service = WeatherService()
        weather_data = await weather_service.get_agricultural_weather(location)
        return weather_data
    except Exception as e:
        logger.error(f"Weather data error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")

# OpenRouter-based AI Services
@app.post("/api/ai/crop-advice", tags=["AI Services"])
async def get_ai_crop_advice(
    query: str,
    context: Optional[dict] = None
):
    """Get AI-powered crop advice using OpenRouter (with AgricultureChatbot)"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        chatbot = AgricultureChatbot()
        
        advice = await chatbot.get_agricultural_advice(query, context or {})
        return advice
    except Exception as e:
        logger.error(f"AI crop advice error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get AI crop advice")

@app.post("/api/ai/analyze-crop", tags=["AI Services"])
async def analyze_crop_with_ai(
    crop_data: dict
):
    """Analyze crop data using OpenRouter AI"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        chatbot = AgricultureChatbot()
        
        # Convert crop data to analysis query
        query = f"Please analyze this crop data: {crop_data}"
        context = crop_data.get('context', {})
        
        analysis = await chatbot.get_agricultural_advice(query, context)
        return analysis
    except Exception as e:
        logger.error(f"AI crop analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze crop data")

@app.get("/api/ai/market-trends/{crop}", tags=["AI Services"])
async def get_market_trends(
    crop: str,
    location: Optional[str] = None
):
    """Get AI-powered market trend predictions using OpenRouter"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        chatbot = AgricultureChatbot()
        
        query = f"What are the current market trends and price predictions for {crop}?"
        context = {"location": location or "India", "crops": crop}
        
        trends = await chatbot.get_agricultural_advice(query, context)
        return trends
    except Exception as e:
        logger.error(f"Market trends error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get market trends")

@app.post("/api/ai/diagnose-disease", tags=["AI Services"])
async def diagnose_plant_disease(
    symptoms: str,
    crop: Optional[str] = None,
    image_analysis: Optional[str] = None
):
    """Diagnose plant diseases using OpenRouter AI"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        chatbot = AgricultureChatbot()
        
        query = f"My {crop or 'crop'} is showing these symptoms: {symptoms}"
        if image_analysis:
            query += f" Image analysis shows: {image_analysis}"
        query += " What disease is this and how should I treat it?"
        
        context = {"crops": crop or "Unknown crop"}
        diagnosis = await chatbot.get_agricultural_advice(query, context)
        return diagnosis
    except Exception as e:
        logger.error(f"Disease diagnosis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to diagnose disease")

@app.post("/api/ai/farm-plan", tags=["AI Services"])
async def generate_farm_plan(
    farm_details: dict
):
    """Generate comprehensive farm planning recommendations using OpenRouter"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        chatbot = AgricultureChatbot()
        
        query = f"Please create a comprehensive farming plan for my farm with these details: {farm_details}"
        context = farm_details
        
        plan = await chatbot.get_agricultural_advice(query, context)
        return plan
    except Exception as e:
        logger.error(f"Farm planning error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate farm plan")

# Enhanced Agricultural Chat endpoint (no authentication required for testing)
@app.post("/api/test/chat", tags=["Testing", "AI Chat"])
async def agricultural_chat_test(
    request: dict  # Request body with 'text' field
):
    """Agricultural chatbot with proper formatting and agriculture-specific responses"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        
        # Get the text from request
        text = request.get('text', '')
        if not text or not text.strip():
            return {
                "success": False,
                "error": "Message text is required",
                "message": "Please provide a 'text' field in your request"
            }
        
        # Build comprehensive context for better responses
        farmer_context = {
            "location": request.get('location', 'India'),
            "state": request.get('state', 'General Region'),
            "crops": request.get('crops', 'Mixed crops'),
            "farm_size": request.get('farm_size', '2-5 hectares'),
            "experience": request.get('experience', 'Moderate'),
            "soil_type": request.get('soil_type', 'Loamy'),
            "irrigation": request.get('irrigation', 'Available'),
            "farming_type": request.get('farming_type', 'Traditional')
        }
        
        # Initialize the enhanced agricultural chatbot
        chatbot = AgricultureChatbot()
        
        # Get agricultural advice with formatting
        response = await chatbot.get_agricultural_advice(text, farmer_context)
        
        # Return formatted response
        return {
            "success": response.get('success', True),
            "query": text,
            "response": response.get('response', 'Unable to generate response'),
            "ai_service": response.get('ai_service', 'Agricultural Expert'),
            "confidence": response.get('confidence', 'medium'),
            "formatted": response.get('formatted', True),
            "question_category": response.get('question_category', 'general'),
            "timestamp": response.get('timestamp', datetime.utcnow().isoformat()),
            "context": farmer_context,
            "helpful_resources": {
                "kisan_helpline": "1800-180-1551",
                "apps": ["Kisan Suvidha", "Plantix", "mKisan"],
                "websites": ["farmer.gov.in", "agmarknet.gov.in"]
            }
        }
        
    except Exception as e:
        logger.error(f"Test chat error: {str(e)}")
        
        # Return a helpful error response
        return {
            "success": False,
            "error": str(e),
            "message": "Chat service encountered an error",
            "fallback_response": f"""🌾 **Agricultural Assistant**

I received your question: "{text[:100]}{'...' if len(text) > 100 else ''}"

While I'm having technical difficulties, here are some general resources:

📞 **Get Help:**
- Kisan Call Center: 1800-180-1551
- Local Agriculture Extension Officer
- Nearest Krishi Vigyan Kendra (KVK)

💡 **Try asking about:**
- Crop diseases and pest management
- Irrigation and water management
- Market prices and best selling times
- Soil health and fertilizers
- Weather-based farming advice

Please try your question again!""",
            "timestamp": datetime.utcnow().isoformat()
        }

# Agriculture-focused chatbot endpoint (for website integration)
@app.post("/api/chat/agriculture", tags=["AI Chat", "Agriculture"])
async def agriculture_chat(
    request: dict  # Request body with 'message' and optional context fields
):
    """Agriculture-focused chatbot that only responds to farming-related queries"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        
        # Get the message from request
        message = request.get('message', '').strip()
        if not message:
            return {
                "success": False,
                "error": "Message is required",
                "type": "error"
            }
        
        # Build user context from request
        user_context = {
            "location": request.get('location', 'India'),
            "experience": request.get('experience', 'Beginner'),
            "crops": request.get('crops', 'Mixed farming'),
            "farm_size": request.get('farm_size', '1-2 hectares'),
            "season": request.get('season', 'Current season')
        }
        
        # Initialize Agriculture chatbot
        chatbot = AgricultureChatbot()
        
        # Get agriculture-focused response
        response = await chatbot.get_agricultural_advice(message, user_context)
        
        # Return formatted response for website
        return {
            "success": response["success"],
            "message": message,
            "response": response["response"],
            "type": "agriculture_advice" if response["success"] else "error",
            "source": response.get("ai_service", "Agricultural Expert"),
            "confidence": response.get("confidence", "medium"),
            "timestamp": datetime.utcnow().isoformat(),
            "user_context": user_context,
            "is_agriculture_related": response["success"]
        }
        
    except Exception as e:
        logger.error(f"Agriculture chat error: {str(e)}")
        
        # Return error with helpful message
        return {
            "success": False,
            "error": str(e),
            "response": """🌾 **KrishiMitra - Agriculture Assistant**
            
I'm experiencing technical difficulties right now, but I'm here to help with your farming questions!
            
📱 **Quick Help:**
- Call Kisan Call Center: 1800-180-1551
- Visit your nearest Krishi Vigyan Kendra
- Try the Kisan Suvidha mobile app
            
🔄 **Please try again in a few minutes!**
            
I specialize in answering questions about crops, farming, diseases, irrigation, market prices, and agricultural best practices. 🧑‍🌾""",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        }

# General AI chat endpoint using AgricultureChatbot (OpenRouter primary)
@app.post("/api/ai/chat", tags=["AI Services", "AI Chat"])
async def ai_chat(request: dict):
    """Unified AI chat endpoint that uses AgricultureChatbot (OpenRouter primary, rule-based fallback)."""
    try:
        from services.agriculture_chatbot import AgricultureChatbot

        # Accept either 'message' or 'text'
        message = (request.get('message') or request.get('text') or '').strip()
        if not message:
            return {"success": False, "error": "Message is required", "type": "error"}

        # Optional context
        context = {
            "location": request.get('location', 'India'),
            "state": request.get('state', 'General Region'),
            "crops": request.get('crops', 'Mixed crops'),
            "farm_size": request.get('farm_size', 'Small-Medium'),
            "experience": request.get('experience', 'Moderate'),
            "soil_type": request.get('soil_type', 'Not specified'),
            "irrigation": request.get('irrigation', 'Available'),
            "farming_type": request.get('farming_type', 'Traditional')
        }

        chatbot = AgricultureChatbot()
        result = await chatbot.get_agricultural_advice(message, context)

        return {
            "success": result.get('success', True),
            "message": message,
            "response": result.get('response', 'Unable to generate response'),
            "ai_service": result.get('ai_service', 'Agricultural Expert'),
            "confidence": result.get('confidence', 'medium'),
            "formatted": result.get('formatted', True),
            "question_category": result.get('question_category', 'general'),
            "timestamp": result.get('timestamp', datetime.utcnow().isoformat())
        }
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "AI chat service encountered an error",
            "timestamp": datetime.utcnow().isoformat()
        }

# Chat History Management Endpoints
@app.post("/api/chat/clear", tags=["AI Chat", "Chat Management"])
async def clear_chat_history(request: dict = {}):
    """Clear chat history for the current session"""
    try:
        # For now, this is a client-side operation, but we return success
        # In the future, this could clear server-side session data
        session_id = request.get('session_id', 'default')
        
        logger.info(f"Chat history cleared for session: {session_id}")
        
        return {
            "success": True,
            "message": "Chat history cleared successfully",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Clear chat history error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to clear chat history",
            "timestamp": datetime.utcnow().isoformat()
        }

@app.post("/api/chat/reset", tags=["AI Chat", "Chat Management"])
async def reset_chat_session(request: dict = {}):
    """Reset chat session and clear all context"""
    try:
        session_id = request.get('session_id', 'default')
        
        # Clear any server-side context or session data
        logger.info(f"Chat session reset for session: {session_id}")
        
        return {
            "success": True,
            "message": "Chat session reset successfully",
            "session_id": session_id,
            "new_session": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Reset chat session error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to reset chat session",
            "timestamp": datetime.utcnow().isoformat()
        }

# API Testing endpoints
@app.get("/api/test/ai-chat", tags=["Testing"])
async def test_openrouter_ai():
    """Test OpenRouter AI API connectivity and functionality through AgricultureChatbot"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        chatbot = AgricultureChatbot()
        
        # Test basic functionality
        test_query = "What are the best practices for rice cultivation in monsoon season?"
        test_context = {
            "location": "Punjab, India",
            "crops": "Rice, Wheat",
            "farm_size": "2 hectares",
            "season": "Monsoon"
        }
        
        result = await chatbot.get_agricultural_advice(test_query, test_context)
        
        return {
            "openrouter_available": chatbot.openrouter_service.is_initialized,
            "rule_based_fallback": True,
            "test_query": test_query,
            "test_result": result,
            "api_status": "working" if result["success"] else "limited_functionality",
            "ai_service_used": result.get("ai_service", "Unknown"),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"OpenRouter AI test error: {str(e)}")
        return {
            "openrouter_available": False,
            "error": str(e),
            "api_status": "failed",
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/api/test/weather", tags=["Testing"])
async def test_weather_api(
    location: str = "Delhi"
):
    """Test weather API connectivity and functionality"""
    try:
        from services.weather_service import WeatherService
        weather_service = WeatherService()
        
        # Test weather data retrieval
        weather_data = await weather_service.get_agricultural_weather(location)
        
        return {
            "weather_api_available": True,
            "test_location": location,
            "weather_data": weather_data,
            "api_status": "working",
            "data_source": weather_data.get("data_source", "unknown"),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Weather API test error: {str(e)}")
        return {
            "weather_api_available": False,
            "error": str(e),
            "api_status": "failed",
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/api/test/market-prices", tags=["Testing"])
async def test_market_prices(
    state: Optional[str] = "Karnataka",
    commodity: Optional[str] = None
):
    """Test market prices endpoint without authentication (for testing only)"""
    try:
        import httpx
        import json
        from datetime import datetime
        
        # AgMarkNet API base URL (using free government API)
        base_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        
        # Build API parameters - Updated with working configuration
        params = {
            "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b",  # Free government API key
            "format": "json",
            "limit": str(20),  # API requires string values
            "offset": str(0)   # API requires string values
        }
        
        # Add filters if provided
        filters = {}
        if state:
            filters["state"] = state
        if commodity:
            filters["commodity"] = commodity
        
        if filters:
            params["filters"] = json.dumps(filters)
        
        # Make API request with timeout
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(base_url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check if data is available
                    if "records" in data and data["records"]:
                        return {
                            "success": True,
                            "message": "Market prices retrieved successfully",
                            "data": {
                                "records": data["records"],
                                "total": data.get("total", len(data["records"])),
                                "count": len(data["records"])
                            },
                            "timestamp": datetime.utcnow().isoformat(),
                            "source": "AgMarkNet - Government of India"
                        }
                    else:
                        # Return sample data for demonstration
                        sample_data = [
                            {
                                "state": state or "Karnataka",
                                "district": "Bangalore Urban",
                                "market": "KR Market",
                                "commodity": commodity or "Rice",
                                "variety": "Common",
                                "grade": "FAQ",
                                "arrival_date": datetime.now().strftime("%Y-%m-%d"),
                                "min_price": "2800",
                                "max_price": "3200",
                                "modal_price": "3000"
                            },
                            {
                                "state": state or "Karnataka",
                                "district": "Mysore",
                                "market": "Mysore Market",
                                "commodity": "Wheat",
                                "variety": "Desi",
                                "grade": "FAQ",
                                "arrival_date": datetime.now().strftime("%Y-%m-%d"),
                                "min_price": "2200",
                                "max_price": "2500",
                                "modal_price": "2350"
                            },
                            {
                                "state": state or "Karnataka",
                                "district": "Hassan",
                                "market": "Hassan Market",
                                "commodity": "Maize",
                                "variety": "Hybrid",
                                "grade": "FAQ",
                                "arrival_date": datetime.now().strftime("%Y-%m-%d"),
                                "min_price": "1800",
                                "max_price": "2100",
                                "modal_price": "1950"
                            }
                        ]
                        
                        # Filter sample data if commodity specified
                        if commodity:
                            sample_data = [item for item in sample_data if commodity.lower() in item["commodity"].lower()]
                        
                        return {
                            "success": True,
                            "message": "Sample market data (API fallback)",
                            "data": {
                                "records": sample_data,
                                "total": len(sample_data),
                                "count": len(sample_data)
                            },
                            "timestamp": datetime.utcnow().isoformat(),
                            "source": "Sample Data - AgMarkNet Integration",
                            "note": "Displaying sample data. Real API might be temporarily unavailable."
                        }
                else:
                    return {
                        "success": False,
                        "message": f"API Error: {response.status_code}",
                        "error": response.text,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
            except Exception as api_error:
                logger.warning(f"Market prices API failed: {str(api_error)}")
                
                # Fallback sample data
                fallback_data = [
                    {"state": "Karnataka", "district": "Bangalore Urban", "market": "KR Market", "commodity": "Rice", "variety": "Common", "grade": "FAQ", "arrival_date": datetime.now().strftime("%Y-%m-%d"), "min_price": "2800", "max_price": "3200", "modal_price": "3000"},
                    {"state": "Karnataka", "district": "Mysore", "market": "Mysore Market", "commodity": "Wheat", "variety": "Desi", "grade": "FAQ", "arrival_date": datetime.now().strftime("%Y-%m-%d"), "min_price": "2200", "max_price": "2500", "modal_price": "2350"},
                    {"state": "Punjab", "district": "Ludhiana", "market": "Ludhiana Market", "commodity": "Rice", "variety": "Basmati", "grade": "FAQ", "arrival_date": datetime.now().strftime("%Y-%m-%d"), "min_price": "4500", "max_price": "5200", "modal_price": "4850"},
                    {"state": "Haryana", "district": "Karnal", "market": "Karnal Market", "commodity": "Wheat", "variety": "HD-2967", "grade": "FAQ", "arrival_date": datetime.now().strftime("%Y-%m-%d"), "min_price": "2300", "max_price": "2600", "modal_price": "2450"}
                ]
                
                # Filter by state and commodity if specified
                if state:
                    fallback_data = [item for item in fallback_data if state.lower() in item["state"].lower()]
                if commodity:
                    fallback_data = [item for item in fallback_data if commodity.lower() in item["commodity"].lower()]
                
                return {
                    "success": True,
                    "message": "Fallback market data (API unavailable)",
                    "data": {
                        "records": fallback_data,
                        "total": len(fallback_data),
                        "count": len(fallback_data)
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                    "source": "Fallback Sample Data",
                    "note": "API temporarily unavailable. Showing sample data for demonstration."
                }
                
    except Exception as e:
        logger.error(f"Market prices test error: {str(e)}")
        return {
            "success": False,
            "message": "Market prices test failed",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/api/test/all", tags=["Testing"])
async def test_all_apis():
    """Test all integrated APIs comprehensively"""
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        from services.weather_service import WeatherService
        
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "tests": {}
        }
        
        # Test OpenRouter AI (primary) and rule-based fallback
        try:
            chatbot = AgricultureChatbot()
            
            # Test the chatbot system
            test_advice = await chatbot.get_agricultural_advice(
                "How to improve soil health for better crop yield?",
                {"location": "Karnataka", "crops": "Tomato, Onion"}
            )
            
            ai_status = "working" if test_advice["success"] else "limited"
            ai_service_used = test_advice.get("ai_service", "Unknown")
                
            results["tests"]["ai_chatbot"] = {
                "openrouter_available": chatbot.openrouter_service.is_initialized,
                "rule_based_fallback": True,
                "status": ai_status,
                "service_used": ai_service_used,
                "openrouter_api_key_configured": bool(os.getenv('OPENROUTER_API_KEY'))
            }
        except Exception as e:
            results["tests"]["ai_chatbot"] = {
                "available": False,
                "status": "error",
                "error": str(e)
            }
        
        # Test Weather API
        try:
            weather_service = WeatherService()
            weather_data = await weather_service.get_agricultural_weather("Mumbai")
            
            results["tests"]["weather_api"] = {
                "available": True,
                "status": "working",
                "data_source": weather_data.get("data_source", "unknown"),
                "api_key_configured": bool(os.getenv('WEATHER_API_KEY'))
            }
        except Exception as e:
            results["tests"]["weather_api"] = {
                "available": False,
                "status": "error",
                "error": str(e)
            }
        
        # Overall status
        working_apis = sum(1 for test in results["tests"].values() if test["status"] == "working")
        total_apis = len(results["tests"])
        
        results["overall_status"] = {
            "working_apis": working_apis,
            "total_apis": total_apis,
            "health_percentage": (working_apis / total_apis) * 100 if total_apis > 0 else 0
        }
        
        return results
        
    except Exception as e:
        logger.error(f"API testing error: {str(e)}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "failed"
        }

# Market Prices endpoint (compatible with Agrisense format)
@app.get("/farmer/crop-prices", tags=["Market Prices"])
async def get_crop_prices(
    state: Optional[str] = "Karnataka",
    commodity: Optional[str] = None,
    minPrice: Optional[str] = None,
    maxPrice: Optional[str] = None,
    modalPrice: Optional[str] = None,
    limit: Optional[str] = "20",
    offset: Optional[str] = "0",
    current_user = Depends(get_current_user)
):
    """Fetch real-time crop prices from Indian government AgMarkNet API
    
    This endpoint fetches live market prices for agricultural commodities
    from various markets across India. Data is sourced from government APIs.
    """
    try:
        import httpx
        import json
        from urllib.parse import quote
        
        # Convert string parameters to appropriate types
        limit_int = int(limit) if limit else 20
        offset_int = int(offset) if offset else 0
        
        # AgMarkNet API base URL
        base_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        
        # Build API parameters
        params = {
            "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b",  # Free government API key
            "format": "json",
            "limit": limit_int,
            "offset": offset_int
        }
        
        # Add filters if provided
        filters = {}
        if state:
            filters["state"] = state
        if commodity:
            filters["commodity"] = commodity
        if minPrice:
            try:
                filters["min_price"] = float(minPrice)
            except ValueError:
                pass
        if maxPrice:
            try:
                filters["max_price"] = float(maxPrice)
            except ValueError:
                pass
        if modalPrice:
            try:
                filters["modal_price"] = float(modalPrice)
            except ValueError:
                pass
        
        # Add filters to params if any
        if filters:
            params["filters"] = json.dumps(filters)
        
        # Make API request with timeout
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(base_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                # Check if data is available
                if "records" in data and data["records"]:
                    return {
                        "success": True,
                        "data": {
                            "records": data["records"],
                            "total": data.get("total", len(data["records"])),
                            "count": len(data["records"])
                        },
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": "AgMarkNet - Government of India"
                    }
                else:
                    # If no data from primary API, return sample data for demonstration
                    sample_data = [
                        {
                            "state": "Karnataka",
                            "district": "Bangalore Urban",
                            "market": "KR Market",
                            "commodity": "Rice",
                            "variety": "Common",
                            "grade": "FAQ",
                            "arrival_date": "2024-01-15",
                            "min_price": "2800",
                            "max_price": "3200",
                            "modal_price": "3000"
                        },
                        {
                            "state": "Karnataka",
                            "district": "Mysore",
                            "market": "Mysore Market",
                            "commodity": "Wheat",
                            "variety": "Desi",
                            "grade": "FAQ",
                            "arrival_date": "2024-01-15",
                            "min_price": "2200",
                            "max_price": "2500",
                            "modal_price": "2350"
                        },
                        {
                            "state": "Karnataka",
                            "district": "Hassan",
                            "market": "Hassan Market",
                            "commodity": "Maize",
                            "variety": "Hybrid",
                            "grade": "FAQ",
                            "arrival_date": "2024-01-15",
                            "min_price": "1800",
                            "max_price": "2100",
                            "modal_price": "1950"
                        },
                        {
                            "state": "Karnataka",
                            "district": "Tumkur",
                            "market": "Tumkur Market",
                            "commodity": "Cotton",
                            "variety": "Medium Staple",
                            "grade": "FAQ",
                            "arrival_date": "2024-01-15",
                            "min_price": "5200",
                            "max_price": "5800",
                            "modal_price": "5500"
                        },
                        {
                            "state": "Karnataka",
                            "district": "Belgaum",
                            "market": "Belgaum Market",
                            "commodity": "Sugarcane",
                            "variety": "Common",
                            "grade": "FAQ",
                            "arrival_date": "2024-01-15",
                            "min_price": "300",
                            "max_price": "380",
                            "modal_price": "340"
                        }
                    ]
                    
                    # Apply commodity filter to sample data if specified
                    if commodity:
                        sample_data = [item for item in sample_data if commodity.lower() in item["commodity"].lower()]
                    
                    return {
                        "success": True,
                        "data": {
                            "records": sample_data[offset_int:offset_int + limit_int],
                            "total": len(sample_data),
                            "count": min(limit_int, len(sample_data) - offset_int)
                        },
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": "Sample Data - AgMarkNet Integration",
                        "note": "Displaying sample data. Real API integration may require additional authentication."
                    }
                    
            except httpx.RequestError as e:
                logger.warning(f"AgMarkNet API request failed: {str(e)}, falling back to sample data")
                
                # Fallback sample data with more variety
                fallback_data = [
                    {"state": "Karnataka", "district": "Bangalore Urban", "market": "KR Market", "commodity": "Rice", "variety": "Common", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "2800", "max_price": "3200", "modal_price": "3000"},
                    {"state": "Karnataka", "district": "Mysore", "market": "Mysore Market", "commodity": "Wheat", "variety": "Desi", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "2200", "max_price": "2500", "modal_price": "2350"},
                    {"state": "Karnataka", "district": "Hassan", "market": "Hassan Market", "commodity": "Maize", "variety": "Hybrid", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "1800", "max_price": "2100", "modal_price": "1950"},
                    {"state": "Karnataka", "district": "Tumkur", "market": "Tumkur Market", "commodity": "Cotton", "variety": "Medium Staple", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "5200", "max_price": "5800", "modal_price": "5500"},
                    {"state": "Karnataka", "district": "Belgaum", "market": "Belgaum Market", "commodity": "Sugarcane", "variety": "Common", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "300", "max_price": "380", "modal_price": "340"},
                    {"state": "Tamil Nadu", "district": "Chennai", "market": "Koyambedu Market", "commodity": "Rice", "variety": "Ponni", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "2900", "max_price": "3300", "modal_price": "3100"},
                    {"state": "Maharashtra", "district": "Pune", "market": "Pune Market", "commodity": "Wheat", "variety": "Lokvan", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "2300", "max_price": "2600", "modal_price": "2450"},
                    {"state": "Punjab", "district": "Ludhiana", "market": "Ludhiana Market", "commodity": "Wheat", "variety": "PBW", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "2400", "max_price": "2700", "modal_price": "2550"},
                    {"state": "Haryana", "district": "Karnal", "market": "Karnal Market", "commodity": "Rice", "variety": "Basmati", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "4500", "max_price": "5200", "modal_price": "4850"},
                    {"state": "Uttar Pradesh", "district": "Meerut", "market": "Meerut Market", "commodity": "Sugarcane", "variety": "Co-238", "grade": "FAQ", "arrival_date": "2024-01-15", "min_price": "320", "max_price": "400", "modal_price": "360"}
                ]
                
                # Apply state filter to fallback data
                if state and state != "Karnataka":
                    filtered_data = [item for item in fallback_data if state.lower() in item["state"].lower()]
                else:
                    filtered_data = fallback_data
                
                # Apply commodity filter if specified
                if commodity:
                    filtered_data = [item for item in filtered_data if commodity.lower() in item["commodity"].lower()]
                
                return {
                    "success": True,
                    "data": {
                        "records": filtered_data[offset_int:offset_int + limit_int],
                        "total": len(filtered_data),
                        "count": min(limit_int, len(filtered_data) - offset_int)
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                    "source": "Fallback Sample Data",
                    "note": "API temporarily unavailable. Showing sample data for demonstration."
                }
                
    except ValueError as e:
        logger.error(f"Parameter validation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid parameter values")
    except Exception as e:
        logger.error(f"Crop prices API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch crop prices")

# Authenticated Agricultural Chat endpoint
@app.post("/farmer/chat", tags=["AI Chat"])
async def authenticated_farmer_chat(
    request: dict,  # Request body with 'text' field
    current_user = Depends(get_current_user)
):
    """Enhanced agricultural chatbot for authenticated farmers
    
    Features:
    - Agriculture-specific knowledge base
    - Rich text formatting with markdown
    - Context-aware responses
    - Professional agricultural guidance
    - Government schemes information
    - Cost-effective farming solutions
    """
    try:
        from services.agriculture_chatbot import AgricultureChatbot
        
        text = request.get('text', '')
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Message text is required")
        
        # Build farmer context from user profile
        farmer_context = {}
        try:
            farmer_context = {
                "location": current_user.get('location', 'India'),
                "state": current_user.get('state', 'General Region'),
                "crops": current_user.get('crops', 'Mixed farming'),
                "farm_size": current_user.get('farm_size', '2-5 hectares'),
                "experience": current_user.get('experience', 'Moderate'),
                "soil_type": current_user.get('soil_type', 'Loamy'),
                "irrigation": current_user.get('irrigation', 'Available'),
                "farming_type": current_user.get('farming_type', 'Traditional')
            }
        except:
            farmer_context = {
                "location": "India",
                "crops": "Mixed farming",
                "farm_size": "Small-Medium"
            }
        
        # Initialize the agricultural chatbot
        chatbot = AgricultureChatbot()
        
        # Get professional agricultural advice
        response = await chatbot.get_agricultural_advice(text, farmer_context)
        
        return {
            "success": response.get('success', True),
            "response": response.get('response', 'Unable to generate response'),
            "ai_service": response.get('ai_service', 'Agricultural Expert'),
            "confidence": response.get('confidence', 'high'),
            "formatted": response.get('formatted', True),
            "question_category": response.get('question_category', 'general'),
            "timestamp": response.get('timestamp', datetime.utcnow().isoformat()),
            "user_context": farmer_context,
            "resources": {
                "emergency_help": "1800-180-1551",
                "local_kvk": "Visit nearest Krishi Vigyan Kendra",
                "apps": ["Kisan Suvidha", "Plantix", "IFFCO Kisan"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Farmer chat error: {str(e)}")
        # Provide a helpful fallback response
        fallback_response = f"""🌾 **Agricultural Assistant Available**

I'm here to help with your farming question: "{text[:100]}{'...' if len(text) > 100 else ''}"

While I'm experiencing technical difficulties, I can still provide basic guidance:

🌱 **General Farming Support:**
- Crop selection and planning advice
- Pest and disease management tips
- Irrigation and soil health guidance
- Market information and pricing

📞 **Immediate Expert Help:**
- **Kisan Call Center**: 1800-180-1551
- **Local Agriculture Extension Officer**
- **Nearest Krishi Vigyan Kendra (KVK)**
- **State Agriculture Department Helpline**

💡 **Quick Resources:**
- Kisan Suvidha App for general information
- eNAM portal for market prices
- India Meteorological Department for weather
- ICAR websites for technical guidance

Please try asking your question again, and I'll do my best to help!"""
        
        return {
            "success": False,
            "response": fallback_response,
            "ai_service": "Emergency Fallback",
            "confidence": "basic",
            "error": "Service temporarily unavailable",
            "timestamp": datetime.utcnow().isoformat()
        }

def generate_agricultural_response(user_question: str, farmer_context: str) -> str:
    """Generate intelligent agricultural responses using pattern matching and knowledge base"""
    question_lower = user_question.lower()
    
    # Weather-related questions
    if any(word in question_lower for word in ['weather', 'rain', 'temperature', 'climate', 'season']):
        return f"""🌤️ **Weather & Farming Advice:**

**Current Season Recommendations:**
- Monitor local weather forecasts daily
- Use weather apps or agricultural websites
- Plan irrigation based on rainfall predictions

**Seasonal Tips:**
- **Monsoon Season**: Prepare drainage, prevent waterlogging
- **Winter**: Protect crops from frost, adjust irrigation
- **Summer**: Increase irrigation frequency, use mulching

**Weather-Based Actions:**
- Heavy rain expected: Ensure proper drainage
- Drought conditions: Implement water conservation
- Temperature extremes: Provide crop protection

💡 **Resources**: Check India Meteorological Department (IMD) for accurate forecasts."""
    
    # Crop-related questions
    elif any(word in question_lower for word in ['crop', 'plant', 'grow', 'seed', 'harvest', 'yield']):
        return f"""🌾 **Crop Management Advice:**

**General Crop Care:**
- Choose varieties suited to your soil and climate
- Follow proper spacing and planting depth
- Monitor growth stages and adjust care accordingly

**Key Success Factors:**
1. **Soil Preparation**: Test pH, add organic matter
2. **Seed Quality**: Use certified, disease-free seeds
3. **Nutrition**: Apply balanced NPK fertilizers
4. **Water Management**: Maintain optimal moisture levels
5. **Pest Control**: Regular monitoring and prevention

**Harvest Optimization:**
- Time harvest at optimal maturity
- Use proper storage techniques
- Monitor market prices for best selling time

🎯 **Pro Tip**: Keep detailed records of inputs and outputs for better planning."""
    
    # Soil-related questions
    elif any(word in question_lower for word in ['soil', 'fertilizer', 'nutrient', 'ph', 'nitrogen', 'phosphorus', 'potassium']):
        return f"""🌱 **Soil Health & Nutrition:**

**Soil Testing (Essential):**
- Test soil pH (ideal: 6.0-7.5 for most crops)
- Check NPK levels and micronutrients
- Test every 2-3 years or when problems arise

**Fertilizer Management:**
- **Organic**: Compost, farmyard manure, green manure
- **Inorganic**: Use based on soil test recommendations
- **Timing**: Apply at critical growth stages

**Soil Health Improvement:**
- Add organic matter regularly
- Practice crop rotation
- Avoid over-tillage
- Use cover crops during off-season

📊 **Government Support**: Many states offer free/subsidized soil testing through agricultural departments."""
    
    # Pest and disease questions
    elif any(word in question_lower for word in ['pest', 'disease', 'insect', 'fungus', 'spray', 'control']):
        return f"""🐛 **Integrated Pest Management:**

**Prevention First:**
- Use resistant crop varieties
- Maintain field hygiene
- Proper crop rotation
- Encourage natural predators

**Early Detection:**
- Regular field monitoring
- Look for early warning signs
- Use pheromone traps
- Scout weekly during critical periods

**Control Methods:**
1. **Biological**: Neem oil, beneficial insects
2. **Cultural**: Crop rotation, resistant varieties
3. **Chemical**: Use only when necessary, follow label instructions

⚠️ **Safety**: Always wear protective equipment when applying pesticides.

🌿 **Eco-Friendly**: Prefer biological and cultural methods for sustainable farming."""
    
    # Irrigation and water questions
    elif any(word in question_lower for word in ['water', 'irrigation', 'drip', 'sprinkler', 'drought']):
        return f"""💧 **Water Management Solutions:**

**Efficient Irrigation Methods:**
- **Drip Irrigation**: 30-50% water savings
- **Sprinkler**: Good for field crops
- **Micro-sprinklers**: Suitable for orchards

**Water Conservation:**
- Mulching to reduce evaporation
- Rainwater harvesting
- Proper scheduling based on crop needs
- Monitor soil moisture levels

**Drought Management:**
- Choose drought-tolerant varieties
- Adjust planting dates
- Use stress-resistant techniques
- Implement water storage solutions

💰 **Government Schemes**: Check PM-KUSUM, PMKSY schemes for irrigation subsidies.

📱 **Tech Help**: Use moisture sensors and weather-based irrigation scheduling."""
    
    # Market and price questions
    elif any(word in question_lower for word in ['price', 'market', 'sell', 'mandi', 'buyer']):
        return f"""💰 **Market Intelligence & Sales:**

**Price Information Sources:**
- eNAM platform for real-time prices
- Local mandi prices
- Mobile apps: Kisan Suvidha, RML Farmer

**Better Price Strategies:**
- Grade and sort produce properly
- Time harvest based on market demand
- Consider value addition (processing)
- Direct marketing to consumers

**Market Options:**
1. **Traditional**: Local mandis, middlemen
2. **Digital**: Online platforms, e-commerce
3. **Direct**: Farmer Producer Organizations (FPOs)
4. **Contract**: Direct contracts with companies

🎯 **Tip**: Join farmer groups for collective bargaining and better prices.

📊 **Records**: Maintain proper records for better financial planning."""
    
    # Default comprehensive response
    else:
        return f"""🌾 **Comprehensive Farming Guidance:**

I'm here to help with all aspects of farming! Here's what I can assist with:

**🌱 Crop Management:**
- Variety selection and planting recommendations
- Growth stage management and care tips
- Harvest timing and post-harvest handling

**🌍 Resource Management:**
- Soil health testing and improvement
- Water-efficient irrigation systems
- Integrated nutrient management

**🛡️ Protection & Control:**
- Pest and disease prevention
- Organic and eco-friendly solutions
- Weather risk management

**💰 Market & Economics:**
- Price trends and market intelligence
- Government schemes and subsidies
- Financial planning and record keeping

**🔍 For specific help, please ask about:**
- A particular crop or farming practice
- Specific problems you're facing
- Local conditions and requirements

What would you like to know more about? I'm here to provide practical, actionable advice for your farming success!"""

async def enhance_with_realtime_data(response: str, user_question: str) -> str:
    """Enhance responses with real-time data when relevant"""
    try:
        question_lower = user_question.lower()
        
        # Add weather alert if weather-related
        if any(word in question_lower for word in ['weather', 'rain', 'temperature']):
            weather_note = "\n\n🌟 **Real-time Update**: For current weather conditions, check India Meteorological Department (IMD) or use weather apps for your specific location."
            response += weather_note
        
        # Add market data note if price-related
        elif any(word in question_lower for word in ['price', 'market', 'mandi']):
            market_note = "\n\n📈 **Live Prices**: Check our Market Insights section or visit eNAM portal for real-time market prices in your area."
            response += market_note
        
        # Add seasonal advice
        current_month = datetime.now().month
        if current_month in [12, 1, 2]:  # Winter
            seasonal_note = "\n\n❄️ **Winter Season Tip**: Protect crops from frost and adjust irrigation schedules."
        elif current_month in [6, 7, 8, 9]:  # Monsoon
            seasonal_note = "\n\n🌧️ **Monsoon Season Tip**: Ensure proper drainage and monitor for fungal diseases."
        else:  # Summer/Pre-monsoon
            seasonal_note = "\n\n☀️ **Summer Season Tip**: Focus on water conservation and heat stress management."
        
        response += seasonal_note
        
        return response
        
    except Exception as e:
        logger.warning(f"Could not enhance response with real-time data: {str(e)}")
        return response

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "status_code": 500
        }
    )

if __name__ == "__main__":
    # Run with uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )