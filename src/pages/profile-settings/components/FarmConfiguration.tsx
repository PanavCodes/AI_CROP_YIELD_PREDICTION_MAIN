import React from 'react';

interface FarmData {
  defaultUnits?: string;
  currency?: string;
  timezone?: string;
  region?: string;
  farmSize?: number;
  primaryCrops?: string[];
  irrigationSystem?: string;
  soilType?: string;
}

interface FarmConfigurationProps {
  data?: FarmData;
  onUpdate?: (data: FarmData) => void;
}

const FarmConfiguration: React.FC<FarmConfigurationProps> = ({ data, onUpdate }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Farm Configuration</h2>
        <p className="text-sm text-gray-600">
          Configure your farm settings and preferences
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farm Size (acres)</label>
            <input
              type="number"
              value={data?.farmSize || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => onUpdate?.({ ...data, farmSize: parseFloat(e.target.value) })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={data?.currency || 'USD'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => onUpdate?.({ ...data, currency: e.target.value })}
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Crops</label>
          <input
            type="text"
            value={data?.primaryCrops?.join(', ') || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => onUpdate?.({ ...data, primaryCrops: e.target.value.split(', ') })}
            placeholder="e.g., wheat, corn, soybeans"
          />
        </div>
      </div>
    </div>
  );
};

export default FarmConfiguration;