# Bhuvan LULC API Integration Guide

This document provides comprehensive guidance for the Bhuvan Land Use Land Cover (LULC) API integration that provides detailed land classification data for agricultural field analysis.

## 🌍 Overview

The Bhuvan LULC API integration adds precise land use classification to the map selection feature, providing:

- **Real-time Land Use Classification**: Determines the actual land use type (cropland, forest, urban, etc.)
- **Agricultural Suitability Assessment**: Rates locations for farming potential
- **Crop Recommendations**: Suggests suitable crops based on land classification
- **Intelligent Field Detection**: Automatically identifies agricultural areas
- **Data-Driven Decision Making**: Provides confidence scores and recommendations

## 🔑 API Configuration

### API Key Setup
```bash
# Add to .env file
VITE_BHUVAN_LULC_API_KEY=7eb07b3610cff6bde6f2f119cf8372f1563ece1f
```

### API Endpoint
- **Base URL**: `https://bhuvan-app1.nrsc.gov.in/bhuvan/lulc/lulc`
- **Method**: GET
- **Parameters**: 
  - `lat`: Latitude coordinate
  - `lon`: Longitude coordinate
  - `api_key`: Your API key

## 🏗️ Architecture Integration

### Service Layer
```
BhuvanLulcService → IntegratedLocationService → GoogleMapPicker → DataInput
```

**Key Components:**
1. **BhuvanLulcService** (`src/services/bhuvanLulcService.ts`)
   - Direct API communication
   - Response parsing and validation
   - Intelligent mock data generation
   - Caching and error handling

2. **IntegratedLocationService** (`src/services/integratedLocationService.ts`)
   - Combines LULC data with other location services
   - Enhanced agricultural area detection
   - Quality assessment including LULC confidence
   - Comprehensive field data structure

3. **GoogleMapPicker** (`src/components/GoogleMapPicker.tsx`)
   - Real-time LULC data display
   - Visual indicators for land use classification
   - Agricultural suitability indicators

## 📊 LULC Classification System

### Land Use Classes
| Code | Class Name | Agricultural Suitability | Typical Crops |
|------|------------|-------------------------|---------------|
| 1 | Irrigated Cropland | Excellent | Rice, Wheat, Sugarcane, Cotton |
| 2 | Rainfed Cropland | Good | Sorghum, Millet, Pulses, Oilseeds |
| 3 | Fallow Land | Good | Any crop after preparation |
| 4 | Plantation Crops | Moderate | Tea, Coffee, Rubber, Coconut |
| 5 | Forest | Poor | N/A |
| 6 | Grassland | Moderate | Fodder crops, Grazing |
| 7 | Wetland | Moderate | Rice, Aquaculture |
| 8 | Water Bodies | Unsuitable | N/A |
| 9 | Built-up Area | Unsuitable | N/A |
| 10 | Barren Land | Poor | N/A |
| 11 | Snow/Glaciers | Unsuitable | N/A |
| 12 | Mixed Cropland | Good | Mixed cropping systems |

### Suitability Scoring
```typescript
const suitabilityMap = {
  'excellent': 95,  // Base score
  'good': 80,
  'moderate': 60,
  'poor': 30,
  'unsuitable': 5
};

// Final score includes confidence bonus
finalScore = baseScore + (confidence * 0.1)
```

## 🎯 Integration Flow

### 1. Map Click Event
```typescript
User clicks map → Coordinates captured → IntegratedLocationService called
```

### 2. LULC Data Enrichment
```typescript
async enrichWithLulcData(result: FieldLocationData) {
  // 1. Call Bhuvan LULC API
  const lulcResponse = await bhuvanLulcService.getLandUseClassification(lat, lng);
  
  // 2. Calculate suitability score
  const suitabilityScore = bhuvanLulcService.getSuitabilityScore(classification);
  
  // 3. Get recommendations
  const recommendations = bhuvanLulcService.getAgriculturalRecommendations(classification);
  
  // 4. Integrate into field data
  result.land_use = { classification, suitability_score, recommendations };
}
```

### 3. Enhanced UI Display
```typescript
// Real-time display in map picker
{fieldData.land_use?.classification.success && (
  <div>
    <span>{classification.class_name}</span>
    <span>{classification.confidence}% confidence</span>
    <span>{agricultural_suitability} for agriculture</span>
    <span>Crops: {crop_recommendations.join(', ')}</span>
  </div>
)}
```

## 🔄 Fallback Strategy

### API Response Handling
1. **Primary**: Bhuvan LULC API call
2. **Fallback**: Intelligent mock data based on geographic location
3. **Error Handling**: Graceful degradation with location-based classification

### Geographic Intelligence
```typescript
// Intelligent classification based on location
if (isInAgriculturalRegion(lat, lng)) {
  // 70% chance irrigated, 30% rainfed
  primaryClass = Math.random() > 0.3 ? 1 : 2;
} else if (isInUrbanArea(lat, lng)) {
  primaryClass = 9; // Built-up
} else if (isInForestRegion(lat, lng)) {
  primaryClass = 5; // Forest
}
```

## 🎨 UI Components

### Map Picker Display
```typescript
// Land use classification with confidence
<div className="space-y-1">
  <div className="flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
    <span>{classification.class_name}</span>
    <span>({confidence.toFixed(0)}% confidence)</span>
  </div>
  
  // Suitability indicators with emojis
  {suitability === 'excellent' && (
    <span className="text-green-600">🌟 Excellent for agriculture</span>
  )}
</div>
```

### DataInput Enhanced Display
```typescript
// Comprehensive location information
{integratedFieldData.land_use?.classification.success && (
  <div>
    <span className="font-medium">Land Use: {class_name}</span>
    <span>Recommended crops: {crop_recommendations.join(', ')}</span>
    <span>Suitability: {agricultural_suitability}</span>
  </div>
)}
```

## 📈 Data Quality Enhancement

### Location Quality Assessment
The integration enhances location quality scoring:

```typescript
// Previous scoring (max 8 points)
adminData: 6 points + googlePlaces: 3 points = 9 points max

// Enhanced with LULC (max 14 points)
adminData: 6 + googlePlaces: 3 + lulcData: 5 = 14 points max

// Quality levels updated:
- Excellent: 10+ points (was 7+)
- Good: 6-9 points (was 4-6)
- Basic: 3-5 points (was 2-3)
- Limited: <3 points
```

### Agricultural Area Detection
Priority-based detection system:

1. **LULC Classification** (Highest Priority)
   - Directly uses land use classification
   - Considers agricultural suitability levels
   - Most accurate method

2. **Google Places Types** (Medium Priority)
   - Identifies urban vs rural indicators
   - Excludes obviously non-agricultural areas

3. **Geographic Regions** (Lower Priority)
   - Uses known agricultural states/regions
   - Broad-scale classification

4. **Village Names** (Fallback)
   - Identifies rural keywords
   - Last resort classification

## 🚀 Usage Examples

### Basic LULC Query
```typescript
import bhuvanLulcService from '../services/bhuvanLulcService';

// Get land use classification
const result = await bhuvanLulcService.getLandUseClassification(30.7333, 76.7794);

console.log(result.primary_class.class_name); // "Irrigated Cropland"
console.log(result.primary_class.agricultural_suitability); // "excellent"
console.log(result.primary_class.crop_types); // ["Rice", "Wheat", "Cotton"]
```

### Integrated Service Usage
```typescript
import integratedLocationService from '../services/integratedLocationService';

const fieldData = await integratedLocationService.getFieldLocationData(
  30.7333, 76.7794, {
    includeLulcData: true,
    includeGooglePlaces: true,
    includeBhuvanData: true
  }
);

// Access LULC data
const landUse = fieldData.land_use;
console.log(landUse.classification.primary_class.class_name);
console.log(landUse.suitability_score); // 0-100
console.log(landUse.recommendations.crop_recommendations);
```

### Agricultural Recommendations
```typescript
// Get detailed recommendations
const recommendations = bhuvanLulcService.getAgriculturalRecommendations(classification);

console.log(recommendations.recommended); // true/false
console.log(recommendations.reasons); // ["Highly suitable for agriculture"]
console.log(recommendations.suggestions); // ["Maintain irrigation infrastructure"]
console.log(recommendations.crop_recommendations); // ["Rice", "Wheat"]
```

## 🔍 Testing and Validation

### Test File
Use `test-lulc-integration.html` to validate:
- Environment variable configuration
- LULC service functionality
- Integrated service responses
- UI display components

### Test Locations
- **Agricultural**: Punjab (30.7333, 76.7794) → Irrigated Cropland
- **Urban**: Delhi (28.6139, 77.2090) → Built-up Area  
- **Forest**: Western Ghats (15.3173, 75.7139) → Forest
- **Water**: Near Ganges (25.3, 83.0) → Wetland/Water Bodies

## 📊 Performance Considerations

### Caching Strategy
- **Cache Duration**: 24 hours for LULC data
- **Cache Key**: `${lat.toFixed(6)},${lng.toFixed(6)}`
- **Cache Size**: Maximum 100 entries with LRU eviction
- **Cache Validation**: Timestamp-based expiry

### API Rate Limiting
- **Timeout**: 10 seconds per request
- **Retry Strategy**: Single attempt with fallback to mock data
- **Error Handling**: Graceful degradation without user disruption

## 🔧 Troubleshooting

### Common Issues

#### LULC Data Not Loading
1. Check `VITE_BHUVAN_LULC_API_KEY` environment variable
2. Verify API key validity and permissions
3. Check browser network tab for API errors
4. Validate coordinate format (decimal degrees)

#### Incorrect Classifications
1. Verify coordinates are within India (Bhuvan coverage area)
2. Check if location is near boundaries (lower accuracy)
3. Consider seasonal variations in land use
4. Validate against satellite imagery

#### Poor Performance
1. Check cache hit rates in browser dev tools
2. Monitor API response times
3. Consider reducing concurrent requests
4. Implement request queuing if needed

### Debugging Tools
```typescript
// Enable debug logging
console.log('LULC Response:', lulcResponse);
console.log('Cache Status:', cacheKey, cached ? 'HIT' : 'MISS');
console.log('API Call Time:', Date.now() - startTime, 'ms');
```

## 🎯 Future Enhancements

### Planned Features
1. **Temporal Analysis**: Historical land use changes
2. **Seasonal Variations**: Crop calendar integration
3. **Multi-point Analysis**: Field boundary detection
4. **Precision Agriculture**: Sub-field variability mapping
5. **Crop Health Monitoring**: NDVI and other indices

### API Extensions
1. **Batch Processing**: Multiple coordinates in single request
2. **Polygon Support**: Field boundary analysis
3. **Time Series**: Historical classification data
4. **Higher Resolution**: Sub-meter accuracy classification

## 📝 Configuration Summary

### Environment Variables
```bash
# Required for LULC functionality
VITE_BHUVAN_LULC_API_KEY=7eb07b3610cff6bde6f2f119cf8372f1563ece1f

# Also required for full integration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_WEATHER_API_KEY=your_weather_api_key
```

### Service Dependencies
- **BhuvanLulcService**: Core LULC functionality
- **IntegratedLocationService**: Multi-source integration
- **GoogleMapPicker**: Interactive UI component
- **DataInput**: Form auto-population

### Data Flow
```
User Map Click → Coordinates → LULC API → Classification → 
Recommendations → UI Display → Form Population
```

This integration provides comprehensive land use intelligence for agricultural applications, enabling data-driven field selection and crop planning decisions.