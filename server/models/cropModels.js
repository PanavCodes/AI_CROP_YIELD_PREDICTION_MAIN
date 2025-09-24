const mongoose = require('mongoose');

// Schema for crop data records (equivalent to DuckDB crop_data table)
const cropDataSchema = new mongoose.Schema({
  upload_batch_id: {
    type: String,
    required: true,
    index: true
  },
  field_name: {
    type: String,
    required: true,
    default: 'Unknown Field'
  },
  state: {
    type: String,
    required: true,
    index: true
  },
  district: {
    type: String,
    required: true
  },
  crop_type: {
    type: String,
    required: true,
    index: true
  },
  yield_per_hectare: {
    type: Number,
    required: true,
    min: 0
  },
  field_size_hectares: {
    type: Number,
    required: true,
    min: 0
  },
  data_source: {
    type: String,
    required: true,
    default: 'csv_upload'
  },
  upload_timestamp: {
    type: Number,
    required: true,
    index: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'crop_data'
});

// Compound indexes for better query performance
cropDataSchema.index({ state: 1, crop_type: 1 });
cropDataSchema.index({ upload_batch_id: 1, upload_timestamp: 1 });
cropDataSchema.index({ yield_per_hectare: 1 });

// Schema for upload batch tracking (equivalent to DuckDB upload_batches table)
const uploadBatchSchema = new mongoose.Schema({
  batch_id: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  total_rows: {
    type: Number,
    required: true
  },
  valid_rows: {
    type: Number,
    required: true
  },
  invalid_rows: {
    type: Number,
    required: true
  },
  processing_status: {
    type: String,
    required: true,
    enum: ['processing', 'completed', 'failed']
  },
  upload_timestamp: {
    type: Number,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'upload_batches'
});

// Create models
const CropData = mongoose.model('CropData', cropDataSchema);
const UploadBatch = mongoose.model('UploadBatch', uploadBatchSchema);

module.exports = {
  CropData,
  UploadBatch
};