// Backend service for Bhuvan reverse geocoding
// Handles the server-side call to Bhuvan API with proper error handling and caching

export interface BhuvanReverseGeocodeResponse {
  village?: string;
  district?: string;
  state?: string;
  success: boolean;
  source: 'bhuvan' | 'error';
  error?: string;
}

export async function reverseGeocodeBhuvan(lat: number, lng: number): Promise<BhuvanReverseGeocodeResponse> {
  try {
    const response = await fetch('/api/geocode/bhuvan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        village: data.village,
        district: data.district,
        state: data.state,
        success: true,
        source: 'bhuvan',
      };
    } else {
      return {
        success: false,
        source: 'error',
        error: data.error || 'Unknown error from backend',
      };
    }
  } catch (error) {
    console.error('Backend reverse geocoding failed:', error);
    return {
      success: false,
      source: 'error',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export default {
  reverseGeocodeBhuvan,
};
