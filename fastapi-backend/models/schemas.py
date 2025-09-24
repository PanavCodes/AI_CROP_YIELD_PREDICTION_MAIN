"""
Pydantic models for FastAPI request/response validation
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class Season(str, Enum):
    RABI = "Rabi"
    KHARIF = "Kharif"
    ZAID = "Zaid"
    PERENNIAL = "Perennial"

# Health check models
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    database_status: str
    ml_service_status: str
    version: str

# Authentication models
class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    expires_in: int

class UserCreate(BaseModel):
    farmer_name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    state: Optional[str] = None
    district: Optional[str] = None
    current_city: Optional[str] = None

# Crop data models
class CropDataBase(BaseModel):
    field_name: str
    state: str
    district: str
    crop_type: str
    yield_per_hectare: float = Field(..., gt=0)
    field_size_hectares: float = Field(..., gt=0)
    season: Optional[Season] = None
    cultivation_year: Optional[int] = None

class CropDataCreate(CropDataBase):
    data_source: str = "api_upload"

class CropDataResponse(CropDataBase):
    id: Optional[str] = Field(None, alias="_id")
    upload_batch_id: str
    upload_timestamp: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True

# ML prediction models
class YieldPredictionRequest(BaseModel):
    crop_type: str
    field_size_hectares: float = Field(..., gt=0)
    state: str
    district: str
    season: Season
    # Soil parameters
    N: float = Field(..., ge=0, le=200, description="Nitrogen content")
    P: float = Field(..., ge=0, le=200, description="Phosphorus content") 
    K: float = Field(..., ge=0, le=300, description="Potassium content")
    ph: float = Field(..., ge=3, le=11, description="Soil pH")
    # Weather parameters
    temperature: float = Field(..., ge=-10, le=60, description="Average temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity percentage")
    rainfall: float = Field(..., ge=0, le=2000, description="Annual rainfall in mm")

class YieldPredictionResponse(BaseModel):
    predicted_yield: float
    confidence_score: float
    field_size_hectares: float
    total_predicted_production: float
    model_version: str
    prediction_factors: Dict[str, Any]
    recommendations: List[str]

class CropRecommendationRequest(BaseModel):
    N: float = Field(..., ge=0, le=200)
    P: float = Field(..., ge=0, le=200)
    K: float = Field(..., ge=0, le=300)
    temperature: float = Field(..., ge=-10, le=60)
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=3, le=11)
    rainfall: float = Field(..., ge=0, le=2000)

class CropRecommendationResponse(BaseModel):
    recommended_crops: List[Dict[str, Any]]
    soil_analysis: Dict[str, Any]
    weather_suitability: Dict[str, Any]
    confidence_scores: Dict[str, float]

# File upload models
class CSVUploadResponse(BaseModel):
    success: bool
    upload_batch_id: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    processing_time: float
    errors: List[str] = []

# Disease detection models
class DiseaseDetectionResponse(BaseModel):
    detected_diseases: List[Dict[str, Any]]
    confidence_scores: Dict[str, float]
    plant_health_status: str
    recommendations: List[str]
    processed_image_url: Optional[str] = None

# Weather models
class WeatherData(BaseModel):
    location: str
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    weather_condition: str
    agricultural_advice: List[str]
    forecast: Optional[List[Dict[str, Any]]] = None

# Analytics models
class CropStatistics(BaseModel):
    total_records: int
    unique_crops: int
    unique_states: int
    unique_districts: int
    avg_yield: float
    min_yield: float
    max_yield: float
    total_area_hectares: float
    top_crops: List[Dict[str, Any]]
    top_states: List[Dict[str, Any]]

class YieldAnalysis(BaseModel):
    crop_type: str
    state: str
    avg_yield: float
    record_count: int
    total_area: float
    yield_trend: Optional[List[Dict[str, Any]]] = None

# Field profile models
class LocationData(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class IrrigationInfo(BaseModel):
    method: str
    availability: str = Field(..., pattern="^(None|Low|Medium|High)$")

class SoilTestResults(BaseModel):
    N: float
    P: float
    K: float
    pH: float

class CropInfo(BaseModel):
    crop_type: str
    planting_date: str
    season: Season
    cultivation_year: int
    expected_yield: Optional[float] = None
    actual_yield: Optional[float] = None
    fertilizers_used: List[str] = []
    pesticides_used: List[str] = []
    previous_crop: Optional[str] = None
    soil_test_results: Optional[SoilTestResults] = None

class FieldProfile(BaseModel):
    field_name: str
    field_size_hectares: float = Field(..., gt=0)
    soil_type: str
    location: LocationData
    irrigation: IrrigationInfo
    crops: List[CropInfo] = []

class FieldProfileCreate(BaseModel):
    farmer_id: str
    field_profile: FieldProfile

class FieldProfileResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    farmer_id: str
    field_profile: FieldProfile
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True

# Error models
class ErrorResponse(BaseModel):
    error: bool = True
    message: str
    status_code: int
    details: Optional[Dict[str, Any]] = None