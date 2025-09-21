// Integrated Location Service
// Combines Google Maps for location selection with Bhuvan API for enhanced field information
// Provides fallbacks and comprehensive location data for agricultural applications

import { Location } from '../types/weather';
import { reverseGeocodeBhuvan } from './backendService';
import { reverseGeocodeAdmin } from './bhuvanService';
import locationService from './locationService';
import bhuvanLulcService, { LulcResponse } from './bhuvanLulcService';

export interface FieldLocationData {
  // Basic location info
  coordinates: {
    latitude: number;
    longitude: number;
  };
  
  // Administrative details (from Bhuvan/OSM)
  administrative: {
    village?: string;
    district?: string;
    state?: string;
    country?: string;
    source: 'bhuvan' | 'proxy' | 'nominatim' | 'google' | 'mock';
  };
  
  // Enhanced location info (from Google Places if available)
  places?: {
    formatted_address?: string;
    place_id?: string;
    types?: string[];
    components?: {
      locality?: string;
      administrative_area_level_1?: string;
      administrative_area_level_2?: string;
      administrative_area_level_3?: string;
      country?: string;
      postal_code?: string;
    };
  };
  
  // Field-specific enhancements
  field: {
    suggested_name: string;
    location_quality: 'excellent' | 'good' | 'basic' | 'limited';
    is_agricultural_area: boolean;
    agricultural_suitability_score?: number;
    nearby_landmarks?: string[];
  };
  
  // Land use classification (from Bhuvan LULC API)
  land_use?: {
    classification: LulcResponse;
    suitability_score: number;
    recommendations: {
      recommended: boolean;
      reasons: string[];
      suggestions: string[];
      crop_recommendations: string[];
    };
  };
  
  // Data sources used
  sources: string[];
  timestamp: string;
}

declare global {
  interface Window {
    google: any;
  }
}

class IntegratedLocationService {
  private isGoogleMapsLoaded = false;
  private geocoder: any = null;

  /**
   * Initialize Google Maps services if available
   */
  private async initializeGoogleServices(): Promise<void> {
    if (this.isGoogleMapsLoaded && this.geocoder) return;

    try {
      if (window.google && window.google.maps) {
        this.geocoder = new window.google.maps.Geocoder();
        this.isGoogleMapsLoaded = true;
      }
    } catch (error) {
      console.warn('Google Maps services not available:', error);
    }
  }

  /**
   * Get comprehensive location data from coordinates
   */
  async getFieldLocationData(
    latitude: number, 
    longitude: number,
    options: {
      includeGooglePlaces?: boolean;
      includeBhuvanData?: boolean;
      includeLulcData?: boolean;
      generateFieldName?: boolean;
    } = {}
  ): Promise<FieldLocationData> {
    const {
      includeGooglePlaces = true,
      includeBhuvanData = true,
      includeLulcData = true,
      generateFieldName = true
    } = options;

    const sources: string[] = [];
    const timestamp = new Date().toISOString();

    // Initialize result structure
    const result: FieldLocationData = {
      coordinates: { latitude, longitude },
      administrative: {
        source: 'mock' as const
      },
      field: {
        suggested_name: '',
        location_quality: 'limited',
        is_agricultural_area: false
      },
      sources,
      timestamp
    };

    try {
      // 1. Get administrative details from Bhuvan/OSM
      if (includeBhuvanData) {
        await this.enrichWithBhuvanData(result);
      }

      // 2. Enhance with Google Places API if available
      if (includeGooglePlaces) {
        await this.enrichWithGooglePlaces(result);
      }

      // 3. Get land use classification from Bhuvan LULC API
      if (includeLulcData) {
        await this.enrichWithLulcData(result);
      }

      // 4. Generate field name suggestions
      if (generateFieldName) {
        this.generateFieldName(result);
      }

      // 5. Assess location quality
      this.assessLocationQuality(result);

      // 6. Detect agricultural areas
      this.detectAgriculturalArea(result);

    } catch (error) {
      console.error('Error in getFieldLocationData:', error);
    }

    return result;
  }

  /**
   * Enrich location data with Bhuvan API information
   */
  private async enrichWithBhuvanData(result: FieldLocationData): Promise<void> {
    try {
      // Try backend service first
      const bhuvanResult = await reverseGeocodeBhuvan(
        result.coordinates.latitude,
        result.coordinates.longitude
      );

      if (bhuvanResult.success) {
        result.administrative = {
          village: bhuvanResult.village,
          district: bhuvanResult.district,
          state: bhuvanResult.state,
          country: 'India', // Bhuvan is India-specific
          source: 'bhuvan'
        };
        result.sources.push('bhuvan-backend');
        return;
      }

      // Fallback to direct Bhuvan/OSM service
      const adminResult = await reverseGeocodeAdmin(
        result.coordinates.latitude,
        result.coordinates.longitude
      );

      result.administrative = {
        village: adminResult.village,
        district: adminResult.district,
        state: adminResult.state,
        source: adminResult.source
      };
      result.sources.push(`bhuvan-${adminResult.source}`);

    } catch (error) {
      console.warn('Failed to enrich with Bhuvan data:', error);
      result.sources.push('bhuvan-failed');
    }
  }

  /**
   * Enrich location data with Bhuvan LULC API
   */
  private async enrichWithLulcData(result: FieldLocationData): Promise<void> {
    try {
      const lulcResponse = await bhuvanLulcService.getLandUseClassification(
        result.coordinates.latitude,
        result.coordinates.longitude
      );

      if (lulcResponse.success) {
        const suitabilityScore = bhuvanLulcService.getSuitabilityScore(lulcResponse.primary_class);
        const recommendations = bhuvanLulcService.getAgriculturalRecommendations(lulcResponse.primary_class);

        result.land_use = {
          classification: lulcResponse,
          suitability_score: suitabilityScore,
          recommendations
        };

        result.field.agricultural_suitability_score = suitabilityScore;
        result.sources.push(`lulc-${lulcResponse.source}`);

        // Update agricultural area detection based on LULC classification
        if (lulcResponse.primary_class.agricultural_suitability === 'excellent' || 
            lulcResponse.primary_class.agricultural_suitability === 'good') {
          result.field.is_agricultural_area = true;
        }
      } else {
        result.sources.push('lulc-failed');
      }
    } catch (error) {
      console.warn('Failed to enrich with LULC data:', error);
      result.sources.push('lulc-error');
    }
  }

  /**
   * Enrich location data with Google Places API
   */
  private async enrichWithGooglePlaces(result: FieldLocationData): Promise<void> {
    try {
      await this.initializeGoogleServices();

      if (!this.geocoder) {
        result.sources.push('google-places-unavailable');
        return;
      }

      return new Promise((resolve) => {
        this.geocoder.geocode(
          {
            location: {
              lat: result.coordinates.latitude,
              lng: result.coordinates.longitude
            }
          },
          (results: any[], status: string) => {
            if (status === 'OK' && results && results.length > 0) {
              const place = results[0];
              
              result.places = {
                formatted_address: place.formatted_address,
                place_id: place.place_id,
                types: place.types || []
              };

              // Extract components
              const components: any = {};
              place.address_components?.forEach((component: any) => {
                const types = component.types;
                if (types.includes('locality')) {
                  components.locality = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                  components.administrative_area_level_1 = component.long_name;
                }
                if (types.includes('administrative_area_level_2')) {
                  components.administrative_area_level_2 = component.long_name;
                }
                if (types.includes('administrative_area_level_3')) {
                  components.administrative_area_level_3 = component.long_name;
                }
                if (types.includes('country')) {
                  components.country = component.long_name;
                }
                if (types.includes('postal_code')) {
                  components.postal_code = component.long_name;
                }
              });

              result.places.components = components;

              // Enhance administrative data if not already available
              if (!result.administrative.district && components.administrative_area_level_2) {
                result.administrative.district = components.administrative_area_level_2;
              }
              if (!result.administrative.state && components.administrative_area_level_1) {
                result.administrative.state = components.administrative_area_level_1;
              }
              if (!result.administrative.country && components.country) {
                result.administrative.country = components.country;
              }

              result.sources.push('google-places');
            } else {
              result.sources.push('google-places-failed');
            }
            resolve();
          }
        );
      });

    } catch (error) {
      console.warn('Failed to enrich with Google Places:', error);
      result.sources.push('google-places-error');
    }
  }

  /**
   * Generate suggested field names based on available data
   */
  private generateFieldName(result: FieldLocationData): void {
    const { administrative, places, coordinates } = result;

    // Priority order for naming
    const nameCandidates: string[] = [];

    // From Bhuvan/admin data
    if (administrative.village) {
      nameCandidates.push(`${administrative.village} Field`);
    }
    if (administrative.district && administrative.village !== administrative.district) {
      nameCandidates.push(`${administrative.district} Field`);
    }

    // From Google Places
    if (places?.components?.locality) {
      nameCandidates.push(`${places.components.locality} Field`);
    }
    if (places?.components?.administrative_area_level_3) {
      nameCandidates.push(`${places.components.administrative_area_level_3} Field`);
    }

    // From state
    if (administrative.state) {
      nameCandidates.push(`${administrative.state} Field`);
    }

    // Fallback to coordinates
    if (nameCandidates.length === 0) {
      nameCandidates.push(
        `Field ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
      );
    }

    result.field.suggested_name = nameCandidates[0];
  }

  /**
   * Assess the quality of location data
   */
  private assessLocationQuality(result: FieldLocationData): void {
    let score = 0;

    // Administrative data quality
    if (result.administrative.village) score += 3;
    if (result.administrative.district) score += 2;
    if (result.administrative.state) score += 1;

    // Google Places data quality
    if (result.places?.formatted_address) score += 2;
    if (result.places?.place_id) score += 1;

    // LULC data quality
    if (result.land_use?.classification.success) {
      score += 3;
      if (result.land_use.classification.source === 'bhuvan_lulc') score += 2;
      if (result.land_use.classification.primary_class.confidence && result.land_use.classification.primary_class.confidence > 80) score += 1;
    }

    // Source reliability
    if (result.administrative.source === 'bhuvan') score += 2;
    else if (result.administrative.source === 'proxy') score += 1;

    // Determine quality level
    if (score >= 10) {
      result.field.location_quality = 'excellent';
    } else if (score >= 6) {
      result.field.location_quality = 'good';
    } else if (score >= 3) {
      result.field.location_quality = 'basic';
    } else {
      result.field.location_quality = 'limited';
    }
  }

  /**
   * Detect if location is in agricultural area
   */
  private detectAgriculturalArea(result: FieldLocationData): void {
    // Priority 1: Use LULC data if available (most accurate)
    if (result.land_use?.classification.success) {
      const classification = result.land_use.classification.primary_class;
      const suitability = classification.agricultural_suitability;
      
      // Set agricultural area based on LULC classification
      result.field.is_agricultural_area = 
        suitability === 'excellent' || 
        suitability === 'good' ||
        (suitability === 'moderate' && classification.class_name.toLowerCase().includes('crop'));
      
      // If LULC indicates agricultural area, we're confident - return early
      if (result.field.is_agricultural_area) {
        return;
      }
    }

    // Priority 2: Check Google Places types for agricultural indicators
    const agriculturalTypes = [
      'establishment',
      'point_of_interest',
      'locality',
      'sublocality'
    ];

    const urbanTypes = [
      'airport',
      'amusement_park',
      'shopping_mall',
      'university',
      'hospital',
      'school'
    ];

    if (result.places?.types) {
      const hasUrbanTypes = result.places.types.some(type => 
        urbanTypes.includes(type)
      );
      
      if (!hasUrbanTypes) {
        result.field.is_agricultural_area = true;
      }
    }

    // Priority 3: India-specific agricultural states/districts
    const agriculturalStates = [
      'Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 
      'Karnataka', 'Andhra Pradesh', 'Telangana', 'Gujarat',
      'Madhya Pradesh', 'Rajasthan', 'Tamil Nadu', 'West Bengal'
    ];

    if (result.administrative.state && 
        agriculturalStates.includes(result.administrative.state)) {
      result.field.is_agricultural_area = true;
    }

    // Priority 4: Rural indicators in village names
    const ruralKeywords = ['gram', 'gaon', 'village', 'rural'];
    if (result.administrative.village) {
      const hasRuralKeywords = ruralKeywords.some(keyword =>
        result.administrative.village!.toLowerCase().includes(keyword)
      );
      if (hasRuralKeywords) {
        result.field.is_agricultural_area = true;
      }
    }
  }

  /**
   * Search for locations using multiple services
   */
  async searchLocations(query: string, options: {
    preferBhuvan?: boolean;
    includeGooglePlaces?: boolean;
    maxResults?: number;
  } = {}): Promise<Location[]> {
    const {
      preferBhuvan = true,
      includeGooglePlaces = true,
      maxResults = 10
    } = options;

    const results: Location[] = [];

    try {
      // Use existing location service for basic search
      const basicResults = await locationService.searchLocations(query);
      results.push(...basicResults.slice(0, maxResults));

      // TODO: Add Google Places text search if needed
      // TODO: Add Bhuvan place search if available

    } catch (error) {
      console.error('Search locations error:', error);
    }

    return results;
  }

  /**
   * Convert FieldLocationData to Location format
   */
  fieldLocationToLocation(fieldData: FieldLocationData): Location {
    const { coordinates, administrative, places, field } = fieldData;

    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      name: field.suggested_name,
      district: administrative.district,
      state: administrative.state,
      country: administrative.country || 'India',
      // Additional metadata can be stored in custom properties if needed
    };
  }

  /**
   * Get current user location with enhanced data
   */
  async getCurrentLocationWithData(): Promise<FieldLocationData | null> {
    try {
      const location = await locationService.detectLocation();
      if (location.success && location.location) {
        return await this.getFieldLocationData(
          location.location.latitude,
          location.location.longitude
        );
      }
    } catch (error) {
      console.error('Failed to get current location with data:', error);
    }
    return null;
  }
}

// Create singleton instance
const integratedLocationService = new IntegratedLocationService();
export default integratedLocationService;

// Export types
export type { FieldLocationData };