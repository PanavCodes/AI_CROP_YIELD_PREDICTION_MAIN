// Weather data types and interfaces for the farmer dashboard

export interface Location {
  latitude: number;
  longitude: number;
  district?: string;
  village?: string;
  state?: string;
  country?: string;
  name?: string; // Display name for the location
}

export interface CurrentWeather {
  temperature: number; // in Celsius
  feelsLike: number;
  humidity: number; // percentage
  rainfall: number; // mm in last hour
  windSpeed: number; // km/h
  windDirection: string; // N, NE, E, SE, S, SW, W, NW
  pressure: number; // hPa
  visibility: number; // km
  uvIndex: number;
  condition: string; // Clear, Cloudy, Rainy, etc.
  conditionCode: string; // for icon mapping
  sunrise: string; // ISO string
  sunset: string; // ISO string
  lastUpdated: string; // ISO string
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  maxTemp: number;
  minTemp: number;
  condition: string;
  conditionCode: string;
  chanceOfRain: number; // percentage
  rainfall: number; // mm
  humidity: number; // percentage
  windSpeed: number; // km/h
  sunrise: string;
  sunset: string;
}

export interface WeatherData {
  location: Location;
  current: CurrentWeather;
  forecast: DailyForecast[];
  alerts?: WeatherAlert[];
  cachedAt: string; // ISO string
  expiresAt: string; // ISO string
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  startTime: string;
  endTime: string;
  areas: string[];
}

export interface CropWeatherAdvice {
  cropType: string;
  advice: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  timeframe: string; // e.g., "next 24 hours", "in 2-3 days"
}

export interface WeatherCache {
  [locationKey: string]: WeatherData;
}

export interface LocationDetectionResult {
  success: boolean;
  location?: Location;
  error?: string;
  method: 'gps' | 'manual' | 'ip' | 'cached';
}

// Weather API configuration
export interface WeatherAPIConfig {
  provider: 'openweathermap' | 'weatherapi' | 'tomorrow' | 'google';
  apiKey: string;
  googleApiKey?: string; // For Google-enhanced services
  baseUrl: string;
  cacheDuration: number; // hours
}

// User location preferences
export interface UserLocationPreference {
  userId: string;
  primaryLocation: Location;
  fieldLocations: Location[];
  autoDetect: boolean;
  lastUpdated: string;
}
