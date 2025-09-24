"""
MongoDB async database connection using Motor
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
import logging
from utils.config import get_settings

logger = logging.getLogger(__name__)

# Global database client and database instance
client: AsyncIOMotorClient = None
database = None

async def get_database():
    """Get MongoDB database instance"""
    global client, database
    
    if database is None:
        await connect_to_mongo()
    
    return database

async def connect_to_mongo():
    """Create database connection"""
    global client, database
    
    try:
        settings = get_settings()
        
        # Create Motor client
        client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            maxPoolSize=10,
            minPoolSize=1
        )
        
        # Test connection
        await client.admin.command('ping')
        
        # Get database name from URI or use default
        db_name = settings.MONGO_URI.split('/')[-1] or "crop-prediction-app"
        database = client[db_name]
        
        logger.info(f"✅ Connected to MongoDB database: {db_name}")
        
        # Ensure indexes exist
        await create_indexes()
        
    except ServerSelectionTimeoutError:
        logger.error("❌ Failed to connect to MongoDB - Server selection timeout")
        raise
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {str(e)}")
        raise

async def close_database_connection():
    """Close database connection"""
    global client
    
    if client:
        client.close()
        logger.info("✅ Closed MongoDB connection")

async def create_indexes():
    """Create database indexes for better performance"""
    global database
    
    try:
        # Crop data collection indexes
        crop_data = database["crop_data"]
        await crop_data.create_index("upload_batch_id")
        await crop_data.create_index("state")
        await crop_data.create_index("crop_type")
        await crop_data.create_index("upload_timestamp")
        await crop_data.create_index([("state", 1), ("crop_type", 1)])  # Compound index
        
        # Upload batches collection indexes
        upload_batches = database["upload_batches"]
        await upload_batches.create_index("batch_id", unique=True)
        await upload_batches.create_index("upload_timestamp")
        
        # Users/Farmers collection indexes
        farmers = database["farmers"]
        await farmers.create_index("email", unique=True)
        await farmers.create_index("farmer_id", unique=True)
        
        # Field profiles collection indexes  
        field_profiles = database["field_profiles"]
        await field_profiles.create_index("farmer_id")
        await field_profiles.create_index("field_profile.location.state")
        
        logger.info("✅ Created database indexes")
        
    except Exception as e:
        logger.warning(f"⚠️ Failed to create some indexes: {str(e)}")

# Collection helpers
def get_crop_data_collection():
    """Get crop data collection"""
    return database["crop_data"]

def get_upload_batches_collection():
    """Get upload batches collection"""
    return database["upload_batches"]

def get_farmers_collection():
    """Get farmers collection"""
    return database["farmers"]

def get_field_profiles_collection():
    """Get field profiles collection"""
    return database["field_profiles"]