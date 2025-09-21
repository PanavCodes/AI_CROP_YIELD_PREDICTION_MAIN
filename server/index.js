// Simple Express server for Bhuvan reverse geocoding API proxy
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory cache for reverse geocoding results (in production, use Redis)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to create cache key from coordinates
function getCacheKey(lat, lng) {
  // Round to 4 decimal places for caching (~11m precision)
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `${roundedLat},${roundedLng}`;
}

// Bhuvan reverse geocoding endpoint
app.post('/api/geocode/bhuvan', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const cacheKey = getCacheKey(latitude, longitude);
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Cache hit for ${cacheKey}`);
        return res.json({
          success: true,
          ...cached.data,
          source: 'cache',
        });
      } else {
        cache.delete(cacheKey);
      }
    }

    // Call Bhuvan API
    const bhuvanApiKey = process.env.BHUVAN_API_KEY;
    if (!bhuvanApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Bhuvan API key not configured',
      });
    }

    // Construct Bhuvan API URL
    // Note: Replace this URL with the actual Bhuvan reverse geocoding endpoint
    const bhuvanUrl = `https://bhuvan-app1.nrsc.gov.in/bhuvan/bhuvan2d/mapviewer/api/reverse?lat=${latitude}&lon=${longitude}&key=${bhuvanApiKey}`;
    
    console.log(`Calling Bhuvan API for ${latitude}, ${longitude}`);
    
    const bhuvanResponse = await axios.get(bhuvanUrl, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'CropPredictionApp/1.0',
      },
    });

    if (bhuvanResponse.status === 200 && bhuvanResponse.data) {
      const data = bhuvanResponse.data;
      
      // Parse Bhuvan response (adjust based on actual API response format)
      const result = {
        village: data.village || data.VILLAGE || data.vill,
        district: data.district || data.DISTRICT || data.dist,
        state: data.state || data.STATE || data.st,
      };

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return res.json({
        success: true,
        ...result,
        source: 'bhuvan',
      });
    } else {
      throw new Error('Invalid response from Bhuvan API');
    }

  } catch (error) {
    console.error('Bhuvan API error:', error.message);
    
    // For development/testing, provide mock data when external API fails
    if (error.response && error.response.status === 404) {
      console.log('Bhuvan API returned 404, providing mock response for development');
      const mockResult = {
        village: 'Sample Village',
        district: 'Sample District', 
        state: 'Sample State',
      };
      
      return res.json({
        success: true,
        ...mockResult,
        source: 'mock',
        note: 'Mock data - Bhuvan API endpoint not accessible'
      });
    }
    
    // Return error response for other errors
    return res.status(500).json({
      success: false,
      error: `Bhuvan API failed: ${error.message}`,
      source: 'error',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache_size: cache.size,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Bhuvan API Key: ${process.env.BHUVAN_API_KEY ? 'Configured' : 'Not configured'}`);
});
