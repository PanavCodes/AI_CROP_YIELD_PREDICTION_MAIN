import React, { useState, useEffect } from 'react';
import YieldPredictionResult from './YieldPredictionResult.jsx';
import { TrendingUp, Loader, AlertTriangle, RefreshCw } from 'lucide-react';

const MultiFieldYieldPrediction = ({ profiles = [] }) => {
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profiles && profiles.length > 0) {
      generatePredictionsForAllProfiles();
    }
  }, [profiles]);

  const generatePredictionsForAllProfiles = async () => {
    setLoading(true);
    setErrors({});
    const newPredictions = {};
    const newErrors = {};

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      try {
        const predictions = await generatePredictionsForProfile(profile, i);
        newPredictions[i] = predictions;
      } catch (error) {
        console.error(`Error generating predictions for profile ${i}:`, error);
        newErrors[i] = error.message;
      }
    }

    setPredictions(newPredictions);
    setErrors(newErrors);
    setLoading(false);
  };

  const generatePredictionsForProfile = async (profile, profileIndex) => {
    const fieldProfile = profile.field_profile;
    const profilePredictions = [];

    // Generate prediction for each crop in the profile
    for (let cropIndex = 0; cropIndex < fieldProfile.crops.length; cropIndex++) {
      const crop = fieldProfile.crops[cropIndex];
      
      // Skip crops without required weather data
      if (!crop.weather_data?.temperature || !crop.weather_data?.rainfall) {
        continue;
      }

      const predictionData = {
        crop: crop.crop_type,
        state: fieldProfile.location?.state || 'Unknown',
        rainfall: crop.weather_data.rainfall,
        temperature: crop.weather_data.temperature,
        area: fieldProfile.field_size_hectares,
        pesticides: 0.0, // Default, can be enhanced later
        year: crop.cultivation_year || new Date().getFullYear()
      };

      try {
        const params = new URLSearchParams(predictionData);
        const response = await fetch(`http://localhost:8000/api/predict/simple-yield?${params}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        profilePredictions.push({
          cropIndex,
          crop: crop,
          prediction: result,
          fieldName: fieldProfile.field_name,
          fieldSize: fieldProfile.field_size_hectares
        });
      } catch (error) {
        console.error(`Error predicting yield for crop ${cropIndex}:`, error);
        profilePredictions.push({
          cropIndex,
          crop: crop,
          error: error.message,
          fieldName: fieldProfile.field_name,
          fieldSize: fieldProfile.field_size_hectares
        });
      }
    }

    return profilePredictions;
  };

  const refreshPredictions = () => {
    generatePredictionsForAllProfiles();
  };

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Field Profiles</h3>
        <p className="text-gray-600">Add field data in the Data Input page to see yield predictions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            Yield Predictions for All Fields
          </h2>
          <p className="text-gray-600 mt-1">
            AI predictions for {profiles.length} field profile{profiles.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={refreshPredictions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'Refresh Predictions'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Generating yield predictions for all fields...</p>
        </div>
      )}

      <div className="grid gap-6">
        {profiles.map((profile, profileIndex) => {
          const fieldProfile = profile.field_profile;
          const profilePredictions = predictions[profileIndex] || [];
          const profileError = errors[profileIndex];

          return (
            <div key={profileIndex} className="border border-gray-200 rounded-xl p-6 bg-white">
              {/* Field Header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  🏞️ {fieldProfile.field_name}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>📏 {fieldProfile.field_size_hectares} hectares</span>
                  <span>🌱 {fieldProfile.soil_type}</span>
                  <span>🌾 {fieldProfile.crops.length} crop{fieldProfile.crops.length !== 1 ? 's' : ''}</span>
                  {fieldProfile.location && (
                    <span>📍 {fieldProfile.location.state || 'Unknown location'}</span>
                  )}
                </div>
              </div>

              {/* Profile Error */}
              {profileError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">Error: {profileError}</span>
                </div>
              )}

              {/* Crop Predictions */}
              <div className="space-y-4">
                {fieldProfile.crops.map((crop, cropIndex) => {
                  const cropPrediction = profilePredictions.find(p => p.cropIndex === cropIndex);
                  
                  // Check if crop has required data for prediction
                  const hasRequiredData = crop.weather_data?.temperature && crop.weather_data?.rainfall;
                  
                  return (
                    <div key={cropIndex} className="border-l-4 border-l-green-500 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {crop.crop_type} ({crop.season} {crop.cultivation_year})
                          </h4>
                          <div className="text-sm text-gray-600">
                            Planted: {crop.planting_date}

                          </div>
                        </div>
                      </div>

                      {!hasRequiredData ? (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Missing Weather Data</span>
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">
                            Temperature and rainfall data required for yield prediction.
                            Please add weather data in the Data Input page.
                          </p>
                        </div>
                      ) : cropPrediction?.error ? (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">Prediction Error: {cropPrediction.error}</span>
                          </div>
                        </div>
                      ) : cropPrediction?.prediction ? (
                        <div className="mt-3">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                              <div className="text-2xl font-bold text-green-600 mb-1">
                                {cropPrediction.prediction.predicted_yield} 
                                <span className="text-sm font-normal text-gray-600 ml-1">quintals/hectare</span>
                              </div>
                              <div className="text-sm text-gray-600">AI Predicted Yield</div>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600 mb-1">
                                {cropPrediction.prediction.total_production}
                                <span className="text-sm font-normal text-gray-600 ml-1">quintals</span>
                              </div>
                              <div className="text-sm text-gray-600">Total Field Production</div>
                            </div>
                          </div>
                          
                          {/* Input Data Summary */}
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Based on:</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                              <span>🌡️ {crop.weather_data.temperature}°C</span>
                              <span>🌧️ {crop.weather_data.rainfall}mm</span>
                              <span>📅 {crop.cultivation_year}</span>
                              <span>🤖 {cropPrediction.prediction.model_type}</span>
                            </div>
                          </div>
                        </div>
                      ) : loading ? (
                        <div className="mt-2 flex items-center gap-2 text-gray-600">
                          <Loader className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Generating prediction...</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiFieldYieldPrediction;
