// Weather Dashboard Component with live weather and crop advice
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

import { WeatherData, Location, CropWeatherAdvice } from '../types/weather';
import weatherService from '../services/weatherService';
import locationService from '../services/locationService';
import cropWeatherAdviceService from '../services/cropWeatherAdviceService';

interface WeatherDashboardProps {
  currentCrop?: string;
  location?: Location;
  onLocationChange?: (location: Location) => void;
}

const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  currentCrop = 'wheat',
  location,
  onLocationChange
}) => {
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [cropAdvice, setCropAdvice] = useState<CropWeatherAdvice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auto-detect location and load weather data on component mount
  useEffect(() => {
    if (location) {
      loadWeatherData(location);
    } else {
      // Auto-detect location on first load
      detectLocationAndLoadWeather();
    }
  }, [currentCrop]);

  // Load weather when location changes
  useEffect(() => {
    if (location) {
      loadWeatherData(location);
    }
  }, [location]);

  const detectLocationAndLoadWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      const locationResult = await locationService.detectLocation();
      
      if (locationResult.success && locationResult.location) {
        onLocationChange?.(locationResult.location);
        await loadWeatherData(locationResult.location);
      } else {
        setError(locationResult.error || 'Unable to detect location');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to detect location');
      setLoading(false);
    }
  };

  const loadWeatherData = async (loc: Location) => {
    try {
      setLoading(true);
      const data = await weatherService.getWeatherData(loc);
      setWeatherData(data);
      
      // Generate crop advice
      if (currentCrop) {
        const advice = cropWeatherAdviceService.generateAdvice(currentCrop, data);
        setCropAdvice(advice);
      }
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const refreshWeather = () => {
    if (location) {
      loadWeatherData(location);
    } else {
      detectLocationAndLoadWeather();
    }
  };

  const getWeatherIcon = (condition: string, size: number = 24) => {
    const iconProps = { size, className: 'text-blue-600' };
    
    switch (condition.toLowerCase()) {
      case 'clear sky':
        return <Sun {...iconProps} className="text-yellow-500" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud {...iconProps} />;
      case 'rainy':
      case 'light rain':
        return <CloudRain {...iconProps} />;
      default:
        return <Cloud {...iconProps} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading weather data...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-white rounded-2xl shadow-lg p-6 border border-red-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center py-8">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Weather Data Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshWeather}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!weatherData) return null;

  const { current, forecast, location: weatherLocation } = weatherData;

  return (
    <div className="space-y-6">
      {/* Current Weather Card */}
      <motion.div 
        className="bg-gradient-to-r from-white to-blue-50 rounded-3xl shadow-xl p-6 sm:p-8 border border-blue-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {weatherLocation.name || 'Current Location'}
              </h2>
              {(weatherLocation.district || weatherLocation.state) && (
                <div className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                  {weatherLocation.district && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {weatherLocation.district}
                    </span>
                  )}
                  {weatherLocation.state && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {weatherLocation.state}
                    </span>
                  )}
                  {weatherLocation.country && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {weatherLocation.country}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={refreshWeather}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="Refresh weather data"
          >
            <RefreshCw size={18} className="text-blue-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {/* Temperature */}
          <div className="text-center bg-white/70 rounded-xl p-4">
            <div className="flex items-center justify-center mb-2">
              {getWeatherIcon(current.condition, 32)}
            </div>
            <div className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{current.temperature}°C</div>
            <div className="text-sm md:text-base text-gray-600 mt-0.5">Feels like {current.feelsLike}°C</div>
            <div className="text-xs text-gray-500 mt-1">{current.condition}</div>
          </div>

          {/* Rainfall */}
          <div className="text-center bg-white/70 rounded-xl p-4">
            <Droplets className="text-blue-500 mx-auto mb-2" size={26} />
            <div className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{current.rainfall}mm</div>
            <div className="text-sm md:text-base text-gray-600">Last hour</div>
          </div>

          {/* Humidity */}
          <div className="text-center bg-white/70 rounded-xl p-4">
            <Gauge className="text-green-500 mx-auto mb-2" size={26} />
            <div className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{current.humidity}%</div>
            <div className="text-sm md:text-base text-gray-600">Humidity</div>
          </div>

          {/* Wind */}
          <div className="text-center bg-white/70 rounded-xl p-4">
            <Wind className="text-gray-500 mx-auto mb-2" size={26} />
            <div className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{current.windSpeed}</div>
            <div className="text-sm md:text-base text-gray-600">km/h {current.windDirection}</div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center gap-2 bg-white/70 rounded-lg px-2.5 py-1.5">
            <Eye size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">Visibility: {current.visibility}km</span>
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-lg px-2.5 py-1.5">
            <Gauge size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">Pressure: {current.pressure}hPa</span>
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-lg px-2.5 py-1.5">
            <Sun size={16} className="text-yellow-500" />
            <span className="text-sm text-gray-600">
              Sunrise: {new Date(current.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-lg px-2.5 py-1.5">
            <Sun size={16} className="text-orange-500" />
            <span className="text-sm text-gray-600">
              Sunset: {new Date(current.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {lastUpdated && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </motion.div>


      {/* 7-Day Forecast */}
      <motion.div 
        className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold text-gray-800">7-Day Forecast</h3>
        </div>
        
        <div className="grid md:grid-cols-7 gap-3 md:gap-4 overflow-x-auto md:overflow-visible">
          {forecast.map((day, index) => (
            <div key={day.date} className="text-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors min-w-[110px]">
              <div className="text-sm font-medium text-gray-600 mb-2">
                {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
              </div>
              <div className="flex justify-center mb-2">
                {getWeatherIcon(day.condition, 24)}
              </div>
              <div className="text-lg font-bold text-gray-800">{day.maxTemp}°</div>
              <div className="text-sm text-gray-600">{day.minTemp}°</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Umbrella size={12} className="text-blue-500" />
                <span className="text-xs text-gray-600">{day.chanceOfRain}%</span>
              </div>
              {day.rainfall > 0 && (
                <div className="text-xs text-blue-600 mt-1">{day.rainfall}mm</div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
};

export default WeatherDashboard;
