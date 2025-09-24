const { CropData, UploadBatch } = require('../models/cropModels');

class MongoAnalyticsService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return this;
    }

    try {
      // Ensure indexes are created
      await CropData.ensureIndexes();
      await UploadBatch.ensureIndexes();
      
      this.isInitialized = true;
      console.log('✅ MongoDB Analytics Service initialized');
      return this;
    } catch (error) {
      console.error('❌ MongoDB Analytics Service initialization failed:', error);
      throw error;
    }
  }

  // Insert crop data records (equivalent to DuckDB batchInsertCropData)
  async insertCropData(records) {
    if (!Array.isArray(records) || records.length === 0) {
      console.log('❌ No valid records to insert');
      return { success: false, inserted: 0 };
    }

    await this.initialize();

    try {
      const timestamp = Date.now();
      
      // Prepare records for MongoDB
      const mongoRecords = records.map((record, index) => ({
        upload_batch_id: record.upload_batch_id || 'unknown',
        field_name: record.field_name || 'Unknown Field',
        state: record.state || 'Unknown State',
        district: record.district || 'Unknown District',
        crop_type: record.crop_type || 'Unknown Crop',
        yield_per_hectare: parseFloat(record.yield_per_hectare) || 0,
        field_size_hectares: parseFloat(record.field_size_hectares) || 0,
        data_source: record.data_source || 'csv_upload',
        upload_timestamp: record.upload_timestamp || timestamp + index
      }));

      // Insert with MongoDB's insertMany for better performance
      const result = await CropData.insertMany(mongoRecords, {
        ordered: false, // Continue inserting even if some documents fail
        rawResult: true
      });

      console.log(`✅ Inserted ${result.insertedCount}/${records.length} records successfully`);
      return { 
        success: true, 
        inserted: result.insertedCount,
        insertedIds: result.insertedIds
      };

    } catch (error) {
      console.error('❌ Error inserting crop data:', error.message);
      
      // If bulk insert fails, try individual inserts
      let insertedCount = 0;
      const timestamp = Date.now();

      for (let i = 0; i < records.length; i++) {
        try {
          const record = records[i];
          const mongoRecord = {
            upload_batch_id: record.upload_batch_id || 'unknown',
            field_name: record.field_name || 'Unknown Field',
            state: record.state || 'Unknown State',
            district: record.district || 'Unknown District',
            crop_type: record.crop_type || 'Unknown Crop',
            yield_per_hectare: parseFloat(record.yield_per_hectare) || 0,
            field_size_hectares: parseFloat(record.field_size_hectares) || 0,
            data_source: record.data_source || 'csv_upload',
            upload_timestamp: record.upload_timestamp || timestamp + i
          };

          await CropData.create(mongoRecord);
          insertedCount++;
        } catch (singleError) {
          console.error(`❌ Error inserting record ${i + 1}:`, singleError.message);
        }
      }

      console.log(`🔄 Fallback insert completed: ${insertedCount}/${records.length} successful`);
      return { success: true, inserted: insertedCount };
    }
  }

  // Get crop data with filtering and pagination (equivalent to DuckDB getCropData)
  async getCropData(filters = {}, limit = 100, offset = 0) {
    await this.initialize();

    try {
      // Build MongoDB query
      const query = {};
      
      if (filters.crop_type) {
        query.crop_type = filters.crop_type;
      }
      
      if (filters.state) {
        query.state = filters.state;
      }
      
      if (filters.district) {
        query.district = filters.district;
      }
      
      if (filters.upload_batch_id) {
        query.upload_batch_id = filters.upload_batch_id;
      }

      // Execute query with sorting and pagination
      const results = await CropData
        .find(query)
        .sort({ upload_timestamp: -1, _id: -1 }) // Sort by timestamp descending, then by _id
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean(); // Return plain objects for better performance

      return results;

    } catch (error) {
      console.error('❌ Error getting crop data:', error);
      return [];
    }
  }

  // Get comprehensive statistics (equivalent to DuckDB getStatistics)
  async getStatistics() {
    await this.initialize();

    try {
      // Use MongoDB aggregation pipeline for statistics
      const stats = await CropData.aggregate([
        {
          $group: {
            _id: null,
            total_records: { $sum: 1 },
            unique_crops: { $addToSet: '$crop_type' },
            unique_states: { $addToSet: '$state' },
            unique_uploads: { $addToSet: '$upload_batch_id' },
            avg_yield: { $avg: '$yield_per_hectare' },
            first_upload: { $min: '$upload_timestamp' },
            latest_upload: { $max: '$upload_timestamp' },
            total_area: { $sum: '$field_size_hectares' },
            min_yield: { $min: '$yield_per_hectare' },
            max_yield: { $max: '$yield_per_hectare' }
          }
        },
        {
          $project: {
            _id: 0,
            total_records: 1,
            unique_crops: { $size: '$unique_crops' },
            unique_states: { $size: '$unique_states' },
            total_uploads: { $size: '$unique_uploads' },
            avg_yield: { $round: ['$avg_yield', 2] },
            first_upload: 1,
            latest_upload: 1,
            total_area: { $round: ['$total_area', 2] },
            min_yield: 1,
            max_yield: 1
          }
        }
      ]);

      return stats.length > 0 ? stats[0] : {
        total_records: 0,
        unique_crops: 0,
        unique_states: 0,
        total_uploads: 0,
        avg_yield: 0,
        first_upload: null,
        latest_upload: null,
        total_area: 0,
        min_yield: 0,
        max_yield: 0
      };

    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      return {
        total_records: 0,
        unique_crops: 0,
        unique_states: 0,
        total_uploads: 0,
        avg_yield: 0,
        first_upload: null,
        latest_upload: null,
        total_area: 0,
        min_yield: 0,
        max_yield: 0
      };
    }
  }

  // Insert batch information (equivalent to DuckDB batch tracking)
  async insertBatchInfo(batchInfo) {
    await this.initialize();

    try {
      const batch = new UploadBatch({
        batch_id: batchInfo.batchId,
        filename: batchInfo.filename,
        file_size: batchInfo.fileSize,
        total_rows: batchInfo.totalRows,
        valid_rows: batchInfo.validRows,
        invalid_rows: batchInfo.invalidRows,
        processing_status: batchInfo.status || 'completed',
        upload_timestamp: Date.now()
      });

      await batch.save();
      console.log(`✅ Batch info saved: ${batchInfo.batchId}`);
      return batch;

    } catch (error) {
      console.error('❌ Error inserting batch info:', error);
      throw error;
    }
  }

  // Get yield analysis by state and crop (equivalent to DuckDB getYieldAnalysis)
  async getYieldAnalysis(state = null, crop = null) {
    await this.initialize();

    try {
      // Build match stage for filtering
      const matchStage = {};
      if (state) matchStage.state = state;
      if (crop) matchStage.crop_type = crop;

      const pipeline = [];
      
      // Add match stage if there are filters
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Group by state and crop_type
      pipeline.push({
        $group: {
          _id: {
            state: '$state',
            crop_type: '$crop_type'
          },
          record_count: { $sum: 1 },
          avg_yield: { $avg: '$yield_per_hectare' },
          min_yield: { $min: '$yield_per_hectare' },
          max_yield: { $max: '$yield_per_hectare' },
          total_area: { $sum: '$field_size_hectares' }
        }
      });

      // Project the results to match expected format
      pipeline.push({
        $project: {
          _id: 0,
          state: '$_id.state',
          crop_type: '$_id.crop_type',
          record_count: 1,
          avg_yield: { $round: ['$avg_yield', 2] },
          min_yield: { $round: ['$min_yield', 2] },
          max_yield: { $round: ['$max_yield', 2] },
          total_area: { $round: ['$total_area', 2] }
        }
      });

      // Sort by average yield descending
      pipeline.push({
        $sort: { avg_yield: -1 }
      });

      const results = await CropData.aggregate(pipeline);
      return results;

    } catch (error) {
      console.error('❌ Error getting yield analysis:', error);
      return [];
    }
  }

  // Get crop distribution by state
  async getCropDistribution() {
    await this.initialize();

    try {
      const pipeline = [
        {
          $group: {
            _id: {
              state: '$state',
              crop_type: '$crop_type'
            },
            count: { $sum: 1 },
            total_area: { $sum: '$field_size_hectares' },
            avg_yield: { $avg: '$yield_per_hectare' }
          }
        },
        {
          $group: {
            _id: '$_id.state',
            crops: {
              $push: {
                crop_type: '$_id.crop_type',
                count: '$count',
                total_area: { $round: ['$total_area', 2] },
                avg_yield: { $round: ['$avg_yield', 2] }
              }
            },
            total_records: { $sum: '$count' }
          }
        },
        {
          $project: {
            _id: 0,
            state: '$_id',
            total_records: 1,
            crops: 1
          }
        },
        {
          $sort: { total_records: -1 }
        }
      ];

      return await CropData.aggregate(pipeline);

    } catch (error) {
      console.error('❌ Error getting crop distribution:', error);
      return [];
    }
  }

  // Get top performing crops
  async getTopPerformingCrops(limit = 10) {
    await this.initialize();

    try {
      const pipeline = [
        {
          $group: {
            _id: '$crop_type',
            avg_yield: { $avg: '$yield_per_hectare' },
            total_records: { $sum: 1 },
            total_area: { $sum: '$field_size_hectares' },
            states: { $addToSet: '$state' }
          }
        },
        {
          $project: {
            _id: 0,
            crop_type: '$_id',
            avg_yield: { $round: ['$avg_yield', 2] },
            total_records: 1,
            total_area: { $round: ['$total_area', 2] },
            states_count: { $size: '$states' }
          }
        },
        {
          $sort: { avg_yield: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ];

      return await CropData.aggregate(pipeline);

    } catch (error) {
      console.error('❌ Error getting top performing crops:', error);
      return [];
    }
  }

  // Clean up method (not really needed for MongoDB, but keeping interface consistent)
  close() {
    console.log('🔌 MongoDB Analytics Service closed');
    // MongoDB connections are managed by Mongoose at the application level
  }
}

module.exports = MongoAnalyticsService;