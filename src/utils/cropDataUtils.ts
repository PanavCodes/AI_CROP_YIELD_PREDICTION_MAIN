// Crop-specific data utilities for dynamic dashboard display
import React from 'react';
import { GiWheat } from 'react-icons/gi';
import { FaSeedling, FaLeaf } from 'react-icons/fa';

export interface CropSpecificData {
  icon: any;
  color: string;
  gradientColor: string;
  baseYield: number; // tons per hectare
  marketPrice: number; // per quintal
  growthDuration: number; // days
  waterRequirement: 'Low' | 'Medium' | 'High';
  soilPreference: string[];
  optimalPH: { min: number; max: number };
  fertilizer: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  commonPests: string[];
  commonDiseases: string[];
  harvestSeason: string;
  marketDemand: 'Low' | 'Medium' | 'High' | 'Very High';
  profitability: 'Low' | 'Medium' | 'High';
}

export const cropDataMapping: Record<string, CropSpecificData> = {
  wheat: {
    icon: GiWheat,
    color: '#f59e0b',
    gradientColor: 'from-yellow-400 to-orange-500',
    baseYield: 45,
    marketPrice: 2200,
    growthDuration: 120,
    waterRequirement: 'Medium',
    soilPreference: ['Loamy', 'Clay', 'Silt'],
    optimalPH: { min: 6.0, max: 7.5 },
    fertilizer: {
      nitrogen: 120,
      phosphorus: 60,
      potassium: 40
    },
    commonPests: ['Aphids', 'Armyworm', 'Termites'],
    commonDiseases: ['Rust', 'Smut', 'Blight'],
    harvestSeason: 'Rabi (March-April)',
    marketDemand: 'High',
    profitability: 'High'
  },
  rice: {
    icon: FaSeedling,
    color: '#10b981',
    gradientColor: 'from-green-400 to-emerald-500',
    baseYield: 42,
    marketPrice: 2800,
    growthDuration: 140,
    waterRequirement: 'High',
    soilPreference: ['Clay', 'Loamy'],
    optimalPH: { min: 5.5, max: 6.5 },
    fertilizer: {
      nitrogen: 100,
      phosphorus: 50,
      potassium: 50
    },
    commonPests: ['Brown Planthopper', 'Stem Borer', 'Leaf Folder'],
    commonDiseases: ['Blast', 'Bacterial Blight', 'Sheath Blight'],
    harvestSeason: 'Kharif (October-November)',
    marketDemand: 'Very High',
    profitability: 'High'
  },
  corn: {
    icon: FaSeedling,
    color: '#eab308',
    gradientColor: 'from-yellow-500 to-amber-600',
    baseYield: 38,
    marketPrice: 1800,
    growthDuration: 100,
    waterRequirement: 'Medium',
    soilPreference: ['Loamy', 'Sandy', 'Silt'],
    optimalPH: { min: 6.0, max: 7.0 },
    fertilizer: {
      nitrogen: 150,
      phosphorus: 75,
      potassium: 60
    },
    commonPests: ['Fall Armyworm', 'Corn Borer', 'Cutworm'],
    commonDiseases: ['Leaf Blight', 'Rust', 'Smut'],
    harvestSeason: 'Kharif (September-October)',
    marketDemand: 'Medium',
    profitability: 'Medium'
  },
  maize: {
    icon: FaSeedling,
    color: '#eab308',
    gradientColor: 'from-yellow-500 to-amber-600',
    baseYield: 38,
    marketPrice: 1800,
    growthDuration: 100,
    waterRequirement: 'Medium',
    soilPreference: ['Loamy', 'Sandy', 'Silt'],
    optimalPH: { min: 6.0, max: 7.0 },
    fertilizer: {
      nitrogen: 150,
      phosphorus: 75,
      potassium: 60
    },
    commonPests: ['Fall Armyworm', 'Corn Borer', 'Cutworm'],
    commonDiseases: ['Leaf Blight', 'Rust', 'Smut'],
    harvestSeason: 'Kharif (September-October)',
    marketDemand: 'Medium',
    profitability: 'Medium'
  },
  cotton: {
    icon: FaLeaf,
    color: '#06b6d4',
    gradientColor: 'from-cyan-400 to-blue-500',
    baseYield: 25,
    marketPrice: 5500,
    growthDuration: 180,
    waterRequirement: 'High',
    soilPreference: ['Black Cotton', 'Loamy'],
    optimalPH: { min: 5.8, max: 8.0 },
    fertilizer: {
      nitrogen: 120,
      phosphorus: 60,
      potassium: 60
    },
    commonPests: ['Bollworm', 'Aphids', 'Thrips'],
    commonDiseases: ['Wilt', 'Leaf Curl', 'Blight'],
    harvestSeason: 'Kharif (October-December)',
    marketDemand: 'High',
    profitability: 'High'
  },
  soybean: {
    icon: FaSeedling,
    color: '#16a34a',
    gradientColor: 'from-green-500 to-green-600',
    baseYield: 28,
    marketPrice: 4200,
    growthDuration: 110,
    waterRequirement: 'Medium',
    soilPreference: ['Loamy', 'Sandy', 'Silt'],
    optimalPH: { min: 6.0, max: 7.0 },
    fertilizer: {
      nitrogen: 30, // Lower due to nitrogen fixation
      phosphorus: 80,
      potassium: 40
    },
    commonPests: ['Pod Borer', 'Stem Fly', 'Aphids'],
    commonDiseases: ['Rust', 'Blight', 'Mosaic'],
    harvestSeason: 'Kharif (September-October)',
    marketDemand: 'High',
    profitability: 'Medium'
  },
  sugarcane: {
    icon: FaSeedling,
    color: '#84cc16',
    gradientColor: 'from-lime-400 to-green-500',
    baseYield: 80,
    marketPrice: 350, // per ton
    growthDuration: 365,
    waterRequirement: 'High',
    soilPreference: ['Loamy', 'Clay'],
    optimalPH: { min: 6.5, max: 7.5 },
    fertilizer: {
      nitrogen: 200,
      phosphorus: 100,
      potassium: 120
    },
    commonPests: ['Borer', 'Aphids', 'Scale Insects'],
    commonDiseases: ['Red Rot', 'Smut', 'Wilt'],
    harvestSeason: 'Year-round',
    marketDemand: 'High',
    profitability: 'High'
  }
};

// Get crop data by crop type (case insensitive, partial match)
export const getCropData = (cropType: string): CropSpecificData => {
  const normalizedCropType = cropType.toLowerCase().trim();
  
  // Direct match first
  if (cropDataMapping[normalizedCropType]) {
    return cropDataMapping[normalizedCropType];
  }
  
  // Partial match
  for (const [key, data] of Object.entries(cropDataMapping)) {
    if (normalizedCropType.includes(key) || key.includes(normalizedCropType)) {
      return data;
    }
  }
  
  // Default fallback
  return {
    icon: FaSeedling,
    color: '#6b7280',
    gradientColor: 'from-gray-400 to-gray-500',
    baseYield: 35,
    marketPrice: 2000,
    growthDuration: 120,
    waterRequirement: 'Medium',
    soilPreference: ['Loamy'],
    optimalPH: { min: 6.0, max: 7.0 },
    fertilizer: {
      nitrogen: 100,
      phosphorus: 50,
      potassium: 50
    },
    commonPests: ['General Pests'],
    commonDiseases: ['General Diseases'],
    harvestSeason: 'Seasonal',
    marketDemand: 'Medium',
    profitability: 'Medium'
  };
};

// Calculate crop-specific yield based on soil conditions and other factors
export const calculateCropYield = (
  cropType: string,
  soilType: string,
  soilTestResults?: {
    N: number | null;
    P: number | null;
    K: number | null;
    pH: number | null;
  }
): number => {
  const cropData = getCropData(cropType);
  let yieldMultiplier = 1.0;
  
  // Soil type compatibility
  if (cropData.soilPreference.includes(soilType)) {
    yieldMultiplier += 0.1; // 10% bonus for preferred soil
  }
  
  // pH optimization
  if (soilTestResults?.pH) {
    const pH = soilTestResults.pH;
    const { min, max } = cropData.optimalPH;
    if (pH >= min && pH <= max) {
      yieldMultiplier += 0.15; // 15% bonus for optimal pH
    } else if (pH < min - 1 || pH > max + 1) {
      yieldMultiplier -= 0.1; // 10% penalty for poor pH
    }
  }
  
  // Nutrient levels
  if (soilTestResults) {
    const { N, P, K } = soilTestResults;
    const requiredN = cropData.fertilizer.nitrogen;
    const requiredP = cropData.fertilizer.phosphorus;
    const requiredK = cropData.fertilizer.potassium;
    
    // Simplified nutrient scoring (in real scenario, this would be more complex)
    if (N && N >= requiredN * 0.8) yieldMultiplier += 0.05;
    if (P && P >= requiredP * 0.8) yieldMultiplier += 0.05;
    if (K && K >= requiredK * 0.8) yieldMultiplier += 0.05;
  }
  
  return Math.round(cropData.baseYield * yieldMultiplier * 10) / 10;
};

// Get crop-specific recommendations
export const getCropRecommendations = (
  cropType: string,
  soilType: string,
  soilTestResults?: {
    N: number | null;
    P: number | null;
    K: number | null;
    pH: number | null;
  }
): {
  irrigation: string[];
  fertilizer: string[];
  pestControl: string[];
  general: string[];
} => {
  const cropData = getCropData(cropType);
  const recommendations = {
    irrigation: [] as string[],
    fertilizer: [] as string[],
    pestControl: [] as string[],
    general: [] as string[]
  };
  
  // Irrigation recommendations
  switch (cropData.waterRequirement) {
    case 'High':
      recommendations.irrigation.push('Ensure consistent water supply');
      recommendations.irrigation.push('Consider drip irrigation for efficiency');
      break;
    case 'Medium':
      recommendations.irrigation.push('Monitor soil moisture regularly');
      recommendations.irrigation.push('Water during early morning or evening');
      break;
    case 'Low':
      recommendations.irrigation.push('Avoid overwatering');
      recommendations.irrigation.push('Focus on critical growth stages');
      break;
  }
  
  // Fertilizer recommendations
  if (soilTestResults) {
    const { N, P, K, pH } = soilTestResults;
    const required = cropData.fertilizer;
    
    if (!N || N < required.nitrogen * 0.8) {
      recommendations.fertilizer.push(`Apply nitrogen fertilizer (target: ${required.nitrogen} kg/ha)`);
    }
    if (!P || P < required.phosphorus * 0.8) {
      recommendations.fertilizer.push(`Apply phosphorus fertilizer (target: ${required.phosphorus} kg/ha)`);
    }
    if (!K || K < required.potassium * 0.8) {
      recommendations.fertilizer.push(`Apply potassium fertilizer (target: ${required.potassium} kg/ha)`);
    }
    
    if (pH && (pH < cropData.optimalPH.min || pH > cropData.optimalPH.max)) {
      if (pH < cropData.optimalPH.min) {
        recommendations.fertilizer.push('Apply lime to increase soil pH');
      } else {
        recommendations.fertilizer.push('Apply sulfur to decrease soil pH');
      }
    }
  }
  
  // Pest control recommendations
  recommendations.pestControl.push(`Monitor for ${cropData.commonPests.join(', ')}`);
  recommendations.pestControl.push(`Watch for signs of ${cropData.commonDiseases.join(', ')}`);
  
  // General recommendations
  recommendations.general.push(`Optimal harvest time: ${cropData.harvestSeason}`);
  recommendations.general.push(`Growth duration: ${cropData.growthDuration} days`);
  if (!cropData.soilPreference.includes(soilType)) {
    recommendations.general.push(`Consider soil improvement for better yield (preferred: ${cropData.soilPreference.join(', ')})`);
  }
  
  return recommendations;
};

// Get market insights for crop
export const getCropMarketInsights = (cropType: string) => {
  const cropData = getCropData(cropType);
  
  return {
    currentPrice: cropData.marketPrice,
    demand: cropData.marketDemand,
    profitability: cropData.profitability,
    harvestSeason: cropData.harvestSeason,
    priceVariation: {
      min: Math.round(cropData.marketPrice * 0.85),
      max: Math.round(cropData.marketPrice * 1.15),
      trend: 'stable' // This could be dynamic based on market data
    }
  };
};
