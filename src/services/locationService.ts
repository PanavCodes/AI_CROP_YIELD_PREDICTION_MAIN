// Location detection service with geolocation API and fallbacks
import { Location, LocationDetectionResult } from '../types/weather';

class LocationService {
  private cachedLocation: Location | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private lastCacheTime: number = 0;

  /**
   * Detect user's location using multiple methods
   */
  async detectLocation(): Promise<LocationDetectionResult> {
    // Try cached location first
    const cachedResult = this.getCachedLocation();
    if (cachedResult.success) {
      return cachedResult;
    }

    // Try GPS location
    const gpsResult = await this.getGPSLocation();
    if (gpsResult.success) {
      this.cacheLocation(gpsResult.location!);
      return gpsResult;
    }

    // Try IP-based location as fallback
    const ipResult = await this.getIPLocation();
    if (ipResult.success) {
      this.cacheLocation(ipResult.location!);
      return ipResult;
    }

    // All methods failed
    return {
      success: false,
      error: 'Unable to detect location. Please enter manually.',
      method: 'manual'
    };
  }

  /**
   * Get location using browser's Geolocation API
   */
  private async getGPSLocation(): Promise<LocationDetectionResult> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: 'Geolocation is not supported by this browser',
          method: 'gps'
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get location details
            const locationDetails = await this.reverseGeocode(latitude, longitude);
            
            resolve({
              success: true,
              location: {
                latitude,
                longitude,
                ...locationDetails
              },
              method: 'gps'
            });
          } catch (error) {
            // Even if reverse geocoding fails, we have coordinates
            resolve({
              success: true,
              location: {
                latitude,
                longitude,
                name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              },
              method: 'gps'
            });
          }
        },
        (error) => {
          let errorMessage = 'Location access denied';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }

          resolve({
            success: false,
            error: errorMessage,
            method: 'gps'
          });
        },
        options
      );
    });
  }

  /**
   * Get approximate location using IP address
   */
  private async getIPLocation(): Promise<LocationDetectionResult> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        throw new Error('IP location service unavailable');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.reason || 'IP location failed');
      }

      return {
        success: true,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          district: data.city,
          state: data.region,
          country: data.country_name,
          name: `${data.city}, ${data.region}`
        },
        method: 'ip'
      };
    } catch (error) {
      return {
        success: false,
        error: `IP location failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        method: 'ip'
      };
    }
  }

  /**
   * Reverse geocode coordinates to get location details
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<Partial<Location>> {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      const address = data.address || {};

      return {
        district: address.city || address.town || address.village || address.county,
        village: address.village || address.hamlet,
        state: address.state,
        country: address.country,
        name: data.display_name?.split(',')[0] || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {};
    }
  }

  /**
   * Search for locations by name (for manual entry)
   */
  async searchLocations(query: string): Promise<Location[]> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`
      );

      if (!response.ok) {
        throw new Error('Location search failed');
      }

      const data = await response.json();

      return data.map((item: any) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        district: item.address?.city || item.address?.town || item.address?.village,
        village: item.address?.village || item.address?.hamlet,
        state: item.address?.state,
        country: item.address?.country,
        name: item.display_name.split(',')[0]
      }));
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  }

  /**
   * Get cached location if still valid
   */
  private getCachedLocation(): LocationDetectionResult {
    const now = Date.now();
    
    if (
      this.cachedLocation && 
      this.lastCacheTime && 
      (now - this.lastCacheTime) < this.CACHE_DURATION
    ) {
      return {
        success: true,
        location: this.cachedLocation,
        method: 'cached'
      };
    }

    return {
      success: false,
      error: 'No valid cached location',
      method: 'cached'
    };
  }

  /**
   * Cache location data
   */
  private cacheLocation(location: Location): void {
    this.cachedLocation = location;
    this.lastCacheTime = Date.now();
    
    try {
      localStorage.setItem('userLocation', JSON.stringify({
        location,
        timestamp: this.lastCacheTime
      }));
    } catch (error) {
      console.warn('Failed to cache location:', error);
    }
  }

  /**
   * Load cached location from storage
   */
  loadCachedLocation(): void {
    try {
      const cached = localStorage.getItem('userLocation');
      if (cached) {
        const { location, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        if ((now - timestamp) < this.CACHE_DURATION) {
          this.cachedLocation = location;
          this.lastCacheTime = timestamp;
        } else {
          // Remove expired cache
          localStorage.removeItem('userLocation');
        }
      }
    } catch (error) {
      console.warn('Failed to load cached location:', error);
    }
  }

  /**
   * Clear cached location
   */
  clearCache(): void {
    this.cachedLocation = null;
    this.lastCacheTime = 0;
    localStorage.removeItem('userLocation');
  }

  /**
   * Calculate distance between two locations (in km)
   */
  calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
export const locationService = new LocationService();

// Initialize cached location on import
locationService.loadCachedLocation();

export default locationService;
