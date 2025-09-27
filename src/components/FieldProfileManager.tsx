import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Edit3, Trash2, Plus, User, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface CropData {
  crop_type: string;
  planting_date: string;
  soil_test_results?: { N: number | null; P: number | null; K: number | null; pH: number | null } | null;
  weather_data?: { temperature: number | null; humidity: number | null; rainfall: number | null } | null;
}

interface FieldProfile {
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
    availability: 'None' | 'Low' | 'Medium' | 'High';
  };
  crops: CropData[];
}

interface FieldProfileJSON {
  field_profile: FieldProfile;
}

interface FieldProfileManagerProps {
  profiles: FieldProfileJSON[];
  currentProfileIndex: number | null;
  isEditing: boolean;
  onProfileEdit: (index: number) => void;
  onProfileDelete: (index: number) => void;
  onNewProfile: () => void;
  onSaveProfile: (name?: string) => void;
  canSave: boolean;
  isSaving?: boolean;
}

const FieldProfileManager: React.FC<FieldProfileManagerProps> = ({
  profiles,
  currentProfileIndex,
  isEditing,
  onProfileEdit,
  onProfileDelete,
  onNewProfile,
  onSaveProfile,
  canSave,
  isSaving = false
}) => {
  const { t } = useTranslation();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const handleSaveAs = () => {
    if (saveAsName.trim()) {
      onSaveProfile(saveAsName.trim());
      setShowSaveDialog(false);
      setSaveAsName('');
    }
  };

  const handleDeleteConfirm = (index: number) => {
    onProfileDelete(index);
    setShowDeleteConfirm(null);
  };

  const formatProfileInfo = (profile: FieldProfile) => {
    const cropCount = profile.crops?.length || 0;
    const mainCrop = profile.crops?.[0]?.crop_type || 'No crop';
    const location = profile.location?.district || profile.location?.name || 'No location';
    
    return {
      cropInfo: cropCount > 1 ? `${mainCrop} +${cropCount - 1} more` : mainCrop,
      locationInfo: location,
      fieldSize: `${profile.field_size_hectares || 0} ha`
    };
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Saved Field Profiles</h2>
            <p className="text-sm text-gray-600">Edit and manage your saved field configurations</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Save Current Profile */}
          {canSave && (
            <div className="flex gap-1">
              <button
                onClick={() => onSaveProfile()}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isEditing ? "Update current profile" : "Save as new profile"}
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
                </span>
              </button>
              
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                title="Save as new profile with custom name"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Clear Form */}
          <button
            onClick={onNewProfile}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Clear form to create new profile"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Profile</span>
          </button>
        </div>
      </div>

      {/* Profile List */}
      {profiles.length > 0 && (
        <div className="grid gap-3">
          {profiles.map((profile, index) => {
            const info = formatProfileInfo(profile.field_profile);
            const isCurrentlyEditing = isEditing && currentProfileIndex === index;
            
            return (
              <div
                key={index}
                className={`relative border-2 rounded-lg p-4 transition-all ${
                  isCurrentlyEditing
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {profile.field_profile.field_name}
                      </h3>
                      {isCurrentlyEditing && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Editing
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">🌾 {info.cropInfo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{info.locationInfo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">📐 {info.fieldSize}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <span>{profile.field_profile.soil_type} • {profile.field_profile.irrigation.method}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    {!isCurrentlyEditing && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onProfileEdit(index);
                          }}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit this profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(index);
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete this profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {isCurrentlyEditing && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <AlertCircle className="w-4 h-4" />
                      <span>You are currently editing this profile. Make your changes below and save to update it.</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save As Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Profile As</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Name
              </label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Enter profile name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAs();
                  if (e.key === 'Escape') setShowSaveDialog(false);
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAs}
                disabled={!saveAsName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Profile</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{profiles[showDeleteConfirm]?.field_profile.field_name}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldProfileManager;