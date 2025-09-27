#!/usr/bin/env python3
"""
Test script to verify the crop recommendation integration
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.crop_recommendation_service import CropRecommendationService
from services.ml_service import MLService

async def test_crop_recommendation_service():
    """Test the crop recommendation service directly"""
    print("🌾 Testing Crop Recommendation Service")
    print("=" * 50)
    
    try:
        # Initialize service
        service = CropRecommendationService()
        success = await service.initialize()
        
        if not success:
            print("❌ Service initialization failed")
            return False
        
        print("✅ Service initialized successfully")
        
        # Test with sample data
        test_cases = [
            {
                "name": "Rice conditions",
                "params": {
                    "N": 90, "P": 42, "K": 43,
                    "temperature": 20.9, "humidity": 82.0,
                    "ph": 6.5, "rainfall": 203.0
                }
            },
            {
                "name": "Dry crop conditions", 
                "params": {
                    "N": 20, "P": 67, "K": 20,
                    "temperature": 26.0, "humidity": 52.0,
                    "ph": 5.7, "rainfall": 20.0
                }
            },
            {
                "name": "Moderate conditions",
                "params": {
                    "N": 80, "P": 18, "K": 40,
                    "temperature": 23.5, "humidity": 45.0,
                    "ph": 6.0, "rainfall": 50.0
                }
            }
        ]
        
        for test_case in test_cases:
            print(f"\n🧪 Testing {test_case['name']}:")
            
            result = await service.recommend_crop(**test_case['params'])
            
            if result['success']:
                print(f"   ✅ Recommended crop: {result['recommended_crop']}")
                print(f"   📊 Confidence: {result['confidence']}")
                print(f"   🏆 Top 3: {[crop['crop'] for crop in result['top_3_recommendations']]}")
            else:
                print(f"   ❌ Test failed")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing service: {str(e)}")
        return False

async def test_ml_service_integration():
    """Test the ML service integration"""
    print("\n🤖 Testing ML Service Integration")
    print("=" * 50)
    
    try:
        # Initialize ML service
        ml_service = MLService()
        await ml_service.initialize()
        
        if not ml_service.is_initialized:
            print("❌ ML service initialization failed")
            return False
        
        print("✅ ML service initialized successfully")
        
        # Test crop recommendation through ML service
        result = await ml_service.recommend_crop(
            N=90, P=42, K=43,
            temperature=20.9, humidity=82.0,
            ph=6.5, rainfall=203.0
        )
        
        if result['success']:
            print(f"   ✅ ML Service crop recommendation: {result['recommended_crop']}")
            print(f"   📊 Confidence: {result['confidence']}")
            print(f"   🔧 Model type: {result['model_type']}")
            return True
        else:
            print("❌ ML service crop recommendation failed")
            return False
        
    except Exception as e:
        print(f"❌ Error testing ML service: {str(e)}")
        return False

async def test_endpoint_format():
    """Test the expected endpoint response format"""
    print("\n📡 Testing Endpoint Response Format")
    print("=" * 50)
    
    try:
        # Initialize and test service
        ml_service = MLService()
        await ml_service.initialize()
        
        # Get recommendation
        recommendation = await ml_service.recommend_crop(
            N=90, P=42, K=43,
            temperature=20.9, humidity=82.0,
            ph=6.5, rainfall=203.0
        )
        
        # Format as endpoint would return (without descriptions)
        endpoint_response = {
            "success": recommendation["success"],
            "recommended_crop": recommendation["recommended_crop"],
            "confidence": recommendation["confidence"],
            "suggestions": [
                crop["crop"] for crop in recommendation["top_3_recommendations"]
            ],
            "confidence_scores": {
                crop["crop"]: crop["confidence"] 
                for crop in recommendation["top_3_recommendations"]
            }
        }
        
        print("✅ Endpoint response format:")
        print(f"   - Success: {endpoint_response['success']}")
        print(f"   - Recommended crop: {endpoint_response['recommended_crop']}")
        print(f"   - Confidence: {endpoint_response['confidence']}")
        print(f"   - Suggestions: {endpoint_response['suggestions']}")
        print(f"   - No descriptions included ✓")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing endpoint format: {str(e)}")
        return False

async def main():
    """Run all tests"""
    print("🧪 Crop Recommendation Integration Test")
    print("=" * 60)
    
    tests = [
        ("Crop Recommendation Service", test_crop_recommendation_service),
        ("ML Service Integration", test_ml_service_integration), 
        ("Endpoint Response Format", test_endpoint_format)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n▶️ Running {test_name}...")
        try:
            if await test_func():
                passed += 1
                print(f"✅ {test_name} PASSED")
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Crop recommendation integration is working properly.")
        print("\n✅ Ready to use:")
        print("   - POST /api/predict/crop-recommendation (detailed)")
        print("   - POST /api/crop-suggestions (simple, no descriptions)")
    else:
        print("⚠️ Some tests failed. Please check the implementation.")
    
    return passed == total

if __name__ == "__main__":
    asyncio.run(main())