import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Cloud, 
  Droplets, 
  Wind, 
  TrendingUp, 
  User,
  DollarSign,
  Sprout,
  Calendar,
  AlertCircle,
  ChevronRight,
  Waves,
  Leaf,
  Target,
  Package
} from 'lucide-react';
import { GiWheat } from 'react-icons/gi';
import { FaSeedling, FaLeaf } from 'react-icons/fa';
import { 
  mockWeatherData, 
  mockCropPredictions, 
  mockYieldTrends, 
  fertilizerPlanData,
  irrigationPlanData 
} from '../mockData/mockData';
import { getCurrentUser } from '../utils/userUtils';
import AIYieldModal from '../components/AIYieldModal';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [showAIModal, setShowAIModal] = useState(false);
  const currentUser = getCurrentUser();

  // Get current date and weekday
  const getCurrentDateInfo = () => {
    const now = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const weekday = weekdays[now.getDay()];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    
    return {
      weekday,
      dateString: `${month} ${day}, ${year}`,
      fullDate: `${weekday}, ${month} ${day}`
    };
  };

  const dateInfo = getCurrentDateInfo();

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return '☀️';
      case 'partly cloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'light rain': return '🌦️';
      case 'moderate rain': return '🌧️';
      default: return '☁️';
    }
  };

  // Mock data for soil nutrients
  const soilNutrientsData = [
    { name: 'Nitrogen', value: fertilizerPlanData.currentNutrients.nitrogen, ideal: 50, color: '#10b981' },
    { name: 'Phosphorus', value: fertilizerPlanData.currentNutrients.phosphorus, ideal: 25, color: '#f59e0b' },
    { name: 'Potassium', value: fertilizerPlanData.currentNutrients.potassium, ideal: 40, color: '#3b82f6' },
  ];

  // Mock market price data
  const marketPriceData = [
    { month: 'Jan', price: 2100 },
    { month: 'Feb', price: 2150 },
    { month: 'Mar', price: 2200 },
    { month: 'Apr', price: 2180 },
    { month: 'May', price: 2250 },
    { month: 'Jun', price: 2300 },
  ];

  // Best crop suggestions
  const cropSuggestions: { name: string; icon: React.ComponentType<any>; yield: string; suitability: number; profit: string; color: string }[] = [
    { name: 'Wheat', icon: GiWheat, yield: '45 tons/ha', suitability: 92, profit: '₹85,000/ha', color: 'from-yellow-400 to-orange-500' },
    { name: 'Corn', icon: FaSeedling as React.ComponentType<any>, yield: '38 tons/ha', suitability: 85, profit: '₹72,000/ha', color: 'from-green-400 to-emerald-500' },
    { name: 'Rice', icon: FaLeaf as React.ComponentType<any>, yield: '42 tons/ha', suitability: 78, profit: '₹68,000/ha', color: 'from-blue-400 to-cyan-500' },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-green-100"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                <Leaf className="text-4xl text-green-600" />
                {t('dashboard.title')}
              </h1>
              {currentUser && (
                <div className="mt-2 flex items-center gap-2 text-gray-600">
                  <User size={16} />
                  <span className="text-sm">
                    {t('dashboard.welcomeBack')}, <span className="font-semibold text-green-700">{currentUser.name}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <motion.div 
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium text-sm flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Calendar size={16} />
                <span>{dateInfo.fullDate}</span>
              </motion.div>
              <motion.div 
                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium text-sm"
                whileHover={{ scale: 1.05 }}
              >
                {t('dashboard.season')}: {t('dashboard.rabi')} 2024
              </motion.div>
              <motion.div 
                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium text-sm"
                whileHover={{ scale: 1.05 }}
              >
                {t('dashboard.field')}: 12.5 {t('dashboard.hectares')}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Cards - Top Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Weather Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl shadow-lg p-5 border border-sky-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/70 rounded-lg">
                <Cloud className="w-6 h-6 text-sky-600" />
              </div>
              <span className="text-2xl">{getWeatherIcon(mockWeatherData.current.condition)}</span>
            </div>
            <h3 className="text-gray-700 font-medium text-sm mb-1">{t('dashboard.currentWeather')}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{mockWeatherData.current.temperature}°C</span>
              <span className="text-sm text-sky-600 font-medium">{mockWeatherData.current.condition}</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Droplets size={14} className="text-blue-500" />
                <span>{mockWeatherData.current.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind size={14} className="text-gray-500" />
                <span>{mockWeatherData.current.windSpeed} km/h</span>
              </div>
            </div>
          </motion.div>

          {/* Predicted Yield Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-lg p-5 border border-green-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/70 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                +12% {t('dashboard.vsLast')}
              </span>
            </div>
            <h3 className="text-gray-700 font-medium text-sm mb-1">{t('dashboard.predictedYield')}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{mockCropPredictions.predictedYield}</span>
              <span className="text-sm text-gray-600">{t('dashboard.tonsPerHa')}</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600">{t('dashboard.aiConfidence')}</span>
                <span className="font-medium text-green-700">{mockCropPredictions.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${mockCropPredictions.confidence}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Soil Moisture Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl shadow-lg p-5 border border-amber-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/70 rounded-lg">
                <Waves className="w-6 h-6 text-amber-600" />
              </div>
              <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-medium">
                {t('dashboard.optimal')}
              </span>
            </div>
            <h3 className="text-gray-700 font-medium text-sm mb-1">{t('dashboard.soilMoisture')}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{irrigationPlanData.soilMoisture}%</span>
              <span className="text-sm text-gray-600">{t('dashboard.moisture')}</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs">
                <Sprout size={14} className="text-amber-600" />
                <span className="text-gray-600">{t('dashboard.nextIrrigation')}: <span className="font-medium text-amber-700">{irrigationPlanData.nextIrrigation}</span></span>
              </div>
            </div>
          </motion.div>

          {/* Market Price Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg p-5 border border-purple-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/70 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
                +₹100
              </span>
            </div>
            <h3 className="text-gray-700 font-medium text-sm mb-1">{t('dashboard.marketPrice')}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">₹{mockCropPredictions.marketPrice}</span>
              <span className="text-sm text-gray-600">{t('dashboard.perQuintal')}</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs">
                <Package size={14} className="text-purple-600" />
                <span className="text-gray-600">{t('dashboard.bestTimeToSell')}: <span className="font-medium text-purple-700">March</span></span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weather Forecast Card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-sky-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <Cloud className="w-5 h-5 text-sky-600" />
                </div>
                {t('dashboard.weatherForecast')}
              </h2>
              <motion.button 
                className="text-sky-600 text-sm font-medium flex items-center gap-1 hover:text-sky-700"
                whileHover={{ x: 5 }}
              >
                {t('dashboard.viewDetails')} <ChevronRight size={16} />
              </motion.button>
            </div>
            
            {/* 5-Day Forecast with Enhanced Design */}
            <div className="grid grid-cols-5 gap-2">
              {mockWeatherData.forecast.map((day, index) => (
                <motion.div 
                  key={index} 
                  className="bg-gradient-to-b from-sky-50 to-blue-50 rounded-xl p-3 text-center border border-sky-100 hover:shadow-md transition-all cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <p className="text-xs font-semibold text-gray-700 mb-2">{day.day}</p>
                  <div className="text-3xl mb-2">{getWeatherIcon(day.condition)}</div>
                  <p className="text-lg font-bold text-gray-900">{day.temp}°</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Droplets size={12} className="text-blue-500" />
                    <p className="text-xs text-blue-600 font-medium">{day.rainfall}mm</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>

          {/* Crop Suggestions Card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-green-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                {t('dashboard.bestCropSuggestions')}
              </h2>
              <motion.button 
                className="text-green-600 text-sm font-medium flex items-center gap-1 hover:text-green-700"
                whileHover={{ x: 5 }}
                onClick={() => setShowAIModal(true)}
              >
                AI Analysis <ChevronRight size={16} />
              </motion.button>
            </div>

            {/* Crop Suggestion Cards */}
            <div className="space-y-3">
              {cropSuggestions.map((crop, index) => {
                const Icon = crop.icon;
                return (
                  <motion.div 
                    key={index}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${crop.color} rounded-xl flex items-center justify-center shadow-md`}>
                        <Icon className="text-white text-2xl" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-800">{crop.name}</h3>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{t('dashboard.suitability')}</p>
                              <p className="text-lg font-bold text-green-600">{crop.suitability}%</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Package size={12} />
                            <span>{crop.yield}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <DollarSign size={12} />
                            <span>{crop.profit}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`bg-gradient-to-r ${crop.color} h-1.5 rounded-full transition-all duration-500`}
                              style={{ width: `${crop.suitability}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Recommendations Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sprout className="text-green-600" />
            {t('suggestions.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Irrigation Schedule Card */}
            <motion.div 
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-5 border border-blue-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">Irrigation Schedule</h3>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full font-medium">
                  Optimized
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Next Irrigation</span>
                    <Calendar size={14} className="text-blue-500" />
                  </div>
                  <p className="text-lg font-bold text-blue-700">{irrigationPlanData.nextIrrigation}</p>
                  <p className="text-xs text-gray-600 mt-1">Duration: {irrigationPlanData.duration}</p>
                </div>
                
                <div className="bg-white/50 rounded-lg p-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Water Saved</span>
                    <span className="font-bold text-green-600">{irrigationPlanData.waterSaved}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${irrigationPlanData.waterSaved}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Fertilizer Plan Card */}
            <motion.div 
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-5 border border-green-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Leaf className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">Fertilizer Plan</h3>
                </div>
                <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full font-medium">
                  {fertilizerPlanData.currentPhase}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Next Application</span>
                    <Sprout size={14} className="text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-green-700">{fertilizerPlanData.nextApplication}</p>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">N</p>
                      <p className="text-sm font-bold text-green-600">{fertilizerPlanData.currentNutrients.nitrogen}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">P</p>
                      <p className="text-sm font-bold text-amber-600">{fertilizerPlanData.currentNutrients.phosphorus}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">K</p>
                      <p className="text-sm font-bold text-blue-600">{fertilizerPlanData.currentNutrients.potassium}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 rounded-lg p-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Cost Savings</span>
                    <span className="font-bold text-green-600">{fertilizerPlanData.costSavings.monthly}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pest Alert Card */}
            <motion.div 
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-5 border border-amber-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">{t('dashboard.pestControl')}</h3>
                </div>
                <span className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded-full font-medium">
                  {t('dashboard.lowRisk')}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.currentStatus')}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">{t('dashboard.noThreatsDetected')}</p>
                  </div>
                </div>
                
                <div className="bg-white/50 rounded-lg p-2">
                  <p className="text-xs text-amber-700 font-medium mb-1">{t('dashboard.preventiveAction')}</p>
                  <p className="text-xs text-gray-600">{t('dashboard.neemSprayScheduled')}</p>
                </div>
                
                <button className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium py-2 rounded-lg transition-colors">
                  {t('dashboard.viewPreventionTips')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Yield Trend Chart */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-green-600" />
                {t('dashboard.yieldTrendAnalysis')}
              </h2>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white">
                <option>{t('dashboard.lastSixMonths')}</option>
                <option>{t('dashboard.lastYear')}</option>
                <option>{t('dashboard.allTime')}</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockYieldTrends}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                  label={{ value: 'Tons/ha', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} tons/ha`, 
                    name === 'actual' ? 'Actual Yield' : name === 'predicted' ? 'AI Predicted' : 'Current Yield'
                  ]}
                />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '20px'
                  }}
                />
                {mockYieldTrends[0].actual !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Actual Yield"
                    connectNulls={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  name="AI Predicted"
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  name="Current Season"
                  fill="url(#colorYield)"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Soil Nutrients Chart */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Leaf className="text-green-600" />
                {t('dashboard.soilNutrients')}
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={soilNutrientsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" name="Current" radius={[8, 8, 0, 0]}>
                  {soilNutrientsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="ideal" name="Ideal" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {soilNutrientsData.map((nutrient, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">{nutrient.name}</p>
                  <p className="text-sm font-bold" style={{ color: nutrient.color }}>
                    {nutrient.value} ppm
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Market Price Trend */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="text-purple-600" />
              {t('dashboard.marketPriceTrend')}
            </h2>
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <TrendingUp size={16} />
              +4.5% {t('dashboard.thisMonth')}
            </span>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={marketPriceData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [`₹${value}/quintal`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fill="url(#colorPrice)"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">{t('dashboard.bestSellingWindow')}</p>
                <p className="text-xs text-purple-700 mt-1">{t('dashboard.expectedPrice')}</p>
              </div>
              <button className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                {t('dashboard.setAlert')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* AI Yield Modal */}
        <AIYieldModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          selectedField={undefined}
        />
      </div>
    </div>
  );
};

export default Dashboard;
