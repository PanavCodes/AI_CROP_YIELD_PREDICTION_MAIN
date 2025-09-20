// Weather service with API integration and caching
import { 
  WeatherData, 
  Location, 
  CurrentWeather, 
  DailyForecast, 
  WeatherCache,
  WeatherAPIConfig,
  WeatherAlert
} from '../types/weather';

class WeatherService {
  private cache: WeatherCache = {};
  private config: WeatherAPIConfig;

  constructor() {
    // Initialize config in constructor to avoid method call before construction
    this.config = {
      provider: (import.meta.env.VITE_WEATHER_PROVIDER as any) || 'weatherapi',
      apiKey: (import.meta.env.VITE_WEATHER_API_KEY as string) || 'demo_key',
      baseUrl: this.getBaseUrl(),
      cacheDuration: parseInt((import.meta.env.VITE_WEATHER_CACHE_DURATION as string) || '12')
    };
    
    this.loadCacheFromStorage();
  }

  private getBaseUrl(): string {
    const provider = (import.meta.env.VITE_WEATHER_PROVIDER as string) || 'weatherapi';
    switch (provider) {
      case 'openweathermap':
        return 'https://api.openweathermap.org/data/2.5';
      case 'weatherapi':
        return 'https://api.weatherapi.com/v1';
      case 'tomorrow':
        return 'https://api.tomorrow.io/v4';
      default:
        return 'https://api.weatherapi.com/v1';
    }
  }

  /**
   * Get weather data for a location with caching
   */
  async getWeatherData(location: Location): Promise<WeatherData> {
    const locationKey = this.getLocationKey(location);
    
    // Check cache first
    const cachedData = this.getCachedWeather(locationKey);
    if (cachedData && !this.isCacheExpired(cachedData)) {
      console.log('Returning cached weather data for', locationKey);
      return cachedData;
    }

    try {
      // Fetch fresh data from API
      console.log('Fetching fresh weather data for', locationKey);
      const weatherData = await this.fetchWeatherFromAPI(location);
      
      // Cache the data
      this.cacheWeatherData(locationKey, weatherData);
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      
      // Return cached data even if expired, as fallback
      if (cachedData) {
        console.log('Returning expired cached data as fallback');
        return cachedData;
      }
      
      throw new Error('Unable to fetch weather data');
    }
  }

  /**
   * Fetch weather data from weather API
   */
  private async fetchWeatherFromAPI(location: Location): Promise<WeatherData> {
    const { latitude, longitude } = location;
    
    if (this.config.provider === 'weatherapi') {
      return this.fetchFromWeatherAPI(latitude, longitude, location);
    } else if (this.config.provider === 'openweathermap') {
      return this.fetchFromOpenWeatherMap(latitude, longitude, location);
    } else {
      throw new Error(`Unsupported weather provider: ${this.config.provider}`);
    }
  }

  /**
   * Fetch from WeatherAPI.com
   */
  private async fetchFromWeatherAPI(latitude: number, longitude: number, location: Location): Promise<WeatherData> {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(
        `${this.config.baseUrl}/current.json?key=${this.config.apiKey}&q=${latitude},${longitude}&aqi=no`
      ),
      fetch(
        `${this.config.baseUrl}/forecast.json?key=${this.config.apiKey}&q=${latitude},${longitude}&days=7&aqi=no&alerts=yes`
      )
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('WeatherAPI request failed');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    return this.transformWeatherAPIResponse(location, currentData, forecastData);
  }

  /**
   * Fetch from OpenWeatherMap
   */
  private async fetchFromOpenWeatherMap(latitude: number, longitude: number, location: Location): Promise<WeatherData> {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(
        `${this.config.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.config.apiKey}&units=metric`
      ),
      fetch(
        `${this.config.baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${this.config.apiKey}&units=metric`
      )
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('OpenWeatherMap API request failed');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    return this.transformOpenWeatherMapResponse(location, currentData, forecastData);
  }

  /**
   * Transform WeatherAPI.com response to our weather data format
   */
  private transformWeatherAPIResponse(
    location: Location, 
    currentData: any, 
    forecastData: any
  ): WeatherData {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.config.cacheDuration * 60 * 60 * 1000).toISOString();

    // Transform current weather from WeatherAPI
    const current: CurrentWeather = {
      temperature: Math.round(currentData.current.temp_c),
      feelsLike: Math.round(currentData.current.feelslike_c),
      humidity: currentData.current.humidity,
      rainfall: currentData.current.precip_mm || 0,
      windSpeed: Math.round(currentData.current.wind_kph),
      windDirection: this.getWindDirection(currentData.current.wind_degree),
      pressure: currentData.current.pressure_mb,
      visibility: currentData.current.vis_km,
      uvIndex: currentData.current.uv || 0,
      condition: currentData.current.condition.text,
      conditionCode: currentData.current.condition.code.toString(),
      sunrise: forecastData.forecast.forecastday[0].astro.sunrise,
      sunset: forecastData.forecast.forecastday[0].astro.sunset,
      lastUpdated: now
    };

    // Transform forecast from WeatherAPI
    const forecast: DailyForecast[] = forecastData.forecast.forecastday.map((day: any) => ({
      date: day.date,
      maxTemp: Math.round(day.day.maxtemp_c),
      minTemp: Math.round(day.day.mintemp_c),
      condition: day.day.condition.text,
      conditionCode: day.day.condition.code.toString(),
      chanceOfRain: day.day.daily_chance_of_rain || 0,
      rainfall: day.day.totalprecip_mm || 0,
      humidity: day.day.avghumidity,
      windSpeed: Math.round(day.day.maxwind_kph),
      sunrise: day.astro.sunrise,
      sunset: day.astro.sunset
    }));

    // Transform alerts from WeatherAPI
    const alerts: WeatherAlert[] = forecastData.alerts?.alert?.map((alert: any) => ({
      id: alert.msgtype || 'alert',
      title: alert.event || 'Weather Alert',
      description: alert.desc || alert.instruction || 'Weather alert in effect',
      severity: this.mapAlertSeverity(alert.severity),
      startTime: alert.effective || now,
      endTime: alert.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      areas: alert.areas ? [alert.areas] : ['Current Location']
    })) || [];

    // Add generated alerts based on conditions
    alerts.push(...this.generateWeatherAlerts(current, forecast));

    return {
      location: {
        ...location,
        name: currentData.location.name || location.name
      },
      current,
      forecast,
      alerts,
      cachedAt: now,
      expiresAt
    };
  }

  /**
   * Transform OpenWeatherMap response to our weather data format
   */
  private transformOpenWeatherMapResponse(
    location: Location, 
    currentData: any, 
    forecastData: any
  ): WeatherData {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.config.cacheDuration * 60 * 60 * 1000).toISOString();

    // Transform current weather
    const current: CurrentWeather = {
      temperature: Math.round(currentData.main.temp),
      feelsLike: Math.round(currentData.main.feels_like),
      humidity: currentData.main.humidity,
      rainfall: currentData.rain?.['1h'] || 0,
      windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
      windDirection: this.getWindDirection(currentData.wind.deg),
      pressure: currentData.main.pressure,
      visibility: Math.round((currentData.visibility || 10000) / 1000), // Convert m to km
      uvIndex: 0, // Not available in free tier
      condition: this.getWeatherCondition(currentData.weather[0].main),
      conditionCode: currentData.weather[0].icon,
      sunrise: new Date(currentData.sys.sunrise * 1000).toISOString(),
      sunset: new Date(currentData.sys.sunset * 1000).toISOString(),
      lastUpdated: now
    };

    // Transform forecast (next 7 days)
    const forecast: DailyForecast[] = this.processForecastData(forecastData.list);

    // Check for weather alerts (mock for now, as OpenWeatherMap alerts require paid plan)
    const alerts: WeatherAlert[] = this.generateWeatherAlerts(current, forecast);

    return {
      location: {
        ...location,
        name: currentData.name || location.name
      },
      current,
      forecast,
      alerts,
      cachedAt: now,
      expiresAt
    };
  }

  /**
   * Process forecast data to get daily summaries
   */
  private processForecastData(forecastList: any[]): DailyForecast[] {
    const dailyData: { [date: string]: any[] } = {};

    // Group forecast data by date
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(item);
    });

    // Convert to daily forecast format
    return Object.entries(dailyData)
      .slice(0, 7) // Next 7 days
      .map(([date, dayData]) => {
        const temps = dayData.map(d => d.main.temp);
        const conditions = dayData.map(d => d.weather[0]);
        const rainfall = dayData.reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0);
        
        // Get the most common condition for the day
        const mainCondition = conditions[Math.floor(conditions.length / 2)];

        return {
          date,
          maxTemp: Math.round(Math.max(...temps)),
          minTemp: Math.round(Math.min(...temps)),
          condition: this.getWeatherCondition(mainCondition.main),
          conditionCode: mainCondition.icon,
          chanceOfRain: Math.round(dayData.filter(d => d.rain).length / dayData.length * 100),
          rainfall: Math.round(rainfall * 10) / 10,
          humidity: Math.round(dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length),
          windSpeed: Math.round(dayData.reduce((sum, d) => sum + d.wind.speed, 0) / dayData.length * 3.6),
          sunrise: new Date(dayData[0].sys?.sunrise * 1000 || Date.now()).toISOString(),
          sunset: new Date(dayData[0].sys?.sunset * 1000 || Date.now()).toISOString()
        };
      });
  }

  /**
   * Generate weather alerts based on conditions
   */
  private generateWeatherAlerts(current: CurrentWeather, forecast: DailyForecast[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];

    // High temperature alert
    if (current.temperature > 40) {
      alerts.push({
        id: 'high-temp',
        title: 'High Temperature Alert',
        description: 'Extreme heat conditions. Ensure adequate irrigation and shade for crops.',
        severity: 'severe',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        areas: ['Current Location']
      });
    }

    // Heavy rain forecast
    const heavyRainDay = forecast.find(day => day.rainfall > 25);
    if (heavyRainDay) {
      alerts.push({
        id: 'heavy-rain',
        title: 'Heavy Rain Forecast',
        description: `Heavy rainfall expected on ${heavyRainDay.date}. Prepare drainage and delay spraying.`,
        severity: 'moderate',
        startTime: new Date(heavyRainDay.date).toISOString(),
        endTime: new Date(new Date(heavyRainDay.date).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        areas: ['Forecast Area']
      });
    }

    return alerts;
  }

  /**
   * Get wind direction from degrees
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Map alert severity from API to our format
   */
  private mapAlertSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
    if (!severity) return 'moderate';
    
    const sev = severity.toLowerCase();
    if (sev.includes('extreme') || sev.includes('critical')) return 'extreme';
    if (sev.includes('severe') || sev.includes('major')) return 'severe';
    if (sev.includes('minor') || sev.includes('low')) return 'minor';
    return 'moderate';
  }

  /**
   * Get wind direction from degrees
   */
  private getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  }

  /**
   * Get weather condition in user-friendly format
   */
  private getWeatherCondition(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      'Clear': 'Clear Sky',
      'Clouds': 'Cloudy',
      'Rain': 'Rainy',
      'Drizzle': 'Light Rain',
      'Thunderstorm': 'Thunderstorm',
      'Snow': 'Snowy',
      'Mist': 'Misty',
      'Fog': 'Foggy',
      'Haze': 'Hazy'
    };
    return conditionMap[condition] || condition;
  }

  /**
   * Generate location key for caching
   */
  private getLocationKey(location: Location): string {
    return `${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`;
  }

  /**
   * Get cached weather data
   */
  private getCachedWeather(locationKey: string): WeatherData | null {
    return this.cache[locationKey] || null;
  }

  /**
   * Check if cached data is expired
   */
  private isCacheExpired(weatherData: WeatherData): boolean {
    return new Date() > new Date(weatherData.expiresAt);
  }

  /**
   * Cache weather data
   */
  private cacheWeatherData(locationKey: string, weatherData: WeatherData): void {
    this.cache[locationKey] = weatherData;
    this.saveCacheToStorage();
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const cachedData = localStorage.getItem('weatherCache');
      if (cachedData) {
        this.cache = JSON.parse(cachedData);
        
        // Clean up expired entries
        Object.keys(this.cache).forEach(key => {
          if (this.isCacheExpired(this.cache[key])) {
            delete this.cache[key];
          }
        });
      }
    } catch (error) {
      console.error('Error loading weather cache:', error);
      this.cache = {};
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('weatherCache', JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving weather cache:', error);
    }
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache = {};
    localStorage.removeItem('weatherCache');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { entries: number; totalSize: string } {
    const entries = Object.keys(this.cache).length;
    const totalSize = new Blob([JSON.stringify(this.cache)]).size;
    return {
      entries,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`
    };
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
export default weatherService;
