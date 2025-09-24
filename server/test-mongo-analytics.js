const mongoose = require('mongoose');
const MongoAnalyticsService = require('./services/mongoAnalyticsService');

console.log('🧪 Testing MongoDB Analytics Service...');

async function testMongoAnalytics() {
  try {
    // Connect to MongoDB (using test database)
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crop-prediction-test';
    console.log(`🔗 Connecting to: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');

    // Initialize analytics service
    const analytics = new MongoAnalyticsService();
    await analytics.initialize();
    console.log('✅ Analytics service initialized');

    // Test data insertion
    console.log('\n📝 Testing data insertion...');
    const testRecords = [
      {
        upload_batch_id: 'test-batch-1',
        field_name: 'Test Field Alpha',
        state: 'Punjab',
        district: 'Amritsar',
        crop_type: 'Rice',
        yield_per_hectare: 45.5,
        field_size_hectares: 2.3,
        data_source: 'test_data'
      },
      {
        upload_batch_id: 'test-batch-1',
        field_name: 'Test Field Beta',
        state: 'Punjab',
        district: 'Ludhiana',
        crop_type: 'Wheat',
        yield_per_hectare: 38.2,
        field_size_hectares: 3.1,
        data_source: 'test_data'
      },
      {
        upload_batch_id: 'test-batch-2',
        field_name: 'Test Field Gamma',
        state: 'Maharashtra',
        district: 'Pune',
        crop_type: 'Cotton',
        yield_per_hectare: 15.8,
        field_size_hectares: 5.0,
        data_source: 'test_data'
      }
    ];

    const insertResult = await analytics.insertCropData(testRecords);
    console.log('✅ Data insertion result:', insertResult);

    // Test statistics
    console.log('\n📊 Testing statistics...');
    const stats = await analytics.getStatistics();
    console.log('📈 Statistics:', JSON.stringify(stats, null, 2));

    // Test data retrieval with filters
    console.log('\n🔍 Testing data retrieval...');
    const punjabData = await analytics.getCropData({ state: 'Punjab' }, 10, 0);
    console.log(`📄 Punjab data (${punjabData.length} records):`, punjabData);

    // Test yield analysis
    console.log('\n📊 Testing yield analysis...');
    const analysis = await analytics.getYieldAnalysis();
    console.log('📈 Yield analysis:', JSON.stringify(analysis, null, 2));

    // Test crop distribution
    console.log('\n🗺️ Testing crop distribution...');
    const distribution = await analytics.getCropDistribution();
    console.log('🌾 Crop distribution:', JSON.stringify(distribution, null, 2));

    // Test top performers
    console.log('\n🏆 Testing top performing crops...');
    const topCrops = await analytics.getTopPerformingCrops(5);
    console.log('🥇 Top crops:', JSON.stringify(topCrops, null, 2));

    // Test batch info insertion
    console.log('\n📦 Testing batch info insertion...');
    await analytics.insertBatchInfo({
      batchId: 'test-batch-1',
      filename: 'test-data.csv',
      fileSize: 1024,
      totalRows: 3,
      validRows: 3,
      invalidRows: 0,
      status: 'completed'
    });
    console.log('✅ Batch info inserted');

    console.log('\n✅ All MongoDB Analytics tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;

  } finally {
    // Clean up
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the test
testMongoAnalytics()
  .then(() => {
    console.log('🎉 MongoDB Analytics Service test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });