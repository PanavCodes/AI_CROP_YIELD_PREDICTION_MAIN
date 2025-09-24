/**
 * Custom React hooks for FastAPI ML services
 * Integrates with the Python FastAPI backend for advanced ML predictions
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

// FastAPI base URL - different from Node.js backend
const FASTAPI_BASE_URL = 'http://localhost:8000';

// Configure axios for FastAPI
const fastAPIClient = axios.create({
  baseURL: FASTAPI_BASE_URL,
  timeout: 30000, // 30 seconds for ML operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token if available
fastAPIClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fastapi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Hook for FastAPI authentication
 */
export const useFastAPIAuth = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    token: localStorage.getItem('fastapi_token'),
    user: null,
    loading: false,
    error: null,
  });

  const login = useCallback(async (email, password) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fastAPIClient.post('/auth/login', { email, password });
      const { access_token, user_id, email: userEmail } = response.data;
      
      localStorage.setItem('fastapi_token', access_token);
      setAuthState({
        isAuthenticated: true,
        token: access_token,
        user: { user_id, email: userEmail },
        loading: false,
        error: null,
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fastapi_token');
    setAuthState({
      isAuthenticated: false,
      token: null,
      user: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...authState,
    login,
    logout,
  };
};

/**
 * Hook for yield prediction using ML models
 */
export const useYieldPrediction = () => {
  const [predictionState, setPredictionState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const predictYield = useCallback(async (predictionData) => {
    setPredictionState({ data: null, loading: true, error: null });
    
    try {
      const response = await fastAPIClient.post('/api/predict/yield', predictionData);
      setPredictionState({ data: response.data, loading: false, error: null });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Yield prediction failed';
      setPredictionState({ data: null, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setPredictionState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...predictionState,
    predictYield,
    clearPrediction,
  };
};

/**
 * Hook for crop recommendations
 */
export const useCropRecommendation = () => {
  const [recommendationState, setRecommendationState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const getCropRecommendation = useCallback(async (soilWeatherData) => {
    setRecommendationState({ data: null, loading: true, error: null });
    
    try {
      const response = await fastAPIClient.post('/api/predict/crop-recommendation', null, {
        params: soilWeatherData,
      });
      setRecommendationState({ data: response.data, loading: false, error: null });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Crop recommendation failed';
      setRecommendationState({ data: null, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearRecommendation = useCallback(() => {
    setRecommendationState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...recommendationState,
    getCropRecommendation,
    clearRecommendation,
  };
};

/**
 * Hook for plant disease detection
 */
export const usePlantDiseaseDetection = () => {
  const [diseaseState, setDiseaseState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const detectDisease = useCallback(async (imageFile) => {
    setDiseaseState({ data: null, loading: true, error: null });
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      const response = await fastAPIClient.post('/api/ai/detect-disease', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setDiseaseState({ data: response.data, loading: false, error: null });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Disease detection failed';
      setDiseaseState({ data: null, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearDetection = useCallback(() => {
    setDiseaseState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...diseaseState,
    detectDisease,
    clearDetection,
  };
};

/**
 * Hook for weather intelligence
 */
export const useWeatherIntelligence = () => {
  const [weatherState, setWeatherState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const getWeatherIntelligence = useCallback(async (location) => {
    setWeatherState({ data: null, loading: true, error: null });
    
    try {
      const response = await fastAPIClient.get(`/api/weather/${encodeURIComponent(location)}`);
      setWeatherState({ data: response.data, loading: false, error: null });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Weather data fetch failed';
      setWeatherState({ data: null, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearWeather = useCallback(() => {
    setWeatherState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...weatherState,
    getWeatherIntelligence,
    clearWeather,
  };
};

/**
 * Hook for FastAPI health checks
 */
export const useFastAPIHealth = () => {
  const [healthState, setHealthState] = useState({
    data: null,
    loading: false,
    error: null,
    isOnline: false,
  });

  const checkHealth = useCallback(async () => {
    setHealthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fastAPIClient.get('/health');
      const isOnline = response.data.status === 'healthy';
      setHealthState({ data: response.data, loading: false, error: null, isOnline });
      return { success: true, data: response.data, isOnline };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Health check failed';
      setHealthState({ data: null, loading: false, error: errorMessage, isOnline: false });
      return { success: false, error: errorMessage, isOnline: false };
    }
  }, []);

  return {
    ...healthState,
    checkHealth,
  };
};

/**
 * Generic hook for FastAPI requests
 */
export const useFastAPIRequest = () => {
  const [requestState, setRequestState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const makeRequest = useCallback(async (method, endpoint, data = null, config = {}) => {
    setRequestState({ data: null, loading: true, error: null });
    
    try {
      const response = await fastAPIClient.request({
        method,
        url: endpoint,
        data,
        ...config,
      });
      setRequestState({ data: response.data, loading: false, error: null });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || `${method} request failed`;
      setRequestState({ data: null, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearRequest = useCallback(() => {
    setRequestState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...requestState,
    makeRequest,
    clearRequest,
  };
};

// Export FastAPI client for direct use
export { fastAPIClient };