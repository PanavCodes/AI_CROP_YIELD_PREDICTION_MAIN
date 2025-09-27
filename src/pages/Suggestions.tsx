import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cropRecommendationApiService, { 
  CropSuggestionRequest, 
  CropSuggestionResponse 
} from '../services/cropRecommendationApiService';
import { RealAPIService } from '../services/apiService';

const Suggestions: React.FC = () => {
  const navigate = useNavigate();
  const [cropSuggestions, setCropSuggestions] = useState<CropSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CropSuggestionRequest>({
    N: 50,
    P: 30,
    K: 40,
    temperature: 25,
    humidity: 65,
    ph: 6.5,
    rainfall: 100
  });
  const [serviceHealth, setServiceHealth] = useState<{ available: boolean; message: string } | null>(null);

  // Check service health on load
  useEffect(() => {
    const checkHealth = async () => {
      const health = await cropRecommendationApiService.checkServiceHealth();
      setServiceHealth(health);
    };
    checkHealth();
  }, []);

  const handleGetCurrentLocationSuggestions = async () => {
    setLoading(true);
    try {
      const location = await RealAPIService.getCurrentLocation();
      const suggestions = await cropRecommendationApiService.getCropSuggestionsFromCurrentConditions(
        location.latitude,
        location.longitude
      );
      setCropSuggestions(suggestions);
    } catch (error) {
      console.error('Error getting location-based suggestions:', error);
      // Show form instead
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const suggestions = await cropRecommendationApiService.getCropSuggestions(formData);
      setCropSuggestions(suggestions);
      setShowForm(false);
    } catch (error) {
      console.error('Error getting manual suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CropSuggestionRequest, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-emerald-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-4 mb-6">
            <span className="text-6xl">🌾</span>
            <span className="text-6xl">🚜</span>
            <span className="text-6xl">💧</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Smart Crop Recommendations</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Get AI-powered crop suggestions based on your soil conditions, weather data, 
            and environmental factors for optimal agricultural productivity.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Service Health Status */}
        {serviceHealth && (
          <div className={`mb-8 p-4 rounded-lg text-center ${
            serviceHealth.available 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-center gap-2">
              <span>{serviceHealth.available ? '✅' : '⚠️'}</span>
              <span className="font-semibold">
                {serviceHealth.available ? 'AI Service Online' : 'AI Service Offline'}
              </span>
            </div>
            <p className="text-sm mt-1">{serviceHealth.message}</p>
            {!serviceHealth.available && (
              <p className="text-sm mt-2">Using fallback recommendations</p>
            )}
          </div>
        )}

        {/* Crop Suggestions Results */}
        {cropSuggestions && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
            <div className="text-center mb-8">
              <div className="flex justify-center items-center gap-3 mb-4">
                <span className="text-4xl">🌾</span>
                <h2 className="text-3xl font-bold text-gray-800">Your Crop Recommendations</h2>
              </div>
              <p className="text-gray-600">Based on your soil and environmental conditions</p>
            </div>

            {/* Top Recommendation */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white mb-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">🏆 Top Recommendation</h3>
                <div className="text-4xl font-bold mb-2">
                  {cropRecommendationApiService.formatCropName(cropSuggestions.recommended_crop)}
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {Math.round(cropSuggestions.confidence * 100)}% Confidence
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {cropRecommendationApiService.getConfidenceDescription(cropSuggestions.confidence)}
                  </span>
                </div>
              </div>
            </div>

            {/* All Suggestions */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {cropSuggestions.suggestions.map((crop, index) => {
                const confidence = cropSuggestions.confidence_scores[crop] || 0;
                const isTopRecommendation = crop === cropSuggestions.recommended_crop;
                
                return (
                  <div 
                    key={crop} 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isTopRecommendation 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <h4 className="font-bold text-lg mb-1">
                        {cropRecommendationApiService.formatCropName(crop)}
                      </h4>
                      <div className="text-sm text-gray-600 mb-2">
                        {Math.round(confidence * 100)}% match
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            isTopRecommendation ? 'bg-green-500' : 'bg-blue-400'
                          }`}
                          style={{ width: `${confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-bold mb-4 text-gray-800">📊 Analysis Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nitrogen:</span>
                  <span className="font-semibold ml-1">{cropSuggestions.input_data.N}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phosphorus:</span>
                  <span className="font-semibold ml-1">{cropSuggestions.input_data.P}</span>
                </div>
                <div>
                  <span className="text-gray-600">Potassium:</span>
                  <span className="font-semibold ml-1">{cropSuggestions.input_data.K}</span>
                </div>
                <div>
                  <span className="text-gray-600">pH:</span>
                  <span className="font-semibold ml-1">{cropSuggestions.input_data.ph}</span>
                </div>
                <div>
                  <span className="text-gray-600">Temperature:</span>
                  <span className="font-semibold ml-1">{cropSuggestions.input_data.temperature}°C</span>
                </div>
                <div>
                  <span className="text-gray-600">Humidity:</span>
                  <span className="font-semibold ml-1">{cropSuggestions.input_data.humidity}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Rainfall:</span>
                  <span className="font-semibold ml-1">{cropSuggestions.input_data.rainfall}mm</span>
                </div>
                <div>
                  <span className="text-gray-600">Analyzed:</span>
                  <span className="font-semibold ml-1">{new Date(cropSuggestions.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Manual Input Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              🌱 Enter Your Soil & Environmental Data
            </h2>
            
            <form onSubmit={handleManualFormSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Soil Nutrients */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">🧪 Soil Nutrients</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nitrogen (N): {formData.N}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="140"
                      value={formData.N}
                      onChange={(e) => handleInputChange('N', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>140</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Phosphorus (P): {formData.P}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="145"
                      value={formData.P}
                      onChange={(e) => handleInputChange('P', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5</span>
                      <span>145</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Potassium (K): {formData.K}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="205"
                      value={formData.K}
                      onChange={(e) => handleInputChange('K', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5</span>
                      <span>205</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      pH Level: {formData.ph}
                    </label>
                    <input
                      type="range"
                      min="3.5"
                      max="10"
                      step="0.1"
                      value={formData.ph}
                      onChange={(e) => handleInputChange('ph', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>3.5 (Acidic)</span>
                      <span>10.0 (Alkaline)</span>
                    </div>
                  </div>
                </div>

                {/* Environmental Conditions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">🌤️ Environmental Conditions</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Temperature: {formData.temperature}°C
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="50"
                      value={formData.temperature}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>8°C</span>
                      <span>50°C</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Humidity: {formData.humidity}%
                    </label>
                    <input
                      type="range"
                      min="14"
                      max="100"
                      value={formData.humidity}
                      onChange={(e) => handleInputChange('humidity', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>14%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Rainfall: {formData.rainfall}mm
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="300"
                      value={formData.rainfall}
                      onChange={(e) => handleInputChange('rainfall', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>20mm</span>
                      <span>300mm</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Get Crop Recommendations
                      <span>🌾</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Action Buttons - Only show if no suggestions are displayed */}
        {!cropSuggestions && !showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                🌾 Get Your Personalized Crop Recommendations
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <button
                  onClick={handleGetCurrentLocationSuggestions}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 flex flex-col items-center gap-4"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  ) : (
                    <span className="text-4xl">📍</span>
                  )}
                  <div>
                    <h3 className="text-xl font-bold mb-2">Use Current Location</h3>
                    <p className="text-green-100 text-sm">
                      Get recommendations based on your current location's soil and weather data
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 flex flex-col items-center gap-4"
                >
                  <span className="text-4xl">📝</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Manual Input</h3>
                    <p className="text-blue-100 text-sm">
                      Enter your soil and environmental data manually for precise recommendations
                    </p>
                  </div>
                </button>
              </div>
              
              <div className="mt-8 text-sm text-gray-600">
                <p>💡 Our AI analyzes 7+ factors including soil nutrients, climate conditions, and more</p>
                <p>🎯 Get recommendations from 22+ crop varieties with confidence scores</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Suggestions;
