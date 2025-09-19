import React from 'react';

interface SecurityData {
  twoFactorEnabled?: boolean;
  trustedDevices?: any[];
  sessionTimeout?: number;
  lastPasswordChange?: Date;
  loginHistory?: any[];
}

interface SecuritySettingsProps {
  data?: SecurityData;
  onUpdate?: (data: SecurityData) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ data, onUpdate }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-600">
          Manage your account security and authentication preferences
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.twoFactorEnabled || false}
              onChange={(e) => onUpdate?.({ ...data, twoFactorEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
          <input
            type="number"
            value={data?.sessionTimeout || 60}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => onUpdate?.({ ...data, sessionTimeout: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;