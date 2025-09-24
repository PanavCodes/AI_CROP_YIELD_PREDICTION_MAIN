const Database = require('duckdb').Database;
const path = require('path');
const fs = require('fs');

class CropDatabase {
  constructor() {
    this.db = null;
    this.connection = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
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
        
        // Create connection (synchronously as per DuckDB API)
        this.connection = this.db.connect();
        console.log('🔌 Database connection established');
        
        // Initialize schema synchronously first, then mark as initialized
        await this.initializeSchema();
        this.isInitialized = true;
        console.log('✅ Database fully initialized');
        
        return this;
        
      } catch (error) {
        console.error('❌ Database initialization failed:', error);
        console.error('❌ Error details:', error.message);
        
        // Clean up on error
        this.cleanup();
        throw error;
      }
    })();

    return this.initPromise;
  }

  async initializeSchema() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Initializing database schema...');
      
      // Test connection first
      this.connection.all('SELECT 1 as connection_test', (err, result) => {
        if (err) {
          console.error('❌ Connection test failed:', err);
          return reject(err);
        }
        
        console.log('✅ Database connection verified:', result);
        
        // Create crop_data table
        console.log('📋 Creating crop_data table...');
        this.connection.exec(`
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
        `, (err1) => {
          if (err1) {
            console.error('❌ Failed to create crop_data table:', err1);
            return reject(err1);
          }
          
          console.log('✅ crop_data table ready');
          
          // Create upload_batches table
          console.log('📋 Creating upload_batches table...');
          this.connection.exec(`
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
          `, (err2) => {
            if (err2) {
              console.error('❌ Failed to create upload_batches table:', err2);
              return reject(err2);
            }
            
            console.log('✅ upload_batches table ready');
            
            // Test table creation
            this.connection.all("SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'", (err3, tables) => {
              if (err3) {
                console.warn('⚠️ Could not query information_schema, but tables should be created');
              } else {
                console.log('📊 Database tables:', tables.map(t => t.table_name));
              }
              
              console.log('✅ Database schema initialized successfully');
              resolve();
            });
          });
        });
      });
    });
  }

  // Helper method to run queries with promises
  async run(query, params = []) {
    // Ensure database is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.connection) {
      throw new Error('Database connection not available');
    }
    
    return new Promise((resolve, reject) => {
      try {
        const trimmed = (query || '').trim();
        const head = trimmed.substring(0, 10).toUpperCase();
        const isResultQuery = head.startsWith('SELECT') || head.startsWith('WITH') || head.startsWith('PRAGMA') || head.startsWith('SHOW');

        if (isResultQuery) {
          this.connection.all(query, params, (err, result) => {
            if (err) {
              console.error('❌ Select query failed:', err.message);
              reject(err);
            } else {
              resolve(result || []);
            }
          });
        } else {
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

  // Simple method to insert test data
  async insertTestData() {
    await this.initialize();
    
    const testRecords = [
      {
        upload_batch_id: 'test-batch-1',
        field_name: 'Test Field 1',
        state: 'Punjab',
        district: 'Amritsar',
        crop_type: 'Rice',
        yield_per_hectare: 45.5,
        field_size_hectares: 2.3,
        data_source: 'test_data',
        upload_timestamp: Date.now()
      }
    ];
    
    return this.batchInsertCropData(testRecords);
  }

  // Simplified bulk insert
  async batchInsertCropData(records) {
    await this.initialize();
    
    if (!records || records.length === 0) {
      console.log('❌ No records to insert!');
      return [];
    }
    
    const timestamp = Date.now();
    let successCount = 0;
    
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        const query = `
          INSERT INTO crop_data (id, upload_batch_id, field_name, state, district, crop_type, yield_per_hectare, field_size_hectares, data_source, upload_timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
          timestamp + i,
          record.upload_batch_id || 'unknown',
          record.field_name || 'Unknown Field',
          record.state || 'Unknown State',
          record.district || 'Unknown District',
          record.crop_type || 'Unknown Crop',
          parseFloat(record.yield_per_hectare) || 0,
          parseFloat(record.field_size_hectares) || 0,
          record.data_source || 'csv_upload',
          record.upload_timestamp || timestamp
        ];
        
        await this.run(query, params);
        successCount++;
      } catch (singleErr) {
        console.error(`❌ Error inserting record ${i + 1}:`, singleErr.message);
      }
    }
    
    console.log(`✅ Inserted ${successCount}/${records.length} records successfully`);
    return [{ batch: 1, count: successCount }];
  }

  // Get crop data with filtering and pagination
  async getCropData(filters = {}, limit = 100, offset = 0) {
    await this.initialize();
    
    let query = 'SELECT * FROM crop_data WHERE 1=1';
    let params = [];
    
    if (filters.crop_type) {
      query += ' AND crop_type = ?';
      params.push(filters.crop_type);
    }
    
    if (filters.state) {
      query += ' AND state = ?';
      params.push(filters.state);
    }
    
    if (filters.upload_batch_id) {
      query += ' AND upload_batch_id = ?';
      params.push(filters.upload_batch_id);
    }
    
    query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const result = await this.run(query, params);
    return result;
  }

  // Get statistics
  async getStatistics() {
    await this.initialize();
    
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
    this.initPromise = null;
  }

  close() {
    this.cleanup();
  }
}

module.exports = CropDatabase;