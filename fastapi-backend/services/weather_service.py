"""
Weather service for agricultural weather data
"""

import logging
import requests
import random
from typing import Dict, Any, List
from utils.config import get_settings

logger = logging.getLogger(__name__)

class WeatherService:
    """Service for fetching and processing weather data for agriculture"""
    
    def __init__(self):
        self.settings = get_settings()
    
    async def get_agricultural_weather(self, location: str) -> Dict[str, Any]:
        """
        Get weather data optimized for agricultural insights
        """
        try:
            # Try to get real weather data first, fallback to mock
            weather_data = None
            
            if self.settings.WEATHER_API_KEY:
                try:
                    weather_data = await self._get_real_weather_data(location)
                    logger.info(f"Using real weather data for {location}")
                except Exception as e:
                    logger.warning(f"Real weather API failed: {str(e)}, falling back to mock data")
            
            if not weather_data:
                weather_data = self._generate_mock_weather_data(location)
                logger.info(f"Using mock weather data for {location}")
            
            agricultural_advice = self._generate_agricultural_advice(weather_data)
            
            return {
                "location": location,
                "temperature": weather_data["temperature"],
                "humidity": weather_data["humidity"],
                "rainfall": weather_data["rainfall"],
                "wind_speed": weather_data["wind_speed"],
                "weather_condition": weather_data["condition"],
                "agricultural_advice": agricultural_advice,
                "forecast": weather_data.get("forecast", []),
                "data_source": "real_api" if self.settings.WEATHER_API_KEY and weather_data.get("real_data") else "mock"
            }
            
        except Exception as e:
            logger.error(f"Weather service error: {str(e)}")
            raise
    
    def _generate_mock_weather_data(self, location: str) -> Dict[str, Any]:
        """Generate mock weather data for demo purposes"""
        
        # Mock current weather
        mock_data = {
            "temperature": round(20 + random.random() * 20, 1),  # 20-40°C
            "humidity": round(40 + random.random() * 50, 1),      # 40-90%
            "rainfall": round(random.random() * 50, 1),           # 0-50mm
            "wind_speed": round(5 + random.random() * 15, 1),     # 5-20 km/h
            "condition": random.choice(["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Sunny"]),
            "pressure": round(1000 + random.random() * 50, 1),
            "uv_index": round(1 + random.random() * 10)
        }
        
        # Mock 7-day forecast
        forecast = []
        for day in range(7):
            forecast_day = {
                "day": day + 1,
                "temperature_max": round(mock_data["temperature"] + random.uniform(-5, 10), 1),
                "temperature_min": round(mock_data["temperature"] - random.uniform(5, 15), 1),
                "humidity": round(40 + random.random() * 50, 1),
                "rainfall": round(random.random() * 30, 1),
                "condition": random.choice(["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Sunny"])
            }
            forecast.append(forecast_day)
        
        mock_data["forecast"] = forecast
        return mock_data
    
    def _generate_agricultural_advice(self, weather_data: Dict[str, Any]) -> List[str]:
        """Generate agricultural advice based on weather conditions"""
        
        advice = []
        temp = weather_data["temperature"]
        humidity = weather_data["humidity"]
        rainfall = weather_data["rainfall"]
        condition = weather_data["condition"]
        
        # Temperature-based advice
        if temp > 35:
            advice.append("🌡️ High temperature alert: Ensure adequate irrigation and consider shade nets")
        elif temp < 15:
            advice.append("❄️ Low temperature warning: Protect sensitive crops from cold damage")
        elif 20 <= temp <= 30:
            advice.append("🌤️ Optimal temperature range for most crops")
        
        # Humidity-based advice
        if humidity > 80:
            advice.append("💧 High humidity: Monitor for fungal diseases and ensure good ventilation")
        elif humidity < 40:
            advice.append("🏜️ Low humidity: Increase irrigation frequency and consider mulching")
        else:
            advice.append("✅ Humidity levels are favorable for crop growth")
        
        # Rainfall-based advice
        if rainfall > 25:
            advice.append("🌧️ Heavy rainfall expected: Ensure proper drainage and postpone spraying")
        elif rainfall > 10:
            advice.append("☔ Moderate rainfall: Good for crop growth, monitor soil moisture")
        elif rainfall < 2:
            advice.append("☀️ Dry conditions: Plan irrigation schedule accordingly")
        
        # Weather condition-based advice
        if condition == "Clear":
            advice.append("☀️ Clear weather: Ideal for field operations and spraying")
        elif condition == "Light Rain":
            advice.append("🌦️ Light rain: Beneficial for crops, but delay chemical applications")
        elif condition == "Cloudy":
            advice.append("☁️ Cloudy conditions: Reduced evaporation, adjust irrigation accordingly")
        
        # General seasonal advice
        advice.append("📅 Consider seasonal crop calendar for optimal planting and harvesting")
        advice.append("📊 Monitor soil moisture levels regularly")
        
        return advice
    
    async def get_weather_for_coordinates(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Get weather data for specific coordinates
        """
        try:
            # Mock implementation - would use actual weather API
            location_name = f"Location {lat:.2f}, {lon:.2f}"
            return await self.get_agricultural_weather(location_name)
            
        except Exception as e:
            logger.error(f"Weather coordinates error: {str(e)}")
            raise
    
    async def get_historical_weather(self, location: str, days: int = 30) -> Dict[str, Any]:
        """
        Get historical weather data for agricultural analysis
        """
        try:
            # Mock historical data
            historical_data = []
            
            for day in range(days):
                day_data = {
                    "date": day + 1,
                    "temperature_max": round(25 + random.uniform(-10, 15), 1),
                    "temperature_min": round(15 + random.uniform(-5, 10), 1),
                    "humidity": round(50 + random.uniform(-20, 30), 1),
                    "rainfall": round(random.uniform(0, 40), 1),
                    "condition": random.choice(["Clear", "Partly Cloudy", "Cloudy", "Rain"])
                }
                historical_data.append(day_data)
            
            # Calculate averages
            avg_temp = sum(day["temperature_max"] for day in historical_data) / len(historical_data)
            avg_humidity = sum(day["humidity"] for day in historical_data) / len(historical_data)
            total_rainfall = sum(day["rainfall"] for day in historical_data)
            
            return {
                "location": location,
                "period_days": days,
                "daily_data": historical_data,
                "averages": {
                    "temperature": round(avg_temp, 1),
                    "humidity": round(avg_humidity, 1),
                    "total_rainfall": round(total_rainfall, 1),
                    "avg_daily_rainfall": round(total_rainfall / days, 2)
                },
                "agricultural_summary": self._generate_historical_summary(avg_temp, avg_humidity, total_rainfall)
            }
            
        except Exception as e:
            logger.error(f"Historical weather error: {str(e)}")
            raise
    
    def _generate_historical_summary(self, avg_temp: float, avg_humidity: float, total_rainfall: float) -> List[str]:
        """Generate agricultural summary based on historical weather"""
        
        summary = []
        
        if avg_temp > 30:
            summary.append("🔥 Hot period - crops may have experienced heat stress")
        elif avg_temp < 20:
            summary.append("❄️ Cool period - slower crop growth expected")
        else:
            summary.append("🌡️ Moderate temperatures - favorable for crop development")
        
        if total_rainfall > 500:
            summary.append("🌧️ High rainfall period - good soil moisture but watch for waterlogging")
        elif total_rainfall < 100:
            summary.append("🏜️ Dry period - irrigation needs were likely high")
        else:
            summary.append("💧 Moderate rainfall - generally favorable conditions")
        
        if avg_humidity > 70:
            summary.append("💨 High humidity - increased disease pressure possible")
        elif avg_humidity < 50:
            summary.append("🌬️ Low humidity - increased water stress for crops")
        
        return summary

    async def _get_real_weather_data(self, location: str) -> Dict[str, Any]:
        """Get real weather data from available weather API"""
        
        if not self.settings.WEATHER_API_KEY:
            raise Exception("Weather API key not configured")
        
        # Check if it's a Google API key (starts with AIza)
        if self.settings.WEATHER_API_KEY.startswith('AIza'):
            return await self._get_google_weather_data(location)
        else:
            return await self._get_weatherapi_data(location)
    
    async def _get_weatherapi_data(self, location: str) -> Dict[str, Any]:
        """Get weather data from WeatherAPI.com"""
        # WeatherAPI.com endpoint
        base_url = "http://api.weatherapi.com/v1"
        current_url = f"{base_url}/current.json"
        forecast_url = f"{base_url}/forecast.json"
        
        headers = {
            "User-Agent": "CropPrediction/1.0"
        }
        
        # Get current weather
        current_params = {
            "key": self.settings.WEATHER_API_KEY,
            "q": location,
            "aqi": "no"
        }
        
        current_response = requests.get(current_url, params=current_params, headers=headers, timeout=10)
        current_response.raise_for_status()
        current_data = current_response.json()
        
        # Get 7-day forecast
        forecast_params = {
            "key": self.settings.WEATHER_API_KEY,
            "q": location,
            "days": 7,
            "aqi": "no",
            "alerts": "no"
        }
        
        forecast_response = requests.get(forecast_url, params=forecast_params, headers=headers, timeout=10)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()
        
        # Extract current weather
        current = current_data["current"]
        location_data = current_data["location"]
        
        # Process forecast
        forecast = []
        for day in forecast_data["forecast"]["forecastday"]:
            day_data = day["day"]
            forecast.append({
                "date": day["date"],
                "temperature_max": day_data["maxtemp_c"],
                "temperature_min": day_data["mintemp_c"],
                "humidity": day_data["avghumidity"],
                "rainfall": day_data["totalprecip_mm"],
                "condition": day_data["condition"]["text"],
                "wind_speed": day_data["maxwind_kph"]
            })
        
        return {
            "temperature": current["temp_c"],
            "humidity": current["humidity"],
            "rainfall": current["precip_mm"],
            "wind_speed": current["wind_kph"],
            "condition": current["condition"]["text"],
            "pressure": current["pressure_mb"],
            "uv_index": current["uv"],
            "forecast": forecast,
            "real_data": True,
            "location_resolved": f"{location_data['name']}, {location_data['region']}, {location_data['country']}"
        }
    
    async def _get_google_weather_data(self, location: str) -> Dict[str, Any]:
        """Get weather data using Google Weather API or OpenWeatherMap with Google API key"""
        try:
            import httpx
            import asyncio
            
            # Try OpenWeatherMap first (more reliable for weather data)
            # Note: We'll use a free service since Google doesn't have a direct weather API
            # The provided key might be for Google Places/Geocoding which we can use for location
            
            # Use OpenWeatherMap free API for actual weather data
            base_url = "http://api.openweathermap.org/data/2.5"
            
            # For demo, we'll use a free API key or fallback to mock data with enhanced features
            try:
                # Try to get location coordinates using the location name
                weather_data = await self._get_openweather_data(location)
                if weather_data:
                    return weather_data
            except Exception as e:
                logger.warning(f"OpenWeatherMap API failed: {str(e)}")
            
            # Enhanced mock data with Google-like features
            mock_data = self._generate_enhanced_mock_weather_data(location)
            mock_data["real_data"] = False
            mock_data["api_source"] = "Enhanced Mock (Google API key detected)"
            
            return mock_data
            
        except Exception as e:
            logger.error(f"Google weather data error: {str(e)}")
            raise
    
    async def _get_openweather_data(self, location: str) -> Dict[str, Any]:
        """Get weather data from OpenWeatherMap (free tier)"""
        try:
            import httpx
            
            # Using free OpenWeatherMap API (requires separate API key)
            # For demo purposes, we'll simulate this
            
            # In production, you would:
            # 1. Get OpenWeatherMap API key
            # 2. Make actual API calls
            # 3. Parse and return structured data
            
            # For now, return None to fallback to enhanced mock
            return None
            
        except Exception as e:
            logger.warning(f"OpenWeatherMap error: {str(e)}")
            return None
    
    def _generate_enhanced_mock_weather_data(self, location: str) -> Dict[str, Any]:
        """Generate enhanced mock weather data with Google-style accuracy"""
        import random
        from datetime import datetime, timedelta
        
        # More realistic weather data based on location
        base_temps = {
            "delhi": 25, "mumbai": 28, "bangalore": 22, "chennai": 30,
            "kolkata": 27, "pune": 24, "hyderabad": 26, "ahmedabad": 29,
            "punjab": 23, "haryana": 24, "uttar pradesh": 26, "bihar": 27,
            "west bengal": 28, "rajasthan": 31, "gujarat": 29, "maharashtra": 27,
            "karnataka": 24, "tamil nadu": 29, "andhra pradesh": 28,
            "telangana": 27, "kerala": 26, "odisha": 28
        }
        
        location_lower = location.lower()
        base_temp = 25  # default
        
        for region, temp in base_temps.items():
            if region in location_lower:
                base_temp = temp
                break
        
        # Current weather with realistic variations
        current_temp = base_temp + random.uniform(-3, 7)
        
        mock_data = {
            "temperature": round(current_temp, 1),
            "humidity": round(45 + random.random() * 40, 1),  # 45-85%
            "rainfall": round(random.random() * 25, 1),       # 0-25mm
            "wind_speed": round(3 + random.random() * 12, 1), # 3-15 km/h
            "condition": random.choice([
                "Clear Sky", "Partly Cloudy", "Mostly Cloudy", 
                "Light Rain", "Sunny", "Overcast"
            ]),
            "pressure": round(1010 + random.uniform(-15, 15), 1),
            "uv_index": round(2 + random.random() * 8),
            "visibility": round(8 + random.random() * 7, 1),  # km
            "feels_like": round(current_temp + random.uniform(-2, 4), 1)
        }
        
        # Enhanced 7-day forecast
        forecast = []
        for day in range(7):
            date_obj = datetime.now() + timedelta(days=day)
            day_temp = base_temp + random.uniform(-5, 8)
            
            forecast_day = {
                "date": date_obj.strftime("%Y-%m-%d"),
                "day_name": date_obj.strftime("%A"),
                "temperature_max": round(day_temp + random.uniform(2, 8), 1),
                "temperature_min": round(day_temp - random.uniform(3, 8), 1),
                "humidity": round(40 + random.random() * 45, 1),
                "rainfall": round(random.random() * 20, 1),
                "condition": random.choice([
                    "Sunny", "Partly Cloudy", "Cloudy", "Light Showers", 
                    "Clear", "Scattered Clouds"
                ]),
                "wind_speed": round(2 + random.random() * 10, 1),
                "uv_index": round(1 + random.random() * 9)
            }
            forecast.append(forecast_day)
        
        mock_data["forecast"] = forecast
        mock_data["location_resolved"] = f"{location} (Enhanced Mock Data)"
        
        return mock_data
