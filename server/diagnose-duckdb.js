const Database = require('duckdb').Database;
const path = require('path');
const fs = require('fs');

console.log('🔍 DuckDB Diagnostics Starting...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform, process.arch);

async function diagnoseDuckDB() {
  // Test 1: In-memory database
  console.log('\n📝 Test 1: In-memory database');
  try {
    const memDb = new Database(':memory:');
    const memConn = memDb.connect();
    
    await new Promise((resolve, reject) => {
      memConn.all('SELECT 42 as answer', (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    memConn.close();
    memDb.close();
    console.log('✅ In-memory database: PASSED');
  } catch (error) {
    console.log('❌ In-memory database: FAILED -', error.message);
    return false;
  }

  // Test 2: File database with explicit path
  console.log('\n📝 Test 2: File database');
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'test.db');
    console.log('Database path:', dbPath);
    
    const fileDb = new Database(dbPath);
    const fileConn = fileDb.connect();
    
    // Test table creation
    await new Promise((resolve, reject) => {
      fileConn.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER, name VARCHAR)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Test insert
    await new Promise((resolve, reject) => {
      fileConn.exec("INSERT INTO test VALUES (1, 'Test')", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Test select
    const result = await new Promise((resolve, reject) => {
      fileConn.all('SELECT * FROM test', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('Query result:', result);
    
    fileConn.close();
    fileDb.close();
    
    // Clean up
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    
    console.log('✅ File database: PASSED');
    return true;
  } catch (error) {
    console.log('❌ File database: FAILED -', error.message);
    console.log('Error stack:', error.stack);
    return false;
  }
}

// Test 3: Async wrapper class
class SimpleDuckDB {
  constructor(path = ':memory:') {
    this.db = new Database(path);
    this.conn = this.db.connect();
  }
  
  query(sql) {
    return new Promise((resolve, reject) => {
      this.conn.all(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result || []);
      });
    });
  }
  
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.conn.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  close() {
    if (this.conn) this.conn.close();
    if (this.db) this.db.close();
  }
}

async function testAsyncWrapper() {
  console.log('\n📝 Test 3: Async wrapper class');
  try {
    const db = new SimpleDuckDB();
    
    await db.exec('CREATE TABLE test_async (id INTEGER, value DOUBLE)');
    await db.exec('INSERT INTO test_async VALUES (1, 3.14), (2, 2.71)');
    
    const results = await db.query('SELECT AVG(value) as avg_value FROM test_async');
    console.log('Average calculation:', results);
    
    db.close();
    console.log('✅ Async wrapper: PASSED');
    return true;
  } catch (error) {
    console.log('❌ Async wrapper: FAILED -', error.message);
    return false;
  }
}

// Run all tests
diagnoseDuckDB()
  .then(basicResult => {
    if (basicResult) {
      return testAsyncWrapper();
    }
    return false;
  })
  .then(asyncResult => {
    console.log('\n🎯 DuckDB Diagnostics Summary:');
    console.log(`Basic functionality: ${basicResult ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Async wrapper: ${asyncResult ? '✅ WORKING' : '❌ FAILED'}`);
    
    if (basicResult && asyncResult) {
      console.log('\n✅ DuckDB is functional - proceed with fixing the schema');
    } else {
      console.log('\n❌ DuckDB has issues - recommend MongoDB-only approach');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('🚨 Diagnostic script failed:', error);
    process.exit(1);
  });