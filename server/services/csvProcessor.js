const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// Validation schema for crop data (very lenient to accept various CSV formats)
const cropDataSchema = Joi.object({
  field_id: Joi.string().optional(),
  field_name: Joi.string().allow('', null).optional(),
  farmer_name: Joi.string().optional(),
  
  // Location (very flexible)
  state: Joi.string().allow('', null).optional(),
  district: Joi.string().allow('', null).optional(),
  village: Joi.string().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  
  // Field characteristics (all optional and flexible)
  field_size_hectares: Joi.number().min(0).optional(),
  soil_type: Joi.string().optional(),
  soil_ph: Joi.number().min(0).max(14).optional(),
  organic_carbon: Joi.number().min(0).optional(),
  nitrogen: Joi.number().min(0).optional(),
  phosphorus: Joi.number().min(0).optional(),
  potassium: Joi.number().min(0).optional(),
  
  // Crop information (very flexible)
  crop_type: Joi.string().allow('', null).optional(),
  crop_variety: Joi.string().optional(),
  planting_date: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
  harvest_date: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
  growing_season: Joi.string().optional(), // Allow any season value
  
  // Agricultural practices
  irrigation_method: Joi.string().optional(),
  irrigation_frequency: Joi.string().optional(),
  fertilizers_used: Joi.string().optional(),
  pesticides_used: Joi.string().optional(),
  farming_method: Joi.string().optional(), // Allow any farming method
  
  // Yield data (flexible)
  yield_per_hectare: Joi.number().min(0).optional(),
  total_yield: Joi.number().min(0).optional(),
  yield_unit: Joi.string().optional(),
  
  // Weather data
  avg_temperature: Joi.number().optional(),
  total_rainfall: Joi.number().min(0).optional(),
  humidity_avg: Joi.number().min(0).max(100).optional(),
  
  // Economic data
  cost_per_hectare: Joi.number().min(0).optional(),
  selling_price: Joi.number().min(0).optional(),
  profit_per_hectare: Joi.number().optional(),
  
  // Metadata (automatically added)
  upload_batch_id: Joi.string().optional(),
  data_source: Joi.string().optional()
}).options({ allowUnknown: true }); // Allow unknown fields

class CSVProcessor {
  constructor() {
    this.supportedFormats = ['.csv', '.xlsx', '.xls'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  // Main method to process uploaded CSV file
  async processCSV(filePath, originalName) {
    const batchId = uuidv4();
    const results = {
      batchId,
      filename: originalName,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      processedData: [],
      summary: {}
    };

    try {
      console.log(`📊 Processing CSV file: ${originalName}`);
      
      // Parse CSV file
      const rawData = await this.parseCSVFile(filePath);
      results.totalRows = rawData.length;
      
      console.log(`📈 Parsed ${rawData.length} rows from CSV`);
      
      // Process and validate each row
      for (let i = 0; i < rawData.length; i++) {
        try {
          const processedRow = await this.processRow(rawData[i], batchId, i + 1);
          if (processedRow) {
            results.processedData.push(processedRow);
            results.validRows++;
          }
        } catch (error) {
          results.invalidRows++;
          results.errors.push({
            row: i + 1,
            data: rawData[i],
            error: error.message
          });
        }
      }
      
      // Generate summary statistics
      results.summary = this.generateSummary(results.processedData);
      
      console.log(`✅ Processing complete: ${results.validRows} valid, ${results.invalidRows} invalid`);
      
      return results;
      
    } catch (error) {
      console.error('❌ CSV processing failed:', error);
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  // Parse CSV file to JSON
  parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true, skipEmptyLines: true }))
        .on('data', row => results.push(row))
        .on('end', () => resolve(results))
        .on('error', error => reject(error));
    });
  }

  // Process and validate individual row
  async processRow(row, batchId, rowNumber) {
    // Clean and normalize data
    const cleanedRow = this.cleanRowData(row);
    
    // Validate against schema
    const { error, value } = cropDataSchema.validate(cleanedRow, { 
      allowUnknown: true, 
      stripUnknown: true 
    });
    
    if (error) {
      throw new Error(`Validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    // Add metadata
    value.upload_batch_id = batchId;
    value.data_source = 'csv_upload';
    
    // Generate field_name if not provided (use district + crop)
    if (!value.field_name) {
      const nameParts = [];
      if (value.district) nameParts.push(value.district);
      if (value.crop_type) nameParts.push(value.crop_type);
      if (nameParts.length === 0) nameParts.push('Unknown');
      value.field_name = nameParts.join(' ') + ' Field';
    }
    
    // Generate field_id if not provided
    if (!value.field_id) {
      value.field_id = `${value.field_name}_${value.state}_${Date.now()}`.replace(/\s+/g, '_');
    }
    
    console.log(`🔍 DEBUG: Processed row ${rowNumber}:`, JSON.stringify(value, null, 2));
    
    return value;
  }

  // Clean and normalize row data
  cleanRowData(row) {
    const cleaned = {};
    
    // Normalize column names and clean data
    Object.keys(row).forEach(key => {
      const normalizedKey = this.normalizeColumnName(key);
      let value = row[key];
      
      // Skip empty values
      if (value === '' || value === null || value === undefined) {
        return;
      }
      
      // Type conversions and cleaning
      if (normalizedKey.includes('date')) {
        value = this.parseDate(value);
      } else if (this.isNumericField(normalizedKey)) {
        value = this.parseNumber(value);
      } else if (typeof value === 'string') {
        value = value.trim();
        
        // Normalize crop names
        if (normalizedKey === 'crop_type') {
          value = this.normalizeCropName(value);
        }
        
        // Normalize soil types
        if (normalizedKey === 'soil_type') {
          value = this.normalizeSoilType(value);
        }
      }
      
      cleaned[normalizedKey] = value;
    });
    
    return cleaned;
  }

  // Normalize column names to match schema
  normalizeColumnName(columnName) {
    const normalized = columnName.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    // Map common column variations to standard names
    const columnMapping = {
      'field': 'field_name',
      'farm_name': 'field_name',
      'farmer': 'farmer_name',
      'area': 'field_size_hectares',
      'size': 'field_size_hectares',
      'hectares': 'field_size_hectares',
      'crop': 'crop_type',
      'variety': 'crop_variety',
      'yield': 'yield_per_hectare',
      'productivity': 'yield_per_hectare',  // This is the key fix!
      'production': 'total_yield',
      'season': 'growing_season',
      'district': 'district',
      'state': 'state',
      'ph': 'soil_ph',
      'n': 'nitrogen',
      'p': 'phosphorus',
      'k': 'potassium',
      'temp': 'avg_temperature',
      'temperature': 'avg_temperature',
      'rain': 'total_rainfall',
      'rainfall': 'total_rainfall',
      'cost': 'cost_per_hectare',
      'price': 'selling_price'
    };
    
    return columnMapping[normalized] || normalized;
  }

  // Check if field should be numeric
  isNumericField(fieldName) {
    const numericFields = [
      'field_size_hectares', 'soil_ph', 'organic_carbon', 'nitrogen', 
      'phosphorus', 'potassium', 'yield_per_hectare', 'total_yield',
      'avg_temperature', 'total_rainfall', 'humidity_avg', 
      'cost_per_hectare', 'selling_price', 'profit_per_hectare',
      'latitude', 'longitude'
    ];
    return numericFields.includes(fieldName);
  }

  // Parse date from various formats
  parseDate(dateString) {
    if (!dateString) return null;
    
    // Handle common Indian date formats
    const formats = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/   // DD/MM/YY or DD-MM-YY
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const date = new Date(match[3], match[2] - 1, match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
        }
      }
    }
    
    // Fallback to Date parsing
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  }

  // Parse number handling Indian number formats
  parseNumber(value) {
    if (typeof value === 'number') return value;
    if (!value) return null;
    
    // Handle Indian comma separated numbers (e.g., 1,50,000)
    const cleaned = value.toString().replace(/,/g, '').trim();
    const number = parseFloat(cleaned);
    
    return isNaN(number) ? null : number;
  }

  // Normalize crop names
  normalizeCropName(cropName) {
    const normalized = cropName.toLowerCase().trim();
    
    const cropMapping = {
      'paddy': 'Rice',
      'dhan': 'Rice',
      'rice': 'Rice',
      'wheat': 'Wheat',
      'gehun': 'Wheat',
      'maize': 'Maize',
      'corn': 'Maize',
      'makka': 'Maize',
      'cotton': 'Cotton',
      'kapas': 'Cotton',
      'sugarcane': 'Sugarcane',
      'ganna': 'Sugarcane'
    };
    
    return cropMapping[normalized] || cropName;
  }

  // Normalize soil types
  normalizeSoilType(soilType) {
    const normalized = soilType.toLowerCase().trim();
    
    const soilMapping = {
      'clay': 'Clay',
      'loam': 'Loamy',
      'loamy': 'Loamy',
      'sand': 'Sandy',
      'sandy': 'Sandy',
      'black': 'Black Cotton',
      'red': 'Red Laterite',
      'alluvial': 'Alluvial'
    };
    
    return soilMapping[normalized] || soilType;
  }

  // Generate summary statistics
  generateSummary(data) {
    if (data.length === 0) return {};
    
    const summary = {
      cropTypes: {},
      states: {},
      soilTypes: {},
      avgYield: 0,
      totalYield: 0,
      totalArea: 0
    };
    
    data.forEach(record => {
      // Count crop types
      if (record.crop_type) {
        summary.cropTypes[record.crop_type] = (summary.cropTypes[record.crop_type] || 0) + 1;
      }
      
      // Count states
      if (record.state) {
        summary.states[record.state] = (summary.states[record.state] || 0) + 1;
      }
      
      // Count soil types
      if (record.soil_type) {
        summary.soilTypes[record.soil_type] = (summary.soilTypes[record.soil_type] || 0) + 1;
      }
      
      // Calculate totals
      if (record.yield_per_hectare) {
        summary.totalYield += record.yield_per_hectare;
      }
      
      if (record.field_size_hectares) {
        summary.totalArea += record.field_size_hectares;
      }
    });
    
    summary.avgYield = data.length > 0 ? summary.totalYield / data.length : 0;
    
    return summary;
  }

  // Validate file before processing
  validateFile(file) {
    const errors = [];
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.supportedFormats.includes(ext)) {
      errors.push(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
    }
    
    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
    }
    
    return errors;
  }
}

module.exports = CSVProcessor;