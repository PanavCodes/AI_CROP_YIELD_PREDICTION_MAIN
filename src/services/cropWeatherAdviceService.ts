// Crop-specific weather advice service
import { WeatherData, CropWeatherAdvice, DailyForecast, CurrentWeather } from '../types/weather';
import { getCropData } from '../utils/cropDataUtils';

class CropWeatherAdviceService {
  /**
   * Generate crop-specific advice based on weather conditions
   */
  generateAdvice(cropType: string, weatherData: WeatherData): CropWeatherAdvice[] {
    const advice: CropWeatherAdvice[] = [];
    const cropData = getCropData(cropType);
    const { current, forecast } = weatherData;

    // Temperature-based advice
    advice.push(...this.getTemperatureAdvice(cropType, current, forecast));

    // Rainfall-based advice
    advice.push(...this.getRainfallAdvice(cropType, current, forecast));

    // Wind-based advice
    advice.push(...this.getWindAdvice(cropType, current, forecast));

    // Humidity-based advice
    advice.push(...this.getHumidityAdvice(cropType, current, forecast));

    // General seasonal advice
    advice.push(...this.getSeasonalAdvice(cropType, current, forecast));

    return advice.filter(item => item.advice.length > 0);
  }

  /**
   * Temperature-based advice
   */
  private getTemperatureAdvice(
    cropType: string, 
    current: CurrentWeather, 
    forecast: DailyForecast[]
  ): CropWeatherAdvice[] {
    const advice: CropWeatherAdvice[] = [];
    const cropData = getCropData(cropType);

    // High temperature warnings
    if (current.temperature > 40) {
      advice.push({
        cropType,
        advice: [
          'Extreme heat detected! Increase irrigation frequency',
          'Provide shade nets if possible to protect crops',
          'Avoid field work during peak hours (11 AM - 4 PM)',
          'Monitor crops for heat stress symptoms'
        ],
        priority: 'urgent',
        actionRequired: true,
        timeframe: 'immediate'
      });
    } else if (current.temperature > 35) {
      advice.push({
        cropType,
        advice: [
          'High temperature alert - ensure adequate water supply',
          'Consider early morning or evening irrigation',
          'Watch for wilting and heat stress signs'
        ],
        priority: 'high',
        actionRequired: true,
        timeframe: 'today'
      });
    }

    // Cold temperature warnings
    if (current.temperature < 10) {
      advice.push({
        cropType,
        advice: [
          'Cold weather detected - protect sensitive crops',
          'Consider frost protection measures',
          'Delay planting of warm-season crops'
        ],
        priority: 'high',
        actionRequired: true,
        timeframe: 'immediate'
      });
    }

    // Temperature forecast analysis
    const hotDays = forecast.filter(day => day.maxTemp > 38).length;
    if (hotDays >= 3) {
      advice.push({
        cropType,
        advice: [
          `${hotDays} hot days forecasted in the next week`,
          'Plan increased irrigation schedule',
          'Consider mulching to retain soil moisture'
        ],
        priority: 'medium',
        actionRequired: true,
        timeframe: 'next 7 days'
      });
    }

    return advice;
  }

  /**
   * Rainfall-based advice
   */
  private getRainfallAdvice(
    cropType: string, 
    current: CurrentWeather, 
    forecast: DailyForecast[]
  ): CropWeatherAdvice[] {
    const advice: CropWeatherAdvice[] = [];
    const cropData = getCropData(cropType);

    // Current rainfall
    if (current.rainfall > 10) {
      advice.push({
        cropType,
        advice: [
          'Heavy rainfall detected - check for waterlogging',
          'Ensure proper drainage in fields',
          'Postpone pesticide/fertilizer application'
        ],
        priority: 'high',
        actionRequired: true,
        timeframe: 'immediate'
      });
    }

    // Forecast analysis
    const rainyDays = forecast.filter(day => day.chanceOfRain > 70);
    const heavyRainDays = forecast.filter(day => day.rainfall > 25);

    if (heavyRainDays.length > 0) {
      const nextHeavyRain = heavyRainDays[0];
      const daysUntil = this.getDaysUntil(nextHeavyRain.date);
      
      advice.push({
        cropType,
        advice: [
          `Heavy rain expected in ${daysUntil} days (${nextHeavyRain.rainfall}mm)`,
          'Complete pesticide spraying before the rain',
          'Prepare drainage channels',
          'Harvest ready crops if possible'
        ],
        priority: 'high',
        actionRequired: true,
        timeframe: `in ${daysUntil} days`
      });
    } else if (rainyDays.length > 0) {
      advice.push({
        cropType,
        advice: [
          `Rain expected in ${this.getDaysUntil(rainyDays[0].date)} days`,
          'Good time to reduce irrigation',
          'Plan field activities accordingly'
        ],
        priority: 'medium',
        actionRequired: false,
        timeframe: `in ${this.getDaysUntil(rainyDays[0].date)} days`
      });
    }

    // Dry period warning
    const dryDays = forecast.filter(day => day.chanceOfRain < 20).length;
    if (dryDays >= 5) {
      advice.push({
        cropType,
        advice: [
          `${dryDays} dry days forecasted`,
          'Plan irrigation schedule carefully',
          'Consider water conservation techniques',
          'Monitor soil moisture levels'
        ],
        priority: 'medium',
        actionRequired: true,
        timeframe: 'next 7 days'
      });
    }

    return advice;
  }

  /**
   * Wind-based advice
   */
  private getWindAdvice(
    cropType: string, 
    current: CurrentWeather, 
    forecast: DailyForecast[]
  ): CropWeatherAdvice[] {
    const advice: CropWeatherAdvice[] = [];

    if (current.windSpeed > 25) {
      advice.push({
        cropType,
        advice: [
          'Strong winds detected - avoid spraying operations',
          'Check for crop damage and provide support if needed',
          'Secure farm equipment and structures'
        ],
        priority: 'high',
        actionRequired: true,
        timeframe: 'immediate'
      });
    } else if (current.windSpeed > 15) {
      advice.push({
        cropType,
        advice: [
          'Moderate winds - be cautious with pesticide spraying',
          'Use appropriate nozzles to reduce drift'
        ],
        priority: 'medium',
        actionRequired: false,
        timeframe: 'today'
      });
    }

    return advice;
  }

  /**
   * Humidity-based advice
   */
  private getHumidityAdvice(
    cropType: string, 
    current: CurrentWeather, 
    forecast: DailyForecast[]
  ): CropWeatherAdvice[] {
    const advice: CropWeatherAdvice[] = [];

    if (current.humidity > 85) {
      advice.push({
        cropType,
        advice: [
          'High humidity - increased disease risk',
          'Monitor for fungal diseases',
          'Ensure good air circulation in crops',
          'Consider preventive fungicide application'
        ],
        priority: 'medium',
        actionRequired: true,
        timeframe: 'next 2-3 days'
      });
    } else if (current.humidity < 30) {
      advice.push({
        cropType,
        advice: [
          'Low humidity - crops may need more water',
          'Increase irrigation frequency',
          'Monitor for water stress symptoms'
        ],
        priority: 'medium',
        actionRequired: true,
        timeframe: 'today'
      });
    }

    return advice;
  }

  /**
   * Seasonal and crop-specific advice
   */
  private getSeasonalAdvice(
    cropType: string, 
    current: CurrentWeather, 
    forecast: DailyForecast[]
  ): CropWeatherAdvice[] {
    const advice: CropWeatherAdvice[] = [];
    const cropData = getCropData(cropType);
    const currentMonth = new Date().getMonth() + 1;

    // Crop-specific seasonal advice
    switch (cropType.toLowerCase()) {
      case 'wheat':
        if (currentMonth >= 11 || currentMonth <= 2) { // Rabi season
          if (current.temperature > 25) {
            advice.push({
              cropType,
              advice: [
                'Wheat prefers cooler temperatures',
                'High temperature may affect grain filling',
                'Ensure adequate irrigation during grain development'
              ],
              priority: 'medium',
              actionRequired: true,
              timeframe: 'ongoing'
            });
          }
        }
        break;

      case 'rice':
        if (currentMonth >= 6 && currentMonth <= 10) { // Kharif season
          const totalRainfall = forecast.reduce((sum, day) => sum + day.rainfall, 0);
          if (totalRainfall < 20) {
            advice.push({
              cropType,
              advice: [
                'Rice needs consistent water supply',
                'Maintain 2-3 cm water level in fields',
                'Plan irrigation schedule carefully'
              ],
              priority: 'high',
              actionRequired: true,
              timeframe: 'ongoing'
            });
          }
        }
        break;

      case 'cotton':
        if (current.humidity > 80 && current.temperature > 30) {
          advice.push({
            cropType,
            advice: [
              'High humidity and temperature favor bollworm activity',
              'Monitor for pest infestation',
              'Consider integrated pest management'
            ],
            priority: 'medium',
            actionRequired: true,
            timeframe: 'next few days'
          });
        }
        break;
    }

    return advice;
  }

  /**
   * Calculate days until a given date
   */
  private getDaysUntil(dateString: string): number {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get irrigation recommendations based on weather
   */
  getIrrigationRecommendations(
    cropType: string, 
    weatherData: WeatherData
  ): { schedule: string[]; frequency: string; amount: string } {
    const { current, forecast } = weatherData;
    const cropData = getCropData(cropType);
    
    const upcomingRain = forecast.filter(day => day.chanceOfRain > 60);
    const totalRainfall = forecast.reduce((sum, day) => sum + day.rainfall, 0);

    let frequency = 'Every 2-3 days';
    let amount = 'Normal';
    const schedule: string[] = [];

    // Adjust based on weather conditions
    if (current.temperature > 35) {
      frequency = 'Daily';
      amount = 'Increased by 25%';
      schedule.push('Early morning (5-7 AM) or evening (6-8 PM)');
    } else if (upcomingRain.length > 0) {
      frequency = 'Reduce frequency';
      amount = 'Reduced';
      schedule.push(`Skip irrigation - rain expected in ${this.getDaysUntil(upcomingRain[0].date)} days`);
    } else if (totalRainfall < 10) {
      frequency = 'Every 1-2 days';
      amount = 'Normal to increased';
      schedule.push('Monitor soil moisture daily');
    }

    // Crop-specific adjustments
    if (cropData.waterRequirement === 'High') {
      schedule.push('Maintain consistent moisture levels');
    } else if (cropData.waterRequirement === 'Low') {
      schedule.push('Allow soil to dry slightly between irrigations');
    }

    return { schedule, frequency, amount };
  }
}

// Export singleton instance
export const cropWeatherAdviceService = new CropWeatherAdviceService();
export default cropWeatherAdviceService;
