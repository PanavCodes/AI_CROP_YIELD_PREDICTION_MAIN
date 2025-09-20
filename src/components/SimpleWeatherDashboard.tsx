import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Umbrella
} from 'lucide-react';

interface WeatherDashboardProps {
  currentCrop?: string;
}

const WeatherDashboard: React.FC<WeatherDashboardProps> = ({ currentCrop }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock weather data for testing
  const mockWeatherData = {
    location: {
      name: "Delhi",
      district: "Delhi",
      state: "Delhi",
      country: "India"
    },
    current: {
      temperature: 28,
      feelsLike: 32,
      humidity: 65,
      rainfall: 0,
      windSpeed: 12,
      windDirection: "SW",
      pressure: 1013,
      visibility: 8,
      uvIndex: 6,
      condition: "Partly Cloudy",
      sunrise: "06:15",
      sunset: "18:45"
    },
    forecast: [
      { date: "2024-09-21", maxTemp: 30, minTemp: 24, condition: "Sunny", rainfall: 0 },
      { date: "2024-09-22", maxTemp: 31, minTemp: 25, condition: "Cloudy", rainfall: 0 },
      { date: "2024-09-23", maxTemp: 29, minTemp: 23, condition: "Light Rain", rainfall: 2 },
      { date: "2024-09-24", maxTemp: 28, minTemp: 22, condition: "Sunny", rainfall: 0 },
      { date: "2024-09-25", maxTemp: 27, minTemp: 21, condition: "Cloudy", rainfall: 0 }
    ]
  };

  useEffect(() => {
    // Simulate loading weather data
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [currentCrop]);

  if (loading) {
    return (
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 border border-sky-100 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="animate-spin text-sky-600" size={24} />
            <span className="text-gray-600">Loading weather data...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 border border-red-100 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Weather Data Unavailable</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-6 border border-sky-100 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <div className="p-2 bg-sky-100 rounded-lg">
            <Cloud className="w-5 h-5 text-sky-600" />
          </div>
          Live Weather & Crop Advice
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} />
          <span>{mockWeatherData.location.name}, {mockWeatherData.location.state}</span>
        </div>
      </div>

      {/* Current Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6 border border-sky-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Current Weather</h3>
              <p className="text-sm text-gray-600">Updated just now</p>
            </div>
            <div className="text-4xl">⛅</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">{mockWeatherData.current.temperature}°C</p>
              <p className="text-sm text-gray-600">Feels like {mockWeatherData.current.feelsLike}°C</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">{mockWeatherData.current.condition}</p>
              <p className="text-sm text-gray-600">Humidity: {mockWeatherData.current.humidity}%</p>
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Weather Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Wind className="text-blue-500" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-700">Wind Speed</p>
                <p className="text-sm text-gray-600">{mockWeatherData.current.windSpeed} km/h {mockWeatherData.current.windDirection}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Droplets className="text-blue-500" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-700">Humidity</p>
                <p className="text-sm text-gray-600">{mockWeatherData.current.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Gauge className="text-purple-500" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-700">Pressure</p>
                <p className="text-sm text-gray-600">{mockWeatherData.current.pressure} hPa</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Eye className="text-green-500" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-700">Visibility</p>
                <p className="text-sm text-gray-600">{mockWeatherData.current.visibility} km</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">5-Day Forecast</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {mockWeatherData.forecast.map((day, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition-all"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs font-semibold text-gray-700 mb-2">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <div className="text-2xl mb-2">
                {day.condition === 'Sunny' ? '☀️' :
                 day.condition === 'Cloudy' ? '☁️' :
                 day.condition === 'Light Rain' ? '🌦️' : '⛅'}
              </div>
              <p className="text-lg font-bold text-gray-900">{day.maxTemp}°</p>
              <p className="text-sm text-gray-600">{day.minTemp}°</p>
              {day.rainfall > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Umbrella size={12} className="text-blue-500" />
                  <p className="text-xs text-blue-600 font-medium">{day.rainfall}mm</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Crop-Specific Advice */}
      {currentCrop && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Crop Advice for {currentCrop}</h4>
              <p className="text-sm text-gray-600">Based on current weather conditions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="text-blue-500" size={16} />
                <span className="font-medium text-gray-700">Irrigation</span>
              </div>
              <p className="text-sm text-gray-600">
                {mockWeatherData.current.temperature > 30
                  ? "Increase irrigation frequency due to high temperatures"
                  : "Maintain regular irrigation schedule"}
              </p>
            </div>

            <div className="bg-white/70 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="text-amber-500" size={16} />
                <span className="font-medium text-gray-700">Protection</span>
              </div>
              <p className="text-sm text-gray-600">
                {mockWeatherData.current.uvIndex > 5
                  ? "Apply UV protection for crops during peak sun hours"
                  : "Monitor for pest activity in current conditions"}
              </p>
            </div>

            <div className="bg-white/70 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-purple-500" size={16} />
                <span className="font-medium text-gray-700">Next Actions</span>
              </div>
              <p className="text-sm text-gray-600">
                {mockWeatherData.forecast[0].rainfall > 0
                  ? "Delay fertilizer application due to upcoming rain"
                  : "Optimal conditions for field activities"}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WeatherDashboard;
