const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const CropDatabase = require('./schema'); // DuckDB schema

class HybridDatabaseManager {
  constructor() {
    this.mongodb = null;
    this.duckdb = null;
    this.isConnected = false;
  }

  // Initialize both databases
  async initialize() {
    console.log('🔄 Initializing hybrid database system...');
    
    try {
      // Initialize MongoDB
      await this.initializeMongoDB();
      
      // Initialize DuckDB (with graceful degradation)
      await this.initializeDuckDB();
      
      this.isConnected = true;
      
      const mongoStatus = this.isMongoConnected() ? 'Connected' : 'Unavailable';
      const duckStatus = this.isDuckDBConnected() ? 'Connected' : 'Unavailable';
      
      console.log('✅ Hybrid database system initialized successfully');
      console.log(`📊 System Status: MongoDB: ${mongoStatus}, DuckDB: ${duckStatus}`);
      
    } catch (error) {
      console.error('❌ Critical database initialization failed:', error);
      throw error;
    }
  }

  // Initialize MongoDB for user management
  async initializeMongoDB() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crop-prediction-agrisense';
    
    try {
      console.log('🍃 Connecting to MongoDB...');
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB connected successfully');
      
      // Test connection
      const db = mongoose.connection.db;
      await db.admin().ping();
      console.log('✅ MongoDB connection verified');
      
    } catch (error) {
      console.warn('⚠️ MongoDB connection failed, running without user management:', error.message);
      console.log('💡 To enable user management, install and start MongoDB or use MongoDB Atlas');
    }
  }

  // Initialize DuckDB for analytics
  async initializeDuckDB() {
    try {
      console.log('🦆 Initializing DuckDB...');
      this.duckdb = new CropDatabase();
      
      // Wait for schema initialization with longer timeout
      await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            // Test the database connection
            const result = await this.duckdb.run('SELECT 1 as test');
            console.log('✅ DuckDB initialized successfully');
            resolve(result);
          } catch (err) {
            console.error('❌ DuckDB test query failed:', err);
            // Try to continue anyway for graceful degradation
            console.log('⚠️ Continuing without DuckDB - analytics features will be limited');
            this.duckdb = null;
            resolve(null);
          }
        }, 500); // Increased timeout
      });
      
    } catch (error) {
      console.warn('⚠️ DuckDB initialization failed:', error.message);
      console.log('💡 Analytics features will be disabled');
      this.duckdb = null; // Set to null for graceful degradation
    }
  }

  // Get MongoDB connection status
  isMongoConnected() {
    return mongoose.connection.readyState === 1;
  }

  // Get DuckDB connection status
  isDuckDBConnected() {
    return this.duckdb !== null;
  }

  // Get database status
  getStatus() {
    return {
      mongodb: this.isMongoConnected(),
      duckdb: this.isDuckDBConnected(),
      hybrid: this.isConnected
    };
  }

  // Graceful shutdown
  async close() {
    console.log('🔄 Closing hybrid database connections...');
    
    try {
      // Close MongoDB
      if (this.isMongoConnected()) {
        await mongoose.connection.close();
        console.log('🍃 MongoDB connection closed');
      }
      
      // Close DuckDB
      if (this.duckdb) {
        this.duckdb.close();
        console.log('🦆 DuckDB connection closed');
      }
      
      this.isConnected = false;
      console.log('✅ Hybrid database system closed successfully');
      
    } catch (error) {
      console.error('❌ Error closing databases:', error);
    }
  }
}

// =============================================================================
// MONGOOSE SCHEMAS FOR USER MANAGEMENT
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

// Create models
const Farmer = mongoose.model('Farmer', farmerSchema);
const FieldProfile = mongoose.model('FieldProfile', fieldProfileSchema);

module.exports = {
  HybridDatabaseManager,
  Farmer,
  FieldProfile
};