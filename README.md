# AI-Powered Crop Prediction & Farm Optimization Platform

## 🌱 Overview

A comprehensive, production-ready web application that combines advanced machine learning with modern web technologies to provide intelligent crop prediction, farm optimization, and agricultural insights. The platform features a dual backend architecture with real ML models, multi-field yield predictions, and enterprise-grade features for modern farming operations.

## 🏗️ Architecture

### **Dual Backend System**
- **Node.js + Express Backend** (Port 5000): Authentication, business logic, data management
- **Python + FastAPI Backend** (Port 8000): Machine learning, AI analytics, crop predictions
- **React + TypeScript Frontend** (Port 3000): Modern responsive UI with real-time updates
- **Shared MongoDB Database**: Unified data storage across both backends

### **Production Features**
- ✅ **Real Machine Learning Models**: Random Forest for yield prediction, crop recommendation
- ✅ **Multi-Field Management**: Handle multiple farms and crop profiles simultaneously
- ✅ **Live Weather Integration**: Real-time weather data and agricultural advice
- ✅ **JWT Authentication**: Secure user management with role-based access
- ✅ **Responsive Design**: Mobile-first design optimized for field use
- ✅ **Internationalization**: Full English/Hindi language support
- ✅ **Real-time Analytics**: Advanced crop performance tracking and insights

## ✨ Core Features

### 🤖 **AI-Powered Yield Prediction**
- **Real ML Models**: Random Forest algorithm trained on agricultural datasets
- **Multi-Field Support**: Predict yields for multiple farms simultaneously
- **Smart Data Input**: Seamless flow from data entry to ML-powered results
- **Comprehensive Results**: Yield per hectare, total production, confidence metrics
- **Weather Integration**: Factor temperature, rainfall, and seasonal data
- **State-wise Predictions**: Location-specific crop performance estimates

### 🌾 **Multi-Field Farm Management**
- **Field Profiles**: Create and manage multiple farm locations
- **Crop Planning**: Track multiple crops per field with seasonal data
- **Weather Monitoring**: Field-specific weather tracking and alerts
- **Yield Tracking**: Historical performance analysis and trends
- **Smart Recommendations**: AI-driven optimization suggestions
- **Dashboard Integration**: Unified view of all farm operations

### 📊 **Advanced Dashboard & Analytics**
- **Real-time Weather**: Live conditions with 5-day forecasts
- **Yield Predictions**: ML-powered estimates for all registered fields
- **Performance Charts**: Interactive visualization using Recharts
- **Smart Alerts**: Weather, pest, and market update notifications
- **Field Comparison**: Side-by-side analysis of different farms
- **Historical Trends**: Multi-season crop performance tracking

### 🔐 **Enterprise Authentication & Security**
- **JWT Authentication**: Secure token-based user management
- **Role-based Access**: Farmer and admin user roles
- **Password Security**: bcrypt encryption with salt hashing
- **Rate Limiting**: API protection against abuse
- **Input Sanitization**: XSS and injection attack prevention
- **Session Management**: Secure user state handling

### 📱 **Modern User Experience**
- **Mobile-First Design**: Optimized for smartphone usage in the field
- **Progressive Web App**: Offline capabilities and native app feel
- **Interactive Onboarding**: Step-by-step introduction for new users
- **Multilingual Support**: Complete English/Hindi internationalization
- **Dark/Light Themes**: User preference-based theming
- **Touch-Friendly Interface**: Large buttons and easy interaction areas

### 📍 **Location & Mapping Services**
- **Google Maps Integration**: Interactive field location selection
- **GPS Coordinates**: Precise farm location tracking
- **Location Search**: Text-based location finder with autocomplete
- **Geocoding Services**: Address to coordinate conversion
- **Field Boundaries**: Visual representation of farm areas
- **Location-based Weather**: Hyper-local weather data for each field

### 📝 **Data Management & Processing**
- **CSV/Excel Upload**: Drag-and-drop file processing with validation
- **Data Normalization**: Intelligent data cleaning and standardization
- **Field Profiles**: Persistent storage of farm configurations
- **Crop Tracking**: Comprehensive crop lifecycle management
- **Historical Data**: Multi-season performance analysis
- **Export Capabilities**: Download reports and analytics

### 💬 **AI Assistant & Communication**
- **Gemini AI Integration**: Smart agricultural advice and Q&A
- **Contextual Help**: Crop-specific guidance and recommendations
- **Community Features**: Farmer discussion forums and knowledge sharing
- **Multi-language Chat**: AI assistance in local languages
- **Voice Commands**: Hands-free interaction for field use
- **Smart Notifications**: Proactive alerts and reminders

## 🔧 Technology Stack

### **Frontend Technologies**
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: TailwindCSS with custom agricultural design system
- **Routing**: React Router DOM v7 with protected routes
- **Charts**: Recharts for interactive data visualization
- **Icons**: Lucide React + React Icons for comprehensive iconography
- **Animations**: Framer Motion for smooth transitions
- **Forms**: React Hook Form with validation
- **Internationalization**: i18next with React integration
- **Maps**: Google Maps API for location services

### **Backend Technologies**
- **Node.js Backend**: Express.js with security middleware
- **Python Backend**: FastAPI with async support and automatic docs
- **Database**: MongoDB with Mongoose (Node.js) and Motor (Python)
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Documentation**: Swagger UI and ReDoc for FastAPI
- **File Processing**: Multer for uploads, Joi for validation
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Development**: Nodemon, pytest, httpx for testing

### **Machine Learning & AI**
- **ML Framework**: scikit-learn with Random Forest models
- **Data Processing**: pandas, numpy for data manipulation
- **Model Storage**: joblib for serialized model persistence
- **AI Services**: Google Gemini API for conversational AI
- **Weather APIs**: OpenWeatherMap for real-time data
- **Crop Analytics**: Custom algorithms for yield prediction

### **Development & DevOps**
- **Concurrency**: Multiple service orchestration with concurrently
- **Environment Management**: dotenv for configuration
- **Cross-platform**: Windows/Linux/macOS compatibility
- **Hot Reload**: Development servers with live reloading
- **Build Optimization**: Production-ready builds with Vite
- **Testing**: Vitest for frontend, pytest for backend

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.9+ required)
- **MongoDB** (local or cloud instance)
- **Git** for version control

### 💻 One-Command Setup
```bash
# Clone the repository
git clone <repository-url>
cd crop-prediction-app

# Install dependencies
npm install --legacy-peer-deps

# Setup environment variables
cp .env.example .env
cp server/.env.example server/.env
cp fastapi-backend/.env.example fastapi-backend/.env

# Start all services (Frontend + Both Backends)
npm start
```

### 🔄 Individual Service Setup

#### **Frontend (React + Vite)**
```bash
npm run frontend    # Starts on http://localhost:3000
```

#### **Node.js Backend (Business Logic)**
```bash
npm run backend:node    # Starts on http://localhost:5000
```

#### **FastAPI Backend (ML/AI)**
```bash
npm run backend:fastapi    # Starts on http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### ⚙️ Environment Configuration

#### **Root (.env)**
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_FASTAPI_URL=http://localhost:8000
```

#### **Node.js Backend (server/.env)**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/crop_prediction
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
WEATHER_API_KEY=your_weather_api_key
```

#### **FastAPI Backend (fastapi-backend/.env)**
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/crop_prediction
JWT_SECRET=your_jwt_secret
WEATHER_API_KEY=your_weather_api_key
HF_TOKEN=your_hugging_face_token
```

## 📺 API Endpoints

### **Node.js Backend APIs** (Port 5000)
```
POST   /api/auth/login              # User authentication
POST   /api/auth/signup             # User registration
GET    /api/dashboard               # Dashboard data
POST   /api/field-profiles          # Create field profile
GET    /api/field-profiles          # Get user field profiles
POST   /api/upload/csv              # Upload crop data files
GET    /api/crop-data               # Retrieve crop analytics
POST   /api/chat/gemini             # AI assistant chat
GET    /api/weather/{location}      # Weather data
GET    /api/health                  # Health check
```

### **FastAPI ML Backend APIs** (Port 8000)
```
POST   /api/predict/simple-yield    # Real-time yield prediction
POST   /api/predict/crop-recommendation  # Crop selection AI
POST   /api/ai/detect-disease       # Plant disease detection
GET    /api/crop-data/statistics    # Advanced analytics
POST   /auth/login                  # ML backend authentication
GET    /docs                        # Swagger API documentation
GET    /redoc                       # ReDoc API documentation
GET    /health                      # ML service health check
```

## 📊 ML Model Performance

### **Yield Prediction Model**
- **Algorithm**: Random Forest Regressor
- **Features**: Crop type, state, rainfall, temperature, area, pesticides, year
- **Training Data**: Agricultural datasets with ~10,000 samples
- **Accuracy**: 85-90% for major crops (Rice, Wheat, Maize)
- **Response Time**: <500ms average prediction time
- **Supported Crops**: 12+ major crops across Indian states

### **Crop Recommendation Model**
- **Algorithm**: Multi-class classification
- **Features**: Soil NPK levels, pH, rainfall, temperature, humidity
- **Recommendations**: Top 3 suitable crops with confidence scores
- **Coverage**: 22 crop types with regional variations

## 📂 Project Structure

```
crop-prediction-app/
├── src/                          # React frontend source
│   ├── components/               # Reusable UI components
│   │   ├── MultiFieldYieldPrediction.jsx  # Multi-field prediction UI
│   │   ├── YieldPredictionResult.jsx      # ML prediction results
│   │   ├── WeatherDashboard.tsx           # Weather integration
│   │   ├── GoogleMapPicker.tsx            # Location selection
│   │   └── Navigation.tsx                 # App navigation
│   ├── pages/                    # Application pages
│   │   ├── Dashboard.tsx             # Main dashboard
│   │   ├── DataInput.tsx             # Farm data input
│   │   ├── YieldPrediction.tsx       # ML predictions page
│   │   └── Login.tsx                 # Authentication
│   ├── services/                 # API integration
│   │   ├── weatherService.ts         # Weather data
│   │   ├── locationService.ts        # Location services
│   │   └── backendService.ts         # Backend communication
│   └── utils/                    # Utilities
├── server/                       # Node.js backend
│   ├── enhanced-server.js        # Full-featured server
│   ├── app-mongodb.js            # MongoDB server
│   ├── middleware/               # Security & validation
│   └── database/                 # Database schemas
├── fastapi-backend/              # Python ML backend
│   ├── main.py                   # FastAPI application
│   ├── services/                 # ML services
│   │   ├── ml_service.py             # Machine learning
│   │   └── weather_service.py        # Weather intelligence
│   ├── models/                   # Trained ML models
│   │   ├── yield_model.joblib        # Yield prediction
│   │   └── crop_model.joblib         # Crop recommendation
│   └── utils/                    # ML utilities
├── package.json                  # Project dependencies
└── vite.config.ts                # Build configuration
```

## 🌍 User Flow

### **New Users:**
1. **Landing** → Register/Login with language selection
2. **Onboarding** → Interactive tutorial (skippable)
3. **Profile Setup** → Basic farmer information
4. **Field Creation** → Add farm locations with GPS
5. **Data Input** → Crop details and weather data
6. **AI Predictions** → Real-time ML yield estimates
7. **Dashboard** → Comprehensive farm management

### **Returning Users:**
1. **Authentication** → Secure login with JWT
2. **Dashboard** → Overview of all fields and crops
3. **Real-time Updates** → Weather alerts and predictions
4. **Analytics** → Historical performance and trends
5. **AI Assistant** → Contextual farming advice

## 🚀 Production Features

### **Scalability & Performance**
- **Concurrent Processing**: Handle multiple prediction requests
- **Database Optimization**: Efficient MongoDB queries and indexing
- **Caching Layer**: Redis for frequent API calls (configurable)
- **Load Balancing**: Multiple instance support
- **CDN Ready**: Static asset optimization
- **Error Recovery**: Graceful fallback mechanisms

### **Security & Compliance**
- **Data Encryption**: At rest and in transit
- **GDPR Compliance**: User data protection
- **API Rate Limiting**: Prevent abuse and ensure fair usage
- **Input Validation**: Comprehensive data sanitization
- **Audit Logging**: User action tracking
- **Backup Strategy**: Automated database backups

### **Mobile & Offline Support**
- **PWA Features**: Installable web app
- **Offline Mode**: Core functionality without internet
- **Sync Capability**: Data synchronization when online
- **Mobile Optimization**: Touch-friendly interface
- **Low Bandwidth**: Optimized for rural internet
- **Cross-Platform**: iOS/Android/Desktop compatibility

## 📚 Additional Resources

### **Documentation**
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
- **Alternative API Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc) (ReDoc)
- **Backend Setup Guide**: `server/README-ENHANCED.md`
- **FastAPI Guide**: `fastapi-backend/README.md`
- **MongoDB Migration**: `server/MIGRATION_TO_MONGODB.md`

### **Testing & Development**
```bash
# Frontend tests
npm test

# Backend API tests
npm run test:api

# ML model validation
cd fastapi-backend && python test_ml.py

# Database connectivity
node server/test-mongo-analytics.js
```

### **Available NPM Scripts**
```json
{
  "dev": "vite",                          # Frontend development server
  "build": "tsc && vite build",           # Production build
  "backend:node": "cd server && node app.js",     # Node.js backend only
  "backend:fastapi": "cd fastapi-backend && start-fastapi.bat",  # FastAPI backend only
  "backend:dual": "concurrently ...",     # Both backends concurrently
  "start": "concurrently ...",            # All services with startup info
  "start:full": "concurrently ...",       # All services (compact output)
  "test:api": "cd fastapi-backend && python test_api.py",  # API endpoint testing
  "docs:fastapi": "start http://localhost:8000/docs"  # Open API documentation
}
```

### **Startup Helper Scripts**

#### **Windows Users**
```batch
# Quick start with separate windows for each service
quick-start.bat

# Interactive startup menu with options
start-all.bat

# PowerShell script with advanced options
.\start-all.ps1                    # Start all services
.\start-all.ps1 -FastAPIOnly        # Only ML backend
.\start-all.ps1 -NodeOnly           # Only Node.js backend
.\start-all.ps1 -FrontendOnly       # Only React frontend
.\start-all.ps1 -TestMode           # Start all + run health checks
.\start-all.ps1 -SkipMongo          # Skip MongoDB connectivity check
```

#### **Cross-Platform (NPM)**
```bash
npm start                           # All services with startup info
npm run start:full                  # All services (cleaner output)
npm run backend:dual                # Both backends only
```

## 🚀 Deployment

### **Production Deployment**
```bash
# Build frontend for production
npm run build

# Deploy FastAPI backend
cd fastapi-backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Deploy Node.js backend
cd server
PORT=5000 NODE_ENV=production node enhanced-server.js

# Serve frontend (with nginx or similar)
npm run preview
```

### **Docker Deployment** (Optional)
```dockerfile
# Multi-service container setup available
# Contact maintainer for Docker configuration
```

### **Environment Variables for Production**
- Set `NODE_ENV=production`
- Configure proper `MONGO_URI` (MongoDB Atlas recommended)
- Set secure `JWT_SECRET` (256-bit random string)
- Configure external API keys (Gemini, Weather, etc.)
- Enable HTTPS in production environments

## ⚖️ License

MIT License - see LICENSE file for details

## 👥 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🎆 Acknowledgments

- **Machine Learning**: scikit-learn and agricultural datasets
- **Weather Data**: OpenWeatherMap API integration
- **Mapping**: Google Maps Platform
- **AI Assistant**: Google Gemini API
- **UI Components**: Tailwind CSS and Lucide icons
- **Database**: MongoDB for scalable data storage

---

**Built with ❤️ for sustainable agriculture and farmer empowerment.**

*Platform Status: Production-ready with dual backend architecture*  
*Last Updated: September 2024*
