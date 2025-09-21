// Bhuvan Land Use Land Cover (LULC) API Service
// Provides detailed land use classification for agricultural field analysis

export interface LulcClassification {
  class_name: string;
  class_code: number;
  confidence?: number;
  coverage_percent?: number;
  description?: string;
  agricultural_suitability: 'excellent' | 'good' | 'moderate' | 'poor' | 'unsuitable';
  crop_types?: string[];
}

export interface LulcResponse {
  success: boolean;
  latitude: number;
  longitude: number;
  primary_class: LulcClassification;
  secondary_classes?: LulcClassification[];
  pixel_resolution?: string;
  data_year?: string;
  source: 'bhuvan_lulc' | 'mock' | 'error';
  error?: string;
}

// LULC class definitions based on common Indian land use classifications
const LULC_CLASSES: { [key: number]: Omit<LulcClassification, 'confidence' | 'coverage_percent'> } = {
  1: {
    class_name: 'Irrigated Cropland',
    class_code: 1,
    description: 'Areas under regular irrigation with high crop productivity',
    agricultural_suitability: 'excellent',
    crop_types: ['Rice', 'Wheat', 'Sugarcane', 'Cotton', 'Vegetables']
  },
  2: {
    class_name: 'Rainfed Cropland',
    class_code: 2,
    description: 'Agricultural areas dependent on monsoon rainfall',
    agricultural_suitability: 'good',
    crop_types: ['Sorghum', 'Millet', 'Pulses', 'Oilseeds', 'Cotton']
  },
  3: {
    class_name: 'Fallow Land',
    class_code: 3,
    description: 'Agricultural land left uncultivated during a growing season',
    agricultural_suitability: 'good',
    crop_types: ['Any crop after proper preparation']
  },
  4: {
    class_name: 'Plantation Crops',
    class_code: 4,
    description: 'Areas under tree crops and orchards',
    agricultural_suitability: 'moderate',
    crop_types: ['Tea', 'Coffee', 'Rubber', 'Coconut', 'Areca nut']
  },
  5: {
    class_name: 'Forest',
    class_code: 5,
    description: 'Dense forest areas',
    agricultural_suitability: 'poor',
    crop_types: []
  },
  6: {
    class_name: 'Grassland',
    class_code: 6,
    description: 'Natural or semi-natural grass-covered areas',
    agricultural_suitability: 'moderate',
    crop_types: ['Fodder crops', 'Grazing']
  },
  7: {
    class_name: 'Wetland',
    class_code: 7,
    description: 'Areas with water logging or seasonal flooding',
    agricultural_suitability: 'moderate',
    crop_types: ['Rice', 'Aquaculture']
  },
  8: {
    class_name: 'Water Bodies',
    class_code: 8,
    description: 'Rivers, lakes, ponds and reservoirs',
    agricultural_suitability: 'unsuitable',
    crop_types: []
  },
  9: {
    class_name: 'Built-up Area',
    class_code: 9,
    description: 'Urban and rural settlements, infrastructure',
    agricultural_suitability: 'unsuitable',
    crop_types: []
  },
  10: {
    class_name: 'Barren Land',
    class_code: 10,
    description: 'Uncultivable land including rocky areas',
    agricultural_suitability: 'poor',
    crop_types: []
  },
  11: {
    class_name: 'Snow/Glaciers',
    class_code: 11,
    description: 'Permanent snow and glacier areas',
    agricultural_suitability: 'unsuitable',
    crop_types: []
  },
  12: {
    class_name: 'Mixed Cropland',
    class_code: 12,
    description: 'Areas with mixed agricultural practices',
    agricultural_suitability: 'good',
    crop_types: ['Mixed cropping systems', 'Intercropping']
  }
};

class BhuvanLulcService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://bhuvan-app1.nrsc.gov.in/bhuvan/lulc/lulc';
  private cache = new Map<string, LulcResponse>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.API_KEY = (import.meta as any).env?.VITE_BHUVAN_LULC_API_KEY || '';
  }

  /**
   * Get land use classification for a specific coordinate
   */
  async getLandUseClassification(latitude: number, longitude: number): Promise<LulcResponse> {
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    // Check cache first
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.API_KEY) {
      console.warn('Bhuvan LULC API key not configured, using mock data');
      return this.getMockResponse(latitude, longitude);
    }

    try {
      const response = await this.fetchLulcData(latitude, longitude);
      
      if (response.success) {
        this.cacheResponse(cacheKey, response);
        return response;
      } else {
        console.warn('Bhuvan LULC API failed, using mock data');
        return this.getMockResponse(latitude, longitude);
      }
    } catch (error) {
      console.error('Bhuvan LULC API error:', error);
      return this.getMockResponse(latitude, longitude);
    }
  }

  /**
   * Fetch LULC data from Bhuvan API
   */
  private async fetchLulcData(latitude: number, longitude: number): Promise<LulcResponse> {
    const url = new URL(this.BASE_URL);
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('lon', longitude.toString());
    url.searchParams.append('api_key', this.API_KEY);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CropPredictionApp/1.0'
      },
      timeout: 10000 // 10 second timeout
    } as any);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseApiResponse(data, latitude, longitude);
  }

  /**
   * Parse API response into standardized format
   */
  private parseApiResponse(data: any, latitude: number, longitude: number): LulcResponse {
    try {
      // Handle different possible response formats
      const classCode = data.lulc_class || data.class_code || data.primary_class;
      const confidence = data.confidence || data.accuracy;
      const coverage = data.coverage_percent || data.percentage;
      const year = data.year || data.data_year;
      const resolution = data.resolution || data.pixel_size;

      if (typeof classCode !== 'number') {
        throw new Error('Invalid class code in response');
      }

      const classInfo = LULC_CLASSES[classCode];
      if (!classInfo) {
        throw new Error(`Unknown LULC class code: ${classCode}`);
      }

      const primaryClass: LulcClassification = {
        ...classInfo,
        confidence: confidence ? parseFloat(confidence) : undefined,
        coverage_percent: coverage ? parseFloat(coverage) : undefined
      };

      return {
        success: true,
        latitude,
        longitude,
        primary_class: primaryClass,
        pixel_resolution: resolution,
        data_year: year,
        source: 'bhuvan_lulc'
      };
    } catch (error) {
      return {
        success: false,
        latitude,
        longitude,
        primary_class: this.getDefaultClass(),
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  /**
   * Generate mock response for testing/fallback
   */
  private getMockResponse(latitude: number, longitude: number): LulcResponse {
    // Determine likely land use based on location in India
    let primaryClassCode = 2; // Default to rainfed cropland
    
    // Agricultural states - more likely to be irrigated cropland
    if (this.isInAgriculturalRegion(latitude, longitude)) {
      primaryClassCode = Math.random() > 0.3 ? 1 : 2; // 70% irrigated, 30% rainfed
    }
    // Urban areas - built-up
    else if (this.isInUrbanArea(latitude, longitude)) {
      primaryClassCode = 9;
    }
    // Forest regions
    else if (this.isInForestRegion(latitude, longitude)) {
      primaryClassCode = 5;
    }
    // Water bodies near major rivers
    else if (this.isNearWaterBody(latitude, longitude)) {
      primaryClassCode = Math.random() > 0.7 ? 8 : 7; // 30% water, 70% wetland
    }

    const classInfo = LULC_CLASSES[primaryClassCode];
    const primaryClass: LulcClassification = {
      ...classInfo,
      confidence: 75 + Math.random() * 20, // 75-95% confidence
      coverage_percent: 80 + Math.random() * 15 // 80-95% coverage
    };

    return {
      success: true,
      latitude,
      longitude,
      primary_class: primaryClass,
      pixel_resolution: '30m',
      data_year: '2022-23',
      source: 'mock'
    };
  }

  /**
   * Check if coordinates are in known agricultural regions
   */
  private isInAgriculturalRegion(lat: number, lng: number): boolean {
    // Punjab, Haryana, Western UP
    if (lat >= 29 && lat <= 32 && lng >= 74 && lng <= 78) return true;
    // Maharashtra - Western regions
    if (lat >= 18 && lat <= 21 && lng >= 73 && lng <= 76) return true;
    // Karnataka - Northern regions
    if (lat >= 15 && lat <= 17 && lng >= 75 && lng <= 78) return true;
    // Andhra Pradesh - Krishna Delta
    if (lat >= 15.5 && lat <= 17.5 && lng >= 80 && lng <= 82) return true;
    // Tamil Nadu - Cauvery Delta
    if (lat >= 10.5 && lat <= 12 && lng >= 78.5 && lng <= 80.5) return true;
    
    return false;
  }

  /**
   * Check if coordinates are in urban areas
   */
  private isInUrbanArea(lat: number, lng: number): boolean {
    const urbanCenters = [
      { name: 'Delhi', lat: 28.6139, lng: 77.2090, radius: 0.3 },
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777, radius: 0.2 },
      { name: 'Bangalore', lat: 12.9716, lng: 77.5946, radius: 0.15 },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707, radius: 0.15 },
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639, radius: 0.15 },
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, radius: 0.15 }
    ];

    return urbanCenters.some(city => {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
      );
      return distance <= city.radius;
    });
  }

  /**
   * Check if coordinates are in forest regions
   */
  private isInForestRegion(lat: number, lng: number): boolean {
    // Western Ghats
    if (lat >= 8 && lat <= 21 && lng >= 73 && lng <= 77) return true;
    // Eastern Ghats
    if (lat >= 11 && lat <= 22 && lng >= 78 && lng <= 86) return true;
    // Northeastern states
    if (lat >= 23 && lat <= 29 && lng >= 88 && lng <= 97) return true;
    // Central India forests
    if (lat >= 20 && lat <= 25 && lng >= 78 && lng <= 84) return true;
    
    return false;
  }

  /**
   * Check if coordinates are near major water bodies
   */
  private isNearWaterBody(lat: number, lng: number): boolean {
    // Near major rivers with tolerance
    const waterBodies = [
      // Ganges
      { lat: 25.3, lng: 83, tolerance: 0.5 },
      // Yamuna
      { lat: 27.2, lng: 78, tolerance: 0.3 },
      // Godavari
      { lat: 18.7, lng: 82, tolerance: 0.4 },
      // Krishna
      { lat: 16.2, lng: 81, tolerance: 0.4 },
      // Cauvery
      { lat: 11.5, lng: 79, tolerance: 0.3 }
    ];

    return waterBodies.some(water => {
      const distance = Math.sqrt(
        Math.pow(lat - water.lat, 2) + Math.pow(lng - water.lng, 2)
      );
      return distance <= water.tolerance;
    });
  }

  /**
   * Get default land use class for unknown areas
   */
  private getDefaultClass(): LulcClassification {
    return {
      ...LULC_CLASSES[2], // Rainfed cropland as default
      confidence: 60,
      coverage_percent: 70
    };
  }

  /**
   * Cache management
   */
  private getCachedResponse(key: string): LulcResponse | null {
    const cached = this.cache.get(key);
    if (cached) {
      // Check if cache is still valid (24 hours)
      const cacheTime = (cached as any)._cacheTime;
      if (cacheTime && Date.now() - cacheTime < this.CACHE_DURATION) {
        return cached;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  private cacheResponse(key: string, response: LulcResponse): void {
    (response as any)._cacheTime = Date.now();
    this.cache.set(key, response);
    
    // Clean old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanCache();
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, response] of this.cache.entries()) {
      const cacheTime = (response as any)._cacheTime;
      if (!cacheTime || now - cacheTime >= this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get agricultural suitability score (0-100)
   */
  getSuitabilityScore(classification: LulcClassification): number {
    const suitabilityMap = {
      'excellent': 95,
      'good': 80,
      'moderate': 60,
      'poor': 30,
      'unsuitable': 5
    };
    
    const baseScore = suitabilityMap[classification.agricultural_suitability];
    const confidenceBonus = (classification.confidence || 75) * 0.1;
    
    return Math.min(100, baseScore + confidenceBonus);
  }

  /**
   * Get detailed agricultural recommendations
   */
  getAgriculturalRecommendations(classification: LulcClassification): {
    recommended: boolean;
    reasons: string[];
    suggestions: string[];
    crop_recommendations: string[];
  } {
    const result = {
      recommended: classification.agricultural_suitability !== 'unsuitable' && classification.agricultural_suitability !== 'poor',
      reasons: [] as string[],
      suggestions: [] as string[],
      crop_recommendations: classification.crop_types || []
    };

    // Add reasons based on classification
    switch (classification.agricultural_suitability) {
      case 'excellent':
        result.reasons.push('Highly suitable for agriculture');
        result.reasons.push('Good soil and water conditions');
        break;
      case 'good':
        result.reasons.push('Suitable for agriculture');
        result.reasons.push('May require some input improvements');
        break;
      case 'moderate':
        result.reasons.push('Moderately suitable');
        result.reasons.push('Requires careful planning and management');
        break;
      case 'poor':
        result.reasons.push('Limited agricultural potential');
        result.reasons.push('May require significant investment');
        break;
      case 'unsuitable':
        result.reasons.push('Not suitable for agriculture');
        result.reasons.push('Consider alternative land uses');
        break;
    }

    // Add specific suggestions
    if (classification.class_name.includes('Irrigated')) {
      result.suggestions.push('Maintain irrigation infrastructure');
      result.suggestions.push('Consider water-efficient crops');
    } else if (classification.class_name.includes('Rainfed')) {
      result.suggestions.push('Focus on drought-resistant varieties');
      result.suggestions.push('Implement rainwater harvesting');
    } else if (classification.class_name.includes('Fallow')) {
      result.suggestions.push('Soil preparation may be needed');
      result.suggestions.push('Consider crop rotation benefits');
    }

    return result;
  }
}

// Create singleton instance
const bhuvanLulcService = new BhuvanLulcService();
export default bhuvanLulcService;

// Export types
export type { LulcClassification, LulcResponse };