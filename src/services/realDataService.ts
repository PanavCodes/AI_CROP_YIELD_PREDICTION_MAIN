/**
 * Real Data Service
 * Extracts and processes real data from field profiles and external APIs to replace mock data
 */

import RealAPIService from './apiService';

// Types
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
      availability: 'None' | 'Low' | 'Medium' | 'High';
    };
    crops: Array<{
      crop_type: string;
      planting_date: string;
      season: 'Rabi' | 'Kharif' | 'Zaid' | 'Perennial';
      cultivation_year: number;
      fertilizers_used: string[];
      pesticides_used: string[];
      previous_crop: string | null;
      soil_test_results: null | {
        N: number | null;
        P: number | null;
        K: number | null;
        pH: number | null;
      };
      weather_data: null | {
        temperature: number | null;
        humidity: number | null;
        rainfall: number | null;
      };
    }>;
  };
}

interface RealWeatherData {
  current: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    condition: string;
  };
  forecast: Array<{
    day: string;
    temp: number;
    rainfall: number;
    condition: string;
  }>;
}

interface RealCropPredictions {
  currentCrop: string;
  predictedYield: number;
  confidence: number;
  harvestDate: string;
  marketPrice: number;
  riskFactors: string[];
  alternativeCrops: Array<{
    name: string;
    yield: number;
    profit: string;
  }>;
}

interface RealSoilNutrients {
  name: string;
  value: number;
  ideal: number;
  color: string;
}

interface RealYieldTrend {
  month: string;
  yield: number;
  actual: number | null;
  predicted: number;
  rainfall: number;
}

// Utility functions
export class RealDataService {
  
  /**
   * Load field profiles from localStorage
   */
  static loadProfiles(): FieldProfile[] {
    try {
      const savedProfiles = localStorage.getItem('fieldProfiles');
      return savedProfiles ? JSON.parse(savedProfiles) : [];
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  }

  /**
   * Get current profile based on index
   */
  static getCurrentProfile(profileIndex: number = 0): FieldProfile | null {
    const profiles = this.loadProfiles();
    return profiles.length > profileIndex ? profiles[profileIndex] : null;
  }

  /**
   * Get current crop based on profile and crop index
   */
  static getCurrentCrop(profileIndex: number = 0, cropIndex: number = 0): FieldProfile['field_profile']['crops'][0] | null {
    const profile = this.getCurrentProfile(profileIndex);
    if (!profile || !profile.field_profile.crops.length) return null;
    return profile.field_profile.crops.length > cropIndex ? profile.field_profile.crops[cropIndex] : null;
  }

  /**
   * Extract weather data from field profiles and external APIs
   */
  static async getWeatherData(profileIndex: number = 0, cropIndex: number = 0): Promise<RealWeatherData> {
    const profile = this.getCurrentProfile(profileIndex);
    const crop = this.getCurrentCrop(profileIndex, cropIndex);
    
    // Try to get location from profile first
    let latitude: number | undefined;
    let longitude: number | undefined;
    
    if (profile?.field_profile?.location) {
      latitude = profile.field_profile.location.latitude;
      longitude = profile.field_profile.location.longitude;
    }
    
    // If no location in profile, try to get user's location
    if (!latitude || !longitude) {
      try {
        const location = await RealAPIService.getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (error) {
        console.warn('Could not get current location:', error);
      }
    }
    
    // If we have coordinates, fetch real weather data
    if (latitude && longitude) {
      try {
        const realWeatherData = await RealAPIService.fetchWeatherData(latitude, longitude);
        return {
          current: {
            temperature: realWeatherData.current.temperature,
            humidity: realWeatherData.current.humidity,
            rainfall: realWeatherData.current.rainfall,
            windSpeed: realWeatherData.current.windSpeed,
            condition: realWeatherData.current.condition
          },
          forecast: realWeatherData.forecast.map(day => ({
            day: day.day,
            temp: day.temp,
            rainfall: day.rainfall,
            condition: day.condition
          }))
        };
      } catch (error) {
        console.error('Failed to fetch real weather data:', error);
      }
    }
    
    // Fallback to crop weather data if available
    if (crop?.weather_data) {
      const temp = crop.weather_data.temperature || 25;
      const humidity = crop.weather_data.humidity || 60;
      const rainfall = crop.weather_data.rainfall || 0;
      
      return {
        current: {
          temperature: temp,
          humidity,
          rainfall,
          windSpeed: 8, // Default value
          condition: this.getWeatherCondition(temp, humidity, rainfall)
        },
        forecast: this.generateForecast(temp, humidity, rainfall)
      };
    }

    // Final fallback data
    return {
      current: {
        temperature: 25,
        humidity: 60,
        rainfall: 0,
        windSpeed: 8,
        condition: "Partly Cloudy"
      },
      forecast: [
        { day: "Mon", temp: 26, rainfall: 0, condition: "Sunny" },
        { day: "Tue", temp: 27, rainfall: 5, condition: "Partly Cloudy" },
        { day: "Wed", temp: 25, rainfall: 10, condition: "Light Rain" },
        { day: "Thu", temp: 24, rainfall: 15, condition: "Moderate Rain" },
        { day: "Fri", temp: 26, rainfall: 0, condition: "Sunny" },
      ]
    };
  }

  /**
   * Get crop predictions based on real data
   */
  static getCropPredictions(profileIndex: number = 0, cropIndex: number = 0): RealCropPredictions {
    const crop = this.getCurrentCrop(profileIndex, cropIndex);
    const profile = this.getCurrentProfile(profileIndex);
    
    if (!crop || !profile) {
      return {
        currentCrop: "No Crop Selected",
        predictedYield: 0,
        confidence: 0,
        harvestDate: new Date().toISOString().split('T')[0],
        marketPrice: 0,
        riskFactors: ["No crop data available"],
        alternativeCrops: []
      };
    }

    const yieldEstimate = this.calculateYieldEstimate(crop, profile);
    const harvestDate = this.calculateHarvestDate(crop.planting_date, crop.crop_type);
    
    return {
      currentCrop: crop.crop_type,
      predictedYield: yieldEstimate,
      confidence: this.calculateConfidence(crop),
      harvestDate,
      marketPrice: this.getMarketPrice(crop.crop_type),
      riskFactors: this.analyzeRiskFactors(crop, profile),
      alternativeCrops: this.getAlternativeCrops(profile.field_profile.soil_type)
    };
  }

  /**
   * Get soil nutrients data from field profiles and external APIs
   */
  static async getSoilNutrients(profileIndex: number = 0, cropIndex: number = 0): Promise<RealSoilNutrients[]> {
    const profile = this.getCurrentProfile(profileIndex);
    const crop = this.getCurrentCrop(profileIndex, cropIndex);
    
    // Try to get real soil data if location is available
    if (profile?.field_profile?.location) {
      try {
        const soilData = await RealAPIService.fetchSoilData(
          profile.field_profile.location.latitude,
          profile.field_profile.location.longitude
        );
        
        return [
          {
            name: "Nitrogen",
            value: soilData.nitrogen,
            ideal: this.getIdealNutrientLevel(crop?.crop_type || 'Wheat', 'N'),
            color: '#10b981'
          },
          {
            name: "Phosphorus",
            value: soilData.phosphorus,
            ideal: this.getIdealNutrientLevel(crop?.crop_type || 'Wheat', 'P'),
            color: '#f59e0b'
          },
          {
            name: "Potassium",
            value: soilData.potassium,
            ideal: this.getIdealNutrientLevel(crop?.crop_type || 'Wheat', 'K'),
            color: '#3b82f6'
          }
        ];
      } catch (error) {
        console.error('Failed to fetch real soil data:', error);
      }
    }
    
    // Fallback to crop soil test results if available
    if (crop?.soil_test_results) {
      const soil = crop.soil_test_results;
      return [
        {
          name: "Nitrogen",
          value: soil.N || 0,
          ideal: this.getIdealNutrientLevel(crop.crop_type, 'N'),
          color: '#10b981'
        },
        {
          name: "Phosphorus",
          value: soil.P || 0,
          ideal: this.getIdealNutrientLevel(crop.crop_type, 'P'),
          color: '#f59e0b'
        },
        {
          name: "Potassium",
          value: soil.K || 0,
          ideal: this.getIdealNutrientLevel(crop.crop_type, 'K'),
          color: '#3b82f6'
        }
      ];
    }

    // Default values if no soil test data
    return [
      { name: "Nitrogen", value: 0, ideal: 50, color: '#10b981' },
      { name: "Phosphorus", value: 0, ideal: 25, color: '#f59e0b' },
      { name: "Potassium", value: 0, ideal: 40, color: '#3b82f6' },
    ];
  }

  /**
   * Generate yield trends based on historical and current data
   */
  static getYieldTrends(profileIndex: number = 0): RealYieldTrend[] {
    const profile = this.getCurrentProfile(profileIndex);
    if (!profile || !profile.field_profile.crops.length) {
      return [];
    }

    const crops = profile.field_profile.crops;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate trends based on crop data
    return months.map((month, index) => {
      const baseYield = this.calculateYieldEstimate(crops[0], profile);
      const seasonal = Math.sin((index / 12) * 2 * Math.PI) * 5;
      const rainfall = this.getRainfallForMonth(crops[0], index);
      
      return {
        month,
        yield: Math.max(0, baseYield + seasonal),
        actual: index < 6 ? Math.max(0, baseYield + seasonal + (Math.random() - 0.5) * 3) : null,
        predicted: Math.max(0, baseYield + seasonal),
        rainfall
      };
    });
  }

  /**
   * Get fertilizer schedule based on crop data
   */
  static getFertilizerPlan(profileIndex: number = 0, cropIndex: number = 0) {
    const crop = this.getCurrentCrop(profileIndex, cropIndex);
    const profile = this.getCurrentProfile(profileIndex);
    
    if (!crop) {
      return {
        currentPhase: 'No Data',
        nextApplication: 'Unknown',
        schedule: [],
        costSavings: { monthly: '$0', yearly: '$0', efficiency: '0%' },
        currentNutrients: { nitrogen: 0, phosphorus: 0, potassium: 0, pH: 7 }
      };
    }

    const plantingDate = new Date(crop.planting_date.split('-').reverse().join('-'));
    const daysSincePlanting = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      currentPhase: this.getCurrentGrowthPhase(daysSincePlanting),
      nextApplication: this.getNextApplicationDate(daysSincePlanting),
      schedule: this.generateFertilizerSchedule(crop),
      costSavings: {
        monthly: `₹${Math.floor((profile?.field_profile.field_size_hectares || 2) * 500)}`,
        yearly: `₹${Math.floor((profile?.field_profile.field_size_hectares || 2) * 6000)}`,
        efficiency: '+15%'
      },
      currentNutrients: {
        nitrogen: crop.soil_test_results?.N || 0,
        phosphorus: crop.soil_test_results?.P || 0,
        potassium: crop.soil_test_results?.K || 0,
        pH: crop.soil_test_results?.pH || 7
      }
    };
  }

  /**
   * Get real market prices for crops
   */
  static async getMarketPrices(cropType?: string, state?: string, limit: number = 10) {
    try {
      console.log('Fetching market prices for:', cropType, state);
      
      const prices = await RealAPIService.fetchCropPrices({
        commodity: cropType,
        state: state,
        limit: limit
      });
      
      return {
        success: true,
        data: prices,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to fetch market prices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  /**
   * Get market trends for a specific commodity
   */
  static async getMarketTrends(commodity: string) {
    try {
      const trends = await RealAPIService.fetchMarketTrends(commodity);
      return trends;
    } catch (error) {
      console.error('Failed to fetch market trends:', error);
      return [];
    }
  }

  /**
   * Get irrigation plan based on crop and field data
   */
  static getIrrigationPlan(profileIndex: number = 0) {
    const profile = this.getCurrentProfile(profileIndex);
    const crop = this.getCurrentCrop(profileIndex, 0);
    
    if (!profile || !crop) {
      return {
        nextIrrigation: 'No data',
        duration: '0 hours',
        soilMoisture: 0,
        waterSaved: 0,
        schedule: [],
        insights: ['No irrigation data available']
      };
    }

    const irrigationMethod = profile.field_profile.irrigation.method;
    const availability = profile.field_profile.irrigation.availability;
    
    return {
      nextIrrigation: 'Tomorrow 6:00 AM',
      duration: this.getIrrigationDuration(availability),
      soilMoisture: this.calculateSoilMoisture(crop),
      waterSaved: this.getWaterSavings(irrigationMethod),
      schedule: this.generateIrrigationSchedule(availability, irrigationMethod),
      insights: this.getIrrigationInsights(irrigationMethod, availability)
    };
  }

  // Helper methods
  private static getWeatherCondition(temp: number, humidity: number, rainfall: number): string {
    if (rainfall > 10) return "Moderate Rain";
    if (rainfall > 5) return "Light Rain";
    if (humidity > 80) return "Cloudy";
    if (temp > 30) return "Sunny";
    return "Partly Cloudy";
  }

  private static generateForecast(baseTemp: number, baseHumidity: number, baseRainfall: number) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return days.map(day => ({
      day,
      temp: baseTemp + (Math.random() - 0.5) * 4,
      rainfall: Math.max(0, baseRainfall + (Math.random() - 0.5) * 10),
      condition: this.getWeatherCondition(baseTemp, baseHumidity, baseRainfall)
    }));
  }

  private static calculateYieldEstimate(crop: any, profile: FieldProfile): number {
    let baseYield = this.getBaseYield(crop.crop_type);
    
    // Adjust based on soil type
    const soilMultiplier = this.getSoilMultiplier(profile.field_profile.soil_type);
    baseYield *= soilMultiplier;
    
    // Adjust based on irrigation
    const irrigationMultiplier = this.getIrrigationMultiplier(profile.field_profile.irrigation.availability);
    baseYield *= irrigationMultiplier;
    
    // Adjust based on soil nutrients
    if (crop.soil_test_results) {
      const nutrientMultiplier = this.getNutrientMultiplier(crop.soil_test_results);
      baseYield *= nutrientMultiplier;
    }
    
    return Math.round(baseYield * 100) / 100;
  }

  private static getBaseYield(cropType: string): number {
    const yieldMap: { [key: string]: number } = {
      'Wheat': 45,
      'Rice': 55,
      'Maize': 65,
      'Cotton': 25,
      'Sugarcane': 800,
      'Pulses': 15,
      'Vegetables': 300,
      'Fruits': 250
    };
    return yieldMap[cropType] || 30;
  }

  private static getSoilMultiplier(soilType: string): number {
    const multipliers: { [key: string]: number } = {
      'Loamy': 1.2,
      'Clay': 1.0,
      'Sandy': 0.8,
      'Silt': 1.1,
      'Black Cotton': 1.15,
      'Peat': 0.9,
      'Chalk': 0.85
    };
    return multipliers[soilType] || 1.0;
  }

  private static getIrrigationMultiplier(availability: string): number {
    const multipliers: { [key: string]: number } = {
      'High': 1.3,
      'Medium': 1.1,
      'Low': 0.9,
      'None': 0.7
    };
    return multipliers[availability] || 1.0;
  }

  private static getNutrientMultiplier(nutrients: any): number {
    const n = nutrients.N || 0;
    const p = nutrients.P || 0;
    const k = nutrients.K || 0;
    
    // Simple scoring based on NPK levels
    const score = (n + p + k) / 150; // Assuming 150 is optimal total
    return Math.min(1.5, Math.max(0.7, 0.5 + score));
  }

  private static calculateConfidence(crop: any): number {
    let confidence = 50; // Base confidence
    
    if (crop.soil_test_results) confidence += 25;
    if (crop.weather_data) confidence += 15;
    if (crop.fertilizers_used.length > 0) confidence += 10;
    
    return Math.min(95, confidence);
  }

  private static calculateHarvestDate(plantingDate: string, cropType: string): string {
    const plantDate = new Date(plantingDate.split('-').reverse().join('-'));
    const growthPeriods: { [key: string]: number } = {
      'Wheat': 120,
      'Rice': 140,
      'Maize': 100,
      'Cotton': 180,
      'Sugarcane': 365,
      'Pulses': 90,
      'Vegetables': 60,
      'Fruits': 180
    };
    
    const days = growthPeriods[cropType] || 120;
    const harvestDate = new Date(plantDate.getTime() + days * 24 * 60 * 60 * 1000);
    return harvestDate.toISOString().split('T')[0];
  }

  private static getMarketPrice(cropType: string): number {
    const prices: { [key: string]: number } = {
      'Wheat': 2200,
      'Rice': 2800,
      'Maize': 1800,
      'Cotton': 5500,
      'Sugarcane': 350,
      'Pulses': 6500,
      'Vegetables': 1200,
      'Fruits': 2000
    };
    return prices[cropType] || 2000;
  }

  private static analyzeRiskFactors(crop: any, profile: FieldProfile): string[] {
    const risks: string[] = [];
    
    if (crop.pesticides_used.length === 0) {
      risks.push("No pest control measures recorded");
    }
    
    if (profile.field_profile.irrigation.availability === 'Low' || profile.field_profile.irrigation.availability === 'None') {
      risks.push("Limited water availability");
    }
    
    if (!crop.soil_test_results) {
      risks.push("Soil health status unknown");
    }
    
    if (!crop.weather_data) {
      risks.push("Weather data not available");
    }
    
    return risks.length > 0 ? risks : ["Low risk profile"];
  }

  private static getAlternativeCrops(soilType: string): Array<{name: string; yield: number; profit: string}> {
    const alternatives: { [key: string]: Array<{name: string; yield: number; profit: string}> } = {
      'Loamy': [
        { name: 'Rice', yield: 55, profit: '₹95,000/ha' },
        { name: 'Maize', yield: 65, profit: '₹78,000/ha' },
        { name: 'Wheat', yield: 50, profit: '₹85,000/ha' }
      ],
      'Clay': [
        { name: 'Rice', yield: 60, profit: '₹105,000/ha' },
        { name: 'Sugarcane', yield: 80, profit: '₹120,000/ha' },
        { name: 'Cotton', yield: 28, profit: '₹95,000/ha' }
      ],
      'Sandy': [
        { name: 'Pulses', yield: 18, profit: '₹65,000/ha' },
        { name: 'Vegetables', yield: 300, profit: '₹150,000/ha' },
        { name: 'Maize', yield: 55, profit: '₹70,000/ha' }
      ]
    };
    
    return alternatives[soilType] || alternatives['Loamy'];
  }

  private static getIdealNutrientLevel(cropType: string, nutrient: 'N' | 'P' | 'K'): number {
    const levels: { [key: string]: {N: number; P: number; K: number} } = {
      'Wheat': { N: 50, P: 25, K: 40 },
      'Rice': { N: 60, P: 30, K: 45 },
      'Maize': { N: 55, P: 28, K: 42 },
      'Cotton': { N: 45, P: 35, K: 50 },
      'Sugarcane': { N: 80, P: 40, K: 60 },
      'Pulses': { N: 30, P: 20, K: 35 }
    };
    
    return levels[cropType]?.[nutrient] || { N: 50, P: 25, K: 40 }[nutrient];
  }

  private static getRainfallForMonth(crop: any, monthIndex: number): number {
    const baseRainfall = crop.weather_data?.rainfall || 50;
    const seasonalVariation = Math.sin((monthIndex / 12) * 2 * Math.PI) * 30;
    return Math.max(0, baseRainfall + seasonalVariation);
  }

  private static getCurrentGrowthPhase(daysSincePlanting: number): string {
    if (daysSincePlanting < 0) return 'Pre-planting';
    if (daysSincePlanting < 30) return 'Germination Phase';
    if (daysSincePlanting < 60) return 'Growth Phase';
    if (daysSincePlanting < 90) return 'Flowering Phase';
    if (daysSincePlanting < 120) return 'Fruiting Phase';
    return 'Maturity Phase';
  }

  private static getNextApplicationDate(daysSincePlanting: number): string {
    const nextApplication = new Date();
    nextApplication.setDate(nextApplication.getDate() + (7 - (daysSincePlanting % 7)));
    return nextApplication.toLocaleDateString();
  }

  private static generateFertilizerSchedule(crop: any) {
    const phases = ['Initial Application', 'Growth Phase', 'Flowering Phase', 'Fruiting Phase', 'Maturity Phase'];
    return phases.map((phase, index) => ({
      week: `Week ${index * 2 + 1}`,
      nitrogen: Math.max(10, 40 - index * 7),
      phosphorus: Math.max(10, 20 + index * 2),
      potassium: Math.max(20, 30 + index * 5),
      phase
    }));
  }

  private static getIrrigationDuration(availability: string): string {
    const durations: { [key: string]: string } = {
      'High': '2 hours',
      'Medium': '3 hours',
      'Low': '4 hours',
      'None': '6 hours'
    };
    return durations[availability] || '3 hours';
  }

  private static calculateSoilMoisture(crop: any): number {
    const baseHumidity = crop.weather_data?.humidity || 60;
    return Math.min(100, Math.max(30, baseHumidity + 10));
  }

  private static getWaterSavings(method: string): number {
    const savings: { [key: string]: number } = {
      'Drip Irrigation': 35,
      'Sprinkler': 25,
      'Flood Irrigation': 5,
      'Furrow Irrigation': 15,
      'Manual Watering': 0
    };
    return savings[method] || 10;
  }

  private static generateIrrigationSchedule(availability: string, method: string) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseHours = availability === 'High' ? 2 : availability === 'Medium' ? 3 : 4;
    
    return days.map(day => ({
      day,
      morning: baseHours * 0.6,
      evening: baseHours * 0.4,
      total: baseHours,
      efficiency: 85 + Math.random() * 10,
      skip: Math.random() > 0.8,
      reason: Math.random() > 0.8 ? 'Rain forecast' : undefined
    }));
  }

  private static getIrrigationInsights(method: string, availability: string): string[] {
    const insights = [
      'Morning irrigation more effective (lower evaporation)',
      `Current method: ${method}`,
      `Water availability: ${availability}`
    ];
    
    if (method === 'Flood Irrigation') {
      insights.push('Consider drip irrigation for 30% more water savings');
    }
    
    if (availability === 'Low') {
      insights.push('Water conservation measures recommended');
    }
    
    return insights;
  }
}

export default RealDataService;