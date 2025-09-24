"""
Configuration settings for FastAPI Crop Prediction App
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Database
    MONGO_URI: str = "mongodb://localhost:27017/crop-prediction-app"
    
    # Security
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # API Keys
    GEMINI_API_KEY: Optional[str] = None
    WEATHER_API_KEY: Optional[str] = None
    HF_TOKEN: Optional[str] = None  # Hugging Face token
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    NODE_ENV: str = "development"
    
    # ML Model settings
    MODEL_PATH: str = "models/"
    ENABLE_GPU: bool = False
    
    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads/"
    
    # External service URLs
    NODE_BACKEND_URL: str = "http://localhost:5000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"

# Global settings instance
_settings = None

def get_settings() -> Settings:
    """Get settings instance (singleton pattern)"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings