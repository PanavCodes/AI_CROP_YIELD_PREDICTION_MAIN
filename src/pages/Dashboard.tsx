import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Waves,
  Leaf,
  Target,
  Package,
  MapPin
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
import { 
  getCropData, 
  calculateCropYield, 
  getCropRecommendations, 
  getCropMarketInsights 
} from '../utils/cropDataUtils';
import WeatherDashboard from '../components/WeatherDashboard';
import FieldLocationDebug from '../components/FieldLocationDebug';
import { Location } from '../types/weather';

// Type for field profiles
interface FieldProfile {
  field_profile: {
    field_name: string;
    field_size_hectares: number;
    soil_type: string;
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      district?: string;
      state?: string;
      country?: string;
    };
    irrigation: {
      method: string;
      availability: string;
    };
    crops: Array<{
      crop_type: string;
      planting_date: string;
      fertilizers_used: string[];
      pesticides_used: string[];
      previous_crop: string | null;
      soil_test_results: null | {
        N: number | null;
        P: number | null;
        K: number | null;
        pH: number | null;
      };
    }>;
  };
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [showAIModal, setShowAIModal] = useState(false);
  const currentUser = getCurrentUser();
  
  // Profile management states
  const [selectedProfile, setSelectedProfile] = useState<number>(0);
  const [selectedCrop, setSelectedCrop] = useState<number>(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Weather-related state
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  
  // Profile and crop state
  const [profiles, setProfiles] = useState<FieldProfile[]>([]);
  const selectedProfileIndex = selectedProfile;
  const selectedCropIndex = selectedCrop;
  
  // Load profiles from localStorage
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem('fieldProfiles');
      if (savedProfiles) {
        const parsedProfiles = JSON.parse(savedProfiles);
        setProfiles(parsedProfiles);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  }, []);

  // Get current profile and crop
  const currentProfile = profiles[selectedProfileIndex];
  const currentCrop = currentProfile?.field_profile?.crops?.[selectedCropIndex];

  // Set location from selected field profile
  useEffect(() => {
    if (currentProfile?.field_profile?.location) {
      console.log('Dashboard: Loading field location for weather:', currentProfile.field_profile.location);
      setUserLocation(currentProfile.field_profile.location);
    } else {
      console.log('Dashboard: No field location found, weather will use user location');
      setUserLocation(null);
    }
  }, [currentProfile]);

  // Get current date and weekday
  const getCurrentDateInfo = () => {
    const now = new Date();
    const weekdays = [
      t('dashboard.weekdays.sunday'), t('dashboard.weekdays.monday'), t('dashboard.weekdays.tuesday'), 
      t('dashboard.weekdays.wednesday'), t('dashboard.weekdays.thursday'), t('dashboard.weekdays.friday'), 
      t('dashboard.weekdays.saturday')
    ];
    const months = [
      t('dashboard.months.jan'), t('dashboard.months.feb'), t('dashboard.months.mar'), 
      t('dashboard.months.apr'), t('dashboard.months.may'), t('dashboard.months.jun'),
      t('dashboard.months.jul'), t('dashboard.months.aug'), t('dashboard.months.sep'), 
      t('dashboard.months.oct'), t('dashboard.months.nov'), t('dashboard.months.dec')
    ];
    
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

  // Dynamic soil nutrients data based on current crop
  const getSoilNutrientsData = () => {
    try {
      const currentCropData = getCurrentCropData();
      const soilTestResults = currentCrop?.soil_test_results;
      
      return [
        { 
          name: t('dashboard.nitrogen'), 
          value: soilTestResults?.N || fertilizerPlanData.currentNutrients.nitrogen, 
          ideal: currentCropData?.fertilizer?.nitrogen || 50, 
          color: '#10b981' 
        },
        { 
          name: t('dashboard.phosphorus'), 
          value: soilTestResults?.P || fertilizerPlanData.currentNutrients.phosphorus, 
          ideal: currentCropData?.fertilizer?.phosphorus || 25, 
          color: '#f59e0b' 
        },
        { 
          name: t('dashboard.potassium'), 
          value: soilTestResults?.K || fertilizerPlanData.currentNutrients.potassium, 
          ideal: currentCropData?.fertilizer?.potassium || 40, 
          color: '#3b82f6' 
        },
      ];
    } catch (error) {
      console.error('Error in getSoilNutrientsData:', error);
      return [
        { name: t('dashboard.nitrogen'), value: 45, ideal: 50, color: '#10b981' },
        { name: t('dashboard.phosphorus'), value: 22, ideal: 25, color: '#f59e0b' },
        { name: t('dashboard.potassium'), value: 38, ideal: 40, color: '#3b82f6' },
      ];
    }
  };
  
  const soilNutrientsData = getSoilNutrientsData();

  // Mock market price data
  const marketPriceData = [
    { month: 'Jan', price: 2100 },
    { month: 'Feb', price: 2150 },
    { month: 'Mar', price: 2200 },
    { month: 'Apr', price: 2180 },
    { month: 'May', price: 2250 },
    { month: 'Jun', price: 2300 },
  ];

  // Dynamic crop suggestions based on current field profile
  const getCropSuggestions = () => {
    try {
      const baseCrops = ['wheat', 'rice', 'corn', 'cotton', 'soybean'];
      
      return baseCrops.map(cropType => {
        try {
          const cropData = getCropData(cropType);
          let suitability = 70; // Base suitability
          
          // Adjust suitability based on current field profile
          if (currentProfile) {
            const soilType = currentProfile.field_profile.soil_type;
            
            // Soil preference bonus
            if (cropData.soilPreference && cropData.soilPreference.includes(soilType)) {
              suitability += 15;
            }
            
            // Water requirement vs irrigation availability
            const irrigation = currentProfile.field_profile.irrigation.availability;
            if (cropData.waterRequirement === 'High' && ['High', 'Medium'].includes(irrigation)) {
              suitability += 10;
            } else if (cropData.waterRequirement === 'Low' && irrigation === 'Low') {
              suitability += 5;
            }
          }
          
          // Calculate estimated yield and profit
          const estimatedYield = currentProfile ? 
            calculateCropYield(cropType, currentProfile.field_profile.soil_type, currentCrop?.soil_test_results || undefined) :
            cropData.baseYield;
          
          const estimatedProfit = Math.round((estimatedYield * cropData.marketPrice * (currentProfile?.field_profile.field_size_hectares || 1)) / 100);
          
          return {
            name: cropType.charAt(0).toUpperCase() + cropType.slice(1),
            icon: cropData.icon,
            yield: `${estimatedYield} tons/ha`,
            suitability: Math.min(suitability, 98), // Cap at 98%
            profit: `₹${estimatedProfit.toLocaleString()}/ha`,
            color: cropData.gradientColor,
            marketDemand: cropData.marketDemand,
            profitability: cropData.profitability
          };
        } catch (error) {
          console.error(`Error processing crop ${cropType}:`, error);
          return {
            name: cropType.charAt(0).toUpperCase() + cropType.slice(1),
            icon: () => null,
            yield: '0 tons/ha',
            suitability: 0,
            profit: '₹0/ha',
            color: 'from-gray-400 to-gray-500',
            marketDemand: 'Medium',
            profitability: 'Medium'
          };
        }
      }).sort((a, b) => b.suitability - a.suitability); // Sort by suitability
    } catch (error) {
      console.error('Error in getCropSuggestions:', error);
      return [];
    }
  };
  
  const cropSuggestions = getCropSuggestions();
  
  // Get crop-specific icon using utility
  const getCropIcon = (cropType: string) => {
    try {
      return getCropData(cropType).icon;
    } catch (error) {
      console.error('Error in getCropIcon:', error);
      return FaSeedling;
    }
  };
  
  // Dynamic yield prediction based on current crop and soil conditions
  const getPredictedYield = () => {
    if (!currentCrop || !currentProfile) return mockCropPredictions.predictedYield.toString();
    
    const calculatedYield = calculateCropYield(
      currentCrop.crop_type,
      currentProfile.field_profile.soil_type,
      currentCrop.soil_test_results || undefined
    );
    
    return calculatedYield.toString();
  };

  // Get current crop data
  const getCurrentCropData = () => {
    try {
      if (!currentCrop) return null;
      return getCropData(currentCrop.crop_type);
    } catch (error) {
      console.error('Error in getCurrentCropData:', error);
      return null;
    }
  };

  // Get crop-specific market price
  const getCurrentMarketPrice = () => {
    try {
      if (!currentCrop) return mockCropPredictions.marketPrice;
      const marketInsights = getCropMarketInsights(currentCrop.crop_type);
      return marketInsights.currentPrice;
    } catch (error) {
      console.error('Error in getCurrentMarketPrice:', error);
      return mockCropPredictions.marketPrice;
    }
  };

  // Get crop-specific recommendations
  const getCurrentRecommendations = () => {
    try {
      if (!currentCrop || !currentProfile) return null;
      return getCropRecommendations(
        currentCrop.crop_type,
        currentProfile.field_profile.soil_type,
        currentCrop.soil_test_results || undefined
      );
    } catch (error) {
      console.error('Error in getCurrentRecommendations:', error);
      return null;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 py-4 px-3 sm:px-5 lg:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with Profile Switcher */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-green-50 rounded-3xl shadow-xl p-4 sm:p-5 border border-green-100"
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
                className="px-4 py-2 bg-blue-100/80 text-blue-900 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Calendar size={16} />
                <span>{dateInfo.fullDate}</span>
              </motion.div>
              <motion.div 
                className="px-4 py-2 bg-green-100/80 text-green-900 rounded-xl font-medium text-sm shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                {t('dashboard.season')}: {t('dashboard.rabi')} 2024
              </motion.div>
              <motion.div 
                className="px-4 py-2 bg-amber-100/80 text-amber-900 rounded-xl font-medium text-sm shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                {t('dashboard.field')}: {currentProfile?.field_profile?.field_size_hectares || '12.5'} {t('dashboard.hectares')}
              </motion.div>
            </div>
          </div>
          
          {/* Profile and Crop Selector */}
          {profiles.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                {/* Field Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-xl hover:shadow-md transition-all"
                  >
                    <MapPin size={16} className="text-green-600" />
                    <div className="text-left">
                      <p className="text-xs text-gray-600">Active Field</p>
                      <p className="font-semibold text-gray-800 tracking-tight">
                        {currentProfile?.field_profile?.field_name || t('dashboard.selectField')}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {profileDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-3 pb-2 mb-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 font-medium">SAVED FIELD PROFILES</p>
                      </div>
                      {profiles.map((profile, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedProfile(idx);
                            setSelectedCrop(0); // Reset to first crop
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left rounded-md hover:bg-gray-50 transition-colors ${
                            selectedProfileIndex === idx ? 'bg-green-50 ring-1 ring-green-300' : ''
                          }`}
                        >
                          <p className="font-medium text-gray-800">{profile.field_profile.field_name}</p>
                          <p className="text-xs text-gray-500">
                            {profile.field_profile.field_size_hectares} ha • {profile.field_profile.soil_type} • 
                            {profile.field_profile.crops.length} crop{profile.field_profile.crops.length > 1 ? 's' : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Crop Selector Chips */}
                {currentProfile && currentProfile.field_profile.crops.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Crops:</span>
                    <div className="flex gap-2 flex-wrap">
                      {currentProfile.field_profile.crops.map((crop, idx) => {
                        const CropIcon = getCropIcon(crop.crop_type);
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedCrop(idx)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                              selectedCropIndex === idx
                                ? 'bg-green-600 text-white shadow-md ring-2 ring-green-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <CropIcon className="text-base" />
                            {crop.crop_type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Current Selection Info */}
              {currentCrop && (
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar size={14} />
                    <span>Planted: {currentCrop.planting_date}</span>
                  </div>
                  {currentCrop.soil_test_results && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        N: {currentCrop.soil_test_results.N || '-'}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        P: {currentCrop.soil_test_results.P || '-'}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        K: {currentCrop.soil_test_results.K || '-'}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        pH: {currentCrop.soil_test_results.pH || '-'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* No Profiles Message */}
          {profiles.length === 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  No field profiles found. Please go to Data Input to create your first field profile.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Key Metrics Cards - Top Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-4">
          {/* Weather Feature Card removed per request */}

          {/* Predicted Yield Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-lg p-4 border border-green-200"
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
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{getPredictedYield()}</span>
              <span className="text-base text-gray-600">{t('dashboard.tonsPerHa')}</span>
            </div>
            {currentCrop && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">{currentCrop.crop_type}</span> • {currentProfile?.field_profile.field_name}
              </div>
            )}
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600">{t('dashboard.aiConfidence')}</span>
                <span className="font-medium text-green-700">{mockCropPredictions.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 shadow-inner"
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
            className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl shadow-lg p-4 border border-amber-200"
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
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{irrigationPlanData.soilMoisture}%</span>
              <span className="text-base text-gray-600">{t('dashboard.moisture')}</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs">
                <Sprout size={14} className="text-amber-600" />
                <span className="text-gray-600">{t('dashboard.nextIrrigation')}: <span className="font-medium text-amber-700">{irrigationPlanData.nextIrrigation}</span></span>
              </div>
              {currentProfile && (
                <div className="text-xs text-gray-500 mt-1">
                  Method: {currentProfile.field_profile.irrigation.method}
                </div>
              )}
            </div>
          </motion.div>

          {/* Market Price Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg p-4 border border-purple-200"
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
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">₹{getCurrentMarketPrice()}</span>
              <span className="text-base text-gray-600">{t('dashboard.perQuintal')}</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs">
                <Package size={14} className="text-purple-600" />
                <span className="text-gray-600">{t('dashboard.bestTimeToSell')}: <span className="font-medium text-purple-700">March</span></span>
              </div>
              {currentCrop && (
                <div className="text-xs text-gray-500 mt-1">
                  For: {currentCrop.crop_type}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Live Weather Dashboard Section */}
        <WeatherDashboard 
          currentCrop={currentCrop?.crop_type} 
          location={userLocation || undefined}
        />
        
        {/* Debug Component - Only shows in development */}
        <FieldLocationDebug 
          profiles={profiles}
          selectedProfileIndex={selectedProfileIndex}
          currentLocation={userLocation}
        />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-1 gap-4">

          {/* Crop Suggestions Card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-5 border border-green-100"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cropSuggestions.slice(0, 3).map((crop, index) => {
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
                              <p className="text-xl font-extrabold text-green-700">{crop.suitability}%</p>
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
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <TrendingUp size={12} />
                            <span>{crop.marketDemand} Demand</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`bg-gradient-to-r ${crop.color} h-2 rounded-full transition-all duration-500 shadow-inner`}
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

        {/* Crop-Specific Recommendations Section */}
        {currentCrop && (
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-5 border border-green-100 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                Recommendations for {currentCrop.crop_type}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {getCurrentCropData()?.profitability} Profitability
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {getCurrentCropData()?.marketDemand} Demand
                </span>
              </div>
            </div>
            
            {getCurrentRecommendations() && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Irrigation Recommendations */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Droplets className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">Irrigation</h3>
                  </div>
                  <ul className="space-y-1">
                    {getCurrentRecommendations()?.irrigation.map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Fertilizer Recommendations */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Leaf className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">Fertilizer</h3>
                  </div>
                  <ul className="space-y-1">
                    {getCurrentRecommendations()?.fertilizer.map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                        <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Pest Control Recommendations */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">Pest Control</h3>
                  </div>
                  <ul className="space-y-1">
                    {getCurrentRecommendations()?.pestControl.map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                        <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* General Recommendations */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">General</h3>
                  </div>
                  <ul className="space-y-1">
                    {getCurrentRecommendations()?.general.map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                        <span className="w-1 h-1 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* General Recommendations Section */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sprout className="text-green-600" />
            {t('suggestions.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Irrigation Schedule Card */}
            <motion.div 
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-4 border border-blue-200"
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
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-4 border border-green-200"
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
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-4 border border-amber-200"
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
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Yield Trend Chart */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 lg:col-span-2"
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
            <ResponsiveContainer width="100%" height={240}>
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
                  label={{ value: t('dashboard.chartLabels.tonsPerHa'), angle: -90, position: 'insideLeft' }}
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
                    name === 'actual' ? t('dashboard.chartLabels.actualYield') : name === 'predicted' ? t('dashboard.chartLabels.aiPredicted') : t('dashboard.chartLabels.currentYield')
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
                    name={t('dashboard.chartLabels.actualYield')}
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
                  name={t('dashboard.chartLabels.aiPredicted')}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  name={t('dashboard.chartLabels.currentSeason')}
                  fill="url(#colorYield)"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Soil Nutrients Chart */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100"
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
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={soilNutrientsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} label={{ value: 'ppm', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} ppm`, 
                    name === 'value' ? 'Current Level' : `Ideal for ${currentCrop?.crop_type || 'Crop'}`
                  ]}
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
              {soilNutrientsData.map((nutrient, index) => {
                const isDeficient = nutrient.value < nutrient.ideal * 0.8;
                const isOptimal = nutrient.value >= nutrient.ideal * 0.8 && nutrient.value <= nutrient.ideal * 1.2;
                return (
                  <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">{nutrient.name}</p>
                    <p className="text-sm font-bold" style={{ color: nutrient.color }}>
                      {nutrient.value} ppm
                    </p>
                    <div className="mt-1">
                      {isDeficient && (
                        <span className="text-xs px-1 py-0.5 bg-red-100 text-red-600 rounded">Low</span>
                      )}
                      {isOptimal && (
                        <span className="text-xs px-1 py-0.5 bg-green-100 text-green-600 rounded">Good</span>
                      )}
                      {!isDeficient && !isOptimal && (
                        <span className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-600 rounded">High</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Market Price Trend */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-5 border border-purple-100"
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
          
          <ResponsiveContainer width="100%" height={220}>
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
