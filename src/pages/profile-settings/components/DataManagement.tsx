import React from 'react';

interface DataManagementData {
  autoBackup?: boolean;
  exportFormat?: string;
  retentionPeriod?: number;
  shareAnalytics?: boolean;
}

interface DataManagementProps {
  data?: DataManagementData;
  onUpdate?: (data: DataManagementData) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ data, onUpdate }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
        <p className="text-sm text-gray-600">
          Control how your data is stored, backed up, and shared
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Auto Backup</h3>
            <p className="text-sm text-gray-600">Automatically backup your data</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.autoBackup || false}
              onChange={(e) => onUpdate?.({ ...data, autoBackup: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
          <select
            value={data?.exportFormat || 'csv'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => onUpdate?.({ ...data, exportFormat: e.target.value })}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;