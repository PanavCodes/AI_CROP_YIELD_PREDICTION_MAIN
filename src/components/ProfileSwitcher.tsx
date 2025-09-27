import React, { useState } from 'react';
import { ChevronDown, Calendar, MapPin, Droplets, Plus, ArrowRight } from 'lucide-react';
import { GiWheat } from 'react-icons/gi';
import { FaSeedling, FaLeaf } from 'react-icons/fa';

// Generic type for field profiles - compatible with different profile structures
interface FieldProfile {
  field_profile: {
    field_name: string;
    field_size_hectares: number;
    soil_type: string;
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      district?: string;
      state?: string;
      country?: string;
    };
    irrigation: {
      method: string;
      availability: string;
    };
    crops: Array<{
      crop_type: string;
      planting_date: string;
      season?: string;
      cultivation_year?: number;
      fertilizers_used?: string[];
      pesticides_used?: string[];
      previous_crop?: string | null;
      soil_test_results?: null | {
        N?: number | null;
        P?: number | null;
        K?: number | null;
        pH?: number | null;
      };
      weather_data?: null | {
        temperature?: number | null;
        humidity?: number | null;
        rainfall?: number | null;
      };
      [key: string]: any; // Allow additional properties
    }>;
  };
}

interface ProfileSwitcherProps {
  profiles: FieldProfile[];
  selectedProfile: number;
  selectedCrop: number;
  onProfileChange: (profileIndex: number) => void;
  onCropChange: (cropIndex: number) => void;
  showCropSelector?: boolean;
  className?: string;
  onNavigateToDataInput?: () => void;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({
  profiles,
  selectedProfile,
  selectedCrop,
  onProfileChange,
  onCropChange,
  showCropSelector = true,
  className = "",
  onNavigateToDataInput
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const currentProfile = profiles[selectedProfile];
  const currentCrop = currentProfile?.field_profile?.crops?.[selectedCrop];

  const getCropIcon = (cropType: string) => {
    const crop = cropType.toLowerCase();
    if (crop.includes('wheat') || crop.includes('rice') || crop.includes('corn') || crop.includes('maize')) {
      return GiWheat;
    } else if (crop.includes('cotton') || crop.includes('sugarcane')) {
      return FaLeaf;
    } else {
      return FaSeedling;
    }
  };

  if (profiles.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            No Field Profiles Found
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            Create your first field profile to start getting AI-powered crop predictions and insights.
          </p>
          {onNavigateToDataInput && (
            <button
              onClick={onNavigateToDataInput}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Field Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="space-y-4">
        {/* Profile Selector */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-600 dark:text-gray-400">Active Field</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
                  {currentProfile?.field_profile?.field_name || 'Select Field'}
                </p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {profileDropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50">
              <div className="px-3 pb-2 mb-2 border-b border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">YOUR FIELD PROFILES</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Created in Data Input page</p>
              </div>
              
              {/* Profile List */}
              <div className="max-h-60 overflow-y-auto">
                {profiles.map((profile, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onProfileChange(idx);
                      onCropChange(0); // Reset to first crop
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-3 text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedProfile === idx ? 'bg-green-50 dark:bg-green-900/30 ring-1 ring-green-300 dark:ring-green-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {profile.field_profile.field_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {profile.field_profile.field_size_hectares} hectares • {profile.field_profile.soil_type}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {profile.field_profile.crops.length} crop{profile.field_profile.crops.length !== 1 ? 's' : ''}
                          {profile.field_profile.location?.state && ` • ${profile.field_profile.location.state}`}
                        </p>
                      </div>
                      {selectedProfile === idx && (
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Create New Profile Option */}
              {onNavigateToDataInput && (
                <>
                  <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-600 mt-2">
                    <button
                      onClick={() => {
                        onNavigateToDataInput();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-blue-600 dark:text-blue-400"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Create New Field Profile</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Crop Selector Chips */}
        {showCropSelector && currentProfile && currentProfile.field_profile.crops.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Crops:</span>
            <div className="flex gap-2 flex-wrap">
              {currentProfile.field_profile.crops.map((crop, idx) => {
                const CropIconComponent = getCropIcon(crop.crop_type) as React.ComponentType<{className?: string}>;
                return (
                  <button
                    key={idx}
                    onClick={() => onCropChange(idx)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCrop === idx
                        ? 'bg-green-600 text-white shadow-md ring-2 ring-green-300 dark:ring-green-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <CropIconComponent className="text-base" />
                    {crop.crop_type}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Selection Info */}
        {currentCrop && (
          <div className="flex flex-wrap gap-3 text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Calendar size={14} />
              <span>Planted: {currentCrop.planting_date}</span>
            </div>
            {currentCrop.season && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <span className="font-medium">Season:</span>
                <span>{currentCrop.season}</span>
              </div>
            )}
            {currentCrop.soil_test_results && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  N: {currentCrop.soil_test_results.N || '-'}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  P: {currentCrop.soil_test_results.P || '-'}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  K: {currentCrop.soil_test_results.K || '-'}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  pH: {currentCrop.soil_test_results.pH || '-'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Field Summary */}
        {currentProfile && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Size:</span>
                <span className="ml-2 font-medium">{currentProfile.field_profile.field_size_hectares} hectares</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Soil:</span>
                <span className="ml-2 font-medium">{currentProfile.field_profile.soil_type}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Irrigation:</span>
                <span className="ml-2 font-medium">{currentProfile.field_profile.irrigation.method}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Water:</span>
                <span className="ml-2 font-medium">{currentProfile.field_profile.irrigation.availability}</span>
              </div>
            </div>
            {currentProfile.field_profile.location && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={14} />
                  <span>
                    {currentProfile.field_profile.location.district && `${currentProfile.field_profile.location.district}, `}
                    {currentProfile.field_profile.location.state}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSwitcher;
