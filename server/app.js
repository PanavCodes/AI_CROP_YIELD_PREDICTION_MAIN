require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Import our services (MongoDB instead of DuckDB)
const mongoose = require('mongoose');
const MongoAnalyticsService = require('./services/mongoAnalyticsService');
const CSVProcessor = require('./services/csvProcessor');
const yieldPredictionService = require('./services/yieldPredictionService');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
let analyticsDb;
const csvProcessor = new CSVProcessor();

// Ensure required directories exist
const ensureDirectories = () => {
  const dirs = ['data', 'uploads', 'database'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Initialize MongoDB connection and analytics service
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing MongoDB connection...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crop-prediction-app';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🍃 MongoDB connected successfully');

    // Initialize analytics service
    analyticsDb = new MongoAnalyticsService();
    await analyticsDb.initialize();
    console.log('✅ MongoDB analytics service initialized');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('❌ Error details:', error.message);
    
    // Don't exit, but warn about limited functionality
    console.warn('⚠️ Continuing with limited database functionality');
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add a custom JSON serializer for BigInt values
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `crop-data-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// =============================================================================
// CSV UPLOAD AND PROCESSING ENDPOINTS
// =============================================================================

// POST /api/upload/csv - Upload and process CSV file
app.post('/api/upload/csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!analyticsDb) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available. CSV upload is disabled.' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    console.log(`📤 Received file upload: ${req.file.originalname}`);
    
    // Validate file
    const validationErrors = csvProcessor.validateFile(req.file);
    if (validationErrors.length > 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        errors: validationErrors 
      });
    }

    // Process CSV file
    const processingResult = await csvProcessor.processCSV(
      req.file.path, 
      req.file.originalname
    );
    
    // Save batch info to database
    const uploadTimestamp = Date.now();
    const batchQuery = `
      INSERT INTO upload_batches (batch_id, filename, file_size, total_rows, valid_rows, invalid_rows, processing_status, upload_timestamp)
      VALUES ('${processingResult.batchId}', '${req.file.originalname.replace(/'/g, "''") }', ${req.file.size}, ${processingResult.totalRows}, ${processingResult.validRows}, ${processingResult.invalidRows}, '${processingResult.validRows > 0 ? 'completed' : 'failed'}', ${uploadTimestamp})
    `;
    await analyticsDb.run(batchQuery);

    // Save valid records to database
    if (processingResult.processedData.length > 0) {
      console.log(`💾 Saving ${processingResult.processedData.length} records to database`);
    await analyticsDb.batchInsertCropData(processingResult.processedData);
    }
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    // Return processing results
    res.json({
      success: true,
      message: 'CSV file processed successfully',
      data: {
        batchId: processingResult.batchId,
        filename: processingResult.filename,
        totalRows: processingResult.totalRows,
        validRows: processingResult.validRows,
        invalidRows: processingResult.invalidRows,
        summary: processingResult.summary,
        errors: processingResult.errors.slice(0, 10) // Limit errors shown
      }
    });
    
  } catch (error) {
    console.error('❌ CSV upload failed:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'CSV processing failed',
      message: error.message
    });
  }
});

// GET /api/crop-data - Get crop data with filtering and pagination
app.get('/api/crop-data', async (req, res) => {
  try {
    if (!analyticsDb) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }
    
    const {
      crop_type,
      state,
      district,
      upload_batch_id,
      limit = 100,
      offset = 0
    } = req.query;
    
    const filters = {};
    if (crop_type) filters.crop_type = crop_type;
    if (state) filters.state = state;
    if (district) filters.district = district;
    if (upload_batch_id) filters.upload_batch_id = upload_batch_id;
    
    const data = await analyticsDb.getCropData(filters, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to retrieve crop data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve crop data' 
    });
  }
});

// Chatbot: Gemini proxy endpoint (keeps API key on the server)
app.post('/api/chat/gemini', async (req, res) => {
  console.log('📞 Gemini API endpoint called at:', new Date().toISOString());
  console.log('📞 Request body:', JSON.stringify(req.body, null, 2));
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not configured');
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY not configured on server' });
    }

    const { history } = req.body || {};
    
    // Handle empty history for initial requests
    let contents = [];
    if (Array.isArray(history) && history.length > 0) {
      // Map frontend format to Gemini format
      contents = history.map(item => ({
        role: item.role === 'model' ? 'model' : 'user',
        parts: item.parts || [{ text: '' }]
      }));
    } else {
      // If no history, create a default request
      console.log('⚠️ Empty or invalid history, using default request');
      contents = [{
        role: 'user',
        parts: [{ text: 'Hello, I need help with farming advice.' }]
      }];
    }

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    console.log('📤 Sending to Gemini:', JSON.stringify({ contents }, null, 2));
    const payload = { contents };
    const response = await axios.post(url, payload, { 
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30 second timeout
    });

    const data = response.data;
    let text = '';
    if (data?.candidates?.length && data.candidates[0]?.content?.parts?.length) {
      text = data.candidates[0].content.parts[0].text || '';
    }

    return res.json({ success: true, text });
  } catch (err) {
    const status = err.response?.status || 500;
    if (status === 429) {
      return res.status(429).json({ success: false, error: 'Rate limited by Gemini API' });
    }
    console.error('❌ Gemini proxy error:', err.message);
    if (err.response?.data) {
      console.error('❌ Gemini API response data:', JSON.stringify(err.response.data, null, 2));
    }
    return res.status(500).json({ success: false, error: 'Gemini proxy error', details: err.message });
  }
});

// GET /api/crop-data/statistics - Get database statistics
app.get('/api/crop-data/statistics', async (req, res) => {
  try {
    if (!analyticsDb) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }
    
    const stats = await analyticsDb.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Failed to get statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve statistics' 
    });
  }
});

// =============================================================================
// YIELD PREDICTION ENDPOINT
// =============================================================================

// POST /api/yield-prediction - Predict crop yield using ML model
app.post('/api/yield-prediction', async (req, res) => {
  try {
    console.log('🔮 Yield prediction request received:', req.body);
    
    const {
      crop,
      state,
      year,
      rainfall,
      temperature,
      pesticides_tonnes,
      areaHectare
    } = req.body;

    // Basic validation
    if (!crop || !state || !year || rainfall === undefined || temperature === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: crop, state, year, rainfall, temperature'
      });
    }

    // Get user email from session/auth (for now, use a default or from headers)
    const userEmail = req.headers['user-email'] || 'default@example.com';
    
    // Call yield prediction service
    const prediction = await yieldPredictionService.predictYield(userEmail, {
      crop,
      state,
      year: parseInt(year),
      rainfall: parseFloat(rainfall),
      temperature: parseFloat(temperature),
      pesticides_tonnes: parseFloat(pesticides_tonnes) || 0.0,
      areaHectare: parseFloat(areaHectare) || 1.0
    });

    res.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Yield prediction endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Yield prediction failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =============================================================================
// EXISTING FIELD DATA ENDPOINTS (keep for compatibility)
// =============================================================================
const getSoilDataForLocation = (lat, lng) => {
  // This would be a real spatial lookup in production
  // For hackathon, return realistic mock data based on India regions
  
  const soilTypes = ['Loamy', 'Clay', 'Sandy', 'Black Cotton', 'Red Laterite', 'Alluvial'];
  const randomSoilType = soilTypes[Math.floor(lat * lng) % soilTypes.length];
  
  // Generate realistic soil data based on location
  const mockSoil = {
    soil_type: randomSoilType,
    soil_depth: Math.random() > 0.5 ? '50-100 cm' : '100-150 cm',
    ph: Math.round((6.0 + Math.random() * 2.0) * 10) / 10, // 6.0-8.0
    organic_carbon: Math.round((0.5 + Math.random() * 1.0) * 100) / 100, // 0.5-1.5
    nitrogen: Math.round(60 + Math.random() * 40), // 60-100
    phosphorus: Math.round(20 + Math.random() * 30), // 20-50
    potassium: Math.round(30 + Math.random() * 30), // 30-60
    source: 'NBSS-Mock',
    confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100
  };
  
  return mockSoil;
};

// Land use classification (mock for hackathon)
const getLandUseForLocation = async (lat, lng) => {
  try {
    // In real implementation, call Bhuvan LULC API
    // For hackathon, return mock based on coordinates
    const landUseTypes = ['Cropland', 'Forest', 'Grassland', 'Urban', 'Water Body'];
    const primaryClass = landUseTypes[Math.floor(Math.abs(lat + lng)) % landUseTypes.length];
    
    return {
      class: primaryClass,
      coverage_percent: Math.round((75 + Math.random() * 20) * 10) / 10,
      source: 'Bhuvan-Mock',
      confidence: Math.round((0.6 + Math.random() * 0.3) * 100) / 100
    };
  } catch (error) {
    console.warn('Land use lookup failed:', error);
    return {
      class: 'Cropland',
      coverage_percent: 80.0,
      source: 'fallback',
      confidence: 0.5
    };
  }
};

// Bhuvan reverse geocoding
const getBhuvanLocation = async (lat, lng) => {
  try {
    const response = await axios.get('https://bhuvan-vec1.nrsc.gov.in/bhuvan/wfs', {
      params: {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'VILLAGE_11',
        outputFormat: 'application/json',
        CQL_FILTER: `INTERSECTS(geom, POINT(${lng} ${lat}))`
      },
      timeout: 5000
    });

    if (response.data && response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      const props = feature.properties;
      
      return {
        village: props.NAME || undefined,
        district: props.DISTRICT || undefined,
        state: props.STATE || undefined,
        source: 'bhuvan',
        confidence: 0.9,
        fetched_at: new Date().toISOString()
      };
    }
    
    throw new Error('No features found');
  } catch (error) {
    console.warn('Bhuvan reverse geocoding failed:', error);
    
    // Fallback to mock Indian locations
    const mockStates = ['Maharashtra', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Karnataka', 'Gujarat'];
    const mockDistricts = ['Mumbai', 'Pune', 'Ludhiana', 'Chandigarh', 'Bangalore', 'Ahmedabad'];
    
    return {
      village: undefined,
      district: mockDistricts[Math.floor(Math.abs(lat + lng)) % mockDistricts.length],
      state: mockStates[Math.floor(Math.abs(lat * lng)) % mockStates.length],
      source: 'mock',
      confidence: 0.6,
      fetched_at: new Date().toISOString()
    };
  }
};

// Main API endpoint for field data aggregation
app.post('/api/fields/ingest-location', async (req, res) => {
  try {
    const { field_id, geometry } = req.body;
    
    if (!geometry || geometry.type !== 'Point') {
      return res.status(400).json({ error: 'Point geometry required' });
    }
    
    const [lng, lat] = geometry.coordinates;
    
    console.log(`Processing field location: ${lat}, ${lng}`);
    
    // Parallel data fetching for better performance
    const [locationData, landUseData] = await Promise.all([
      getBhuvanLocation(lat, lng),
      getLandUseForLocation(lat, lng)
    ]);
    
    // Get soil data (synchronous for mock)
    const soilData = getSoilDataForLocation(lat, lng);
    
    const result = {
      field_id,
      location: locationData,
      land_use: landUseData,
      soil: soilData,
      processed_at: new Date().toISOString(),
      data_sources: ['bhuvan', 'nbss-mock', 'lulc-mock']
    };
    
    console.log('Field data aggregated successfully:', result);
    res.json(result);
    
  } catch (error) {
    console.error('Error processing field location:', error);
    res.status(500).json({ 
      error: 'Failed to process field location',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Field Data API',
    database: analyticsDb ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
    version: '1.0.0-hackathon'
  });
});

// Bhuvan reverse geocoding proxy (existing functionality)
app.get('/api/geocode/bhuvan', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const locationData = await getBhuvanLocation(parseFloat(lat), parseFloat(lon));
    
    res.json({
      success: true,
      village: locationData.village,
      district: locationData.district,
      state: locationData.state,
      source: locationData.source
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Initialize and start server
const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');
    ensureDirectories();
    
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.error('❌ Database initialization failed:', dbError.message);
      console.log('🔄 Attempting to continue without database (some features may be limited)');
      // Set db to null so other parts know database is not available
      analyticsDb = null;
    }
    
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Crop Data Processing Server Started!');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🗄️ Database status: ${analyticsDb ? '✅ Connected' : '❌ Not available'}`);
      console.log('');
      console.log('📋 Available Endpoints:');
      console.log(`   📤 Upload CSV: POST /api/upload/csv ${analyticsDb ? '' : '(disabled)'}`);
      console.log(`   📊 Get Data:   GET /api/crop-data ${analyticsDb ? '' : '(disabled)'}`);
      console.log(`   📈 Statistics: GET /api/crop-data/statistics ${analyticsDb ? '' : '(disabled)'}`);
      console.log(`   📍 Field Data: POST /api/fields/ingest-location`);
      console.log(`   💚 Health:     GET /api/health`);
      console.log(`   🌍 Bhuvan:     GET /api/geocode/bhuvan`);
      console.log('');
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error details:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    console.log('\n⏸️ Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, shutting down server gracefully...`);
  
  try {
    if (analyticsDb) {
      analyticsDb.close();
      console.log('🗄️ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
  
  console.log('✅ Server shutdown complete');
  process.exit(0);
};

// Handle multiple shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

startServer();

module.exports = app;
