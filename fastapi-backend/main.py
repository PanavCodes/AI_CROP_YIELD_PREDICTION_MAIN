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
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000"
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
        db_status = "connected" if db else "disconnected"
        
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
    """Recommend optimal crop based on soil and weather conditions"""
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
        return recommendation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Crop recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Crop recommendation failed")

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