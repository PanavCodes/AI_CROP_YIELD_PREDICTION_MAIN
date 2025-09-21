# Google Maps Integration Setup Guide

This guide explains how to set up the Google Maps integration for field location selection with Bhuvan reverse geocoding.

## 🗺️ Architecture Overview

```
User clicks on Google Maps → Coordinates captured → Backend calls Bhuvan API → Admin details returned
```

### Workflow:
1. **Display Map**: Google Maps JS API loads centered on India
2. **User Clicks**: Drop marker at clicked location, capture lat/lng
3. **Send to Backend**: POST /api/geocode/bhuvan with coordinates
4. **Bhuvan Integration**: Backend calls Bhuvan reverse geocoding API
5. **Display Results**: Show "Your field is in [village], [district]"

## 🚀 Quick Setup

### 1. Frontend Configuration

Create `.env.local` in the project root:
```bash
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAfFDVXypkWCuA-nntCrAgvmuIjMGPe8dM
```

### 2. Backend Configuration

Navigate to the server directory and create `.env`:
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```bash
# Bhuvan API Configuration
BHUVAN_API_KEY=730f11543ab5c91ebafa749c4ec72c87b06736c6

# Server Configuration
PORT=5000
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Start Both Servers

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## 🔑 API Keys Setup

### Google Maps API Key

Your API key `AIzaSyAfFDVXypkWCuA-nntCrAgvmuIjMGPe8dM` is configured. To verify it follows Google's guidelines:

#### ✅ **API Key Verification:**
1. **Test the key**: Open `test-google-maps.html` in your browser
2. **Check restrictions**: Go to [Google Cloud Console > Keys & Credentials](https://console.cloud.google.com/apis/credentials)
3. **Verify API access**: Ensure **Maps JavaScript API** is enabled
4. **Production security**: Restrict the key to your domain before production

#### 🔧 **API Key Configuration (if needed):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Google Maps Platform > Keys & Credentials**
3. Click on your API key name to edit
4. Under **API restrictions**: Select **Maps JavaScript API**
5. Under **Application restrictions**: Add your domain for production
6. Click **Save**

### Bhuvan API Key

You already have the key: `730f11543ab5c91ebafa749c4ec72c87b06736c6`
- Add to `server/.env` as `BHUVAN_API_KEY`

## 🧪 Testing the Integration

1. **Start both servers** (frontend on :3000, backend on :5000)
2. **Navigate to Data Input** page
3. **Click "Pick on Map"** button
4. **Click anywhere on the map** to drop a marker
5. **Click "Confirm Location"** to trigger reverse geocoding
6. **Verify admin details** appear: "Your field is in [village], [district]"

## 📁 File Structure

```
src/
├── components/
│   └── GoogleMapPicker.tsx      # Interactive map component
├── services/
│   ├── backendService.ts        # Backend API calls
│   └── bhuvanService.ts         # Legacy service (kept for fallback)
└── pages/
    └── DataInput.tsx            # Updated to use Google Maps

server/
├── index.js                     # Express server with Bhuvan proxy
├── package.json                 # Backend dependencies
└── .env.example                 # Environment template
```

## 🔧 Backend API Endpoints

### POST /api/geocode/bhuvan
**Request:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response:**
```json
{
  "success": true,
  "village": "New Delhi",
  "district": "Central Delhi",
  "state": "Delhi",
  "source": "bhuvan"
}
```

### GET /api/health
Health check endpoint to verify backend is running.

## 🎯 Features

- **Interactive Map**: Click-to-select field location
- **Satellite View**: Better field identification
- **Real-time Geocoding**: Instant admin details via Bhuvan
- **Caching**: 24-hour cache for repeated coordinates
- **Error Handling**: Graceful fallbacks if APIs fail
- **Mobile Responsive**: Works on all devices

## 🐛 Troubleshooting

### Map Not Loading
- Check Google Maps API key in `.env.local`
- Verify API key has Maps JavaScript API enabled
- Check browser console for errors

### Reverse Geocoding Fails
- Verify backend server is running on port 5000
- Check Bhuvan API key in `server/.env`
- Check backend logs for API errors

### CORS Issues
- Backend includes CORS middleware
- Vite proxy configured for `/api` routes

## 🚀 Production Deployment

1. **Environment Variables**: Set in production environment
2. **API Key Security**: Use domain restrictions for Google Maps
3. **Rate Limiting**: Add rate limiting to backend endpoints
4. **Caching**: Consider Redis for production caching
5. **Monitoring**: Add logging and error tracking

## 📝 Notes

- Google Maps API has usage limits (check pricing)
- Bhuvan API rate limits may apply
- Coordinates cached for 24 hours to reduce API calls
- Fallback to OpenStreetMap if Bhuvan fails (in bhuvanService.ts)
