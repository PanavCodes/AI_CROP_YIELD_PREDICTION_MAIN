// Debug component to show field location information
import React from 'react';
import { MapPin, Info } from 'lucide-react';

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
    crops: Array<any>;
  };
}

interface FieldLocationDebugProps {
  profiles: FieldProfile[];
  selectedProfileIndex: number;
  currentLocation: any;
}

const FieldLocationDebug: React.FC<FieldLocationDebugProps> = ({ 
  profiles, 
  selectedProfileIndex, 
  currentLocation 
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 opacity-80 max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <Info size={14} />
        <span className="font-bold">Field Location Debug</span>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Total Profiles:</strong> {profiles.length}
        </div>
        
        <div>
          <strong>Selected Profile:</strong> {selectedProfileIndex}
        </div>
        
        {profiles[selectedProfileIndex] && (
          <>
            <div>
              <strong>Field Name:</strong> {profiles[selectedProfileIndex].field_profile.field_name}
            </div>
            
            <div>
              <strong>Has Location:</strong> {profiles[selectedProfileIndex].field_profile.location ? 'Yes' : 'No'}
            </div>
            
            {profiles[selectedProfileIndex].field_profile.location && (
              <div className="pl-2 border-l border-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  <span>Lat: {profiles[selectedProfileIndex].field_profile.location?.latitude.toFixed(4)}</span>
                </div>
                <div>
                  <span>Lng: {profiles[selectedProfileIndex].field_profile.location?.longitude.toFixed(4)}</span>
                </div>
                <div>
                  <span>Name: {profiles[selectedProfileIndex].field_profile.location?.name || 'N/A'}</span>
                </div>
                <div>
                  <span>District: {profiles[selectedProfileIndex].field_profile.location?.district || 'N/A'}</span>
                </div>
                <div>
                  <span>State: {profiles[selectedProfileIndex].field_profile.location?.state || 'N/A'}</span>
                </div>
              </div>
            )}
          </>
        )}
        
        <div>
          <strong>Weather Location:</strong> {currentLocation ? 'Set' : 'Not Set'}
        </div>
        
        {currentLocation && (
          <div className="pl-2 border-l border-gray-600">
            <div>Lat: {currentLocation.latitude?.toFixed(4) || 'N/A'}</div>
            <div>Lng: {currentLocation.longitude?.toFixed(4) || 'N/A'}</div>
            <div>Name: {currentLocation.name || 'N/A'}</div>
          </div>
        )}
        
        <div className="text-gray-400 mt-2 text-xs">
          💡 This debug info only shows in development
        </div>
      </div>
    </div>
  );
};

export default FieldLocationDebug;