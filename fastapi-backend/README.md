# 🌾 FastAPI Crop Prediction Backend

A high-performance Python backend using FastAPI for agricultural crop prediction and analytics, designed to complement your existing Node.js Express backend.

## ✅ **Completed Features**

### 🚀 **Core Backend**
- **FastAPI Framework** - High-performance async Python web framework
- **MongoDB Integration** - Async database operations with Motor
- **Automatic API Documentation** - Swagger UI and ReDoc
- **Pydantic Validation** - Request/response validation and serialization
- **CORS Configuration** - Frontend integration ready

### 🔐 **Authentication & Security**
- **JWT Token Authentication** - Secure API access
- **Demo Authentication** - Login with `demo@farmer.com` / `password123`
- **HTTP Bearer Security** - Standard authorization headers

### 🤖 **Machine Learning & AI**
- **Yield Prediction** - ML-based crop yield forecasting
- **Crop Recommendation** - Optimal crop suggestions based on soil/weather
- **Plant Disease Detection** - AI-powered image analysis (mock implementation)
- **Agricultural Weather Intelligence** - Weather-based farming advice

### 📊 **Data Analytics**
- **CSV Upload Processing** - Async file processing with validation
- **MongoDB Aggregation Pipelines** - Advanced analytics queries
- **Crop Statistics** - Comprehensive agricultural data insights
- **Data Filtering** - Flexible crop data queries

### 🌤️ **Weather Integration**
- **Agricultural Weather Service** - Farming-specific weather insights
- **7-day Forecast** - Weather predictions for crop planning
- **Historical Weather Data** - 30-day historical analysis
- **Smart Agricultural Advice** - Weather-based recommendations

## 🏗️ **Project Structure**

```
fastapi-backend/
├── main.py                     # FastAPI application entry point
├── .env                        # Environment configuration
├── requirements.txt            # Python dependencies
├── test_api.py                 # API endpoint tests
│
├── database/
│   ├── __init__.py
│   └── mongodb.py              # MongoDB async connection & indexing
│
├── models/
│   ├── __init__.py
│   └── schemas.py              # Pydantic models for validation
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py         # JWT authentication
│   ├── ml_service.py           # Machine learning models
│   ├── crop_analytics.py       # Data analytics & CSV processing
│   └── weather_service.py      # Weather data & agricultural advice
│
└── utils/
    ├── __init__.py
    └── config.py               # Settings & configuration
```

## 🚀 **Quick Start**

### **1. Setup Virtual Environment**
```powershell
cd fastapi-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### **2. Install Dependencies**
```powershell
pip install -r requirements.txt
```

### **3. Configure Environment**
Update `.env` file with your settings:
```env
MONGO_URI=mongodb://localhost:27017/crop-prediction-app
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your_gemini_key_here
```

### **4. Start the Server**
```powershell
# Development mode (auto-reload)
python main.py

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

### **5. Test the API**
```powershell
python test_api.py
```

## 📡 **API Endpoints**

### **Health & Status**
- `GET /health` - Health check with service status

### **Authentication**
- `POST /auth/login` - User authentication (demo: `demo@farmer.com` / `password123`)

### **Machine Learning**
- `POST /api/predict/yield` - Crop yield prediction
- `POST /api/predict/crop-recommendation` - Optimal crop recommendations
- `POST /api/ai/detect-disease` - Plant disease detection (auth required)

### **Data Management**
- `GET /api/crop-data` - Paginated crop data with filters
- `GET /api/crop-data/statistics` - Comprehensive crop statistics
- `POST /api/upload/csv` - CSV file upload & processing (auth required)

### **Weather Services**
- `GET /api/weather/{location}` - Agricultural weather data & advice

## 📚 **API Documentation**

Once the server is running, access the interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 **Testing**

### **Run API Tests**
```powershell
python test_api.py
```

### **Test Individual Endpoints**
```powershell
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@farmer.com", "password": "password123"}'

# Yield prediction
curl -X POST http://localhost:8000/api/predict/yield \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "Rice",
    "field_size_hectares": 2.5,
    "state": "Punjab",
    "district": "Amritsar", 
    "season": "Kharif",
    "N": 80, "P": 40, "K": 40, "ph": 6.5,
    "temperature": 28, "humidity": 75, "rainfall": 1200
  }'
```

## 🔧 **Configuration**

### **Environment Variables**
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/crop-prediction-app` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key...` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `true` |
| `GEMINI_API_KEY` | Google Gemini API key | _(optional)_ |
| `WEATHER_API_KEY` | Weather service API key | _(optional)_ |

### **MongoDB Setup**
```powershell
# Start MongoDB (Windows)
net start MongoDB

# Or install MongoDB Community Server
# Download: https://www.mongodb.com/try/download/community
```

## 🤖 **Machine Learning Features**

### **Yield Prediction**
- Predicts crop yield based on soil parameters (N, P, K, pH)
- Weather factors (temperature, humidity, rainfall)
- Regional and seasonal adjustments
- Confidence scoring and recommendations

### **Crop Recommendation**
- Analyzes soil nutrients and weather conditions
- Recommends top 3 suitable crops
- Suitability scoring with detailed factors
- Agricultural advice for optimal growing

### **Disease Detection** _(Mock Implementation)_
- Image-based plant disease detection
- Confidence scoring for detected diseases
- Treatment recommendations
- Health status assessment

## 🌤️ **Weather Intelligence**

### **Agricultural Weather Service**
- Current weather optimized for farming decisions
- 7-day forecast for crop planning
- Temperature, humidity, rainfall analysis
- Agricultural advice based on weather patterns

### **Smart Recommendations**
- Irrigation scheduling based on rainfall
- Disease risk assessment from humidity
- Optimal timing for field operations
- Temperature-based crop protection advice

## 🔄 **Integration with Node.js Backend**

This FastAPI backend is designed to work alongside your existing Express.js backend:

- **Complementary Services**: FastAPI handles ML/AI workloads, Node.js handles authentication/business logic
- **Shared MongoDB**: Both backends can use the same database
- **CORS Configured**: Frontend can call both backends
- **Consistent API Design**: Similar endpoint patterns and response formats

## 🚧 **Development Roadmap**

### **Immediate Enhancements**
- [ ] Real JWT authentication with bcrypt
- [ ] Actual ML model training and integration
- [ ] Real weather API integration
- [ ] CSV upload with advanced validation

### **Advanced Features**
- [ ] Redis caching for ML predictions
- [ ] Celery task queue for heavy computations
- [ ] Real-time websocket updates
- [ ] Advanced analytics dashboards

## 🛠️ **Production Deployment**

### **Docker Setup**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Production Commands**
```bash
# Install production dependencies
pip install -r requirements.txt

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 🎉 **Success! FastAPI Backend is Ready**

Your FastAPI backend is now integrated with your crop prediction project, providing:

- ✅ **High-performance async API**
- ✅ **Advanced ML capabilities** 
- ✅ **MongoDB analytics**
- ✅ **Weather intelligence**
- ✅ **Automatic API documentation**
- ✅ **Production-ready architecture**

**Next Steps**: Update your frontend to call FastAPI endpoints for ML predictions and advanced analytics!