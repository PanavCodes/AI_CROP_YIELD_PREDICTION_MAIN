import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertCircle,
  Loader,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Database,
  Eye
} from 'lucide-react';
import YieldPredictionResult from '../components/YieldPredictionResult.jsx';
import MultiFieldYieldPrediction from '../components/MultiFieldYieldPrediction.jsx';
import ProfileSwitcher from '../components/ProfileSwitcher';

const YieldPrediction: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state (from DataInput page)
  const navigationData = location.state as { predictionData?: any; sourceField?: string } | null;
  const [predictionData, setPredictionData] = useState(navigationData?.predictionData || null);
  const [sourceField, setSourceField] = useState(navigationData?.sourceField || '');
  
  // Load saved field profiles from localStorage
  const [profiles, setProfiles] = useState(() => {
    try {
      const raw = localStorage.getItem('fieldProfiles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Profile and crop selection state
  const [selectedProfile, setSelectedProfile] = useState<number>(0);
  const [selectedCrop, setSelectedCrop] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // If we have prediction data from navigation, show only the result
  if (predictionData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header with Back Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/data-input')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Data Input</span>
              </button>
              
              <button
                onClick={() => navigate('/yield-prediction', { replace: true })}
                className="text-green-600 hover:text-green-800 text-sm underline"
              >
                View All Fields
              </button>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Yield Prediction
                </h1>
              </div>
              {sourceField && (
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Prediction for: <span className="font-semibold">{sourceField}</span>
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-300">
                ML-powered yield prediction based on your field data
              </p>
            </div>
          </motion.div>

          {/* Yield Prediction Result Component */}
          <YieldPredictionResult predictionData={predictionData} />
        </div>
      </div>
    );
  }
  
  // Show profiles view with switcher - this is now the default view
  if (profiles.length > 0) {
    const currentProfile = profiles[selectedProfile];
    const currentCrop = currentProfile?.field_profile?.crops?.[selectedCrop];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/data-input')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Data Input</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'single' ? 'all' : 'single')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  {viewMode === 'single' ? 'View All Fields' : 'View Single Field'}
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Yield Predictions
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {viewMode === 'single' 
                  ? 'ML-powered predictions for your selected field' 
                  : 'ML-powered predictions for all your field profiles'
                }
              </p>
            </div>
          </motion.div>

          {viewMode === 'single' ? (
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Profile Switcher Sidebar */}
              <div className="lg:col-span-1">
                <ProfileSwitcher
                  profiles={profiles}
                  selectedProfile={selectedProfile}
                  selectedCrop={selectedCrop}
                  onProfileChange={setSelectedProfile}
                  onCropChange={setSelectedCrop}
                  showCropSelector={true}
                  onNavigateToDataInput={() => navigate('/data-input')}
                />
              </div>

              {/* Single Field Prediction */}
              <div className="lg:col-span-3 space-y-6">
                {currentProfile && currentCrop ? (
                  <motion.div
                    key={`${selectedProfile}-${selectedCrop}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Field Context Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {currentProfile.field_profile.field_name}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Yield prediction for {currentCrop.crop_type} • {currentCrop.season} {currentCrop.cultivation_year}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Field Size</div>
                          <div className="text-xl font-semibold text-green-600">
                            {currentProfile.field_profile.field_size_hectares} ha
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Soil Type:</span>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {currentProfile.field_profile.soil_type}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Irrigation:</span>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {currentProfile.field_profile.irrigation.method}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Water Availability:</span>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {currentProfile.field_profile.irrigation.availability}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Planted:</span>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {currentCrop.planting_date}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Weather Data Check */}
                    {(!currentCrop.weather_data?.temperature || !currentCrop.weather_data?.rainfall) ? (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                              Incomplete Weather Data
                            </h3>
                            <p className="text-amber-800 dark:text-amber-300 mb-4">
                              For the most accurate yield predictions, please add temperature and rainfall data to this field profile.
                              The prediction will use regional averages as fallbacks.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">Available data:</div>
                                <div className="space-y-1 text-sm">
                                  <div className={`flex items-center gap-2 ${currentCrop.weather_data?.temperature ? 'text-green-700' : 'text-amber-600'}`}>
                                    {currentCrop.weather_data?.temperature ? '✅' : '❌'} Temperature: {currentCrop.weather_data?.temperature ? `${currentCrop.weather_data.temperature}°C` : 'Missing'}
                                  </div>
                                  <div className={`flex items-center gap-2 ${currentCrop.weather_data?.rainfall ? 'text-green-700' : 'text-amber-600'}`}>
                                    {currentCrop.weather_data?.rainfall ? '✅' : '❌'} Rainfall: {currentCrop.weather_data?.rainfall ? `${currentCrop.weather_data.rainfall}mm` : 'Missing'}
                                  </div>
                                  <div className={`flex items-center gap-2 ${currentCrop.weather_data?.humidity ? 'text-green-700' : 'text-gray-500'}`}>
                                    {currentCrop.weather_data?.humidity ? '✅' : '➖'} Humidity: {currentCrop.weather_data?.humidity ? `${currentCrop.weather_data.humidity}%` : 'Optional'}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">Default values used:</div>
                                <div className="space-y-1 text-sm text-amber-600">
                                  {!currentCrop.weather_data?.temperature && <div>🌡️ Temperature: 25°C (regional avg)</div>}
                                  {!currentCrop.weather_data?.rainfall && <div>🌧️ Rainfall: 800mm (regional avg)</div>}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <button
                                onClick={() => navigate('/data-input')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Add Weather Data
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold">✓</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-900 dark:text-green-200">Complete Weather Data Available</h4>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                              Temperature: {currentCrop.weather_data?.temperature}°C • Rainfall: {currentCrop.weather_data?.rainfall}mm
                              {currentCrop.weather_data?.humidity && ` • Humidity: ${currentCrop.weather_data.humidity}%`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Yield Prediction Result */}
                    <YieldPredictionResult 
                      predictionData={{
                        crop: currentCrop.crop_type,
                        state: currentProfile.field_profile.location?.state || 'Unknown',
                        rainfall: currentCrop.weather_data?.rainfall || 800, // Default fallback
                        temperature: currentCrop.weather_data?.temperature || 25, // Default fallback
                        area: currentProfile.field_profile.field_size_hectares,
                        pesticides: 0.0,
                        year: currentCrop.cultivation_year || new Date().getFullYear()
                      }}
                    />
                  </motion.div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <AlertCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No Crop Data Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      The selected field profile doesn't have any crop data for yield prediction.
                    </p>
                    <button
                      onClick={() => navigate('/data-input')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Add Crop Data
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Multi-Field View */
            <MultiFieldYieldPrediction profiles={profiles} />
          )}
        </div>
      </div>
    );
  }

  // No data available - encourage user to add field data
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/data-input')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Data Input</span>
            </button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Yield Predictions
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              ML-powered predictions for your field profiles
            </p>
          </div>
        </motion.div>

        {/* No Data State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <Database className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                No Field Data Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                To see AI-powered yield predictions, you need to add field profiles with crop and weather data first.
              </p>
              <button
                onClick={() => navigate('/data-input')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
                Add Field Data
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default YieldPrediction;
