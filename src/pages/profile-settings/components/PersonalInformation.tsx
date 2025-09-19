import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

interface PersonalData {
  name?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string | null;
  address?: string;
  farmName?: string;
}

interface PersonalInformationProps {
  data?: PersonalData;
  onUpdate?: (data: PersonalData) => void;
}

const PersonalInformation: React.FC<PersonalInformationProps> = ({ data, onUpdate }) => {
  const [formData, setFormData] = useState<PersonalData>(data || {});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleInputChange = (field: keyof PersonalData, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate?.(updatedData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          <p className="text-sm text-gray-600">
            Manage your personal details and profile information
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Icon name={isEditing ? "X" : "Edit"} size={16} className="mr-2" />
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-gray-200">
              <Icon name="User" size={32} className="text-blue-600" />
            </div>
          </div>
          
          {isEditing && (
            <div>
              <Button variant="outline">
                <Icon name="Camera" size={16} className="mr-2" />
                Upload Photo
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          )}
        </div>

        {/* Personal Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <Input
              value={formData?.name || ''}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              disabled={!isEditing}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Farm Name</label>
            <Input
              value={formData?.farmName || ''}
              onChange={(e) => handleInputChange('farmName', e?.target?.value)}
              disabled={!isEditing}
              placeholder="Enter your farm name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <Input
              type="email"
              value={formData?.email || ''}
              onChange={(e) => handleInputChange('email', e?.target?.value)}
              disabled={!isEditing}
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <Input
              type="tel"
              value={formData?.phone || ''}
              onChange={(e) => handleInputChange('phone', e?.target?.value)}
              disabled={!isEditing}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={formData?.address || ''}
              onChange={(e) => handleInputChange('address', e?.target?.value)}
              disabled={!isEditing}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 ${
                !isEditing ? 'opacity-60 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
              placeholder="Enter your complete address"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInformation;