const Database = require('duckdb').Database;
const path = require('path');
const fs = require('fs');

class CropDatabase {
  constructor() {
    this.db = null;
    this.connection = null;
    this.isInitialized = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    try {
      // Create database file in data directory
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`📁 Created data directory: ${dataDir}`);
      }

      const dbPath = path.join(dataDir, 'crop_data.db');
      console.log(`🔍 Database path: ${dbPath}`);
      
      // Create database instance
      this.db = new Database(dbPath);
      console.log('🗄️ Database instance created');
      
      // Create connection
      this.connection = this.db.connect();
      console.log('🔌 Database connection established');
      
      // Initialize schema
      await this.initializeSchema();
      this.isInitialized = true;
      console.log('✅ Database fully initialized');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Stack trace:', error.stack);
      
      // Clean up on error
      this.cleanup();
      throw error;
    }
  }

  async initializeSchema() {
    try {
      console.log('🔧 Initializing database schema...');
      
      // Test connection first with a simple query
      const testResult = await this.run('SELECT 1 as connection_test');
      console.log('✅ Database connection verified:', testResult);
      
      // Create simple crop_data table
      console.log('📋 Creating crop_data table...');
      const createCropDataTable = `
        CREATE TABLE IF NOT EXISTS crop_data (
          id BIGINT,
          upload_batch_id VARCHAR,
          field_name VARCHAR,
          state VARCHAR,
          district VARCHAR,
          crop_type VARCHAR,
          yield_per_hectare DOUBLE,
          field_size_hectares DOUBLE,
          data_source VARCHAR,
          upload_timestamp BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await this.run(createCropDataTable);
      console.log('✅ crop_data table ready');

      // Create upload_batches table
      console.log('📋 Creating upload_batches table...');
      const createBatchesTable = `
        CREATE TABLE IF NOT EXISTS upload_batches (
          batch_id VARCHAR,
          filename VARCHAR,
          file_size INTEGER,
          total_rows INTEGER,
          valid_rows INTEGER,
          invalid_rows INTEGER,
          processing_status VARCHAR,
          upload_timestamp BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await this.run(createBatchesTable);
      console.log('✅ upload_batches table ready');

      // Test table creation
      const tablesResult = await this.run("SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'");
      console.log('📊 Database tables:', tablesResult.map(t => t.table_name));

      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database schema:', error);
      console.error('❌ Schema error details:', error.message);
      throw error;
    }
  }

  // Helper method to ensure database is initialized before operations
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initPromise;
    }
    if (!this.connection) {
      throw new Error('Database connection not available');
    }
  }

  // Helper method to run queries with promises and proper error handling
  async run(query, params = []) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
        const trimmed = (query || '').trim();
        const head = trimmed.substring(0, 10).toUpperCase();
        const isResultQuery = head.startsWith('SELECT') || head.startsWith('WITH') || head.startsWith('PRAGMA') || head.startsWith('SHOW');

        // If parameters provided, always use 'all' which returns results
        if (params && params.length > 0) {
          this.connection.all(query, params, (err, result) => {
            if (err) {
              console.error('❌ Query with params failed:', err.message);
              reject(err);
            } else {
              resolve(result);
            }
          });
          return;
        }

        // For queries without params, choose based on type
        if (isResultQuery) {
          this.connection.all(query, (err, result) => {
            if (err) {
              console.error('❌ Select query failed:', err.message);
              reject(err);
            } else {
              resolve(result);
            }
          });
        } else {
          // DDL/DML where we don't expect rows back
          this.connection.exec(query, (err) => {
            if (err) {
              console.error('❌ Exec query failed:', err.message);
              reject(err);
            } else {
              resolve([]);
            }
          });
        }
      } catch (syncError) {
        console.error('❌ Synchronous error in run():', syncError.message);
        reject(syncError);
      }
    });
  }

  // Simplified bulk insert for better reliability
  async batchInsertCropData(records) {
    await this.ensureInitialized();
    
    if (!records || records.length === 0) {
      console.log('❌ No records to insert!');
      return [];
    }
    
    const timestamp = Date.now();
    
    try {
      // Build single bulk insert query for all records
      const values = records.map((record, idx) => {
        const id = timestamp + idx;
        const upload_batch_id = (record.upload_batch_id || 'unknown').replace(/'/g, "''");
        const field_name = (record.field_name || 'Unknown Field').replace(/'/g, "''");
        const state = (record.state || 'Unknown State').replace(/'/g, "''");
        const district = (record.district || 'Unknown District').replace(/'/g, "''");
        const crop_type = (record.crop_type || 'Unknown Crop').replace(/'/g, "''");
        const yield_per_hectare = parseFloat(record.yield_per_hectare) || 0;
        const field_size_hectares = parseFloat(record.field_size_hectares) || 0;
        const data_source = (record.data_source || 'csv_upload').replace(/'/g, "''");
        const upload_timestamp = timestamp;
        
        return `(${id}, '${upload_batch_id}', '${field_name}', '${state}', '${district}', '${crop_type}', ${yield_per_hectare}, ${field_size_hectares}, '${data_source}', ${upload_timestamp})`;
      }).join(', ');
      
      const query = `
        INSERT INTO crop_data (id, upload_batch_id, field_name, state, district, crop_type, yield_per_hectare, field_size_hectares, data_source, upload_timestamp)
        VALUES ${values}
      `;
      
      console.log(`💾 Inserting ${records.length} records in single bulk operation`);
      
      // Execute the bulk insert
      await this.run(query);
      console.log(`✅ Successfully executed bulk insert`);
      
      return [{ batch: 1, count: records.length }];
      
    } catch (err) {
      console.error(`❌ Error in bulk insert:`, err.message);
      
      // Fallback: try inserting records one by one
      console.log('🔄 Falling back to individual inserts...');
      let successCount = 0;
      
      for (let i = 0; i < records.length; i++) {
        try {
          const record = records[i];
          const singleQuery = `
            INSERT INTO crop_data (id, upload_batch_id, field_name, state, district, crop_type, yield_per_hectare, field_size_hectares, data_source, upload_timestamp)
            VALUES (${timestamp + i}, '${(record.upload_batch_id || 'unknown').replace(/'/g, "''")}', '${(record.field_name || 'Unknown Field').replace(/'/g, "''")}', '${(record.state || 'Unknown State').replace(/'/g, "''")}', '${(record.district || 'Unknown District').replace(/'/g, "''")}', '${(record.crop_type || 'Unknown Crop').replace(/'/g, "''")}', ${parseFloat(record.yield_per_hectare) || 0}, ${parseFloat(record.field_size_hectares) || 0}, '${(record.data_source || 'csv_upload').replace(/'/g, "''")}', ${timestamp})
          `;
          await this.run(singleQuery);
          successCount++;
        } catch (singleErr) {
          console.error(`❌ Error inserting record ${i + 1}:`, singleErr.message);
        }
      }
      
      console.log(`🔄 Individual insert complete: ${successCount}/${records.length} successful`);
      return [{ batch: 1, count: successCount }];
    }
  }

  // Get crop data with filtering and pagination
  async getCropData(filters = {}, limit = 100, offset = 0) {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM crop_data WHERE 1=1';
    
    // Build query with embedded values instead of parameters to avoid DuckDB issues
    if (filters.crop_type) {
      query += ` AND crop_type = '${filters.crop_type.replace(/'/g, "''")}'`;
    }
    
    if (filters.state) {
      query += ` AND state = '${filters.state.replace(/'/g, "''")}'`;
    }
    
    if (filters.upload_batch_id) {
      query += ` AND upload_batch_id = '${filters.upload_batch_id.replace(/'/g, "''")}'`;
    }
    
    query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const result = await this.run(query);
    return result;
  }

  // Get statistics
  async getStatistics() {
    await this.ensureInitialized();
    
    try {
      const stats = await this.run(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT crop_type) as unique_crops,
          COUNT(DISTINCT state) as unique_states,
          COUNT(DISTINCT upload_batch_id) as total_uploads,
          AVG(yield_per_hectare) as avg_yield,
          MIN(upload_timestamp) as first_upload,
          MAX(upload_timestamp) as latest_upload
        FROM crop_data
      `);
      
      return stats && stats.length > 0 ? stats[0] : {
        total_records: 0,
        unique_crops: 0,
        unique_states: 0,
        total_uploads: 0,
        avg_yield: 0,
        first_upload: null,
        latest_upload: null
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        total_records: 0,
        unique_crops: 0,
        unique_states: 0,
        total_uploads: 0,
        avg_yield: 0,
        first_upload: null,
        latest_upload: null
      };
    }
  }

  cleanup() {
    try {
      if (this.connection) {
        this.connection.close();
        console.log('🔌 Database connection closed');
        this.connection = null;
      }
      if (this.db) {
        this.db.close();
        console.log('🗄️ Database instance closed');
        this.db = null;
      }
    } catch (error) {
      console.error('❌ Error closing database:', error.message);
    }
    this.isInitialized = false;
  }

  close() {
    this.cleanup();
  }
}

module.exports = CropDatabase;