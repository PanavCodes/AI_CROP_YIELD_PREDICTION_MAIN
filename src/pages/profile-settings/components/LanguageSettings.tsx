import React from 'react';

interface LanguageData {
  primary?: string;
  secondary?: string;
  interfaceLanguage?: string;
}

interface LanguageSettingsProps {
  data?: LanguageData;
  onUpdate?: (data: LanguageData) => void;
}

const LanguageSettings: React.FC<LanguageSettingsProps> = ({ data, onUpdate }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Language & Region</h2>
        <p className="text-sm text-gray-600">
          Set your preferred language and regional settings
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Language</label>
          <select
            value={data?.primary || 'EN'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => onUpdate?.({ ...data, primary: e.target.value })}
          >
            <option value="EN">English</option>
            <option value="HI">Hindi</option>
            <option value="GU">Gujarati</option>
            <option value="MR">Marathi</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Language</label>
          <select
            value={data?.secondary || 'HI'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => onUpdate?.({ ...data, secondary: e.target.value })}
          >
            <option value="EN">English</option>
            <option value="HI">Hindi</option>
            <option value="GU">Gujarati</option>
            <option value="MR">Marathi</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;