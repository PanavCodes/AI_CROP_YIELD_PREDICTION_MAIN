# 🌾 Enhanced Crop Prediction Backend

This enhanced backend integrates the **Agrisense tech stack** with your existing crop prediction functionality.

## 🚀 **What's New - Agrisense Integration**

### **✅ Tech Stack Additions:**
- **MongoDB + Mongoose** - NoSQL database with object modeling
- **JWT Authentication** - Secure token-based authentication
- **bcryptjs** - Password hashing and security
- **Weather APIs** - Real-time weather data integration
- **AI Services** - Hugging Face and external ML models
- **Image Processing** - Sharp for plant disease detection
- **Security Suite** - Helmet, rate limiting, XSS protection
- **Enhanced Validation** - Comprehensive input validation

## 🎯 **Features**

### **🔐 Authentication System**
- JWT-based secure authentication
- Password hashing with bcrypt
- Role-based access control (farmer/admin)
- Session management

### **📊 Enhanced Data Models**
- **Farmer Profiles** - Complete farmer information with all new fields
- **Field Profiles** - GPS-enabled field management
- **Crop Data** - Season, yield, weather, and soil tracking
- **Historical Data** - Soil and weather data tracking over time

### **🤖 AI Integration**
- **Agricultural Chat Assistant** - Context-aware farming advice
- **Plant Disease Detection** - AI-powered image analysis
- **Crop Recommendations** - Data-driven suggestions
- **Weather Analysis** - Real-time weather integration

### **🌍 External APIs**
- **Weather API** - Live weather data
- **Hugging Face** - AI/ML models
- **AgMarkNet** - Crop price data
- **Soil Data APIs** - Enhanced soil analysis
- **Unsplash** - Agricultural imagery

## 📋 **API Endpoints**

### **Authentication**
```
POST /api/auth/signup    - Register new farmer
POST /api/auth/login     - Login farmer
```

### **Field Management**  
```
GET  /api/field-profiles     - Get farmer's field profiles
POST /api/field-profiles     - Save field profile
GET  /api/dashboard          - Enhanced dashboard data
```

### **AI Services**
```
POST /api/ai/chat            - AI agricultural assistant
POST /api/ai/detect-disease  - Plant disease detection
```

### **Data Management**
```
POST /api/upload/csv         - Upload crop data
GET  /api/crop-data          - Get crop data with filters
POST /api/fields/ingest-location - Process field location
```

### **Existing Features (Preserved)**
```
POST /api/chat/gemini        - Gemini AI chat
GET  /api/health             - Health check
```

## 🔧 **Environment Variables**

The enhanced backend requires these environment variables (see `.env.example`):

### **Required**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret

### **Optional APIs**
- `WEATHER_API_KEY` - WeatherAPI.com key
- `GEMINI_API_KEY` - Google Gemini API key
- `HF_TOKEN` - Hugging Face token
- `UNSPLASH_ACCESS_KEY` - Unsplash API key
- `AGMARKNET_API_KEY` - AgMarkNet API key
- `PYTHON_AI_SERVICE_URL` - External AI service URL

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
cd server
npm install
```

### **2. Setup Environment**
```bash
# Run the setup script
node setup-enhanced.js

# Update .env with your API keys
# See .env.example for all available options
```

### **3. Start Enhanced Server**
```bash
# Start with enhanced Agrisense features
node enhanced-server.js

# OR start original server
node app.js
```

### **4. Install MongoDB (if needed)**
```bash
# Windows (via Chocolatey)
choco install mongodb

# macOS (via Homebrew)
brew install mongodb-community

# Or use MongoDB Atlas (cloud)
# Update MONGO_URI in .env with Atlas connection string
```

## 📊 **Database Schema**

### **Farmer Collection**
```javascript
{
  farmerId: String (unique),
  farmerName: String,
  email: String (unique),
  password: String (hashed),
  
  // Location
  state: String,
  district: String,
  currentCity: String,
  
  // Enhanced Crop Data
  crop: String,
  season: 'Rabi' | 'Kharif' | 'Zaid' | 'Perennial',
  cultivation_year: Number,
  areaHectare: Number,
  yieldQuintal: Number,
  expected_yield: Number,
  actual_yield: Number,
  
  // Soil Data  
  N: Number, P: Number, K: Number,
  ph: Number,
  soilTemperature: Number,
  soilMoisture: Number,
  
  // Weather Data
  temperature: Number,
  humidity: Number,
  rainfall: Number,
  
  role: 'farmer' | 'admin'
}
```

### **Field Profiles Collection**
```javascript
{
  farmerId: String,
  field_profile: {
    field_name: String,
    field_size_hectares: Number,
    soil_type: String,
    location: {
      latitude: Number,
      longitude: Number,
      name: String,
      district: String,
      state: String
    },
    irrigation: {
      method: String,
      availability: 'None' | 'Low' | 'Medium' | 'High'
    },
    crops: [{
      crop_type: String,
      planting_date: String,
      season: String,
      cultivation_year: Number,
      expected_yield: Number,
      actual_yield: Number,
      fertilizers_used: [String],
      pesticides_used: [String],
      previous_crop: String,
      soil_test_results: {
        N: Number, P: Number, K: Number, pH: Number
      },
      weather_data: {
        temperature: Number,
        humidity: Number,
        rainfall: Number
      }
    }]
  }
}
```

## 🔒 **Security Features**

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - API request throttling
- **Input Sanitization** - MongoDB injection prevention
- **XSS Protection** - Cross-site scripting prevention
- **CORS Configuration** - Origin-based access control
- **Helmet Security** - Security headers

## 📈 **Performance & Caching**

- **Memory Caching** - Weather and soil data caching
- **Connection Pooling** - MongoDB connection optimization
- **Image Optimization** - Sharp-based image processing
- **API Response Caching** - 2-hour cache duration for external APIs

## 🧪 **Testing the Enhanced Backend**

### **1. Health Check**
```bash
curl http://localhost:5000/api/health
```

### **2. Register Farmer**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "farmerName": "Test Farmer",
    "email": "test@farmer.com", 
    "password": "password123",
    "state": "Karnataka",
    "district": "Bangalore"
  }'
```

### **3. Login**  
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@farmer.com",
    "password": "password123"
  }'
```

### **4. Access Protected Route**
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🆚 **Enhanced vs Original Backend**

| Feature | Original | Enhanced |
|---------|----------|----------|
| **Database** | DuckDB only | DuckDB + MongoDB |
| **Authentication** | None | JWT-based |
| **User Management** | None | Complete farmer profiles |
| **Weather Data** | None | Real-time weather APIs |
| **AI Integration** | Gemini only | Gemini + Hugging Face + Custom AI |
| **Image Processing** | None | Sharp-based disease detection |
| **Security** | Basic | Comprehensive (Helmet, rate limiting, etc.) |
| **Field Management** | Basic location | GPS + comprehensive profiles |
| **API Design** | Simple | RESTful with authentication |

## 🌟 **Next Steps**

1. **Get API Keys** - Sign up for Weather API, Hugging Face, etc.
2. **Setup MongoDB** - Local installation or MongoDB Atlas
3. **Configure Environment** - Update .env with your keys  
4. **Test Integration** - Use the API endpoints
5. **Deploy** - Set up production environment

The enhanced backend is now **fully compatible with the Agrisense tech stack** while preserving all your existing functionality! 🎉