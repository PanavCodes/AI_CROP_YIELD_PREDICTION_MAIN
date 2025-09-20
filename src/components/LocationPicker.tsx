// Location Picker Component for manual location selection
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Loader, X, Navigation } from 'lucide-react';
import { Location } from '../types/weather';
import locationService from '../services/locationService';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Location) => void;
  currentLocation?: Location;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const debounceTimer = setTimeout(() => {
        searchLocations(searchQuery);
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchLocations = async (query: string) => {
    setLoading(true);
    try {
      const results = await locationService.searchLocations(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Location search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const detectCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      const result = await locationService.detectLocation();
      if (result.success && result.location) {
        onLocationSelect(result.location);
        onClose();
      } else {
        alert(result.error || 'Unable to detect location');
      }
    } catch (error) {
      alert('Location detection failed');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Select Location</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Auto-detect Location Button */}
          <button
            onClick={detectCurrentLocation}
            disabled={detectingLocation}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl border border-blue-200 transition-all disabled:opacity-50 shadow-sm"
          >
            {detectingLocation ? (
              <Loader className="animate-spin text-blue-600" size={20} />
            ) : (
              <Navigation className="text-blue-600" size={20} />
            )}
            <div className="text-left flex-1">
              <div className="font-semibold text-blue-800">
                {detectingLocation ? 'Detecting Location...' : 'Auto-Detect My Location'}
              </div>
              <div className="text-sm text-blue-600">
                {detectingLocation ? 'Please wait while we find your location' : 'Use GPS to automatically detect your current location'}
              </div>
            </div>
          </button>

          {/* Current Location Display */}
          {currentLocation && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-green-600" size={16} />
                <span className="font-medium text-green-800">Current Location</span>
              </div>
              <div className="text-sm text-green-700">
                {currentLocation.name || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </div>
              {currentLocation.district && (
                <div className="text-xs text-green-600 mt-1">
                  {currentLocation.district}, {currentLocation.state}
                </div>
              )}
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for district, village, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {loading && (
              <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" size={20} />
            )}
          </div>

          {/* Search Results */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="text-gray-400 mt-1" size={16} />
                    <div>
                      <div className="font-medium text-gray-800">
                        {location.name}
                      </div>
                      {location.district && (
                        <div className="text-sm text-gray-600">
                          {location.district}
                          {location.state && `, ${location.state}`}
                          {location.country && `, ${location.country}`}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : searchQuery.length > 2 && !loading ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="mx-auto mb-2 text-gray-300" size={32} />
                <div>No locations found</div>
                <div className="text-sm">Try searching with a different term</div>
              </div>
            ) : searchQuery.length <= 2 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="mx-auto mb-2 text-gray-300" size={32} />
                <div>Search for your location</div>
                <div className="text-sm">Enter at least 3 characters</div>
              </div>
            ) : null}
          </div>

          {/* Popular Locations (India-specific) */}
          {searchQuery.length === 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Popular Agricultural Regions</h3>
              <div className="space-y-2">
                {[
                  { name: 'Punjab', district: 'Punjab', state: 'Punjab', latitude: 31.1471, longitude: 75.3412 },
                  { name: 'Haryana', district: 'Haryana', state: 'Haryana', latitude: 29.0588, longitude: 76.0856 },
                  { name: 'Uttar Pradesh', district: 'Uttar Pradesh', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
                  { name: 'Maharashtra', district: 'Maharashtra', state: 'Maharashtra', latitude: 19.7515, longitude: 75.7139 },
                  { name: 'Karnataka', district: 'Karnataka', state: 'Karnataka', latitude: 15.3173, longitude: 75.7139 }
                ].map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="text-gray-400" size={14} />
                      <span className="text-sm text-gray-700">{location.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LocationPicker;
