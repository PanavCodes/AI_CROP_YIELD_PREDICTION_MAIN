"""
Crop analytics service for data processing and statistical analysis
"""

import logging
import pandas as pd
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
from database.mongodb import get_database, get_crop_data_collection, get_upload_batches_collection
from models.schemas import CropDataResponse

logger = logging.getLogger(__name__)

class CropAnalyticsService:
    """Service for crop data analytics and processing"""
    
    def __init__(self):
        pass
    
    async def get_crop_data(self, filters: Dict[str, Any] = None, limit: int = 100, offset: int = 0) -> List[CropDataResponse]:
        """
        Get paginated crop data with optional filters
        """
        try:
            collection = get_crop_data_collection()
            
            # Build MongoDB query from filters
            query = {}
            if filters:
                for key, value in filters.items():
                    if value:
                        query[key] = {"$regex": value, "$options": "i"}  # Case-insensitive regex
            
            # Execute query with pagination
            cursor = collection.find(query).skip(offset).limit(limit)
            documents = await cursor.to_list(length=limit)
            
            # Convert to response models
            result = []
            for doc in documents:
                # Convert ObjectId to string
                doc["_id"] = str(doc["_id"])
                result.append(CropDataResponse(**doc))
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching crop data: {str(e)}")
            raise
    
    async def get_comprehensive_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive crop data statistics using MongoDB aggregation
        """
        try:
            collection = get_crop_data_collection()
            
            # Aggregation pipeline for comprehensive statistics
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_records": {"$sum": 1},
                        "unique_crops": {"$addToSet": "$crop_type"},
                        "unique_states": {"$addToSet": "$state"},
                        "unique_districts": {"$addToSet": "$district"},
                        "avg_yield": {"$avg": "$yield_per_hectare"},
                        "min_yield": {"$min": "$yield_per_hectare"},
                        "max_yield": {"$max": "$yield_per_hectare"},
                        "total_area": {"$sum": "$field_size_hectares"}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "total_records": 1,
                        "unique_crops": {"$size": "$unique_crops"},
                        "unique_states": {"$size": "$unique_states"},
                        "unique_districts": {"$size": "$unique_districts"},
                        "avg_yield": {"$round": ["$avg_yield", 2]},
                        "min_yield": 1,
                        "max_yield": 1,
                        "total_area_hectares": {"$round": ["$total_area", 2]}
                    }
                }
            ]
            
            # Execute aggregation
            result = await collection.aggregate(pipeline).to_list(1)
            
            if not result:
                return {
                    "total_records": 0,
                    "unique_crops": 0,
                    "unique_states": 0,
                    "unique_districts": 0,
                    "avg_yield": 0,
                    "min_yield": 0,
                    "max_yield": 0,
                    "total_area_hectares": 0,
                    "top_crops": [],
                    "top_states": []
                }
            
            stats = result[0]
            
            # Get top crops by average yield
            top_crops = await self.get_top_crops_by_yield()
            stats["top_crops"] = top_crops
            
            # Get top states by total area
            top_states = await self.get_top_states_by_area()
            stats["top_states"] = top_states
            
            return stats
            
        except Exception as e:
            logger.error(f"Error fetching statistics: {str(e)}")
            raise
    
    async def get_top_crops_by_yield(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top crops by average yield"""
        try:
            collection = get_crop_data_collection()
            
            pipeline = [
                {
                    "$group": {
                        "_id": "$crop_type",
                        "avg_yield": {"$avg": "$yield_per_hectare"},
                        "total_area": {"$sum": "$field_size_hectares"},
                        "record_count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "crop_type": "$_id",
                        "avg_yield": {"$round": ["$avg_yield", 2]},
                        "total_area": {"$round": ["$total_area", 2]},
                        "record_count": 1,
                        "_id": 0
                    }
                },
                {"$sort": {"avg_yield": -1}},
                {"$limit": limit}
            ]
            
            result = await collection.aggregate(pipeline).to_list(limit)
            return result
            
        except Exception as e:
            logger.error(f"Error fetching top crops: {str(e)}")
            return []
    
    async def get_top_states_by_area(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top states by total cultivation area"""
        try:
            collection = get_crop_data_collection()
            
            pipeline = [
                {
                    "$group": {
                        "_id": "$state",
                        "total_area": {"$sum": "$field_size_hectares"},
                        "avg_yield": {"$avg": "$yield_per_hectare"},
                        "record_count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "state": "$_id",
                        "total_area": {"$round": ["$total_area", 2]},
                        "avg_yield": {"$round": ["$avg_yield", 2]},
                        "record_count": 1,
                        "_id": 0
                    }
                },
                {"$sort": {"total_area": -1}},
                {"$limit": limit}
            ]
            
            result = await collection.aggregate(pipeline).to_list(limit)
            return result
            
        except Exception as e:
            logger.error(f"Error fetching top states: {str(e)}")
            return []
    
    async def process_csv_upload(self, file, user_id: str) -> Dict[str, Any]:
        """
        Process uploaded CSV file and insert data into database
        """
        try:
            start_time = datetime.utcnow()
            
            # Generate batch ID
            batch_id = str(uuid.uuid4())
            
            # Read CSV content
            content = await file.read()
            
            # Process with pandas
            import io
            df = pd.read_csv(io.BytesIO(content))
            
            # Validate and clean data
            valid_rows, invalid_rows, errors = await self._validate_crop_data(df)
            
            if valid_rows:
                # Insert valid data
                await self._insert_crop_data(valid_rows, batch_id)
            
            # Record upload batch
            await self._record_upload_batch(
                batch_id=batch_id,
                filename=file.filename,
                file_size=len(content),
                total_rows=len(df),
                valid_rows=len(valid_rows),
                invalid_rows=len(invalid_rows),
                user_id=user_id
            )
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            return {
                "success": True,
                "upload_batch_id": batch_id,
                "total_rows": len(df),
                "valid_rows": len(valid_rows),
                "invalid_rows": len(invalid_rows),
                "processing_time": round(processing_time, 3),
                "errors": errors[:10]  # Return first 10 errors
            }
            
        except Exception as e:
            logger.error(f"CSV upload processing error: {str(e)}")
            raise
    
    async def _validate_crop_data(self, df: pd.DataFrame) -> tuple:
        """Validate crop data from DataFrame"""
        
        valid_rows = []
        invalid_rows = []
        errors = []
        
        required_columns = ['field_name', 'state', 'district', 'crop_type', 'yield_per_hectare', 'field_size_hectares']
        
        # Check required columns
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            errors.append(f"Missing required columns: {missing_columns}")
            return [], df.to_dict('records'), errors
        
        for idx, row in df.iterrows():
            try:
                # Check for required fields
                if pd.isna(row['field_name']) or pd.isna(row['state']) or pd.isna(row['crop_type']):
                    errors.append(f"Row {idx + 1}: Missing required fields")
                    invalid_rows.append(row.to_dict())
                    continue
                
                # Validate numeric fields
                if not pd.isna(row['yield_per_hectare']) and row['yield_per_hectare'] <= 0:
                    errors.append(f"Row {idx + 1}: Invalid yield value")
                    invalid_rows.append(row.to_dict())
                    continue
                
                if not pd.isna(row['field_size_hectares']) and row['field_size_hectares'] <= 0:
                    errors.append(f"Row {idx + 1}: Invalid field size")
                    invalid_rows.append(row.to_dict())
                    continue
                
                # Create valid row
                valid_row = {
                    'field_name': str(row['field_name']).strip(),
                    'state': str(row['state']).strip(),
                    'district': str(row['district']).strip() if not pd.isna(row['district']) else '',
                    'crop_type': str(row['crop_type']).strip(),
                    'yield_per_hectare': float(row['yield_per_hectare']) if not pd.isna(row['yield_per_hectare']) else 0.0,
                    'field_size_hectares': float(row['field_size_hectares']) if not pd.isna(row['field_size_hectares']) else 0.0,
                    'data_source': 'csv_upload',
                    'upload_timestamp': int(datetime.utcnow().timestamp())
                }
                
                valid_rows.append(valid_row)
                
            except Exception as e:
                errors.append(f"Row {idx + 1}: {str(e)}")
                invalid_rows.append(row.to_dict())
        
        return valid_rows, invalid_rows, errors
    
    async def _insert_crop_data(self, data: List[Dict], batch_id: str):
        """Insert crop data into database"""
        
        collection = get_crop_data_collection()
        
        # Add batch_id to all records
        for record in data:
            record['upload_batch_id'] = batch_id
            record['created_at'] = datetime.utcnow()
        
        # Bulk insert
        if data:
            await collection.insert_many(data)
            logger.info(f"Inserted {len(data)} crop records with batch_id: {batch_id}")
    
    async def _record_upload_batch(self, batch_id: str, filename: str, file_size: int,
                                 total_rows: int, valid_rows: int, invalid_rows: int, user_id: str):
        """Record upload batch information"""
        
        collection = get_upload_batches_collection()
        
        batch_record = {
            'batch_id': batch_id,
            'filename': filename,
            'file_size': file_size,
            'total_rows': total_rows,
            'valid_rows': valid_rows,
            'invalid_rows': invalid_rows,
            'processing_status': 'completed',
            'upload_timestamp': int(datetime.utcnow().timestamp()),
            'user_id': user_id,
            'created_at': datetime.utcnow()
        }
        
        await collection.insert_one(batch_record)
        logger.info(f"Recorded upload batch: {batch_id}")
    
    async def get_yield_analysis_by_state_crop(self, state: Optional[str] = None, 
                                             crop_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get yield analysis grouped by state and crop type"""
        try:
            collection = get_crop_data_collection()
            
            # Build match stage
            match_stage = {}
            if state:
                match_stage['state'] = {"$regex": state, "$options": "i"}
            if crop_type:
                match_stage['crop_type'] = {"$regex": crop_type, "$options": "i"}
            
            pipeline = [
                {"$match": match_stage} if match_stage else {"$match": {}},
                {
                    "$group": {
                        "_id": {
                            "state": "$state",
                            "crop_type": "$crop_type"
                        },
                        "avg_yield": {"$avg": "$yield_per_hectare"},
                        "record_count": {"$sum": 1},
                        "total_area": {"$sum": "$field_size_hectares"},
                        "min_yield": {"$min": "$yield_per_hectare"},
                        "max_yield": {"$max": "$yield_per_hectare"}
                    }
                },
                {
                    "$project": {
                        "state": "$_id.state",
                        "crop_type": "$_id.crop_type",
                        "avg_yield": {"$round": ["$avg_yield", 2]},
                        "record_count": 1,
                        "total_area": {"$round": ["$total_area", 2]},
                        "min_yield": {"$round": ["$min_yield", 2]},
                        "max_yield": {"$round": ["$max_yield", 2]},
                        "_id": 0
                    }
                },
                {"$sort": {"avg_yield": -1}},
                {"$limit": 50}  # Limit results
            ]
            
            result = await collection.aggregate(pipeline).to_list(50)
            return result
            
        except Exception as e:
            logger.error(f"Error in yield analysis: {str(e)}")
            return []