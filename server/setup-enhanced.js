// Enhanced Backend Setup Script
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Enhanced Backend with Agrisense Tech Stack...');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️  Please update .env with your API keys!');
  } else {
    console.log('❌ .env.example not found. Please create environment file.');
  }
} else {
  console.log('✅ .env file already exists');
}

// Create necessary directories
const directories = ['uploads', 'data', 'database'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`✅ Directory exists: ${dir}`);
  }
});

console.log('');
console.log('🎉 Setup complete! To start the enhanced server:');
console.log('');
console.log('1. Update your .env file with API keys:');
console.log('   - MONGO_URI (MongoDB connection)');
console.log('   - WEATHER_API_KEY (Weather API)');
console.log('   - GEMINI_API_KEY (Google Gemini)');
console.log('   - HF_TOKEN (Hugging Face)');
console.log('');
console.log('2. Start the server:');
console.log('   node enhanced-server.js');
console.log('');
console.log('🔧 Available API Endpoints:');
console.log('   🔐 POST /api/auth/signup - Register farmer');
console.log('   🔐 POST /api/auth/login - Login farmer');
console.log('   👤 GET/POST /api/field-profiles - Manage field profiles');
console.log('   📊 GET /api/dashboard - Enhanced dashboard data');
console.log('   🤖 POST /api/ai/chat - AI agricultural assistant');
console.log('   🌿 POST /api/ai/detect-disease - Plant disease detection');
console.log('   📤 POST /api/upload/csv - Upload crop data');
console.log('   💚 GET /api/health - Health check');
console.log('');