const { getCurrentUser } = require('../utils/userUtils');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Yield prediction service adapted from Agrisense ML model
 * Uses rule-based system as fallback when ML models are unavailable
 */
class YieldPredictionService {
  constructor() {
    // Features used by the yield prediction model (from Agrisense)
    this.YIELD_FEATURES = ['Year', 'rainfall_mm', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item'];
    
    // Crop yield baselines (quintals per hectare) based on Indian agricultural data
    this.CROP_YIELD_BASELINES = {
      'Rice': 35.0,
      'Wheat': 30.0,
      'Maize': 25.0,
      'Cotton': 15.0,
      'Sugarcane': 70.0,
      'Soybean': 12.0,
      'Groundnut': 18.0,
      'Sunflower': 14.0,
      'Jowar': 10.0,
      'Bajra': 12.0,
      'Barley': 28.0,
      'Gram': 10.0
    };
  }

  /**
   * Get user's field data from request or database
   * In production, this would query user profiles from database
   * For now, we'll accept field data through the API request
   */
  getUserFieldData(userEmail) {
    try {
      // Since we're in Node.js backend, we can't access browser localStorage
      // Instead, we'll let the frontend pass the user's profile data
      // or we could implement database storage for user profiles
      console.log('🔍 Getting field data for user:', userEmail);
      
      // For now, return null and let the enhanced input data flow work
      // In production, implement database query:
      // const userProfile = await UserProfile.findOne({ email: userEmail });
      // return userProfile?.fieldProfile || null;
      
      return null;
    } catch (error) {
      console.error('Error getting user field data:', error);
      return null;
    }
  }

  /**
   * Rule-based yield prediction when ML model is unavailable
   * Adapted from Agrisense fallback logic
   */
  getFallbackYieldPrediction(inputData) {
    const {
      crop,
      state,
      year,
      rainfall,
      temperature,
      pesticides_tonnes = 0.0,
      areaHectare
    } = inputData;

    // Get base yield for the crop
    const baseYield = this.CROP_YIELD_BASELINES[crop] || 25.0; // Default 25 quintals/ha

    console.log(`📊 Base yield for ${crop}: ${baseYield} quintals/ha`);

    // Environmental factor adjustments
    let tempFactor = 1.0;
    let rainFactor = 1.0;
    let pesticideFactor = 1.0;
    let stateFactor = 1.0;

    // Temperature factor (optimal ranges vary by crop)
    const tempOptimal = this.getOptimalTemperature(crop);
    if (temperature >= tempOptimal.min && temperature <= tempOptimal.max) {
      tempFactor = 1.0;
    } else if (temperature < tempOptimal.min - 10 || temperature > tempOptimal.max + 10) {
      tempFactor = 0.6; // Severe temperature stress
    } else {
      tempFactor = 0.8; // Moderate temperature stress
    }

    // Rainfall factor (optimal ranges vary by crop)
    const rainOptimal = this.getOptimalRainfall(crop);
    if (rainfall >= rainOptimal.min && rainfall <= rainOptimal.max) {
      rainFactor = 1.0;
    } else if (rainfall < rainOptimal.min * 0.5 || rainfall > rainOptimal.max * 1.5) {
      rainFactor = 0.5; // Severe water stress/flooding
    } else {
      rainFactor = 0.75; // Moderate water stress
    }

    // Pesticide factor (moderate use can help, excessive use can harm)
    if (pesticides_tonnes === 0) {
      pesticideFactor = 0.9; // No pest protection
    } else if (pesticides_tonnes <= 0.1) {
      pesticideFactor = 1.0; // Optimal use
    } else if (pesticides_tonnes <= 0.5) {
      pesticideFactor = 0.95; // Slightly excessive
    } else {
      pesticideFactor = 0.8; // Harmful excessive use
    }

    // State factor (based on agricultural productivity)
    const highProductivityStates = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra'];
    const mediumProductivityStates = ['Karnataka', 'Andhra Pradesh', 'Telangana', 'Gujarat', 'Rajasthan'];
    
    if (highProductivityStates.includes(state)) {
      stateFactor = 1.1;
    } else if (mediumProductivityStates.includes(state)) {
      stateFactor = 1.0;
    } else {
      stateFactor = 0.9;
    }

    // Calculate predicted yield
    const predictedYield = baseYield * tempFactor * rainFactor * pesticideFactor * stateFactor;
    
    console.log(`📊 Yield calculation factors:
      - Base yield: ${baseYield}
      - Temperature factor: ${tempFactor} (temp: ${temperature}°C)
      - Rainfall factor: ${rainFactor} (rainfall: ${rainfall}mm)
      - Pesticide factor: ${pesticideFactor} (usage: ${pesticides_tonnes} tonnes)
      - State factor: ${stateFactor} (state: ${state})
      - Final yield: ${predictedYield.toFixed(2)} quintals/ha`);

    const features_used = {
      Year: year,
      rainfall_mm: rainfall,
      pesticides_tonnes: pesticides_tonnes,
      avg_temp: temperature,
      Area: state,
      Item: crop
    };

    return {
      predicted_yield_quintal_per_hectare: Math.round(predictedYield * 100) / 100,
      features_used: features_used,
      yield_advice: this.generateYieldAdvice(crop, predictedYield, inputData),
      note: "Prediction generated using rule-based agricultural model (ML model integration pending)",
      calculation_details: {
        base_yield: baseYield,
        temperature_factor: tempFactor,
        rainfall_factor: rainFactor,
        pesticide_factor: pesticideFactor,
        state_factor: stateFactor
      }
    };
  }

  /**
   * Get optimal temperature range for crop
   */
  getOptimalTemperature(crop) {
    const tempRanges = {
      'Rice': { min: 20, max: 35 },
      'Wheat': { min: 15, max: 25 },
      'Maize': { min: 18, max: 32 },
      'Cotton': { min: 21, max: 35 },
      'Sugarcane': { min: 20, max: 35 },
      'Soybean': { min: 20, max: 30 },
      'Groundnut': { min: 20, max: 30 },
      'Sunflower': { min: 18, max: 25 },
      'Jowar': { min: 20, max: 35 },
      'Bajra': { min: 23, max: 33 },
      'Barley': { min: 12, max: 25 },
      'Gram': { min: 15, max: 30 }
    };
    return tempRanges[crop] || { min: 18, max: 30 };
  }

  /**
   * Get optimal rainfall range for crop
   */
  getOptimalRainfall(crop) {
    const rainRanges = {
      'Rice': { min: 100, max: 200 },
      'Wheat': { min: 75, max: 100 },
      'Maize': { min: 50, max: 100 },
      'Cotton': { min: 50, max: 100 },
      'Sugarcane': { min: 150, max: 250 },
      'Soybean': { min: 50, max: 125 },
      'Groundnut': { min: 50, max: 75 },
      'Sunflower': { min: 40, max: 60 },
      'Jowar': { min: 45, max: 65 },
      'Bajra': { min: 40, max: 60 },
      'Barley': { min: 45, max: 65 },
      'Gram': { min: 40, max: 65 }
    };
    return rainRanges[crop] || { min: 50, max: 100 };
  }

  /**
   * Generate practical yield improvement advice
   */
  generateYieldAdvice(crop, predictedYield, inputData) {
    const { temperature, rainfall, pesticides_tonnes } = inputData;
    const advice = [];
    
    const tempOptimal = this.getOptimalTemperature(crop);
    const rainOptimal = this.getOptimalRainfall(crop);

    // Temperature advice
    if (temperature < tempOptimal.min) {
      advice.push(`🌡️ Temperature is below optimal range. Consider heat-retaining mulches or greenhouse cultivation.`);
    } else if (temperature > tempOptimal.max) {
      advice.push(`🌡️ Temperature is above optimal. Use shade nets, increase irrigation, or plant during cooler seasons.`);
    }

    // Rainfall advice
    if (rainfall < rainOptimal.min) {
      advice.push(`💧 Insufficient rainfall expected. Plan for supplemental irrigation and water-efficient varieties.`);
    } else if (rainfall > rainOptimal.max) {
      advice.push(`☔ Excessive rainfall expected. Ensure proper drainage and consider fungicide application.`);
    }

    // Pesticide advice
    if (pesticides_tonnes === 0) {
      advice.push(`🦗 Consider integrated pest management with biological controls and minimal pesticide use.`);
    } else if (pesticides_tonnes > 0.2) {
      advice.push(`⚠️ High pesticide usage detected. Reduce application and focus on biological pest control methods.`);
    }

    // Yield-specific advice
    if (predictedYield < 20) {
      advice.push(`📈 Yield is below average. Focus on soil testing, proper fertilization, and improved varieties.`);
    } else if (predictedYield > 40) {
      advice.push(`🎯 Excellent yield potential! Maintain current practices and monitor for pest/disease management.`);
    }

    return advice.length > 0 ? advice.join(' ') : `Continue with current agricultural practices for ${crop} cultivation.`;
  }

  /**
   * Call Python ML model for prediction
   */
  async callPythonMLModel(inputData) {
    return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '..', 'ml-models', 'optimized_predictor.py');
      const pythonProcess = spawn('python', [pythonScriptPath]);
      
      let outputData = '';
      let errorData = '';
      
      // Send input data to Python process
      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
      
      // Collect output
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      // Collect errors
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.log('🐍 Python ML Service:', data.toString());
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(outputData);
            console.log('✅ Python ML model prediction successful:', result);
            resolve(result);
          } catch (parseError) {
            console.error('❌ Failed to parse Python output:', outputData);
            reject(new Error(`Failed to parse ML model output: ${parseError.message}`));
          }
        } else {
          console.error('❌ Python process failed with code:', code);
          console.error('❌ Error output:', errorData);
          reject(new Error(`Python ML process failed with code ${code}: ${errorData}`));
        }
      });
      
      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error);
        reject(new Error(`Failed to start Python ML process: ${error.message}`));
      });
    });
  }

  /**
   * Main prediction method - uses real ML model with fallback
   */
  async predictYield(userEmail, inputData) {
    try {
      console.log('🔮 Starting yield prediction for user:', userEmail);
      console.log('📊 Input data:', inputData);

      // Use the input data directly (user has already provided the necessary information)
      let enhancedInputData = { ...inputData };
      
      // Apply sensible defaults if certain fields are missing
      enhancedInputData = {
        ...enhancedInputData,
        temperature: inputData.temperature || 25, // Default 25°C
        rainfall: inputData.rainfall || 100, // Default 100mm
        pesticides_tonnes: inputData.pesticides_tonnes || 0.0, // Default no pesticides
        areaHectare: inputData.areaHectare || 1.0, // Default 1 hectare
        year: inputData.year || new Date().getFullYear() // Default current year
      };

      console.log('📊 Enhanced input data:', enhancedInputData);

      // Validate required fields
      const requiredFields = ['crop', 'state', 'temperature', 'rainfall'];
      const missingFields = requiredFields.filter(field => !enhancedInputData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      try {
        // Try to use the real ML model first
        console.log('🤖 Attempting ML model prediction...');
        const mlPrediction = await this.callPythonMLModel(enhancedInputData);
        
        // Add yield advice to ML prediction
        if (mlPrediction && !mlPrediction.error) {
          mlPrediction.yield_advice = this.generateYieldAdvice(
            enhancedInputData.crop, 
            mlPrediction.predicted_yield_quintal_per_hectare, 
            enhancedInputData
          );
          
          console.log('✅ ML model prediction completed:', mlPrediction);
          return mlPrediction;
        } else {
          throw new Error(mlPrediction.error || 'ML model returned invalid result');
        }
      } catch (mlError) {
        console.warn('⚠️ ML model failed, using fallback:', mlError.message);
        
        // Fallback to rule-based prediction
        const fallbackPrediction = this.getFallbackYieldPrediction(enhancedInputData);
        fallbackPrediction.note = `ML model unavailable (${mlError.message}). ${fallbackPrediction.note}`;
        
        console.log('✅ Fallback prediction completed:', fallbackPrediction);
        return fallbackPrediction;
      }
      
    } catch (error) {
      console.error('❌ Yield prediction failed:', error);
      throw error;
    }
  }
}

module.exports = new YieldPredictionService();