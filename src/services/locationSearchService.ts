// Enhanced Location Search Service
// Provides comprehensive search functionality for agricultural field locations

import { Location } from '../types/weather';

export interface SearchResult {
  location: Location;
  relevance: number;
  type: 'agricultural' | 'urban' | 'rural' | 'district' | 'state';
  description?: string;
}

class LocationSearchService {
  private agriculturalCenters: Location[] = [
    // Punjab - Rice and Wheat Belt
    { name: 'Ludhiana', latitude: 30.9010, longitude: 75.8573, district: 'Ludhiana', state: 'Punjab', country: 'India' },
    { name: 'Amritsar', latitude: 31.6340, longitude: 74.8723, district: 'Amritsar', state: 'Punjab', country: 'India' },
    { name: 'Patiala', latitude: 30.3398, longitude: 76.3869, district: 'Patiala', state: 'Punjab', country: 'India' },
    { name: 'Bathinda', latitude: 30.2118, longitude: 74.9455, district: 'Bathinda', state: 'Punjab', country: 'India' },
    { name: 'Jalandhar', latitude: 31.3260, longitude: 75.5762, district: 'Jalandhar', state: 'Punjab', country: 'India' },

    // Haryana - Green Revolution Hub
    { name: 'Karnal', latitude: 29.6857, longitude: 76.9905, district: 'Karnal', state: 'Haryana', country: 'India' },
    { name: 'Hisar', latitude: 29.1492, longitude: 75.7217, district: 'Hisar', state: 'Haryana', country: 'India' },
    { name: 'Sirsa', latitude: 29.5347, longitude: 75.0294, district: 'Sirsa', state: 'Haryana', country: 'India' },
    { name: 'Panipat', latitude: 29.3909, longitude: 76.9635, district: 'Panipat', state: 'Haryana', country: 'India' },

    // Uttar Pradesh - Sugarcane and Wheat
    { name: 'Meerut', latitude: 28.9845, longitude: 77.7064, district: 'Meerut', state: 'Uttar Pradesh', country: 'India' },
    { name: 'Agra', latitude: 27.1767, longitude: 78.0081, district: 'Agra', state: 'Uttar Pradesh', country: 'India' },
    { name: 'Aligarh', latitude: 27.8974, longitude: 78.0880, district: 'Aligarh', state: 'Uttar Pradesh', country: 'India' },
    { name: 'Bareilly', latitude: 28.3670, longitude: 79.4304, district: 'Bareilly', state: 'Uttar Pradesh', country: 'India' },

    // Maharashtra - Cotton and Sugarcane
    { name: 'Nashik', latitude: 19.9975, longitude: 73.7898, district: 'Nashik', state: 'Maharashtra', country: 'India' },
    { name: 'Aurangabad', latitude: 19.8762, longitude: 75.3433, district: 'Aurangabad', state: 'Maharashtra', country: 'India' },
    { name: 'Ahmednagar', latitude: 19.0948, longitude: 74.7480, district: 'Ahmednagar', state: 'Maharashtra', country: 'India' },
    { name: 'Solapur', latitude: 17.6599, longitude: 75.9064, district: 'Solapur', state: 'Maharashtra', country: 'India' },

    // Karnataka - Diverse Crops
    { name: 'Belgaum', latitude: 15.8497, longitude: 74.4977, district: 'Belgaum', state: 'Karnataka', country: 'India' },
    { name: 'Hubli', latitude: 15.3647, longitude: 75.1240, district: 'Dharwad', state: 'Karnataka', country: 'India' },
    { name: 'Mysore', latitude: 12.2958, longitude: 76.6394, district: 'Mysore', state: 'Karnataka', country: 'India' },
    { name: 'Shimoga', latitude: 13.9299, longitude: 75.5681, district: 'Shimoga', state: 'Karnataka', country: 'India' },

    // Andhra Pradesh - Rice and Cotton
    { name: 'Vijayawada', latitude: 16.5062, longitude: 80.6480, district: 'Krishna', state: 'Andhra Pradesh', country: 'India' },
    { name: 'Guntur', latitude: 16.3067, longitude: 80.4365, district: 'Guntur', state: 'Andhra Pradesh', country: 'India' },
    { name: 'Nellore', latitude: 14.4426, longitude: 79.9865, district: 'Nellore', state: 'Andhra Pradesh', country: 'India' },
    { name: 'Anantapur', latitude: 14.6819, longitude: 77.6006, district: 'Anantapur', state: 'Andhra Pradesh', country: 'India' },

    // Tamil Nadu - Rice and Sugarcane
    { name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, district: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
    { name: 'Salem', latitude: 11.6643, longitude: 78.1460, district: 'Salem', state: 'Tamil Nadu', country: 'India' },
    { name: 'Tiruchirapalli', latitude: 10.7905, longitude: 78.7047, district: 'Tiruchirapalli', state: 'Tamil Nadu', country: 'India' },
    { name: 'Thanjavur', latitude: 10.7870, longitude: 79.1378, district: 'Thanjavur', state: 'Tamil Nadu', country: 'India' },

    // Gujarat - Cotton and Groundnut
    { name: 'Rajkot', latitude: 22.3039, longitude: 70.8022, district: 'Rajkot', state: 'Gujarat', country: 'India' },
    { name: 'Vadodara', latitude: 22.3072, longitude: 73.1812, district: 'Vadodara', state: 'Gujarat', country: 'India' },
    { name: 'Surat', latitude: 21.1702, longitude: 72.8311, district: 'Surat', state: 'Gujarat', country: 'India' },
    { name: 'Bharuch', latitude: 21.7051, longitude: 72.9959, district: 'Bharuch', state: 'Gujarat', country: 'India' },

    // Madhya Pradesh - Wheat and Soybean
    { name: 'Indore', latitude: 22.7196, longitude: 75.8577, district: 'Indore', state: 'Madhya Pradesh', country: 'India' },
    { name: 'Bhopal', latitude: 23.2599, longitude: 77.4126, district: 'Bhopal', state: 'Madhya Pradesh', country: 'India' },
    { name: 'Gwalior', latitude: 26.2183, longitude: 78.1828, district: 'Gwalior', state: 'Madhya Pradesh', country: 'India' },
    { name: 'Ujjain', latitude: 23.1765, longitude: 75.7885, district: 'Ujjain', state: 'Madhya Pradesh', country: 'India' },

    // West Bengal - Rice
    { name: 'Krishnanagar', latitude: 23.4058, longitude: 88.5029, district: 'Nadia', state: 'West Bengal', country: 'India' },
    { name: 'Burdwan', latitude: 23.2324, longitude: 87.8615, district: 'Purba Bardhaman', state: 'West Bengal', country: 'India' },
    { name: 'Midnapore', latitude: 22.4248, longitude: 87.3130, district: 'Paschim Medinipur', state: 'West Bengal', country: 'India' },

    // Rajasthan - Millet and Oilseeds
    { name: 'Kota', latitude: 25.2138, longitude: 75.8648, district: 'Kota', state: 'Rajasthan', country: 'India' },
    { name: 'Udaipur', latitude: 24.5854, longitude: 73.7125, district: 'Udaipur', state: 'Rajasthan', country: 'India' },
    { name: 'Jodhpur', latitude: 26.2389, longitude: 73.0243, district: 'Jodhpur', state: 'Rajasthan', country: 'India' },
  ];

  private cropKeywords = {
    'rice': ['rice', 'paddy', 'chawal', 'dhan'],
    'wheat': ['wheat', 'gehun', 'gahu'],
    'cotton': ['cotton', 'kapas', 'ruyi'],
    'sugarcane': ['sugarcane', 'ganna', 'sugar'],
    'maize': ['maize', 'corn', 'makka', 'bhutta'],
    'soybean': ['soybean', 'soya', 'bhatmas'],
    'groundnut': ['groundnut', 'peanut', 'moongfali'],
    'millet': ['millet', 'bajra', 'jowar', 'ragi']
  };

  /**
   * Search for agricultural locations based on query
   */
  async searchLocations(query: string, options: {
    maxResults?: number;
    focusOnAgricultural?: boolean;
    includeUrban?: boolean;
  } = {}): Promise<SearchResult[]> {
    const {
      maxResults = 10,
      focusOnAgricultural = true,
      includeUrban = false
    } = options;

    if (!query || query.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // 1. Search agricultural centers
    this.agriculturalCenters.forEach(location => {
      const relevance = this.calculateRelevance(location, lowerQuery);
      if (relevance > 0) {
        results.push({
          location,
          relevance,
          type: 'agricultural',
          description: `Agricultural center in ${location.state}`
        });
      }
    });

    // 2. Add crop-specific search results
    const cropResults = this.searchByCropType(lowerQuery);
    results.push(...cropResults);

    // 3. Sort by relevance and limit results
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results.slice(0, maxResults);
  }

  /**
   * Calculate relevance score for a location
   */
  private calculateRelevance(location: Location, query: string): number {
    let score = 0;
    
    // Exact name match (highest priority)
    if (location.name.toLowerCase() === query) {
      score += 100;
    }
    // Name starts with query
    else if (location.name.toLowerCase().startsWith(query)) {
      score += 80;
    }
    // Name contains query
    else if (location.name.toLowerCase().includes(query)) {
      score += 60;
    }
    
    // District match
    if (location.district?.toLowerCase().includes(query)) {
      score += 40;
    }
    
    // State match
    if (location.state?.toLowerCase().includes(query)) {
      score += 20;
    }
    
    // Boost score for agricultural keywords
    const agriculturalKeywords = [
      'farm', 'krishi', 'agri', 'kisan', 'field', 'crop',
      'wheat', 'rice', 'cotton', 'sugarcane', 'maize'
    ];
    
    for (const keyword of agriculturalKeywords) {
      if (query.includes(keyword)) {
        score += 15;
        break;
      }
    }
    
    return score;
  }

  /**
   * Search locations by crop type
   */
  private searchByCropType(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const [crop, keywords] of Object.entries(this.cropKeywords)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          // Find locations suitable for this crop
          const suitableLocations = this.getLocationsForCrop(crop);
          
          suitableLocations.forEach(location => {
            results.push({
              location,
              relevance: 70,
              type: 'agricultural',
              description: `Suitable for ${crop} cultivation`
            });
          });
          
          break; // Found match for this crop
        }
      }
    }
    
    return results;
  }

  /**
   * Get locations suitable for specific crops
   */
  private getLocationsForCrop(crop: string): Location[] {
    const cropRegions: { [key: string]: string[] } = {
      'rice': ['Punjab', 'Haryana', 'Uttar Pradesh', 'West Bengal', 'Andhra Pradesh', 'Tamil Nadu'],
      'wheat': ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan'],
      'cotton': ['Gujarat', 'Maharashtra', 'Andhra Pradesh', 'Punjab', 'Haryana'],
      'sugarcane': ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu'],
      'maize': ['Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Madhya Pradesh'],
      'soybean': ['Madhya Pradesh', 'Maharashtra', 'Rajasthan'],
      'groundnut': ['Gujarat', 'Andhra Pradesh', 'Tamil Nadu', 'Karnataka'],
      'millet': ['Rajasthan', 'Gujarat', 'Maharashtra', 'Karnataka']
    };

    const suitableStates = cropRegions[crop] || [];
    
    return this.agriculturalCenters.filter(location => 
      suitableStates.includes(location.state || '')
    ).slice(0, 5); // Limit to top 5 locations per crop
  }

  /**
   * Get popular agricultural locations
   */
  getPopularLocations(): SearchResult[] {
    const popular = [
      'Ludhiana', 'Nashik', 'Karnal', 'Vijayawada', 
      'Coimbatore', 'Belgaum', 'Rajkot', 'Indore'
    ];

    return this.agriculturalCenters
      .filter(location => popular.includes(location.name))
      .map(location => ({
        location,
        relevance: 90,
        type: 'agricultural' as const,
        description: `Popular agricultural center`
      }));
  }

  /**
   * Get locations by state
   */
  getLocationsByState(stateName: string): SearchResult[] {
    return this.agriculturalCenters
      .filter(location => 
        location.state?.toLowerCase().includes(stateName.toLowerCase())
      )
      .map(location => ({
        location,
        relevance: 85,
        type: 'agricultural' as const,
        description: `Agricultural center in ${location.state}`
      }));
  }

  /**
   * Get nearby agricultural locations
   */
  getNearbyLocations(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 100
  ): SearchResult[] {
    return this.agriculturalCenters
      .map(location => {
        const distance = this.calculateDistance(
          latitude, longitude,
          location.latitude, location.longitude
        );
        
        if (distance <= radiusKm) {
          return {
            location,
            relevance: Math.max(10, 100 - distance), // Higher relevance for closer locations
            type: 'agricultural' as const,
            description: `${distance.toFixed(0)}km away`
          };
        }
        return null;
      })
      .filter((result): result is SearchResult => result !== null)
      .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// Create singleton instance
const locationSearchService = new LocationSearchService();
export default locationSearchService;

// Export types
export type { SearchResult };