const Database = require('duckdb').Database;
const path = require('path');
const fs = require('fs');

class RobustCropDatabase {
  constructor() {
    this.db = null;
    this.conn = null;
    this.isInitialized = false;
    this.dbPath = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return this;
    }

    try {
      // Create data directory
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`📁 Created data directory: ${dataDir}`);
      }

      // Use a unique database file name to avoid conflicts
      const timestamp = Date.now();
      this.dbPath = path.join(dataDir, `crop_data_${timestamp}.db`);
      console.log(`🔍 Database path: ${this.dbPath}`);
      
      // Initialize database
      this.db = new Database(this.dbPath);
      this.conn = this.db.connect();
      console.log('🔌 DuckDB connection established');
      
      // Initialize schema
      await this.initializeSchema();
      this.isInitialized = true;
      console.log('✅ DuckDB database initialized successfully');
      
      return this;
    } catch (error) {
      console.error('❌ DuckDB initialization failed:', error);
      this.cleanup();
      throw error;
    }
  }

  async initializeSchema() {
    console.log('🔧 Initializing database schema...');
    
    // Test connection
    await this.query('SELECT 1 as connection_test');
    console.log('✅ Database connection verified');
    
    // Create crop_data table
    await this.exec(`
      CREATE TABLE IF NOT EXISTS crop_data (
        id BIGINT PRIMARY KEY,
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
    `);
    console.log('✅ crop_data table created');

    // Create upload_batches table
    await this.exec(`
      CREATE TABLE IF NOT EXISTS upload_batches (
        batch_id VARCHAR PRIMARY KEY,
        filename VARCHAR,
        file_size INTEGER,
        total_rows INTEGER,
        valid_rows INTEGER,
        invalid_rows INTEGER,
        processing_status VARCHAR,
        upload_timestamp BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ upload_batches table created');

    // Create indexes for better performance
    await this.exec('CREATE INDEX IF NOT EXISTS idx_crop_data_state ON crop_data(state)');
    await this.exec('CREATE INDEX IF NOT EXISTS idx_crop_data_crop_type ON crop_data(crop_type)');
    await this.exec('CREATE INDEX IF NOT EXISTS idx_crop_data_upload_batch ON crop_data(upload_batch_id)');
    console.log('✅ Indexes created');

    console.log('✅ Database schema initialized successfully');
  }

  // Helper method for queries that return results
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.conn) {
        return reject(new Error('Database connection not available'));
      }

      if (params.length > 0) {
        this.conn.all(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      } else {
        this.conn.all(sql, (err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      }
    });
  }

  // Helper method for commands that don't return results
  exec(sql) {
    return new Promise((resolve, reject) => {
      if (!this.conn) {
        return reject(new Error('Database connection not available'));
      }

      this.conn.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Insert crop data with proper error handling
  async insertCropData(records) {
    if (!Array.isArray(records) || records.length === 0) {
      console.log('❌ No valid records to insert');
      return { success: false, inserted: 0 };
    }

    await this.initialize();

    let insertedCount = 0;
    const timestamp = Date.now();

    // Insert records one by one for better error handling
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        const id = timestamp + i;
        
        const sql = `
          INSERT INTO crop_data (
            id, upload_batch_id, field_name, state, district, 
            crop_type, yield_per_hectare, field_size_hectares, 
            data_source, upload_timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          id,
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

        // Use exec for INSERT statements to avoid parameter binding issues
        const insertSql = `
          INSERT INTO crop_data (
            id, upload_batch_id, field_name, state, district, 
            crop_type, yield_per_hectare, field_size_hectares, 
            data_source, upload_timestamp
          ) VALUES (
            ${id}, 
            '${(record.upload_batch_id || 'unknown').replace(/'/g, "''")}'', 
            '${(record.field_name || 'Unknown Field').replace(/'/g, "''")}'', 
            '${(record.state || 'Unknown State').replace(/'/g, "''")}'', 
            '${(record.district || 'Unknown District').replace(/'/g, "''")}'', 
            '${(record.crop_type || 'Unknown Crop').replace(/'/g, "''")}'', 
            ${parseFloat(record.yield_per_hectare) || 0}, 
            ${parseFloat(record.field_size_hectares) || 0}, 
            '${(record.data_source || 'csv_upload').replace(/'/g, "''")}'', 
            ${record.upload_timestamp || timestamp}
          )
        `;
        await this.exec(insertSql);
        insertedCount++;
      } catch (error) {
        console.error(`❌ Error inserting record ${i + 1}:`, error.message);
      }
    }

    console.log(`✅ Inserted ${insertedCount}/${records.length} records successfully`);
    return { success: true, inserted: insertedCount };
  }

  // Get crop data with filters
  async getCropData(filters = {}, limit = 100, offset = 0) {
    await this.initialize();
    
    let sql = 'SELECT * FROM crop_data WHERE 1=1';
    let params = [];
    
    if (filters.crop_type) {
      sql += ' AND crop_type = ?';
      params.push(filters.crop_type);
    }
    
    if (filters.state) {
      sql += ' AND state = ?';
      params.push(filters.state);
    }
    
    if (filters.upload_batch_id) {
      sql += ' AND upload_batch_id = ?';
      params.push(filters.upload_batch_id);
    }
    
    sql += ' ORDER BY id DESC';
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    return await this.query(sql, params);
  }

  // Get statistics
  async getStatistics() {
    await this.initialize();
    
    try {
      const stats = await this.query(`
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
      
      return stats.length > 0 ? stats[0] : {
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

  // Insert batch info
  async insertBatchInfo(batchInfo) {
    await this.initialize();
    
    const sql = `
      INSERT INTO upload_batches (
        batch_id, filename, file_size, total_rows, valid_rows, 
        invalid_rows, processing_status, upload_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      batchInfo.batchId,
      batchInfo.filename,
      batchInfo.fileSize,
      batchInfo.totalRows,
      batchInfo.validRows,
      batchInfo.invalidRows,
      batchInfo.status,
      Date.now()
    ];

    return await this.query(sql, params);
  }

  // Get crop yield analysis by state and crop
  async getYieldAnalysis(state = null, crop = null) {
    await this.initialize();
    
    let sql = `
      SELECT 
        state,
        crop_type,
        COUNT(*) as record_count,
        AVG(yield_per_hectare) as avg_yield,
        MIN(yield_per_hectare) as min_yield,
        MAX(yield_per_hectare) as max_yield,
        SUM(field_size_hectares) as total_area
      FROM crop_data 
      WHERE 1=1
    `;
    
    let params = [];
    
    if (state) {
      sql += ' AND state = ?';
      params.push(state);
    }
    
    if (crop) {
      sql += ' AND crop_type = ?';
      params.push(crop);
    }
    
    sql += ' GROUP BY state, crop_type ORDER BY avg_yield DESC';
    
    return await this.query(sql, params);
  }

  cleanup() {
    try {
      if (this.conn) {
        this.conn.close();
        console.log('🔌 Database connection closed');
        this.conn = null;
      }
      if (this.db) {
        this.db.close();
        console.log('🗄️ Database instance closed');
        this.db = null;
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
    }
    this.isInitialized = false;
  }

  close() {
    this.cleanup();
  }

  // Graceful shutdown - properly close connections
  async shutdown() {
    console.log('🛑 Shutting down DuckDB database...');
    this.cleanup();
    
    // Small delay to ensure file handles are released
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clean up old database files if needed
    if (this.dbPath && fs.existsSync(this.dbPath)) {
      try {
        // Note: We don't delete the file as it may contain important data
        console.log(`📁 Database file preserved at: ${this.dbPath}`);
      } catch (error) {
        console.warn('⚠️ Could not clean up database file:', error.message);
      }
    }
  }
}

module.exports = RobustCropDatabase;