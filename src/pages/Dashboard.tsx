import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import RealDataService from '../services/realDataService';
import { getCurrentUser } from '../utils/userUtils';
import AIYieldModal from '../components/AIYieldModal';
import { 
  getCropData, 
  calculateCropYield, 
  getCropRecommendations, 
  getCropMarketInsights 
} from '../utils/cropDataUtils';
import { 
  mockDashboardStats, 
  mockFieldData, 
  mockWeatherData, 
  mockMarketData,
  mockYieldTrends,
  mockCropPredictions,
  mockOptimizations,
  fertilizerPlanData,
  irrigationPlanData
} from '../mockData/mockData';
import WeatherDashboard from '../components/WeatherDashboard';
import FieldLocationDebug from '../components/FieldLocationDebug';
import MultiFieldYieldPrediction from '../components/MultiFieldYieldPrediction.jsx';
import ProfileSwitcher from '../components/ProfileSwitcher';
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
  const navigate = useNavigate();
  const [showAIModal, setShowAIModal] = useState(false);
  const currentUser = getCurrentUser();
  
  // Profile management states
  const [selectedProfile, setSelectedProfile] = useState<number>(0);
  const [selectedCrop, setSelectedCrop] = useState<number>(0);
  
  // Weather-related state
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  
  // Profile and crop state
  const [profiles, setProfiles] = useState<FieldProfile[]>([]);
  const selectedProfileIndex = selectedProfile;
  const selectedCropIndex = selectedCrop;
  
  // Load profiles from localStorage
  useEffect(() => {
    const loadProfiles = () => {
      try {
        const savedProfiles = localStorage.getItem('fieldProfiles');
        console.log('Loading profiles from localStorage:', savedProfiles);
        if (savedProfiles) {
          const parsedProfiles = JSON.parse(savedProfiles);
          console.log('Parsed profiles:', parsedProfiles);
          setProfiles(parsedProfiles);
        } else {
          console.log('No saved profiles found');
          setProfiles([]);
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
        setProfiles([]);
      }
    };

    // Load profiles initially
    loadProfiles();

    // Listen for storage changes (when profiles are updated in another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fieldProfiles') {
        console.log('Profiles updated in localStorage, reloading...');
        loadProfiles();
      }
    };

    // Listen for custom events when profiles are updated in the same tab
    const handleProfileUpdate = () => {
      console.log('Profiles updated via custom event, reloading...');
      loadProfiles();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profilesUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profilesUpdated', handleProfileUpdate);
    };
  }, []);

  // Reset selected indices when profiles change or become invalid
  useEffect(() => {
    if (profiles.length === 0) {
      setSelectedProfile(0);
      setSelectedCrop(0);
    } else {
      // Ensure selected profile index is valid
      if (selectedProfile >= profiles.length) {
        setSelectedProfile(0);
        setSelectedCrop(0);
      } else {
        // Ensure selected crop index is valid for current profile
        const profile = profiles[selectedProfile];
        if (profile?.field_profile?.crops && selectedCrop >= profile.field_profile.crops.length) {
          setSelectedCrop(0);
        }
      }
    }
  }, [profiles, selectedProfile, selectedCrop]);

  // Get current profile and crop with bounds checking
  const currentProfile = profiles.length > 0 && selectedProfileIndex < profiles.length 
    ? profiles[selectedProfileIndex] 
    : null;
  const currentCrop = currentProfile?.field_profile?.crops && currentProfile.field_profile.crops.length > 0 && selectedCropIndex < currentProfile.field_profile.crops.length
    ? currentProfile.field_profile.crops[selectedCropIndex]
    : null;

  // Load real data when profiles change
  useEffect(() => {
    const loadRealData = async () => {
      setIsLoadingRealData(true);
      try {
        // Load weather data
        const weatherData = await RealDataService.getWeatherData(selectedProfile, selectedCrop);
        setRealWeatherData(weatherData);
        
        // Load market prices if we have a current crop
        if (currentCrop) {
          const marketPricesResult = await RealDataService.getMarketPrices(
            currentCrop.crop_type, 
            currentProfile?.field_profile?.location?.state
          );
          setRealMarketPrices(marketPricesResult.data || []);
        }
      } catch (error) {
        console.error('Failed to load real data:', error);
      } finally {
        setIsLoadingRealData(false);
      }
    };

    loadRealData();
  }, [selectedProfile, selectedCrop, currentProfile, currentCrop]);

  // Real data state
  const [realWeatherData, setRealWeatherData] = useState<any>(null);
  const [realMarketPrices, setRealMarketPrices] = useState<any[]>([]);
  const [isLoadingRealData, setIsLoadingRealData] = useState(false);

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

  // Soil nutrients data state
  const [soilNutrientsData, setSoilNutrientsData] = useState([
    { name: t('dashboard.nitrogen'), value: 0, ideal: 50, color: '#10b981' },
    { name: t('dashboard.phosphorus'), value: 0, ideal: 25, color: '#f59e0b' },
    { name: t('dashboard.potassium'), value: 0, ideal: 40, color: '#3b82f6' },
  ]);

  // Load soil nutrients data asynchronously
  useEffect(() => {
    const loadSoilNutrients = async () => {
      try {
        const realNutrients = await RealDataService.getSoilNutrients(selectedProfile, selectedCrop);
        const formattedNutrients = realNutrients.map(nutrient => ({
          name: t(`dashboard.${nutrient.name.toLowerCase()}`),
          value: nutrient.value,
          ideal: nutrient.ideal,
          color: nutrient.color
        }));
        setSoilNutrientsData(formattedNutrients);
      } catch (error) {
        console.error('Error loading soil nutrients data:', error);
        setSoilNutrientsData([
          { name: t('dashboard.nitrogen'), value: 0, ideal: 50, color: '#10b981' },
          { name: t('dashboard.phosphorus'), value: 0, ideal: 25, color: '#f59e0b' },
          { name: t('dashboard.potassium'), value: 0, ideal: 40, color: '#3b82f6' },
        ]);
      }
    };

    loadSoilNutrients();
  }, [selectedProfile, selectedCrop, t]);
  
  // Enhanced data service with fallbacks
  const getDataWithFallback = (dataFetcher: () => any, fallbackData: any) => {
    try {
      const data = dataFetcher();
      return data && Object.keys(data).length > 0 ? data : fallbackData;
    } catch (error) {
      console.warn('Data fetch failed, using fallback:', error);
      return fallbackData;
    }
  };

  // Get data with smart fallbacks
  const realCropPredictions = getDataWithFallback(
    () => RealDataService.getCropPredictions(selectedProfile, selectedCrop),
    {
      ...mockCropPredictions,
      currentCrop: currentCrop?.crop_type || 'Wheat',
      predictedYield: currentProfile ? 45.5 : mockCropPredictions.predictedYield,
      confidence: 85,
      marketPrice: 2250
    }
  );
  
  const realYieldTrends = getDataWithFallback(
    () => RealDataService.getYieldTrends(selectedProfile),
    mockYieldTrends
  );
  
  const realIrrigationPlan = getDataWithFallback(
    () => RealDataService.getIrrigationPlan(selectedProfile),
    {
      ...irrigationPlanData,
      soilMoisture: currentProfile ? 68 : irrigationPlanData.soilMoisture,
      nextIrrigation: 'Tomorrow 6:00 AM'
    }
  );
  
  const realFertilizerPlan = getDataWithFallback(
    () => RealDataService.getFertilizerPlan(selectedProfile, selectedCrop),
    {
      ...fertilizerPlanData,
      currentPhase: currentCrop ? 'Growth Phase' : fertilizerPlanData.currentPhase
    }
  );

  // Enhanced market price data with fallbacks
  const marketPriceData = realMarketPrices.length > 0 ? 
    realMarketPrices.slice(0, 6).map(item => ({
      month: new Date(item.date || Date.now()).toLocaleDateString('en', { month: 'short' }),
      price: item.modal_price || item.price || 2200
    })) : 
    mockMarketData.priceHistory.wheat.map(item => ({
      month: new Date(item.date).toLocaleDateString('en', { month: 'short' }),
      price: item.price
    }));

  // Dashboard stats with real data integration
  const dashboardStats = {
    ...mockDashboardStats,
    totalFields: profiles.length || mockDashboardStats.totalFields,
    totalArea: profiles.length > 0 ? 
      `${profiles.reduce((sum, p) => sum + (p.field_profile?.field_size_hectares || 0), 0).toFixed(1)} hectares` :
      mockDashboardStats.totalArea,
    activeCrops: profiles.reduce((count, p) => count + (p.field_profile?.crops?.length || 0), 0) || mockDashboardStats.activeCrops,
    currentSeason: getCurrentSeason(),
    nextHarvest: currentCrop ? getNextHarvestDate() : mockDashboardStats.nextHarvest
  };

  // Helper functions
  function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 4 && month <= 6) return 'Kharif';
    if (month >= 10 && month <= 3) return 'Rabi';
    return 'Zaid';
  }

  function getNextHarvestDate() {
    if (!currentCrop || !currentCrop.planting_date) return 'Not available';
    try {
      const plantingDate = new Date(currentCrop.planting_date.split('-').reverse().join('-'));
      const harvestDate = new Date(plantingDate);
      harvestDate.setDate(harvestDate.getDate() + 120); // Approximate growing period
      return harvestDate.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'March 15, 2024';
    }
  }

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
    return realCropPredictions.predictedYield.toString();
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
    return realCropPredictions.marketPrice;
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
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header with Profile Switcher */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-green-100/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm"
        >
          {/* Main Header Section */}
          <div className="bg-gradient-to-r from-green-50 via-white to-emerald-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 px-8 py-6 border-b border-green-100/50 dark:border-gray-600/50">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-4 mb-3">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl shadow-lg">
                    <Leaf className="text-3xl text-green-600" />
                  </div>
                  {t('dashboard.title')}
                </h1>
                {currentUser && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <span className="text-lg font-medium">
                      {t('dashboard.welcomeBack')}, <span className="font-bold text-green-700 dark:text-green-400">{currentUser.name}</span>
                    </span>
                  </div>
                )}
              </div>
              
              {/* Enhanced Status Badges */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 flex-wrap">
                  <motion.div 
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-900 dark:text-blue-100 rounded-2xl font-semibold text-sm flex items-center gap-3 shadow-lg border border-blue-200/50 dark:border-blue-700/50"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Calendar size={18} className="text-blue-600" />
                    <span>{dateInfo.fullDate}</span>
                  </motion.div>
                  <motion.div 
                    className="px-5 py-2.5 bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/40 text-green-900 dark:text-green-100 rounded-2xl font-semibold text-sm shadow-lg border border-green-200/50 dark:border-green-700/50"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Season: {dashboardStats.currentSeason} 2025
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Switcher */}
          <div className="px-8 py-6">
            <ProfileSwitcher
              profiles={profiles}
              selectedProfile={selectedProfile}
              selectedCrop={selectedCrop}
              onProfileChange={(profileIndex: number) => {
                setSelectedProfile(profileIndex);
                setSelectedCrop(0); // Reset to first crop when switching profiles
              }}
              onCropChange={setSelectedCrop}
              showCropSelector={true}
              onNavigateToDataInput={() => window.location.href = '/data-input'}
            />
            
            {/* Yield Prediction Navigation */}
            {profiles.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/yield-prediction')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <TrendingUp className="w-5 h-5" />
                  View AI Yield Predictions
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Get ML-powered yield predictions for all your fields
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Key Metrics Cards - Top Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-4">
          {/* Weather Feature Card removed per request */}

          {/* Predicted Yield Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-4 border border-green-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/70 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                +12% {t('dashboard.vsLast')}
              </span>
            </div>
            <h3 className="text-gray-700 dark:text-gray-300 font-medium text-sm mb-1">{t('dashboard.predictedYield')}</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{getPredictedYield()}</span>
              <span className="text-base text-gray-600 dark:text-gray-400">{t('dashboard.tonsPerHa')}</span>
            </div>
            {currentCrop && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">{currentCrop.crop_type}</span> • {currentProfile?.field_profile.field_name}
              </div>
            )}
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">{t('dashboard.aiConfidence')}</span>
                <span className="font-medium text-green-700 dark:text-green-400">{realCropPredictions.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 shadow-inner"
                  style={{ width: `${realCropPredictions.confidence}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Soil Moisture Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-4 border border-amber-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/70 rounded-lg">
                <Waves className="w-6 h-6 text-amber-600" />
              </div>
              <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-medium">
                {t('dashboard.optimal')}
              </span>
            </div>
            <h3 className="text-gray-700 dark:text-gray-300 font-medium text-sm mb-1">{t('dashboard.soilMoisture')}</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{realIrrigationPlan.soilMoisture}%</span>
              <span className="text-base text-gray-600 dark:text-gray-400">{t('dashboard.moisture')}</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs">
                <Sprout size={14} className="text-amber-600" />
                <span className="text-gray-600 dark:text-gray-400">{t('dashboard.nextIrrigation')}: <span className="font-medium text-amber-700 dark:text-amber-400">{realIrrigationPlan.nextIrrigation}</span></span>
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
        

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-1 gap-4">

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



        {/* Yield Predictions for All Fields */}
        {profiles.length > 0 && (
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="text-green-600" />
                  AI Yield Predictions
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Machine learning predictions for all your field profiles
                </p>
              </div>
            </div>
            
            <MultiFieldYieldPrediction profiles={profiles} />
          </motion.div>
        )}

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
