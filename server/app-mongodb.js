require('dotenv').config();

// =============================================================================
// AGRISENSE MONGODB-FIRST IMPLEMENTATION
// Working implementation with MongoDB + Security + Authentication
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

const app = express();
const PORT = process.env.PORT || 3001;

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

// =============================================================================
// MONGODB SCHEMAS (AGRISENSE STYLE)
// =============================================================================

// Enhanced Farmer Schema
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
  
  // Crop data (enhanced with new fields)
  crop: String,
  season: { type: String, enum: ['Rabi', 'Kharif', 'Zaid', 'Perennial'] },
  cultivation_year: Number,
  areaHectare: Number,
  yieldQuintal: Number,
  expected_yield: Number,
  actual_yield: Number,
  
  // Soil data
  N: Number,
  P: Number,
  K: Number,
  ph: Number,
  soilTemperature: Number,
  soilMoisture: Number,
  
  // Weather data
  temperature: Number,
  humidity: Number,
  rainfall: Number,
  
  // System fields
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

// Password hashing middleware
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

// Compare password method
farmerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Enhanced Field Profile Schema
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
        N: Number,
        P: Number,
        K: Number,
        pH: Number,
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

// Crop Data Schema (MongoDB version for analytics)
const cropDataSchema = new mongoose.Schema({
  field_id: String,
  field_name: String,
  farmer_name: String,
  
  // Location
  state: String,
  district: String,
  village: String,
  latitude: Number,
  longitude: Number,
  
  // Field characteristics
  field_size_hectares: Number,
  soil_type: String,
  soil_ph: Number,
  organic_carbon: Number,
  nitrogen: Number,
  phosphorus: Number,
  potassium: Number,
  
  // Crop information
  crop_type: String,
  crop_variety: String,
  planting_date: Date,
  harvest_date: Date,
  growing_season: String,
  
  // Agricultural practices
  irrigation_method: String,
  irrigation_frequency: String,
  fertilizers_used: String,
  pesticides_used: String,
  farming_method: String,
  
  // Yield data
  yield_per_hectare: Number,
  total_yield: Number,
  yield_unit: String,
  
  // Weather data
  avg_temperature: Number,
  total_rainfall: Number,
  humidity_avg: Number,
  
  // Economic data
  cost_per_hectare: Number,
  selling_price: Number,
  profit_per_hectare: Number,
  
  // Metadata
  upload_batch_id: String,
  data_source: String,
  uploaded_by: String
}, { timestamps: true });

// Create models
const Farmer = mongoose.model('Farmer', farmerSchema);
const FieldProfile = mongoose.model('FieldProfile', fieldProfileSchema);
const CropData = mongoose.model('CropData', cropDataSchema);

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
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

// Optional authentication
const optionalAuth = async (req, res, next) => {
  try {
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

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

// Register new farmer
app.post('/api/auth/signup', async (req, res) => {
  try {
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
// CROP DATA ANALYTICS (MONGODB)
// =============================================================================

app.get('/api/crop-data', optionalAuth, async (req, res) => {
  try {
    const {
      crop_type,
      state,
      district,
      limit = 100,
      offset = 0
    } = req.query;
    
    const filters = {};
    if (crop_type) filters.crop_type = new RegExp(crop_type, 'i');
    if (state) filters.state = new RegExp(state, 'i');
    if (district) filters.district = new RegExp(district, 'i');
    
    const data = await CropData.find(filters)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    
    const total = await CropData.countDocuments(filters);
    
    res.json({
      success: true,
      data: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: total
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
    const totalRecords = await CropData.countDocuments();
    const cropTypes = await CropData.aggregate([
      { $group: { _id: '$crop_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const states = await CropData.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total_records: totalRecords,
        crop_types: cropTypes,
        states: states
      }
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
// ENHANCED DASHBOARD
// =============================================================================

app.get('/api/dashboard', optionalAuth, async (req, res) => {
  try {
    const dashboardData = {
      user: req.user || null,
      databases: {
        mongodb: mongoose.connection.readyState === 1,
        duckdb: false, // Will add later
        hybrid: mongoose.connection.readyState === 1
      },
      statistics: null
    };

    // Get basic statistics
    if (mongoose.connection.readyState === 1) {
      try {
        const totalFarmers = await Farmer.countDocuments();
        const totalCropData = await CropData.countDocuments();
        const totalFieldProfiles = await FieldProfile.countDocuments();
        
        dashboardData.statistics = {
          farmers: totalFarmers,
          crop_records: totalCropData,
          field_profiles: totalFieldProfiles
        };
      } catch (error) {
        console.warn('⚠️ Could not fetch statistics:', error.message);
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
// GEMINI AI CHAT
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

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/api/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  
  res.json({ 
    status: 'OK', 
    service: 'AgriSense MongoDB Backend',
    databases: {
      mongodb: isMongoConnected ? 'connected' : 'unavailable',
      duckdb: 'not_implemented', // Will add later
      hybrid: isMongoConnected ? 'partial' : 'unavailable'
    },
    features: {
      user_management: isMongoConnected,
      analytics: isMongoConnected,
      authentication: isMongoConnected,
      ai_chat: !!process.env.GEMINI_API_KEY,
      csv_processing: false, // Will add later
      geospatial: false // Will add later
    },
    timestamp: new Date().toISOString(),
    version: '2.0.0-agrisense-mongodb'
  });
});

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

const startServer = async () => {
  try {
    console.log('🚀 Starting AgriSense MongoDB Backend...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crop-prediction-agrisense';
    
    console.log('🍃 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
    
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🌾 AgriSense MongoDB Backend Started! 🌾');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log('');
      
      console.log('🗄️ Database Status:');
      console.log('   🍃 MongoDB: ✅ Connected');
      console.log('   🦆 DuckDB:  ⏳ Coming soon');
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
      
      console.log('📊 Analytics (MongoDB):');
      console.log('   📈 Get Data:    GET /api/crop-data');
      console.log('   📊 Statistics:  GET /api/crop-data/statistics');
      console.log('');
      
      console.log('🤖 AI Services:');
      console.log('   🤖 Gemini Chat: POST /api/chat/gemini');
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
  console.log('\n🛑 Shutting down AgriSense server gracefully...');
  try {
    await mongoose.connection.close();
    console.log('🍃 MongoDB connection closed');
    console.log('✅ Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

module.exports = app;