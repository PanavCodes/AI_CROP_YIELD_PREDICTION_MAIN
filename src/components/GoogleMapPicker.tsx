// Google Maps field location picker component
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Loader, Info, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import integratedLocationService, { FieldLocationData } from '../services/integratedLocationService';
import locationSearchService from '../services/locationSearchService';
import { Location } from '../types/weather';

interface GoogleMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number, fieldData?: FieldLocationData) => void;
  apiKey: string;
  onFieldDataReceived?: (fieldData: FieldLocationData) => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  onFieldDataReceived,
  apiKey
}) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [fieldData, setFieldData] = useState<FieldLocationData | null>(null);
  const [fetchingData, setFetchingData] = useState(false);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [placesService, setPlacesService] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps API
  useEffect(() => {
    console.log('GoogleMapPicker - API Key received:', apiKey ? 'Yes' : 'No');
    console.log('GoogleMapPicker - API Key value:', apiKey);
    console.log('GoogleMapPicker - Environment check:', (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY);
    
    if (!isOpen) {
      return;
    }

    if (!apiKey) {
      console.error('GoogleMapPicker - Missing API key');
      setError('Google Maps API key is not configured. Please check your environment variables.');
      setIsLoading(false);
      return;
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded, initializing map');
        initializeMap();
        return;
      }

      // Remove any existing Google Maps script to avoid conflicts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Create script tag to load Google Maps API
      const script = document.createElement('script');
      const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,places&callback=initGoogleMaps`;
      console.log('GoogleMapPicker - Loading Maps URL:', mapsUrl);
      script.src = mapsUrl;
      script.async = true;
      script.defer = true;
      
      // Set up global callback
      window.initGoogleMaps = () => {
        console.log('Google Maps callback triggered');
        if (window.google && window.google.maps) {
          initializeMap();
        } else {
          console.error('Google Maps failed to load properly');
          setError('Failed to load Google Maps. Please check your internet connection and API key.');
          setIsLoading(false);
        }
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Google Maps script:', error);
        setError('Failed to load Google Maps script. Please check your internet connection.');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [isOpen, apiKey]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      // Center on India by default
      const indiaCenter = { lat: 20.5937, lng: 78.9629 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 5,
        center: indiaCenter,
        mapTypeId: 'satellite', // Show satellite view for better field identification
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_CENTER,
        },
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);
      
      // Initialize Places Service for search functionality
      if (window.google && window.google.maps.places) {
        const placesServiceInstance = new window.google.maps.places.PlacesService(mapInstance);
        setPlacesService(placesServiceInstance);
      }
      
      setIsLoading(false);

      // Add click listener to drop marker
      mapInstance.addListener('click', async (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Remove existing marker
        if (marker) {
          marker.setMap(null);
        }

        // Create new marker
        const newMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          title: 'Selected Field Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="8" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="16" r="3" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16),
          },
        });

        setMarker(newMarker);
        setSelectedCoords({ lat, lng });
        
        // Fetch comprehensive location data
        setFetchingData(true);
        try {
          const locationData = await integratedLocationService.getFieldLocationData(
            lat, lng, {
              includeGooglePlaces: true,
              includeBhuvanData: true,
              includeLulcData: true,
              generateFieldName: true
            }
          );
          setFieldData(locationData);
          if (onFieldDataReceived) {
            onFieldDataReceived(locationData);
          }
        } catch (error) {
          console.error('Failed to fetch field location data:', error);
        } finally {
          setFetchingData(false);
        }
      });

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setError(`Error initializing Google Maps: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords.lat, selectedCoords.lng, fieldData || undefined);
      onClose();
    }
  };

  const handleClose = () => {
    // Clean up marker
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    setSelectedCoords(null);
    setFieldData(null);
    setFetchingData(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    onClose();
  };
  
  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      const results: Location[] = [];
      
      // Method 1: Use Google Places Text Search if available
      if (placesService && window.google) {
        await searchWithGooglePlaces(query, results);
      }
      
      // Method 2: Use enhanced location search service
      try {
        const searchResults = await locationSearchService.searchLocations(query, {
          maxResults: 6,
          focusOnAgricultural: true
        });
        
        searchResults.forEach(searchResult => {
          const location = searchResult.location;
          const exists = results.some(r => 
            Math.abs(r.latitude - location.latitude) < 0.001 && 
            Math.abs(r.longitude - location.longitude) < 0.001
          );
          if (!exists) {
            // Add description from search result
            const enhancedLocation: Location = {
              ...location,
              name: searchResult.description ? 
                `${location.name} (${searchResult.description})` : location.name
            };
            results.push(enhancedLocation);
          }
        });
      } catch (error) {
        console.warn('Enhanced location search failed:', error);
        
        // Fallback to predefined locations
        const predefinedLocations = getPredefinedLocations(query);
        predefinedLocations.forEach(location => {
          const exists = results.some(r => 
            Math.abs(r.latitude - location.latitude) < 0.001 && 
            Math.abs(r.longitude - location.longitude) < 0.001
          );
          if (!exists) {
            results.push(location);
          }
        });
      }
      
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const searchWithGooglePlaces = (query: string, results: Location[]): Promise<void> => {
    return new Promise((resolve) => {
      if (!placesService) {
        resolve();
        return;
      }
      
      const request = {
        query: `${query} India`,
        fields: ['place_id', 'formatted_address', 'geometry', 'name', 'types'],
        locationBias: {
          center: { lat: 20.5937, lng: 78.9629 }, // Center of India
          radius: 2000000 // 2000km radius
        }
      };
      
      placesService.textSearch(request, (placesResults: any[], status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && placesResults) {
          placesResults.slice(0, 5).forEach((place: any) => {
            if (place.geometry && place.geometry.location) {
              const location: Location = {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
                name: place.name || place.formatted_address,
                district: extractDistrictFromAddress(place.formatted_address),
                state: extractStateFromAddress(place.formatted_address),
                country: 'India'
              };
              results.push(location);
            }
          });
        }
        resolve();
      });
    });
  };
  
  const extractDistrictFromAddress = (address: string): string | undefined => {
    if (!address) return undefined;
    const parts = address.split(', ');
    if (parts.length >= 3) {
      return parts[parts.length - 3];
    }
    return undefined;
  };
  
  const extractStateFromAddress = (address: string): string | undefined => {
    if (!address) return undefined;
    const parts = address.split(', ');
    if (parts.length >= 2) {
      const statePart = parts[parts.length - 2];
      return statePart.replace(/\s\d{6}$/, '');
    }
    return undefined;
  };
  
  const getPredefinedLocations = (query: string): Location[] => {
    const agriculturalLocations = [
      { name: 'Ludhiana', latitude: 30.9010, longitude: 75.8573, district: 'Ludhiana', state: 'Punjab', country: 'India' },
      { name: 'Amritsar', latitude: 31.6340, longitude: 74.8723, district: 'Amritsar', state: 'Punjab', country: 'India' },
      { name: 'Karnal', latitude: 29.6857, longitude: 76.9905, district: 'Karnal', state: 'Haryana', country: 'India' },
      { name: 'Nashik', latitude: 19.9975, longitude: 73.7898, district: 'Nashik', state: 'Maharashtra', country: 'India' },
      { name: 'Belgaum', latitude: 15.8497, longitude: 74.4977, district: 'Belgaum', state: 'Karnataka', country: 'India' },
      { name: 'Vijayawada', latitude: 16.5062, longitude: 80.6480, district: 'Krishna', state: 'Andhra Pradesh', country: 'India' },
      { name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, district: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
      { name: 'Rajkot', latitude: 22.3039, longitude: 70.8022, district: 'Rajkot', state: 'Gujarat', country: 'India' },
    ];
    
    const lowerQuery = query.toLowerCase();
    return agriculturalLocations.filter(location => 
      location.name.toLowerCase().includes(lowerQuery) ||
      location.district?.toLowerCase().includes(lowerQuery) ||
      location.state?.toLowerCase().includes(lowerQuery)
    );
  };
  
  const handleSearchResultSelect = async (location: Location) => {
    setShowSearchResults(false);
    setSearchQuery('');
    
    // Center map on selected location
    if (map) {
      const latLng = { lat: location.latitude, lng: location.longitude };
      map.setCenter(latLng);
      map.setZoom(12); // Zoom in to show field details
      
      // Simulate a click at this location to get field data
      await handleLocationSelect(location.latitude, location.longitude);
    }
  };
  
  const handleLocationSelect = async (lat: number, lng: number) => {
    // Remove existing marker
    if (marker) {
      marker.setMap(null);
    }

    // Create new marker
    const newMarker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Selected Field Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="8" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
            <circle cx="16" cy="16" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16),
      },
    });

    setMarker(newMarker);
    setSelectedCoords({ lat, lng });
    
    // Fetch comprehensive location data
    setFetchingData(true);
    try {
      const locationData = await integratedLocationService.getFieldLocationData(
        lat, lng, {
          includeGooglePlaces: true,
          includeBhuvanData: true,
          includeLulcData: true,
          generateFieldName: true
        }
      );
      setFieldData(locationData);
      if (onFieldDataReceived) {
        onFieldDataReceived(locationData);
      }
    } catch (error) {
      console.error('Failed to fetch field location data:', error);
    } finally {
      setFetchingData(false);
    }
  };
  
  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        // Don't hide results immediately if input is focused
        if (searchInputRef.current !== document.activeElement) {
          setShowSearchResults(false);
        }
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, placesService]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="text-green-600" />
                {t('dataInputLocation.pickOnMap')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Search for a location or click on the map to select your field
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for agricultural areas, cities, or districts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => {
                  // Delay hiding results to allow for click events
                  setTimeout(() => setShowSearchResults(false), 200);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              />
              {isSearching && (
                <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" size={16} />
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((location, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchResultSelect(location)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="text-green-500 mt-1" size={16} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {location.name}
                            </div>
                            {location.district && (
                              <div className="text-sm text-gray-600">
                                {location.district}
                                {location.state && `, ${location.state}`}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 3 && !isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <Search className="mx-auto mb-2 text-gray-300" size={24} />
                    <div>No locations found</div>
                    <div className="text-sm">Try a different search term</div>
                  </div>
                ) : searchQuery.length === 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                      🌾 Popular Agricultural Areas
                    </div>
                    {locationSearchService.getPopularLocations().slice(0, 6).map((searchResult, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchResultSelect(searchResult.location)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="text-green-500 mt-1" size={16} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {searchResult.location.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {searchResult.location.district}, {searchResult.location.state}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              {searchResult.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading && !error && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Map Loading Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="text-sm text-red-500">
                  <p>• Make sure you have a valid Google Maps API key</p>
                  <p>• Check your internet connection</p>
                  <p>• Ensure the Maps JavaScript API is enabled</p>
                </div>
              </div>
            </div>
          )}
          
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />

          {/* Instructions overlay */}
          {!selectedCoords && !isLoading && (
            <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">Click anywhere on the map to select your field location</span>
              </div>
            </div>
          )}

          {/* Selected coordinates info */}
          {selectedCoords && (
            <div className="absolute top-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Field Location Selected
                  </div>
                  <button
                    onClick={handleConfirmLocation}
                    disabled={fetchingData}
                    className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {fetchingData ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
                
                {/* Coordinates */}
                <div className="text-xs text-gray-600 mb-2">
                  📍 {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                </div>
                
                {/* Loading state */}
                {fetchingData && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                    <Loader className="w-3 h-3 animate-spin" />
                    Fetching location details...
                  </div>
                )}
                
                {/* Field data display */}
                {fieldData && !fetchingData && (
                  <div className="space-y-2 text-xs">
                    {/* Suggested name */}
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-gray-700">
                        {fieldData.field.suggested_name}
                      </span>
                    </div>
                    
                    {/* Administrative info */}
                    {(fieldData.administrative.village || fieldData.administrative.district) && (
                      <div className="text-gray-600">
                        📍 {[
                          fieldData.administrative.village,
                          fieldData.administrative.district,
                          fieldData.administrative.state
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                    
                    {/* Quality indicator */}
                    <div className="flex items-center gap-2">
                      {fieldData.field.location_quality === 'excellent' && (
                        <><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-green-600">Excellent location data</span></>
                      )}
                      {fieldData.field.location_quality === 'good' && (
                        <><CheckCircle className="w-3 h-3 text-blue-500" /><span className="text-blue-600">Good location data</span></>
                      )}
                      {fieldData.field.location_quality === 'basic' && (
                        <><Info className="w-3 h-3 text-yellow-500" /><span className="text-yellow-600">Basic location data</span></>
                      )}
                      {fieldData.field.location_quality === 'limited' && (
                        <><AlertCircle className="w-3 h-3 text-orange-500" /><span className="text-orange-600">Limited location data</span></>
                      )}
                    </div>
                    
                    {/* Land use classification */}
                    {fieldData.land_use?.classification.success && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="font-medium text-gray-700 text-xs">
                            {fieldData.land_use.classification.primary_class.class_name}
                          </span>
                          {fieldData.land_use.classification.primary_class.confidence && (
                            <span className="text-xs text-gray-500">
                              ({fieldData.land_use.classification.primary_class.confidence.toFixed(0)}% confidence)
                            </span>
                          )}
                        </div>
                        
                        {/* Agricultural suitability */}
                        <div className="flex items-center gap-2">
                          {fieldData.land_use.classification.primary_class.agricultural_suitability === 'excellent' && (
                            <><span className="text-green-600">🌟</span><span className="text-green-600 text-xs">Excellent for agriculture</span></>
                          )}
                          {fieldData.land_use.classification.primary_class.agricultural_suitability === 'good' && (
                            <><span className="text-green-600">✅</span><span className="text-green-600 text-xs">Good for agriculture</span></>
                          )}
                          {fieldData.land_use.classification.primary_class.agricultural_suitability === 'moderate' && (
                            <><span className="text-yellow-600">⚠️</span><span className="text-yellow-600 text-xs">Moderate suitability</span></>
                          )}
                          {fieldData.land_use.classification.primary_class.agricultural_suitability === 'poor' && (
                            <><span className="text-orange-600">⚠️</span><span className="text-orange-600 text-xs">Limited suitability</span></>
                          )}
                          {fieldData.land_use.classification.primary_class.agricultural_suitability === 'unsuitable' && (
                            <><span className="text-red-600">❌</span><span className="text-red-600 text-xs">Not suitable for agriculture</span></>
                          )}
                        </div>
                        
                        {/* Crop recommendations */}
                        {fieldData.land_use.recommendations.crop_recommendations.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Suitable crops: </span>
                            {fieldData.land_use.recommendations.crop_recommendations.slice(0, 3).join(', ')}
                            {fieldData.land_use.recommendations.crop_recommendations.length > 3 && '...'}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Agricultural area indicator (fallback if no LULC data) */}
                    {!fieldData.land_use?.classification.success && fieldData.field.is_agricultural_area && (
                      <div className="flex items-center gap-2 text-green-600">
                        <span>🌾</span>
                        <span>Agricultural area detected</span>
                      </div>
                    )}
                    
                    {/* Data sources */}
                    <div className="text-gray-500 text-xs">
                      Sources: {fieldData.sources.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>💡 <strong>Tip:</strong> Use satellite view to identify your field boundaries clearly</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              {selectedCoords && (
                <button
                  onClick={handleConfirmLocation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Use This Location
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GoogleMapPicker;
