require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');

// Import MongoDB services (replacing DuckDB)
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
  const dirs = ['data', 'uploads'];
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
    
    // Save batch info to MongoDB
    await analyticsDb.insertBatchInfo({
      batchId: processingResult.batchId,
      filename: req.file.originalname,
      fileSize: req.file.size,
      totalRows: processingResult.totalRows,
      validRows: processingResult.validRows,
      invalidRows: processingResult.invalidRows,
      status: processingResult.validRows > 0 ? 'completed' : 'failed'
    });

    // Save valid records to MongoDB
    if (processingResult.processedData.length > 0) {
      console.log(`💾 Saving ${processingResult.processedData.length} records to MongoDB`);
      await analyticsDb.insertCropData(processingResult.processedData);
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
    
    const results = await analyticsDb.getCropData(filters, limit, offset);
    
    res.json({
      success: true,
      data: results,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: results.length
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get crop data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve crop data' 
    });
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

// GET /api/crop-data/analysis - Get yield analysis by state and crop
app.get('/api/crop-data/analysis', async (req, res) => {
  try {
    if (!analyticsDb) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }
    
    const { state, crop } = req.query;
    const analysis = await analyticsDb.getYieldAnalysis(state, crop);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('❌ Failed to get yield analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve yield analysis' 
    });
  }
});

// GET /api/crop-data/distribution - Get crop distribution by state
app.get('/api/crop-data/distribution', async (req, res) => {
  try {
    if (!analyticsDb) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }
    
    const distribution = await analyticsDb.getCropDistribution();
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('❌ Failed to get crop distribution:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve crop distribution' 
    });
  }
});

// GET /api/crop-data/top-performers - Get top performing crops
app.get('/api/crop-data/top-performers', async (req, res) => {
  try {
    if (!analyticsDb) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }
    
    const { limit = 10 } = req.query;
    const topCrops = await analyticsDb.getTopPerformingCrops(limit);
    
    res.json({
      success: true,
      data: topCrops
    });
  } catch (error) {
    console.error('❌ Failed to get top performing crops:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve top performing crops' 
    });
  }
});

// =============================================================================
// YIELD PREDICTION ENDPOINT (keep existing functionality)
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
// CHATBOT ENDPOINTS (keep existing functionality)
// =============================================================================

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/api/health', (req, res) => {
  const dbStatus = analyticsDb ? 'connected' : 'disconnected';
  res.json({ 
    success: true, 
    message: 'Server is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const startServer = async () => {
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Initialize database
    await initializeDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🍃 Database: MongoDB${analyticsDb ? ' (Connected)' : ' (Disconnected)'}`);
      console.log(`📊 Analytics: ${analyticsDb ? 'Enabled' : 'Limited functionality'}`);
      console.log(`🔮 ML Prediction: Enabled`);
      console.log(`🤖 Gemini Chat: ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Disabled'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Graceful shutdown initiated...');
  
  if (analyticsDb) {
    analyticsDb.close();
  }
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('🍃 MongoDB connection closed');
  }
  
  console.log('✅ Server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  if (analyticsDb) {
    analyticsDb.close();
  }
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  
  process.exit(0);
});

// Start the server
startServer();