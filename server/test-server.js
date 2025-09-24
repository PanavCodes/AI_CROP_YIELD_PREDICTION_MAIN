require('dotenv').config();
const express = require('express');
const cors = require('cors');
const yieldPredictionService = require('./services/yieldPredictionService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 Starting minimal test server for ML integration...');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Test server is running', timestamp: new Date().toISOString() });
});

// POST /api/yield-prediction - Test the ML integration
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
    const userEmail = req.headers['user-email'] || 'test@example.com';
    
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

// Alternative endpoint that directly calls the Python ML service
app.post('/api/test-ml-direct', async (req, res) => {
  try {
    console.log('🧪 Direct ML test request:', req.body);
    
    const { spawn } = require('child_process');
    const path = require('path');
    
    const pythonScriptPath = path.join(__dirname, 'ml-models', 'yield_predictor.py');
    const inputData = JSON.stringify(req.body);
    
    const pythonProcess = spawn('python', [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      console.log('🐍 Python process stderr:', stderr);
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          res.json({
            success: true,
            data: result,
            debug: { stderr, code }
          });
        } catch (parseError) {
          res.status(500).json({
            success: false,
            error: 'Failed to parse ML response',
            debug: { stdout, stderr, code }
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: 'ML prediction failed',
          debug: { stdout, stderr, code }
        });
      }
    });
    
    // Send input data to Python script
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
    
  } catch (error) {
    console.error('❌ Direct ML test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`🔍 Available endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/yield-prediction - Full yield prediction service`);
  console.log(`   POST /api/test-ml-direct - Direct ML model test`);
});