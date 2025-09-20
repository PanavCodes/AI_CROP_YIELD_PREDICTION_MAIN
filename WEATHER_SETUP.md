# Weather Feature Setup Guide

## Overview
This guide explains how to set up the location-based live weather feature for the farmer dashboard.

## Features Implemented

### 🌦️ Core Weather Features
- **Auto Location Detection**: Uses browser Geolocation API with fallback options
- **Live Weather Data**: Current conditions + 7-day forecast
- **Weather Caching**: 12-24 hour cache to reduce API costs
- **Crop-Specific Advice**: Contextual recommendations based on weather and crop type
- **Multi-language Support**: English and Hindi interface

### 📍 Location Services
- **GPS Detection**: Automatic location detection via browser
- **Manual Entry**: Search and select location if GPS denied
- **Location Storage**: Saves user's primary and field locations
- **Popular Locations**: Pre-populated Indian agricultural regions

### 🌾 Smart Crop Advice
- **Weather-Based Recommendations**: Irrigation, fertilizer, pest control advice
- **Priority Levels**: Urgent, high, medium, low priority alerts
- **Crop-Specific Logic**: Different advice for wheat, rice, corn, cotton, etc.
- **Seasonal Considerations**: Rabi/Kharif season specific recommendations

## Setup Instructions

### 1. Get Weather API Key

#### Option A: OpenWeatherMap (Recommended - Free tier available)
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes: 1000 calls/day, current weather, 5-day forecast

#### Option B: WeatherAPI (Alternative)
1. Go to [WeatherAPI](https://www.weatherapi.com/)
2. Sign up for free account
3. Get API key (10,000 calls/month free)

#### Option C: Tomorrow.io (Premium option)
1. Go to [Tomorrow.io](https://www.tomorrow.io/)
2. Sign up for account
3. More accurate data but paid service

### 2. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file and add your API key:
```env
REACT_APP_WEATHER_API_KEY=your_actual_api_key_here
REACT_APP_WEATHER_PROVIDER=openweathermap
REACT_APP_WEATHER_CACHE_DURATION=12
REACT_APP_ENABLE_GPS_LOCATION=true
REACT_APP_DEFAULT_COUNTRY=IN
```

### 3. Install Dependencies (if needed)

The weather feature uses existing dependencies, but verify these are installed:

```bash
npm install
```

Required packages (should already be in package.json):
- `lucide-react` - Icons
- `framer-motion` - Animations  
- `react-i18next` - Internationalization

### 4. Test the Feature

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the dashboard
3. The weather section should appear with:
   - Current weather conditions
   - 7-day forecast
   - Crop-specific advice (if crop selected)
   - Location picker option

### 5. Location Permissions

When users first visit:
1. Browser will request location permission
2. If granted: Auto-detects location and shows weather
3. If denied: Shows manual location picker
4. Users can always change location via the picker

## File Structure

```
src/
├── types/
│   └── weather.ts                 # Weather data interfaces
├── services/
│   ├── weatherService.ts          # Weather API integration
│   ├── locationService.ts         # Location detection & search
│   └── cropWeatherAdviceService.ts # Crop-specific advice logic
├── components/
│   ├── WeatherDashboard.tsx       # Main weather display
│   └── LocationPicker.tsx         # Location selection modal
├── utils/
│   └── userUtils.ts              # Updated with location storage
├── locales/
│   └── hi/
│       └── weather.json          # Hindi translations
└── pages/
    └── Dashboard.tsx             # Updated with weather integration
```

## API Usage & Costs

### OpenWeatherMap Free Tier
- **Limit**: 1,000 calls/day
- **With Caching**: ~83 users/day (12-hour cache)
- **Cost**: Free
- **Upgrade**: $40/month for 100,000 calls

### Optimization Strategies
1. **Caching**: 12-24 hour cache reduces API calls by 95%
2. **Location Grouping**: Users in same area share cached data
3. **Smart Refresh**: Only refresh when user actively views weather
4. **Fallback Data**: Show cached data even if expired

## Troubleshooting

### Common Issues

#### 1. Weather Data Not Loading
- Check API key in `.env` file
- Verify API key is valid on provider dashboard
- Check browser console for error messages
- Ensure internet connection is working

#### 2. Location Detection Fails
- Check if HTTPS is enabled (required for GPS)
- Verify location permissions in browser
- Test manual location search as fallback
- Check console for geolocation errors

#### 3. Crop Advice Not Showing
- Ensure a crop is selected in field profile
- Check if crop type is supported in `cropDataUtils.ts`
- Verify weather data is loaded successfully
- Check browser console for JavaScript errors

#### 4. API Rate Limits
- Monitor API usage on provider dashboard
- Increase cache duration in `.env`
- Consider upgrading API plan
- Implement user-based rate limiting

### Debug Mode

Enable debug logging by setting:
```env
REACT_APP_DEBUG_WEATHER=true
```

This will log:
- API requests and responses
- Cache hits/misses
- Location detection attempts
- Crop advice generation

## Customization

### Adding New Weather Providers

1. Update `weatherService.ts`:
```typescript
// Add new provider configuration
const providers = {
  openweathermap: { /* existing config */ },
  newProvider: {
    baseUrl: 'https://api.newprovider.com',
    // Add provider-specific logic
  }
};
```

2. Implement provider-specific data transformation
3. Update environment variables
4. Test thoroughly

### Adding New Crop Types

1. Update `cropDataUtils.ts` with new crop data
2. Add crop-specific advice in `cropWeatherAdviceService.ts`
3. Update translations if needed
4. Test weather advice generation

### Customizing Advice Logic

Edit `cropWeatherAdviceService.ts` to modify:
- Temperature thresholds
- Rainfall recommendations  
- Wind speed warnings
- Humidity alerts
- Seasonal advice

## Production Deployment

### Security Checklist
- [ ] API keys in environment variables (not committed to git)
- [ ] HTTPS enabled for location services
- [ ] Rate limiting implemented
- [ ] Error handling for API failures
- [ ] Fallback data for offline scenarios

### Performance Optimization
- [ ] Implement service worker for offline caching
- [ ] Add loading states for better UX
- [ ] Optimize image assets (weather icons)
- [ ] Monitor API usage and costs
- [ ] Set up error tracking (Sentry, etc.)

### Monitoring
- Set up alerts for:
  - API rate limit approaching
  - High error rates
  - Cache miss rates
  - User location detection failures

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key and permissions
3. Test with different locations
4. Check network connectivity
5. Review this documentation

## Future Enhancements

Potential improvements:
- **Weather Alerts**: Push notifications for severe weather
- **Historical Data**: Weather trends and patterns
- **Satellite Imagery**: Visual weather maps
- **Soil Moisture**: Integration with IoT sensors
- **Precision Agriculture**: Field-level micro-weather
- **Machine Learning**: Improved crop advice algorithms
