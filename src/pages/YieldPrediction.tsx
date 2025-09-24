import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Leaf,
  CloudRain,
  Thermometer,
  Calendar,
  MapPin,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowLeft
} from 'lucide-react';
import YieldPredictionResult from '../components/YieldPredictionResult.jsx';
import MultiFieldYieldPrediction from '../components/MultiFieldYieldPrediction.jsx';

interface YieldPredictionForm {
  crop: string;
  state: string;
  year: number;
  rainfall: number;
  temperature: number;
  pesticides_tonnes: number;
  areaHectare: number;
}

interface YieldResult {
  predicted_yield_quintal_per_hectare: number;
  features_used: {
    Year: number;
    rainfall_mm: number;
    pesticides_tonnes: number;
    avg_temp: number;
    Area: string;
    Item: string;
  };
  yield_advice?: string;
  note?: string;
}

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
  
  const [formData, setFormData] = useState<YieldPredictionForm>({
    crop: predictionData?.crop || '',
    state: predictionData?.state || '',
    year: predictionData?.year || new Date().getFullYear(),
    rainfall: predictionData?.rainfall || 0,
    temperature: predictionData?.temperature || 0,
    pesticides_tonnes: predictionData?.pesticides || 0,
    areaHectare: predictionData?.area || 0
  });

  const [result, setResult] = useState<YieldResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!predictionData); // Hide form if we have data from navigation

  const crops = [
    'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean',
    'Groundnut', 'Sunflower', 'Jowar', 'Bajra', 'Barley', 'Gram'
  ];

  const states = [
    'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala',
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh',
    'Punjab', 'Haryana', 'Bihar', 'West Bengal', 'Odisha'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/yield-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.message || 'Prediction failed');
      }
    } catch (err) {
      console.error('Yield prediction error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getYieldQuality = (yield_value: number) => {
    if (yield_value >= 40) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (yield_value >= 30) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (yield_value >= 20) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Below Average', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // If we have prediction data from navigation, show only the result
  if (predictionData && !showForm) {
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
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/yield-prediction', { replace: true })}
                  className="text-green-600 hover:text-green-800 text-sm underline"
                >
                  View All Fields
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Manual Input Instead
                </button>
              </div>
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
  
  // Show all profiles view when no specific prediction data
  if (!showForm && profiles.length > 0) {
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
              
              <button
                onClick={() => setShowForm(true)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Manual Input Instead
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
                ML-powered predictions for all your field profiles
              </p>
            </div>
          </motion.div>

          {/* Multi-Field Prediction Component */}
          <MultiFieldYieldPrediction profiles={profiles} />
        </div>
      </div>
    );
  }
  
  // Original form view for manual input
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Yield Prediction
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get accurate crop yield predictions based on weather conditions, farming practices, and regional data using advanced machine learning models.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center mb-6">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Prediction Parameters
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Crop Selection */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Leaf className="h-4 w-4 mr-2 text-green-600" />
                  Crop Type
                </label>
                <select
                  name="crop"
                  value={formData.crop}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Crop</option>
                  {crops.map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              {/* State Selection */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-red-600" />
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="2020"
                  max="2030"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Weather Parameters */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CloudRain className="h-4 w-4 mr-2 text-blue-600" />
                    Rainfall (mm)
                  </label>
                  <input
                    type="number"
                    name="rainfall"
                    value={formData.rainfall}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Thermometer className="h-4 w-4 mr-2 text-orange-600" />
                    Avg Temperature (°C)
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                    step="0.1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Farming Parameters */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Pesticides (tonnes)
                  </label>
                  <input
                    type="number"
                    name="pesticides_tonnes"
                    value={formData.pesticides_tonnes}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Farm Area (hectares)
                  </label>
                  <input
                    type="number"
                    name="areaHectare"
                    value={formData.areaHectare}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Predicting Yield...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Predict Yield
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center mb-6">
              <BarChart3 className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Prediction Results
              </h2>
            </div>

            {/* Error State */}
            {error && (
              <div className="flex items-center p-4 bg-red-100 border border-red-200 rounded-lg mb-6">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin h-8 w-8 text-blue-600 mr-3" />
                <span className="text-gray-600 dark:text-gray-300">
                  Analyzing your data and generating predictions...
                </span>
              </div>
            )}

            {/* Results Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Main Prediction */}
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {result.predicted_yield_quintal_per_hectare.toFixed(2)}
                  </div>
                  <div className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                    Quintals per Hectare
                  </div>
                  
                  {(() => {
                    const quality = getYieldQuality(result.predicted_yield_quintal_per_hectare);
                    return (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full ${quality.bg}`}>
                        <CheckCircle className={`h-4 w-4 mr-2 ${quality.color}`} />
                        <span className={`font-medium ${quality.color}`}>
                          {quality.label}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Total Expected Production */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                    Total Expected Production
                  </div>
                  <div className="text-2xl font-semibold text-blue-900 dark:text-blue-200">
                    {(result.predicted_yield_quintal_per_hectare * formData.areaHectare).toFixed(2)} Quintals
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    For {formData.areaHectare} hectares
                  </div>
                </div>

                {/* Features Used */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Analysis Parameters
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Crop:</span>
                      <span className="ml-2 font-medium">{result.features_used.Item}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Year:</span>
                      <span className="ml-2 font-medium">{result.features_used.Year}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Rainfall:</span>
                      <span className="ml-2 font-medium">{result.features_used.rainfall_mm} mm</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                      <span className="ml-2 font-medium">{result.features_used.avg_temp}°C</span>
                    </div>
                  </div>
                </div>

                {/* AI Advice */}
                {result.yield_advice && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      AI Recommendations
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {result.yield_advice}
                    </p>
                  </div>
                )}

                {/* Note */}
                {result.note && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-3">
                    <strong>Note:</strong> {result.note}
                  </div>
                )}
              </motion.div>
            )}

            {/* Default State */}
            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Ready for Prediction
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Fill in the parameters on the left and click "Predict Yield" to get AI-powered yield forecasts.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default YieldPrediction;