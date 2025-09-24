require('dotenv').config();

// =============================================================================
// AGRISENSE HYBRID TECH STACK - Enhanced Server
// DuckDB (Analytics) + MongoDB (User Management) + Security + AI
// =============================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { xss } = require('express-xss-sanitizer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Import hybrid database and authentication
const { HybridDatabaseManager, Farmer, FieldProfile } = require('./database/hybridDb');
const { authenticateToken, optionalAuth, authorize, generateToken } = require('./middleware/auth');

// Import existing services
const CSVProcessor = require('./services/csvProcessor');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize hybrid database manager
const hybridDb = new HybridDatabaseManager();
let db; // DuckDB instance for analytics
const csvProcessor = new CSVProcessor();

// =============================================================================
// SECURITY MIDDLEWARE (AGRISENSE STYLE)
// =============================================================================

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { 
    success: false, 
    error: "Too many requests from this IP, please try again later." 
  }
});
app.use('/api', limiter);

// Data sanitization
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add custom JSON serializer for BigInt values (DuckDB compatibility)
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// =============================================================================
// FILE UPLOAD CONFIGURATION
// =============================================================================

// Ensure required directories exist
const ensureDirectories = () => {
  const dirs = ['data', 'uploads', 'database', 'middleware'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Enhanced multer setup for both CSV and images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

// Register new farmer
app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!hybridDb.isMongoConnected()) {
      return res.status(503).json({ 
        success: false, 
        error: 'User management not available. MongoDB connection required.' 
      });
    }

    const {
      farmerName,
      email,
      password,
      state,
      district,
      currentCity,
      crop,
      season
    } = req.body;

    // Validation
    if (!farmerName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await Farmer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    // Create new farmer
    const farmer = new Farmer({
      farmerName,
      email,
      password,
      state,
      district,
      currentCity,
      crop,
      season
    });

    await farmer.save();

    // Generate token
    const token = generateToken(farmer._id);

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: {
        token,
        user: farmer.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed', 
      message: error.message 
    });
  }
});

// Login farmer
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!hybridDb.isMongoConnected()) {
      return res.status(503).json({ 
        success: false, 
        error: 'User management not available. MongoDB connection required.' 
      });
    }

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const farmer = await Farmer.findOne({ email }).select('+password');
    if (!farmer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await farmer.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(farmer._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: farmer.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed', 
      message: error.message 
    });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// =============================================================================
// FIELD PROFILE MANAGEMENT
// =============================================================================

// Get farmer's field profiles
app.get('/api/field-profiles', authenticateToken, async (req, res) => {
  try {
    if (!hybridDb.isMongoConnected()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Field profile management not available. MongoDB connection required.' 
      });
    }

    const fieldProfiles = await FieldProfile.find({ farmerId: req.user.farmerId });

    res.json({
      success: true,
      data: fieldProfiles
    });

  } catch (error) {
    console.error('❌ Get field profiles error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve field profiles', 
      message: error.message 
    });
  }
});

// Save field profile
app.post('/api/field-profiles', authenticateToken, async (req, res) => {
  try {
    if (!hybridDb.isMongoConnected()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Field profile management not available. MongoDB connection required.' 
      });
    }

    const fieldProfileData = {
      farmerId: req.user.farmerId,
      field_profile: req.body.field_profile
    };

    const fieldProfile = new FieldProfile(fieldProfileData);
    await fieldProfile.save();

    res.status(201).json({
      success: true,
      message: 'Field profile saved successfully',
      data: fieldProfile
    });

  } catch (error) {
    console.error('❌ Save field profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save field profile', 
      message: error.message 
    });
  }
});

// =============================================================================
// ENHANCED DASHBOARD
// =============================================================================

app.get('/api/dashboard', optionalAuth, async (req, res) => {
  try {
    const dashboardData = {
      user: req.user || null,
      databases: hybridDb.getStatus(),
      statistics: null
    };

    // Get DuckDB statistics if available
    if (db) {
      try {
        const stats = await db.getStatistics();
        dashboardData.statistics = stats;
      } catch (error) {
        console.warn('⚠️ Could not fetch DuckDB statistics:', error.message);
      }
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load dashboard', 
      message: error.message 
    });
  }
});

// =============================================================================
// EXISTING CSV UPLOAD AND PROCESSING (DUCKDB)
// =============================================================================

app.post('/api/upload/csv', optionalAuth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Analytics database not available. CSV upload is disabled.' 
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
      VALUES ('${processingResult.batchId}', '${req.file.originalname.replace(/'/g, "''")}', ${req.file.size}, ${processingResult.totalRows}, ${processingResult.validRows}, ${processingResult.invalidRows}, '${processingResult.validRows > 0 ? 'completed' : 'failed'}', ${uploadTimestamp})
    `;
    await db.run(batchQuery);

    // Save valid records to database
    if (processingResult.processedData.length > 0) {
      console.log(`💾 Saving ${processingResult.processedData.length} records to DuckDB`);
      await db.batchInsertCropData(processingResult.processedData);
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
        errors: processingResult.errors.slice(0, 10),
        user: req.user ? req.user.farmerId : 'anonymous'
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

// =============================================================================
// CROP DATA ANALYTICS (DUCKDB)
// =============================================================================

app.get('/api/crop-data', optionalAuth, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Analytics database not available' 
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
    
    const data = await db.getCropData(filters, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      user: req.user ? req.user.farmerId : 'anonymous'
    });
    
  } catch (error) {
    console.error('❌ Failed to retrieve crop data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve crop data',
      message: error.message
    });
  }
});

app.get('/api/crop-data/statistics', optionalAuth, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Analytics database not available' 
      });
    }
    
    const stats = await db.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Failed to get statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

// =============================================================================
// EXISTING GEMINI AI CHAT
// =============================================================================

app.post('/api/chat/gemini', optionalAuth, async (req, res) => {
  console.log('📞 Gemini API endpoint called at:', new Date().toISOString());
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not configured');
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY not configured on server' });
    }

    const { history } = req.body || {};
    
    let contents = [];
    if (Array.isArray(history) && history.length > 0) {
      contents = history.map(item => ({
        role: item.role === 'model' ? 'model' : 'user',
        parts: item.parts || [{ text: '' }]
      }));
    } else {
      console.log('⚠️ Empty or invalid history, using default request');
      contents = [{
        role: 'user',
        parts: [{ text: 'Hello, I need help with farming advice.' }]
      }];
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, { contents }, { 
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const data = response.data;
    let text = '';
    if (data?.candidates?.length && data.candidates[0]?.content?.parts?.length) {
      text = data.candidates[0].content.parts[0].text || '';
    }

    return res.json({ 
      success: true, 
      text,
      user: req.user ? req.user.farmerId : 'anonymous'
    });

  } catch (err) {
    const status = err.response?.status || 500;
    if (status === 429) {
      return res.status(429).json({ success: false, error: 'Rate limited by Gemini API' });
    }
    console.error('❌ Gemini proxy error:', err.message);
    return res.status(500).json({ success: false, error: 'Gemini proxy error', details: err.message });
  }
});

// =============================================================================
// EXISTING BHUVAN/FIELD DATA ENDPOINTS
// =============================================================================

// Existing field data processing (keep all existing logic)
const getSoilDataForLocation = (lat, lng) => {
  const soilTypes = ['Loamy', 'Clay', 'Sandy', 'Black Cotton', 'Red Laterite', 'Alluvial'];
  const randomSoilType = soilTypes[Math.floor(lat * lng) % soilTypes.length];
  
  return {
    soil_type: randomSoilType,
    soil_depth: Math.random() > 0.5 ? '50-100 cm' : '100-150 cm',
    ph: Math.round((6.0 + Math.random() * 2.0) * 10) / 10,
    organic_carbon: Math.round((0.5 + Math.random() * 1.0) * 100) / 100,
    nitrogen: Math.round(60 + Math.random() * 40),
    phosphorus: Math.round(20 + Math.random() * 30),
    potassium: Math.round(30 + Math.random() * 30),
    source: 'NBSS-Mock',
    confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100
  };
};

const getLandUseForLocation = async (lat, lng) => {
  try {
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

app.post('/api/fields/ingest-location', optionalAuth, async (req, res) => {
  try {
    const { field_id, geometry } = req.body;
    
    if (!geometry || geometry.type !== 'Point') {
      return res.status(400).json({ error: 'Point geometry required' });
    }
    
    const [lng, lat] = geometry.coordinates;
    console.log(`Processing field location: ${lat}, ${lng}`);
    
    const [locationData, landUseData] = await Promise.all([
      getBhuvanLocation(lat, lng),
      getLandUseForLocation(lat, lng)
    ]);
    
    const soilData = getSoilDataForLocation(lat, lng);
    
    const result = {
      field_id,
      location: locationData,
      land_use: landUseData,
      soil: soilData,
      processed_at: new Date().toISOString(),
      data_sources: ['bhuvan', 'nbss-mock', 'lulc-mock'],
      user: req.user ? req.user.farmerId : 'anonymous'
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

app.get('/api/geocode/bhuvan', optionalAuth, async (req, res) => {
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

// =============================================================================
// HEALTH CHECK WITH HYBRID STATUS
// =============================================================================

app.get('/api/health', (req, res) => {
  const dbStatus = hybridDb.getStatus();
  
  res.json({ 
    status: 'OK', 
    service: 'AgriSense Hybrid Backend',
    databases: {
      mongodb: dbStatus.mongodb ? 'connected' : 'unavailable',
      duckdb: dbStatus.duckdb ? 'connected' : 'unavailable',
      hybrid: dbStatus.hybrid ? 'operational' : 'partial'
    },
    features: {
      user_management: dbStatus.mongodb,
      analytics: dbStatus.duckdb,
      csv_processing: dbStatus.duckdb,
      authentication: dbStatus.mongodb,
      ai_chat: !!process.env.GEMINI_API_KEY,
      geospatial: true
    },
    timestamp: new Date().toISOString(),
    version: '2.0.0-agrisense-hybrid'
  });
});

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

const startServer = async () => {
  try {
    console.log('🚀 Starting AgriSense Hybrid Server...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    ensureDirectories();
    
    // Initialize hybrid database system
    await hybridDb.initialize();
    
    // Get DuckDB instance for analytics
    if (hybridDb.isDuckDBConnected()) {
      db = hybridDb.duckdb;
    }
    
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🌾 AgriSense Hybrid Backend Started! 🌾');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log('');
      
      const dbStatus = hybridDb.getStatus();
      console.log('🗄️ Database Status:');
      console.log(`   🍃 MongoDB: ${dbStatus.mongodb ? '✅ Connected' : '❌ Not available'}`);
      console.log(`   🦆 DuckDB:  ${dbStatus.duckdb ? '✅ Connected' : '❌ Not available'}`);
      console.log(`   🔀 Hybrid:  ${dbStatus.hybrid ? '✅ Operational' : '⚠️ Partial'}`);
      console.log('');
      
      console.log('🔐 Authentication Endpoints:');
      console.log('   📝 Signup:      POST /api/auth/signup');
      console.log('   🔑 Login:       POST /api/auth/login');
      console.log('   👤 Profile:     GET /api/auth/profile');
      console.log('');
      
      console.log('🌾 Field Management:');
      console.log('   📊 Dashboard:   GET /api/dashboard');
      console.log('   🏞️ Field Profiles: GET|POST /api/field-profiles');
      console.log('');
      
      console.log('📊 Analytics (DuckDB):');
      console.log(`   📤 Upload CSV:  POST /api/upload/csv ${db ? '' : '(disabled)'}`);
      console.log(`   📈 Get Data:    GET /api/crop-data ${db ? '' : '(disabled)'}`);
      console.log(`   📊 Statistics:  GET /api/crop-data/statistics ${db ? '' : '(disabled)'}`);
      console.log('');
      
      console.log('🤖 AI & External Services:');
      console.log('   🤖 Gemini Chat: POST /api/chat/gemini');
      console.log('   📍 Field Data:  POST /api/fields/ingest-location');
      console.log('   🌍 Bhuvan:      GET /api/geocode/bhuvan');
      console.log('');
      
      console.log('⚡ System:');
      console.log('   💚 Health:      GET /api/health');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    console.log('\n⏸️ Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, shutting down AgriSense server gracefully...`);
  
  hybridDb.close()
    .then(() => {
      console.log('✅ AgriSense server shutdown complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error during shutdown:', error.message);
      process.exit(1);
    });
};

// Handle multiple shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Start the server
startServer();

module.exports = app;