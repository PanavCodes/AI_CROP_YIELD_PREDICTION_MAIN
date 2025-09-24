// Enhanced Server with Agrisense Tech Stack Integration
require('dotenv').config();

// Agrisense Tech Stack Imports
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const sharp = require('sharp');

// Existing imports
const path = require('path');
const fs = require('fs');
const CropDatabase = require('./database/schema');
const CSVProcessor = require('./services/csvProcessor');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================================================
// ENHANCED CONFIGURATION WITH AGRISENSE TECH STACK
// =============================================================================

// Environment Variables (Agrisense style)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/crop-prediction';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const AGMARKNET_API_KEY = process.env.AGMARKNET_API_KEY;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Cache configurations (Agrisense style)
const weatherCache = new Map();
const soilCache = new Map();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// =============================================================================
// ENHANCED MIDDLEWARE SETUP
// =============================================================================

// Security middlewares (Agrisense style)
app.use(helmet()); // Security headers
app.use(cors({ origin: CLIENT_URL, credentials: true })); // CORS
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Enhanced multer setup for image processing
const storage = multer.memoryStorage(); // Store in memory for processing
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
// MONGOOSE SCHEMAS (AGRISENSE STYLE)
// =============================================================================

// Enhanced Farmer Schema with all Agrisense fields
const farmerSchema = new mongoose.Schema({
  farmerId: { type: String, required: true, unique: true },
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
  role: { type: String, enum: ["farmer", "admin"], default: "farmer" }
}, { timestamps: true });

const Farmer = mongoose.model('Farmer', farmerSchema);

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
      country: String
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
        pH: Number
      },
      weather_data: {
        temperature: Number,
        humidity: Number,
        rainfall: Number
      }
    }]
  }
}, { timestamps: true });

const FieldProfile = mongoose.model('FieldProfile', fieldProfileSchema);

// Soil Data Schema for historical tracking
const soilDataSchema = new mongoose.Schema({
  farmerId: { type: String, required: true },
  deviceId: String,
  ph: Number,
  temperature: Number,
  moisture: Number,
  nitrogen: Number,
  phosphorus: Number,
  potassium: Number,
  location: {
    latitude: Number,
    longitude: Number
  },
  timestamp: { type: Date, default: Date.now }
});

const SoilData = mongoose.model('SoilData', soilDataSchema);

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

// Initialize databases
let db; // DuckDB for existing functionality
const csvProcessor = new CSVProcessor();

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('🟢 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Initialize DuckDB (existing functionality)
const initializeDuckDB = async () => {
  try {
    console.log('🔄 Initializing DuckDB...');
    db = new CropDatabase();
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          db.run('SELECT 1 as test')
            .then(() => {
              console.log('🟢 DuckDB initialized successfully');
              resolve();
            })
            .catch(reject);
        } catch (err) {
          reject(err);
        }
      }, 100);
    });
  } catch (error) {
    console.error('❌ DuckDB initialization failed:', error);
    db = null;
  }
};

// =============================================================================
// AUTHENTICATION MIDDLEWARE (AGRISENSE STYLE)
// =============================================================================

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(401).json({ error: "Access denied, no token provided" });
    }

    try {
      const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
      req.farmer = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    } catch (err) {
      res.status(400).json({ error: "Invalid token" });
    }
  };
};

// =============================================================================
// ENHANCED AUTHENTICATION ENDPOINTS
// =============================================================================

// Enhanced Signup with all fields
app.post('/api/auth/signup', async (req, res) => {
  try {
    const {
      farmerName, email, password, role, state, district,
      crop, season, cultivation_year, areaHectare, yieldQuintal,
      expected_yield, actual_yield, N, P, K, temperature, humidity, ph, rainfall
    } = req.body;

    const existing = await Farmer.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Farmer already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const farmerId = "F" + Date.now();

    const farmer = new Farmer({
      farmerId,
      farmerName,
      email,
      password: hashedPassword,
      role: role || "farmer",
      state, district, crop, season, cultivation_year,
      areaHectare, yieldQuintal, expected_yield, actual_yield,
      N, P, K, temperature, humidity, ph, rainfall
    });

    await farmer.save();

    const token = jwt.sign(
      { farmerId: farmer.farmerId, email: farmer.email, role: farmer.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({ 
      message: "Farmer registered successfully", 
      token, 
      farmerId,
      farmer: {
        farmerId: farmer.farmerId,
        farmerName: farmer.farmerName,
        email: farmer.email,
        role: farmer.role
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Enhanced Login with weather updates
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const farmer = await Farmer.findOne({ email });
    if (!farmer) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, farmer.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Update weather data if available
    if (farmer.district && farmer.state && WEATHER_API_KEY) {
      try {
        const weatherRes = await axios.get(
          `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${farmer.district},${farmer.state}`
        );

        const { current } = weatherRes.data;
        farmer.temperature = current.temp_c;
        farmer.humidity = current.humidity;
        farmer.rainfall = current.precip_mm || 0;
        await farmer.save();
      } catch (weatherErr) {
        console.error('Weather API error:', weatherErr.message);
      }
    }

    const token = jwt.sign(
      { farmerId: farmer.farmerId, email: farmer.email, role: farmer.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({ 
      message: "Login successful", 
      token, 
      farmerId: farmer.farmerId,
      farmer: {
        farmerId: farmer.farmerId,
        farmerName: farmer.farmerName,
        email: farmer.email,
        role: farmer.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// ENHANCED FIELD PROFILE ENDPOINTS
// =============================================================================

// Save field profile (enhanced)
app.post('/api/field-profiles', authMiddleware(['farmer', 'admin']), async (req, res) => {
  try {
    const fieldProfile = new FieldProfile({
      farmerId: req.farmer.farmerId,
      field_profile: req.body.field_profile
    });

    await fieldProfile.save();
    res.status(201).json({ 
      message: "Field profile saved successfully",
      profile: fieldProfile 
    });
  } catch (err) {
    console.error('Save field profile error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get field profiles
app.get('/api/field-profiles', authMiddleware(['farmer', 'admin']), async (req, res) => {
  try {
    const profiles = await FieldProfile.find({ farmerId: req.farmer.farmerId });
    res.json({ profiles });
  } catch (err) {
    console.error('Get field profiles error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// WEATHER AND SOIL API ENDPOINTS (AGRISENSE STYLE)
// =============================================================================

// Get enhanced dashboard data
app.get('/api/dashboard', authMiddleware(['farmer', 'admin']), async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ farmerId: req.farmer.farmerId }).select("-password");
    if (!farmer) {
      return res.status(404).json({ error: "Farmer not found" });
    }

    // Get field profiles
    const fieldProfiles = await FieldProfile.find({ farmerId: farmer.farmerId });

    // Generate crop recommendations based on farmer data
    const cropRecommendations = [
      {
        crop: 'Wheat',
        suitability: Math.min(100, Math.max(0, Math.round(85 + (farmer.ph ? (farmer.ph - 7) * 5 : 0)))),
        expectedYield: Math.round(40 + (farmer.soilTemperature || 20) * 0.5),
        profitability: Math.round(80 + (farmer.humidity || 60) * 0.2)
      },
      {
        crop: 'Rice',
        suitability: Math.min(100, Math.max(0, Math.round(75 + (farmer.rainfall || 10) * 0.5))),
        expectedYield: Math.round(35 + (farmer.soilMoisture || 40) * 0.3),
        profitability: Math.round(70 + (farmer.N || 20) * 0.8)
      },
      {
        crop: 'Corn',
        suitability: Math.min(100, Math.max(0, Math.round(80 + (farmer.temperature ? (farmer.temperature - 25) * 2 : 0)))),
        expectedYield: Math.round(38 + (farmer.K || 15) * 0.4),
        profitability: Math.round(75 + (farmer.P || 10) * 1.2)
      }
    ];

    res.json({
      farmerData: farmer,
      fieldProfiles: fieldProfiles,
      cropRecommendations: cropRecommendations,
      weatherData: {
        temperature: farmer.temperature,
        humidity: farmer.humidity,
        rainfall: farmer.rainfall
      },
      soilData: {
        ph: farmer.ph,
        temperature: farmer.soilTemperature,
        moisture: farmer.soilMoisture,
        N: farmer.N,
        P: farmer.P,
        K: farmer.K
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// AI INTEGRATION ENDPOINTS (AGRISENSE STYLE)
// =============================================================================

// AI Chat endpoint
app.post('/api/ai/chat', authMiddleware(['farmer', 'admin']), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const farmer = await Farmer.findOne({ farmerId: req.farmer.farmerId });
    if (!farmer) {
      return res.status(404).json({ error: "Farmer not found" });
    }

    // Enhanced context with farmer data
    const context = `
      You are an expert agricultural assistant for ${farmer.farmerName}.
      Location: ${farmer.district}, ${farmer.state}
      Current Crop: ${farmer.crop || 'Not specified'}
      Season: ${farmer.season || 'Not specified'}
      Field Size: ${farmer.areaHectare || 'Not specified'} hectares
      Soil pH: ${farmer.ph || 'Unknown'}
      Temperature: ${farmer.temperature || 'Unknown'}°C
      Humidity: ${farmer.humidity || 'Unknown'}%
      Rainfall: ${farmer.rainfall || 'Unknown'}mm
      
      User's question: "${message}"
    `;

    // If HF_TOKEN is available, use Hugging Face
    if (HF_TOKEN) {
      try {
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
          { inputs: context },
          {
            headers: { 'Authorization': `Bearer ${HF_TOKEN}` },
            timeout: 10000
          }
        );
        
        return res.json({ response: response.data.generated_text || "I'm here to help with your farming questions!" });
      } catch (hfError) {
        console.error('Hugging Face error:', hfError.message);
      }
    }

    // Fallback to simple responses
    const responses = [
      `Based on your location in ${farmer.district}, I recommend considering seasonal crops appropriate for your region.`,
      `With ${farmer.areaHectare || 'your'} hectares, you have good potential for diversified farming.`,
      `Your soil conditions and current weather patterns suggest focusing on crops suitable for ${farmer.season || 'the current'} season.`
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    res.json({ response: randomResponse });

  } catch (err) {
    console.error('AI Chat error:', err);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

// Plant disease detection
app.post('/api/ai/detect-disease', authMiddleware(['farmer']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Process image with Sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(224, 224)
      .jpeg({ quality: 90 })
      .toBuffer();

    // If Python AI service is available
    if (PYTHON_AI_SERVICE_URL) {
      try {
        const formData = new FormData();
        formData.append('file', processedImage, { filename: 'image.jpg' });

        const aiResponse = await axios.post(
          `${PYTHON_AI_SERVICE_URL}/plant-disease-detection`,
          formData,
          { headers: formData.getHeaders(), timeout: 30000 }
        );

        return res.json(aiResponse.data);
      } catch (aiError) {
        console.error('AI service error:', aiError.message);
      }
    }

    // Fallback mock response
    const mockDiseases = [
      { name: 'Healthy', confidence: 0.85 },
      { name: 'Leaf Blight', confidence: 0.12 },
      { name: 'Rust', confidence: 0.03 }
    ];

    res.json({
      predictions: mockDiseases,
      message: 'Image processed successfully (mock response)'
    });

  } catch (err) {
    console.error('Disease detection error:', err);
    res.status(500).json({ error: 'Disease detection failed' });
  }
});

// =============================================================================
// EXISTING ENDPOINTS (PRESERVED)
// =============================================================================

// CSV Upload (existing functionality)
app.post('/api/upload/csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!db) {
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

    // Save buffer to temporary file for processing
    const tempFilePath = path.join(__dirname, 'uploads', `temp-${Date.now()}.csv`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const processingResult = await csvProcessor.processCSV(tempFilePath, req.file.originalname);
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    if (processingResult.processedData.length > 0) {
      await db.batchInsertCropData(processingResult.processedData);
    }
    
    res.json({
      success: true,
      message: 'CSV file processed successfully',
      data: {
        totalRows: processingResult.totalRows,
        validRows: processingResult.validRows,
        invalidRows: processingResult.invalidRows,
        summary: processingResult.summary
      }
    });
    
  } catch (error) {
    console.error('CSV upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'CSV processing failed',
      message: error.message
    });
  }
});

// Get crop data
app.get('/api/crop-data', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
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
    
    const data = await db.getCropData(filters, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Failed to retrieve crop data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve crop data' 
    });
  }
});

// Field data endpoints (existing)
app.post('/api/fields/ingest-location', async (req, res) => {
  try {
    const { field_id, geometry } = req.body;
    
    if (!geometry || geometry.type !== 'Point') {
      return res.status(400).json({ error: 'Point geometry required' });
    }
    
    const [lng, lat] = geometry.coordinates;
    
    // Mock soil data (enhanced)
    const soilData = {
      soil_type: 'Loamy',
      ph: Math.round((6.0 + Math.random() * 2.0) * 10) / 10,
      organic_carbon: Math.round((0.5 + Math.random() * 1.0) * 100) / 100,
      nitrogen: Math.round(60 + Math.random() * 40),
      phosphorus: Math.round(20 + Math.random() * 30),
      potassium: Math.round(30 + Math.random() * 30)
    };
    
    const result = {
      field_id,
      location: {
        latitude: lat,
        longitude: lng
      },
      soil: soilData,
      processed_at: new Date().toISOString()
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

// Gemini Chat (existing)
app.post('/api/chat/gemini', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY not configured on server' 
      });
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

    return res.json({ success: true, text });
  } catch (err) {
    console.error('Gemini proxy error:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Gemini proxy error', 
      details: err.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Enhanced Crop Prediction API',
    database: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      duckdb: db ? 'connected' : 'unavailable'
    },
    timestamp: new Date().toISOString(),
    version: '2.0.0-enhanced'
  });
});

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

const startServer = async () => {
  try {
    console.log('🚀 Starting Enhanced Server with Agrisense Tech Stack...');
    
    // Ensure directories exist
    ['uploads', 'data', 'database'].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Initialize DuckDB
    await initializeDuckDB();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('🎉 Enhanced Crop Prediction Server Started!');
      console.log(`🌐 Server running on http://localhost:${PORT}`);
      console.log(`🍃 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🗄️ DuckDB: ${db ? '✅ Connected' : '❌ Not available'}`);
      console.log('');
      console.log('📋 Available API Endpoints:');
      console.log('   🔐 Auth:        POST /api/auth/signup, /api/auth/login');
      console.log('   👤 Profiles:    GET/POST /api/field-profiles');
      console.log('   📊 Dashboard:   GET /api/dashboard');
      console.log('   🤖 AI Chat:     POST /api/ai/chat');
      console.log('   🌿 Disease:     POST /api/ai/detect-disease');
      console.log('   📤 CSV Upload:  POST /api/upload/csv');
      console.log('   📈 Crop Data:   GET /api/crop-data');
      console.log('   💚 Health:      GET /api/health');
      console.log('');
      console.log('🔧 Tech Stack: Express + MongoDB + JWT + Weather APIs + AI Integration');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  try {
    await mongoose.connection.close();
    console.log('🍃 MongoDB connection closed');
    
    if (db) {
      db.close();
      console.log('🗄️ DuckDB connection closed');
    }
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
  
  console.log('✅ Server shutdown complete');
  process.exit(0);
});

startServer();

module.exports = app;