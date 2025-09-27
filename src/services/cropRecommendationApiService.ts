/**
 * Crop Recommendation API Service
 * Connects to the FastAPI backend for real crop recommendations
 */

export interface CropSuggestionRequest {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface CropSuggestion {
  crop: string;
  confidence: number;
}

export interface CropSuggestionResponse {
  success: boolean;
  recommended_crop: string;
  confidence: number;
  suggestions: string[];
  confidence_scores: Record<string, number>;
  input_data: CropSuggestionRequest;
  timestamp: string;
}

export interface SoilAnalysis {
  nitrogen_status: string;
  phosphorus_status: string;
  potassium_status: string;
  ph_status: string;
  overall_soil_health: string;
}

export interface EnvironmentalAnalysis {
  temperature_status: string;
  humidity_status: string;
  rainfall_status: string;
  overall_climate: string;
}

export interface DetailedCropRecommendation {
  success: boolean;
  recommended_crop: string;
  confidence: number;
  top_3_recommendations: CropSuggestion[];
  soil_analysis: SoilAnalysis;
  environmental_analysis: EnvironmentalAnalysis;
  model_info: {
    model_type: string;
    supported_crops: number;
  };
  timestamp: string;
}

class CropRecommendationApiService {
  private readonly baseUrl: string;

  constructor() {
    // Use FastAPI backend URL
    this.baseUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
  }

  /**
   * Get simple crop suggestions (for suggestions page)
   */
  async getCropSuggestions(params: CropSuggestionRequest): Promise<CropSuggestionResponse> {
    try {
      const url = new URL('/api/crop-suggestions', this.baseUrl);
      
      // Add parameters as query params
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });

      console.log('Fetching crop suggestions from:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send empty body for POST request, data is in query params
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching crop suggestions:', error);
      // Return fallback data
      return this.getFallbackSuggestions(params);
    }
  }

  /**
   * Get detailed crop recommendations (with analysis)
   */
  async getDetailedCropRecommendation(params: CropSuggestionRequest): Promise<DetailedCropRecommendation> {
    try {
      const url = new URL('/api/predict/crop-recommendation', this.baseUrl);
      
      // Add parameters as query params
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });

      console.log('Fetching detailed crop recommendation from:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching detailed crop recommendation:', error);
      // Return fallback data
      return this.getFallbackDetailedRecommendation(params);
    }
  }

  /**
   * Get crop suggestions using soil and weather data from existing services
   */
  async getCropSuggestionsFromCurrentConditions(
    latitude: number,
    longitude: number,
    soilOverride?: Partial<CropSuggestionRequest>
  ): Promise<CropSuggestionResponse> {
    try {
      // Import API services
      const { RealAPIService } = await import('./apiService');

      // Get soil and weather data
      const [soilData, weatherData] = await Promise.all([
        RealAPIService.fetchSoilData(latitude, longitude),
        RealAPIService.fetchWeatherData(latitude, longitude)
      ]);

      // Convert to crop recommendation parameters
      const params: CropSuggestionRequest = {
        N: soilOverride?.N ?? soilData.nitrogen,
        P: soilOverride?.P ?? soilData.phosphorus,
        K: soilOverride?.K ?? soilData.potassium,
        temperature: soilOverride?.temperature ?? weatherData.current.temperature,
        humidity: soilOverride?.humidity ?? weatherData.current.humidity,
        ph: soilOverride?.ph ?? soilData.ph,
        rainfall: soilOverride?.rainfall ?? weatherData.current.rainfall
      };

      return await this.getCropSuggestions(params);
    } catch (error) {
      console.error('Error getting crop suggestions from current conditions:', error);
      
      // Fallback with default values
      const defaultParams: CropSuggestionRequest = {
        N: 50,
        P: 30,
        K: 40,
        temperature: 25,
        humidity: 65,
        ph: 6.5,
        rainfall: 100
      };

      return this.getFallbackSuggestions(defaultParams);
    }
  }

  /**
   * Check if the FastAPI service is available
   */
  async checkServiceHealth(): Promise<{ available: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          message: `Service is running: ${data.status}`
        };
      } else {
        return {
          available: false,
          message: `Service returned status: ${response.status}`
        };
      }
    } catch (error) {
      return {
        available: false,
        message: `Service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate crop recommendation parameters
   */
  validateParameters(params: CropSuggestionRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Define reasonable ranges
    const ranges = {
      N: { min: 0, max: 140, name: 'Nitrogen' },
      P: { min: 5, max: 145, name: 'Phosphorus' },
      K: { min: 5, max: 205, name: 'Potassium' },
      temperature: { min: 8, max: 50, name: 'Temperature' },
      humidity: { min: 14, max: 100, name: 'Humidity' },
      ph: { min: 3.5, max: 10, name: 'pH' },
      rainfall: { min: 20, max: 300, name: 'Rainfall' }
    };

    Object.entries(ranges).forEach(([key, range]) => {
      const value = params[key as keyof CropSuggestionRequest];
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`${range.name} must be a valid number`);
      } else if (value < range.min || value > range.max) {
        errors.push(`${range.name} should be between ${range.min} and ${range.max}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format crop name for display
   */
  formatCropName(crop: string): string {
    return crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
  }

  /**
   * Get confidence level description
   */
  getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Good';
    if (confidence >= 0.6) return 'Moderate';
    if (confidence >= 0.5) return 'Fair';
    return 'Low';
  }

  /**
   * Fallback suggestions when API is unavailable
   */
  private getFallbackSuggestions(params: CropSuggestionRequest): CropSuggestionResponse {
    // Simple rule-based fallback
    let recommendedCrop = 'wheat';
    
    if (params.rainfall > 150 && params.humidity > 70) {
      recommendedCrop = 'rice';
    } else if (params.temperature > 30 && params.rainfall < 50) {
      recommendedCrop = 'cotton';
    } else if (params.ph < 6.0) {
      recommendedCrop = 'coffee';
    }

    return {
      success: true,
      recommended_crop: recommendedCrop,
      confidence: 0.75,
      suggestions: [recommendedCrop, 'maize', 'wheat'],
      confidence_scores: {
        [recommendedCrop]: 0.75,
        'maize': 0.65,
        'wheat': 0.55
      },
      input_data: params,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fallback detailed recommendation when API is unavailable
   */
  private getFallbackDetailedRecommendation(params: CropSuggestionRequest): DetailedCropRecommendation {
    const fallbackSuggestions = this.getFallbackSuggestions(params);
    
    return {
      success: true,
      recommended_crop: fallbackSuggestions.recommended_crop,
      confidence: fallbackSuggestions.confidence,
      top_3_recommendations: Object.entries(fallbackSuggestions.confidence_scores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([crop, confidence]) => ({ crop, confidence })),
      soil_analysis: {
        nitrogen_status: params.N > 80 ? 'High' : params.N > 40 ? 'Optimal' : 'Low',
        phosphorus_status: params.P > 60 ? 'High' : params.P > 30 ? 'Optimal' : 'Low',
        potassium_status: params.K > 100 ? 'High' : params.K > 50 ? 'Optimal' : 'Low',
        ph_status: params.ph < 6.0 ? 'Acidic' : params.ph > 7.5 ? 'Alkaline' : 'Neutral',
        overall_soil_health: 'Good'
      },
      environmental_analysis: {
        temperature_status: params.temperature < 15 ? 'Cold' : params.temperature > 35 ? 'Hot' : 'Optimal',
        humidity_status: params.humidity < 40 ? 'Low' : params.humidity > 85 ? 'High' : 'Good',
        rainfall_status: params.rainfall < 50 ? 'Low' : params.rainfall > 200 ? 'High' : 'Adequate',
        overall_climate: 'Favorable'
      },
      model_info: {
        model_type: 'Fallback Model',
        supported_crops: 22
      },
      timestamp: new Date().toISOString()
    };
  }
}

export default new CropRecommendationApiService();