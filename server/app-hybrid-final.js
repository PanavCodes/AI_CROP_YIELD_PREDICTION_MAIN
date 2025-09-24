require('dotenv').config();

// =============================================================================
// AGRISENSE HYBRID IMPLEMENTATION - MongoDB + DuckDB
// MongoDB: User Management, Authentication, Field Profiles
// DuckDB: Analytics, CSV Processing, Large Dataset Analysis
// =============================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { xss } = require('express-xss-sanitizer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Import existing DuckDB services
const CropDatabase = require('./database/schema');
const CSVProcessor = require('./services/csvProcessor');

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize DuckDB for analytics
let duckdb = null;
const csvProcessor = new CSVProcessor();

// =============================================================================
// HYBRID DATABASE INITIALIZATION
// =============================================================================

const initializeDatabases = async () => {
  console.log('🔄 Initializing hybrid database system...');
  
  // Initialize MongoDB
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crop-prediction-agrisense';
    console.log('🍃 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.log('💡 User management features will be limited');
  }

  // Initialize DuckDB
  try {
    console.log('🦆 Initializing DuckDB...');
    duckdb = new CropDatabase();
    
    // Wait for DuckDB to be ready
    await new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          await duckdb.run('SELECT 1 as test');
          console.log('✅ DuckDB initialized successfully');
          resolve();
        } catch (err) {
          console.warn('⚠️ DuckDB initialization issue:', err.message);
          console.log('💡 Analytics features may be limited');
          resolve(); // Continue anyway
        }
      }, 1000);
    });
  } catch (error) {
    console.warn('⚠️ DuckDB initialization failed:', error.message);
    console.log('💡 CSV processing and analytics will be limited');
  }

  const mongoStatus = mongoose.connection.readyState === 1;
  const duckdbStatus = duckdb !== null;
  
  console.log('✅ Hybrid database system initialized');
  console.log(`📊 MongoDB: ${mongoStatus ? 'Connected' : 'Unavailable'}`);
  console.log(`📊 DuckDB: ${duckdbStatus ? 'Connected' : 'Unavailable'}`);
  
  return { mongodb: mongoStatus, duckdb: duckdbStatus };
};

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

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

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    success: false, 
    error: "Too many requests from this IP, please try again later." 
  }
});
app.use('/api', limiter);

app.use(mongoSanitize());
app.use(xss());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// DuckDB compatibility
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// =============================================================================
// MONGODB SCHEMAS (USER MANAGEMENT)
// =============================================================================

const farmerSchema = new mongoose.Schema({
  farmerId: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  farmerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Location data
  state: String,
  district: String,
  currentCity: String,
  
  // Crop data
  crop: String,
  season: { type: String, enum: ['Rabi', 'Kharif', 'Zaid', 'Perennial'] },
  cultivation_year: Number,
  areaHectare: Number,
  yieldQuintal: Number,
  expected_yield: Number,
  actual_yield: Number,
  
  // Soil data
  N: Number, P: Number, K: Number,
  ph: Number,
  soilTemperature: Number,
  soilMoisture: Number,
  
  // Weather data
  temperature: Number,
  humidity: Number,
  rainfall: Number,
  
  role: { type: String, enum: ["farmer", "admin"], default: "farmer" },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

farmerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

farmerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const fieldProfileSchema = new mongoose.Schema({
  farmerId: { type: String, required: true },
  field_profile: {
    field_name: { type: String, required: true },
    field_size_hectares: { type: Number, required: true },
    soil_type: { type: String, required: true },
    location: {
      latitude: Number,
      longitude: Number,
      name: String,
      district: String,
      state: String,
      country: { type: String, default: 'India' }
    },
    irrigation: {
      method: String,
      availability: { type: String, enum: ['None', 'Low', 'Medium', 'High'] }
    },
    crops: [{
      crop_type: String,
      planting_date: String,
      season: { type: String, enum: ['Rabi', 'Kharif', 'Zaid', 'Perennial'] },
      cultivation_year: Number,
      expected_yield: Number,
      actual_yield: Number,
      fertilizers_used: [String],
      pesticides_used: [String],
      previous_crop: String,
      soil_test_results: {
        N: Number, P: Number, K: Number, pH: Number,
        tested_date: Date
      },
      weather_data: {
        temperature: Number,
        humidity: Number,
        rainfall: Number,
        recorded_date: Date
      }
    }]
  }
}, { timestamps: true });

// Create MongoDB models
let Farmer, FieldProfile;
try {
  Farmer = mongoose.model('Farmer', farmerSchema);
  FieldProfile = mongoose.model('FieldProfile', fieldProfileSchema);
} catch (error) {
  console.warn('⚠️ MongoDB models not available:', error.message);
}

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

const authenticateToken = async (req, res, next) => {
  try {
    if (!Farmer) {
      return res.status(503).json({ 
        success: false, 
        error: 'Authentication not available. MongoDB connection required.' 
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Farmer.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token. User not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid token.' 
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    if (!Farmer) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Farmer.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// =============================================================================
// FILE UPLOAD CONFIGURATION
// =============================================================================

const ensureDirectories = () => {
  const dirs = ['data', 'uploads', 'database', 'middleware'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

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
  limits: { fileSize: 50 * 1024 * 1024 },
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
// AUTHENTICATION ROUTES (MongoDB)
// =============================================================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!Farmer) {
      return res.status(503).json({ 
        success: false, 
        error: 'User registration not available. MongoDB connection required.' 
      });
    }

    const {
      farmerName, email, password, state, district, currentCity, crop, season
    } = req.body;

    if (!farmerName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      });
    }

    const existingUser = await Farmer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    const farmer = new Farmer({
      farmerName, email, password, state, district, currentCity, crop, season
    });

    await farmer.save();
    const token = generateToken(farmer._id);

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: { token, user: farmer.toJSON() }
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

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!Farmer) {
      return res.status(503).json({ 
        success: false, 
        error: 'Login not available. MongoDB connection required.' 
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const farmer = await Farmer.findOne({ email }).select('+password');
    if (!farmer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const isMatch = await farmer.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const token = generateToken(farmer._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: farmer.toJSON() }
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

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

// =============================================================================
// FIELD PROFILE MANAGEMENT (MongoDB)
// =============================================================================

app.get('/api/field-profiles', authenticateToken, async (req, res) => {
  try {
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

app.post('/api/field-profiles', authenticateToken, async (req, res) => {
  try {
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
// CSV UPLOAD AND PROCESSING (DuckDB)
// =============================================================================

app.post('/api/upload/csv', optionalAuth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!duckdb) {
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
    
    // Save batch info to DuckDB
    const uploadTimestamp = Date.now();
    const uploadedBy = req.user ? req.user.farmerId : 'anonymous';
    
    try {
      const batchQuery = `
        INSERT INTO upload_batches (batch_id, filename, file_size, total_rows, valid_rows, invalid_rows, processing_status, upload_timestamp)
        VALUES ('${processingResult.batchId}', '${req.file.originalname.replace(/'/g, "''")}', ${req.file.size}, ${processingResult.totalRows}, ${processingResult.validRows}, ${processingResult.invalidRows}, '${processingResult.validRows > 0 ? 'completed' : 'failed'}', ${uploadTimestamp})
      `;
      await duckdb.run(batchQuery);

      // Save valid records to DuckDB
      if (processingResult.processedData.length > 0) {
        console.log(`💾 Saving ${processingResult.processedData.length} records to DuckDB`);
        
        // Add uploaded_by info to each record
        const enhancedData = processingResult.processedData.map(record => ({
          ...record,
          uploaded_by: uploadedBy
        }));
        
        await duckdb.batchInsertCropData(enhancedData);
      }
    } catch (dbError) {
      console.warn('⚠️ DuckDB save failed:', dbError.message);
    }
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
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
        user: uploadedBy
      }
    });
    
  } catch (error) {
    console.error('❌ CSV upload failed:', error);
    
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
// CROP DATA ANALYTICS (DuckDB)
// =============================================================================

app.get('/api/crop-data', optionalAuth, async (req, res) => {
  try {
    if (!duckdb) {
      return res.status(503).json({ 
        success: false, 
        error: 'Analytics database not available' 
      });
    }
    
    const {
      crop_type, state, district, upload_batch_id,
      limit = 100, offset = 0
    } = req.query;
    
    const filters = {};
    if (crop_type) filters.crop_type = crop_type;
    if (state) filters.state = state;
    if (district) filters.district = district;
    if (upload_batch_id) filters.upload_batch_id = upload_batch_id;
    
    const data = await duckdb.getCropData(filters, parseInt(limit), parseInt(offset));
    
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
    if (!duckdb) {
      return res.status(503).json({ 
        success: false, 
        error: 'Analytics database not available' 
      });
    }
    
    const stats = await duckdb.getStatistics();
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
// ENHANCED DASHBOARD (Hybrid Data)
// =============================================================================

app.get('/api/dashboard', optionalAuth, async (req, res) => {
  try {
    const dashboardData = {
      user: req.user || null,
      databases: {
        mongodb: mongoose.connection.readyState === 1,
        duckdb: duckdb !== null,
        hybrid: true
      },
      statistics: {}
    };

    // Get MongoDB statistics
    if (Farmer && FieldProfile) {
      try {
        dashboardData.statistics.farmers = await Farmer.countDocuments();
        dashboardData.statistics.field_profiles = await FieldProfile.countDocuments();
      } catch (error) {
        console.warn('⚠️ Could not fetch MongoDB statistics:', error.message);
      }
    }

    // Get DuckDB statistics
    if (duckdb) {
      try {
        const duckdbStats = await duckdb.getStatistics();
        dashboardData.statistics = { ...dashboardData.statistics, ...duckdbStats };
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
// EXISTING SERVICES (Gemini AI, Bhuvan)
// =============================================================================

app.post('/api/chat/gemini', optionalAuth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
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
    console.error('❌ Gemini proxy error:', err.message);
    return res.status(500).json({ success: false, error: 'Gemini proxy error' });
  }
});

// Bhuvan field data processing
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
    
    const locationData = await getBhuvanLocation(lat, lng);
    const soilData = getSoilDataForLocation(lat, lng);
    
    const result = {
      field_id,
      location: locationData,
      soil: soilData,
      processed_at: new Date().toISOString(),
      data_sources: ['bhuvan', 'nbss-mock'],
      user: req.user ? req.user.farmerId : 'anonymous'
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Error processing field location:', error);
    res.status(500).json({ 
      error: 'Failed to process field location',
      message: error.message 
    });
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/api/health', (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  const duckdbConnected = duckdb !== null;
  
  res.json({ 
    status: 'OK', 
    service: 'AgriSense Hybrid Backend',
    databases: {
      mongodb: mongoConnected ? 'connected' : 'unavailable',
      duckdb: duckdbConnected ? 'connected' : 'unavailable',
      hybrid: mongoConnected && duckdbConnected ? 'fully_operational' : 'partial'
    },
    features: {
      user_management: mongoConnected,
      authentication: mongoConnected,
      field_profiles: mongoConnected,
      csv_processing: duckdbConnected,
      analytics: duckdbConnected,
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
    console.log('🚀 Starting AgriSense Hybrid Backend...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    ensureDirectories();
    
    // Initialize databases
    const dbStatus = await initializeDatabases();
    
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🌾 AgriSense Hybrid Backend Started! 🌾');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log('');
      
      console.log('🗄️ Database Status:');
      console.log(`   🍃 MongoDB: ${dbStatus.mongodb ? '✅ Connected' : '❌ Not available'}`);
      console.log(`   🦆 DuckDB:  ${dbStatus.duckdb ? '✅ Connected' : '❌ Not available'}`);
      console.log(`   🔀 Hybrid:  ${dbStatus.mongodb && dbStatus.duckdb ? '✅ Fully Operational' : '⚠️ Partial'}`);
      console.log('');
      
      if (dbStatus.mongodb) {
        console.log('🔐 Authentication Endpoints:');
        console.log('   📝 Signup:       POST /api/auth/signup');
        console.log('   🔑 Login:        POST /api/auth/login');
        console.log('   👤 Profile:      GET /api/auth/profile');
        console.log('');
        
        console.log('🌾 Field Management:');
        console.log('   🏞️ Field Profiles: GET|POST /api/field-profiles');
      }
      
      console.log('📊 Dashboard & Analytics:');
      console.log('   📊 Dashboard:    GET /api/dashboard');
      if (dbStatus.duckdb) {
        console.log('   📤 Upload CSV:   POST /api/upload/csv');
        console.log('   📈 Get Data:     GET /api/crop-data');
        console.log('   📊 Statistics:   GET /api/crop-data/statistics');
      }
      console.log('');
      
      console.log('🤖 AI & External Services:');
      console.log('   🤖 Gemini Chat: POST /api/chat/gemini');
      console.log('   📍 Field Data:  POST /api/fields/ingest-location');
      console.log('');
      
      console.log('⚡ System:');
      console.log('   💚 Health:      GET /api/health');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    
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
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down AgriSense hybrid server gracefully...');
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🍃 MongoDB connection closed');
    }
    
    if (duckdb) {
      duckdb.close();
      console.log('🦆 DuckDB connection closed');
    }
    
    console.log('✅ Hybrid server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

module.exports = app;