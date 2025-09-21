import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUpload, FiFile, FiCalendar, FiCheck, FiPlus } from 'react-icons/fi';
import { Trash2, Save, MapPin, Loader, CheckCircle } from 'lucide-react';
import { GiWheat, GiWateringCan } from 'react-icons/gi';
import { soilTypes, cropTypes, irrigationMethods } from '../mockData/mockData';
import { getCurrentUser, updateUserFarmData, saveUserSession, isNewUser, updateUserLocation } from '../utils/userUtils';
import locationService from '../services/locationService';
import GoogleMapPicker from '../components/GoogleMapPicker';
import { Location } from '../types/weather';
import { fetchAggregatedFieldData } from '../services/fieldDataService';
import { reverseGeocodeBhuvan } from '../services/backendService';
import integratedLocationService, { FieldLocationData } from '../services/integratedLocationService';

// Types for form and saved profile
interface CropForm {
  crop_type: string;
  planting_date: string; // dd-mm-yyyy
  fertilizers_used: string; // comma-separated
  pesticides_used: string; // comma-separated
  previous_crop: string; // optional
  soil_N: string; // optional numeric
  soil_P: string; // optional numeric
  soil_K: string; // optional numeric
  soil_pH: string; // optional numeric
}

interface FieldForm {
  field_name: string;
  field_size_hectares: string; // numeric string
  soil_type: string;
  irrigation_method: string;
  irrigation_availability: 'None' | 'Low' | 'Medium' | 'High' | '';
  crops: CropForm[];
}

interface FieldProfileJSON {
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
      availability: 'None' | 'Low' | 'Medium' | 'High';
    };
    crops: Array<{
      crop_type: string;
      planting_date: string; // dd-mm-yyyy
      fertilizers_used: string[];
      pesticides_used: string[];
      previous_crop: string | null;
      soil_test_results: null | { N: number | null; P: number | null; K: number | null; pH: number | null };
    }>;
  };
}

const IRRIGATION_AVAILABILITY: Array<'None' | 'Low' | 'Medium' | 'High'> = ['None', 'Low', 'Medium', 'High'];

const defaultCrop = (): CropForm => ({
  crop_type: '',
  planting_date: '',
  fertilizers_used: '',
  pesticides_used: '',
  previous_crop: '',
  soil_N: '',
  soil_P: '',
  soil_K: '',
  soil_pH: '',
});

const defaultFieldForm: FieldForm = {
  field_name: '',
  field_size_hectares: '',
  soil_type: '',
  irrigation_method: '',
  irrigation_availability: '',
  crops: [defaultCrop()],
};

const DataInput: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [showNewUserMessage, setShowNewUserMessage] = useState(false);

  // New: profiles and editing state
  const [profiles, setProfiles] = useState<FieldProfileJSON[]>(() => {
    try {
      const raw = localStorage.getItem('fieldProfiles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fields, setFields] = useState<FieldForm[]>([defaultFieldForm]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [form, setForm] = useState<FieldForm>(defaultFieldForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [fetchingLocationData, setFetchingLocationData] = useState(false);
  const [autofillInfo, setAutofillInfo] = useState<{
    village?: string; district?: string; state?: string;
    land_use?: { class?: string; coverage_percent?: number } | null;
    soil?: { soil_type?: string; soil_depth?: string; ph?: number; organic_carbon?: number; nitrogen?: number; phosphorus?: number; potassium?: number } | null;
  } | null>(null);
  const [adminInfo, setAdminInfo] = useState<{ village?: string; district?: string; state?: string; source?: string } | null>(null);
  const [integratedFieldData, setIntegratedFieldData] = useState<FieldLocationData | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // States for displaying crop data
  const [cropData, setCropData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataStats, setDataStats] = useState<any>(null);
  const [showDataTable, setShowDataTable] = useState(false);

  // Update form when currentFieldIndex changes
  useEffect(() => {
    if (fields[currentFieldIndex]) {
      setForm(fields[currentFieldIndex]);
    }
  }, [currentFieldIndex, fields]);
  
  // Load location from profile when editing
  useEffect(() => {
    if (editingIndex !== null && profiles[editingIndex]) {
      const profile = profiles[editingIndex];
      if (profile.field_profile.location) {
        setSelectedLocation({
          latitude: profile.field_profile.location.latitude,
          longitude: profile.field_profile.location.longitude,
          name: profile.field_profile.location.name,
          district: profile.field_profile.location.district,
          state: profile.field_profile.location.state,
          country: profile.field_profile.location.country
        });
        console.log('Loaded location from profile:', profile.field_profile.location);
      } else {
        setSelectedLocation(null);
        console.log('No location found in profile');
      }
    } else if (editingIndex === null) {
      // Clear location when creating new profile
      setSelectedLocation(null);
    }
  }, [editingIndex, profiles]);

  // Update fields array when form changes
  useEffect(() => {
    setFields(prev => {
      const updated = [...prev];
      updated[currentFieldIndex] = form;
      return updated;
    });
  }, [form, currentFieldIndex]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && isNewUser(user)) {
      setShowNewUserMessage(true);
    }
    // Fetch existing data when component mounts
    fetchCropData();
  }, []);

  // Function to fetch crop data from backend
  const fetchCropData = async () => {
    setLoadingData(true);
    try {
      console.log('🔍 DEBUG: Fetching crop data from backend...');
      
      // Fetch crop data
      const dataResponse = await fetch('http://localhost:5000/api/crop-data?limit=100');
      console.log('🔍 DEBUG: Data response status:', dataResponse.status);
      
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        console.log('🔍 DEBUG: Received crop data:', data);
        setCropData(data.data || []);
        console.log('🔍 DEBUG: Set crop data length:', data.data?.length || 0);
      } else {
        console.error('❌ Data fetch failed with status:', dataResponse.status);
      }
      
      // Fetch statistics
      const statsResponse = await fetch('http://localhost:5000/api/crop-data/statistics');
      console.log('🔍 DEBUG: Stats response status:', statsResponse.status);
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('🔍 DEBUG: Received stats:', stats);
        setDataStats(stats.data || stats);
      } else {
        console.error('❌ Stats fetch failed with status:', statsResponse.status);
      }
    } catch (error) {
      console.error('❌ Error fetching crop data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const setField = (name: keyof FieldForm, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const setCropField = (index: number, name: keyof CropForm, value: any) => {
    setForm(prev => {
      const updated = [...prev.crops];
      updated[index] = { ...updated[index], [name]: value };
      return { ...prev, crops: updated };
    });
  };

  const addField = () => {
    const newField = {
      ...defaultFieldForm,
      field_name: `Field ${fields.length + 1}`,
      crops: [defaultCrop()]
    };
    setFields(prev => [...prev, newField]);
  };
  
  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
    if (currentFieldIndex >= fields.length - 1) {
      setCurrentFieldIndex(Math.max(0, fields.length - 2));
    }
  };
  
  const addCrop = () => setForm(prev => ({ ...prev, crops: [...prev.crops, defaultCrop()] }));
  const removeCrop = (index: number) => setForm(prev => ({ ...prev, crops: prev.crops.filter((_, i) => i !== index) }));

  // Validation helpers
  const isPositiveNumber = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) && n > 0;
  };
  const isOptionalNumber = (s: string) => s === '' || /^\d+(\.\d+)?$/.test(s);
  const isValidDateDDMMYYYY = (s: string) => /^([0-2]\d|3[01])-(0\d|1[0-2])-\d{4}$/.test(s);

  const buildJSON = (f: FieldForm): FieldProfileJSON => {
    return {
      field_profile: {
        field_name: f.field_name.trim(),
        field_size_hectares: Number(f.field_size_hectares),
        soil_type: f.soil_type,
        location: selectedLocation ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          name: selectedLocation.name,
          district: selectedLocation.district,
          state: selectedLocation.state,
          country: selectedLocation.country
        } : undefined,
        irrigation: {
          method: f.irrigation_method,
          availability: (f.irrigation_availability || 'Low') as 'None' | 'Low' | 'Medium' | 'High',
        },
        crops: f.crops.map(c => {
          const ferts = c.fertilizers_used
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          const pests = c.pesticides_used
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          const soilProvided = c.soil_N || c.soil_P || c.soil_K || c.soil_pH;
          return {
            crop_type: c.crop_type.trim(),
            planting_date: c.planting_date.trim(),
            fertilizers_used: ferts,
            pesticides_used: pests,
            previous_crop: c.previous_crop.trim() ? c.previous_crop.trim() : null,
            soil_test_results: soilProvided
              ? {
                  N: c.soil_N ? Number(c.soil_N) : null,
                  P: c.soil_P ? Number(c.soil_P) : null,
                  K: c.soil_K ? Number(c.soil_K) : null,
                  pH: c.soil_pH ? Number(c.soil_pH) : null,
                }
              : null,
          };
        }),
      },
    };
  };

  const validateForm = (f: FieldForm): string[] => {
    const errs: string[] = [];
    if (!f.field_name.trim()) errs.push('Field name/ID is required.');
    if (!isPositiveNumber(f.field_size_hectares)) errs.push('Field size (hectares) must be a number > 0.');
    if (!f.soil_type) errs.push('Soil type is required.');
    if (!f.irrigation_method) errs.push('Irrigation method is required.');
    if (!f.irrigation_availability) errs.push('Irrigation availability is required.');
    if (!f.crops.length) errs.push('At least one crop is required.');

    f.crops.forEach((c, i) => {
      if (!c.crop_type.trim()) errs.push(`Crop ${i + 1}: crop type is required.`);
      if (!isValidDateDDMMYYYY(c.planting_date.trim())) errs.push(`Crop ${i + 1}: planting date must be dd-mm-yyyy.`);
      if (!isOptionalNumber(c.soil_N)) errs.push(`Crop ${i + 1}: N must be numeric.`);
      if (!isOptionalNumber(c.soil_P)) errs.push(`Crop ${i + 1}: P must be numeric.`);
      if (!isOptionalNumber(c.soil_K)) errs.push(`Crop ${i + 1}: K must be numeric.`);
      if (!isOptionalNumber(c.soil_pH)) errs.push(`Crop ${i + 1}: pH must be numeric.`);
    });

    return errs;
  };

  const resetForm = () => {
    setFields([defaultFieldForm]);
    setCurrentFieldIndex(0);
    setForm(defaultFieldForm);
    setEditingIndex(null);
    setErrors([]);
  };

  const saveProfilesToStorage = (list: FieldProfileJSON[]) => {
    localStorage.setItem('fieldProfiles', JSON.stringify(list));
    setProfiles(list);
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all fields
    const allErrors: string[] = [];
    fields.forEach((field, idx) => {
      const fieldErrors = validateForm(field).map(err => `Field ${idx + 1}: ${err}`);
      allErrors.push(...fieldErrors);
    });
    
    if (allErrors.length) {
      setErrors(allErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Save all fields as separate profiles
      const newProfiles = fields.map(field => {
        const profile = buildJSON(field);
        console.log('Saving profile with location:', profile.field_profile.location);
        return profile;
      });
      const next = [...profiles];
      
      if (editingIndex !== null) {
        // If editing, replace the single profile
        next[editingIndex] = newProfiles[0];
        // Add any additional fields as new profiles
        if (newProfiles.length > 1) {
          next.push(...newProfiles.slice(1));
        }
      } else {
        // Add all new profiles
        next.push(...newProfiles);
      }
      
      saveProfilesToStorage(next);

      // Mark user as having completed farm data
      if (currentUser) {
        updateUserFarmData(currentUser.email);
        const updatedUser = { ...currentUser, hasFarmData: true };
        saveUserSession(updatedUser);
        setCurrentUser(updatedUser);
      }

      // Navigate to dashboard like before
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving field profiles:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload tab handlers (retain existing behavior)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) return;

    setIsSubmitting(true);
    setUploadStatus('uploading');
    setErrors([]);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('csvFile', uploadedFile);

      // Upload to backend API
      console.log('Uploading CSV to backend...');
      const response = await fetch('http://localhost:5000/api/upload/csv', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('Upload result:', result);

      if (!response.ok || !result.success) {
        setErrors(result.errors || [result.error || 'Upload failed']);
        setUploadStatus('error');
        return;
      }

      // Show success with summary
      setUploadStatus('success');
      const summary = result.data;
      const successMsg = `CSV processed successfully! Total: ${summary.totalRows} rows, Valid: ${summary.validRows}, Invalid: ${summary.invalidRows}`;
      setSuccessMessage(successMsg);
      
      // Display crop summary if available
      if (summary.summary?.cropTypes) {
        const crops = Object.keys(summary.summary.cropTypes).join(', ');
        console.log('Crops found:', crops);
      }

      // Show validation errors if any
      if (summary.errors && summary.errors.length > 0) {
        const errorMessages = summary.errors.slice(0, 5).map(
          (err: any) => `Row ${err.row}: ${err.error}`
        );
        if (summary.errors.length > 5) {
          errorMessages.push(`...and ${summary.errors.length - 5} more errors`);
        }
        setErrors(errorMessages);
      }

      // Update user status
      if (currentUser) {
        updateUserFarmData(currentUser.email);
        const updatedUser = { ...currentUser, hasFarmData: true };
        saveUserSession(updatedUser);
        setCurrentUser(updatedUser);
      }

      // Fetch and show the uploaded data
      await fetchCropData();
      setShowDataTable(true);
      
      // Don't navigate away - let user see their data
      // setTimeout(() => {
      //   navigate('/dashboard');
      // }, 2000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors(['Network error: Could not connect to server. Make sure backend is running on port 5000.']);
      setUploadStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadProfileIntoForm = (index: number) => {
    const p = profiles[index];
    if (!p) return;
    setEditingIndex(index);
    const f = p.field_profile;
    const fieldForm = {
      field_name: f.field_name,
      field_size_hectares: String(f.field_size_hectares),
      soil_type: f.soil_type,
      irrigation_method: f.irrigation.method,
      irrigation_availability: f.irrigation.availability,
      crops: f.crops.map(c => ({
        crop_type: c.crop_type,
        planting_date: c.planting_date,
        fertilizers_used: c.fertilizers_used.join(', '),
        pesticides_used: c.pesticides_used.join(', '),
        previous_crop: c.previous_crop ?? '',
        soil_N: c.soil_test_results?.N != null ? String(c.soil_test_results.N) : '',
        soil_P: c.soil_test_results?.P != null ? String(c.soil_test_results.P) : '',
        soil_K: c.soil_test_results?.K != null ? String(c.soil_test_results.K) : '',
        soil_pH: c.soil_test_results?.pH != null ? String(c.soil_test_results.pH) : '',
      })),
    };
    setFields([fieldForm]);
    setCurrentFieldIndex(0);
    setForm(fieldForm);
    setActiveTab('manual');
  };

  const deleteProfile = (index: number) => {
    const next = profiles.filter((_, i) => i !== index);
    saveProfilesToStorage(next);
    if (editingIndex === index) {
      resetForm();
    }
  };

  // Auto-detect location function
  const handleAutoDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const locationResult = await locationService.detectLocation();
      
      if (locationResult.success && locationResult.location) {
        const location = locationResult.location;
        
        // Generate field name from location
        let fieldName = '';
        
        if (location.village) {
          fieldName = `${location.village} Field`;
        } else if (location.district) {
          fieldName = `${location.district} Field`;
        } else if (location.name) {
          fieldName = `${location.name} Field`;
        } else {
          fieldName = 'My Field';
        }
        
        // Update field name in form
        setField('field_name', fieldName);
        
        // Save location for weather dashboard
        if (currentUser) {
          updateUserLocation(currentUser.email, location, true);
          console.log('Location saved for weather dashboard:', location.name);
        }
        
        // Also cache location in localStorage for immediate use
        localStorage.setItem('userLocation', JSON.stringify({
          location,
          timestamp: Date.now()
        }));
        
      } else {
        // Fallback to generic name if location detection fails
        setField('field_name', 'My Field');
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      // Fallback to generic name
      setField('field_name', 'My Field');
    } finally {
      setDetectingLocation(false);
    }
  };


  // After coordinates are selected from Google Maps, fetch admin details and soil data
  const handleMapLocationSelected = async (lat: number, lng: number, fieldData?: FieldLocationData) => {
    // Use integrated location data if available, otherwise create basic location
    const loc: Location = {
      latitude: lat,
      longitude: lng,
      name: fieldData?.field.suggested_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      district: fieldData?.administrative.district,
      state: fieldData?.administrative.state,
      country: fieldData?.administrative.country
    };
    
    setSelectedLocation(loc);
    
    // If we have integrated field data, use it directly
    if (fieldData) {
      setIntegratedFieldData(fieldData);
      
      // Update admin info from integrated data
      setAdminInfo({
        village: fieldData.administrative.village,
        district: fieldData.administrative.district,
        state: fieldData.administrative.state,
        source: fieldData.administrative.source
      });
      
      // Auto-populate field name if empty
      if (!form.field_name && fieldData.field.suggested_name) {
        setField('field_name', fieldData.field.suggested_name);
      }
      
      // Fetch additional soil data if needed
      await fetchAdditionalSoilData(lat, lng);
      return;
    }
    
    // Fallback to legacy method if no integrated data
    setFetchingLocationData(true);
    try {
      // Step 1: Call backend for Bhuvan reverse geocoding
      const bhuvanResult = await reverseGeocodeBhuvan(lat, lng);
      
      if (bhuvanResult.success) {
        setAdminInfo({
          village: bhuvanResult.village,
          district: bhuvanResult.district,
          state: bhuvanResult.state,
          source: 'bhuvan',
        });
      } else {
        console.warn('Bhuvan reverse geocoding failed:', bhuvanResult.error);
        setAdminInfo({ source: 'error' });
      }

      // If field name is empty, generate from admin info immediately
      if (!form.field_name && bhuvanResult.success) {
        const name = bhuvanResult.village
          ? `${bhuvanResult.village} Field`
          : bhuvanResult.district
            ? `${bhuvanResult.district} Field`
            : bhuvanResult.state
              ? `${bhuvanResult.state} Field`
              : '';
        if (name) setField('field_name', name);
      }

      await fetchAdditionalSoilData(lat, lng);
    } catch (e) {
      console.error('Failed to fetch location data:', e);
    } finally {
      setFetchingLocationData(false);
    }
  };
  
  // Separate function for fetching soil data
  const fetchAdditionalSoilData = async (lat: number, lng: number) => {
    try {
      // Step 2: Fetch aggregated soil/land data (uses backend or mock)
      const agg = await fetchAggregatedFieldData({
        field_id: form.field_name || undefined,
        geometry: { type: 'Point', coordinates: [lng, lat] }
      });

      // Keep a small summary for the UI
      setAutofillInfo({
        village: agg.location?.village,
        district: agg.location?.district,
        state: agg.location?.state,
        land_use: agg.land_use ?? null,
        soil: agg.soil ?? null,
      });

      // Apply soil type at field level if provided
      if (agg.soil?.soil_type) {
        setField('soil_type', agg.soil.soil_type);
      }

      // Apply NPK/pH to each crop only if empty, to avoid overriding manual entries
      setForm(prev => {
        const updatedCrops = prev.crops.map(c => ({
          ...c,
          soil_N: c.soil_N || (agg.soil?.nitrogen != null ? String(agg.soil.nitrogen) : c.soil_N),
          soil_P: c.soil_P || (agg.soil?.phosphorus != null ? String(agg.soil.phosphorus) : c.soil_P),
          soil_K: c.soil_K || (agg.soil?.potassium != null ? String(agg.soil.potassium) : c.soil_K),
          soil_pH: c.soil_pH || (agg.soil?.ph != null ? String(agg.soil.ph) : c.soil_pH),
        }));
        return { ...prev, crops: updatedCrops };
      });

      // If field name is still empty, fallback to agg location
      if (!form.field_name) {
        const name = agg.location?.village
          ? `${agg.location.village} Field`
          : agg.location?.district
            ? `${agg.location.district} Field`
            : agg.location?.state
              ? `${agg.location.state} Field`
              : '';
        if (name) setField('field_name', name);
      }
    } catch (e) {
      console.error('Failed to fetch soil data:', e);
    }
  };
  
  const handleFieldDataReceived = (fieldData: FieldLocationData) => {
    setIntegratedFieldData(fieldData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-leaf-green to-green-600 p-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <GiWheat className="text-4xl" />
              {t('dataInput.title')}
            </h1>
            {showNewUserMessage && (
              <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 text-white">
                  <FiCheck className="text-xl" />
                  <span className="font-semibold">{t('dataInput.newUserWelcome')}</span>
                </div>
                <p className="text-white/90 text-sm mt-1">{t('dataInput.newUserMessage')}</p>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Field Location selection & autofill */}
            <div className="mb-6 bg-gray-50 border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-md font-semibold text-gray-800">{t('dataInputLocation.fieldLocation')}</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    {t('dataInputLocation.pickOnMap')}
                  </button>
                </div>
              </div>

              {selectedLocation && (
                <div className="text-sm text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{t('dataInputLocation.selectedLocation')}:</span>
                    <span>
                      {selectedLocation.name || `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
                    </span>
                  </div>
                  {adminInfo && (
                    <div className="mt-1 text-gray-600">
                      {adminInfo.village && adminInfo.district && (
                        <span>{t('dataInputLocation.yourFieldIsInVD', { village: adminInfo.village, district: adminInfo.district })}</span>
                      )}
                      {!adminInfo.village && adminInfo.district && (
                        <span>{t('dataInputLocation.yourFieldIsInD', { district: adminInfo.district })}</span>
                      )}
                      {adminInfo.village && !adminInfo.district && (
                        <span>{t('dataInputLocation.yourFieldIsInVillage', { village: adminInfo.village })}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {fetchingLocationData && (
                <div className="text-sm text-blue-700 flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {t('dataInputLocation.fetchingLocationData')}
                </div>
              )}
              
              {/* Enhanced location information from integrated service */}
              {integratedFieldData && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-800">Enhanced Location Data</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {integratedFieldData.field.location_quality}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Data Sources:</span>
                      <div className="text-gray-600">{integratedFieldData.sources.join(', ')}</div>
                    </div>
                    
                    {integratedFieldData.places?.formatted_address && (
                      <div>
                        <span className="font-medium text-gray-700">Google Address:</span>
                        <div className="text-gray-600">{integratedFieldData.places.formatted_address}</div>
                      </div>
                    )}
                    
                    {integratedFieldData.land_use?.classification.success && (
                      <div>
                        <span className="font-medium text-gray-700">Land Use:</span>
                        <div className="text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>{integratedFieldData.land_use.classification.primary_class.class_name}</span>
                            {integratedFieldData.land_use.classification.primary_class.confidence && (
                              <span className="text-xs text-gray-500">
                                ({integratedFieldData.land_use.classification.primary_class.confidence.toFixed(0)}%)
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            {integratedFieldData.land_use.classification.primary_class.agricultural_suitability === 'excellent' && (
                              <><span className="text-green-600">🌟</span><span className="text-green-600">Excellent for agriculture</span></>
                            )}
                            {integratedFieldData.land_use.classification.primary_class.agricultural_suitability === 'good' && (
                              <><span className="text-green-600">✅</span><span className="text-green-600">Good for agriculture</span></>
                            )}
                            {integratedFieldData.land_use.classification.primary_class.agricultural_suitability === 'moderate' && (
                              <><span className="text-yellow-600">⚠️</span><span className="text-yellow-600">Moderate suitability</span></>
                            )}
                            {integratedFieldData.land_use.classification.primary_class.agricultural_suitability === 'poor' && (
                              <><span className="text-orange-600">⚠️</span><span className="text-orange-600">Limited suitability</span></>
                            )}
                            {integratedFieldData.land_use.classification.primary_class.agricultural_suitability === 'unsuitable' && (
                              <><span className="text-red-600">❌</span><span className="text-red-600">Not suitable</span></>
                            )}
                          </div>
                          
                          {integratedFieldData.land_use.recommendations.crop_recommendations.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-gray-700">Recommended crops: </span>
                              <span className="text-gray-600">
                                {integratedFieldData.land_use.recommendations.crop_recommendations.slice(0, 4).join(', ')}
                                {integratedFieldData.land_use.recommendations.crop_recommendations.length > 4 && '...'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {integratedFieldData.field.is_agricultural_area && !integratedFieldData.land_use?.classification.success && (
                      <div className="flex items-center gap-1 text-green-700">
                        <span>🌾</span>
                        <span>Agricultural area detected</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {autofillInfo && (
                <div className="mt-2 grid md:grid-cols-3 gap-3 text-sm">
                  {/* Admin */}
                  <div className="bg-white border rounded-lg p-3">
                    <div className="font-semibold text-gray-800 mb-2">{t('dataInputLocation.details')}</div>
                    <div className="text-gray-600">
                      {(adminInfo?.village || autofillInfo?.village) && (
                        <div><span className="font-medium">{t('dataInputLocation.village')}:</span> {adminInfo?.village || autofillInfo?.village}</div>
                      )}
                      {(adminInfo?.district || autofillInfo?.district) && (
                        <div><span className="font-medium">{t('dataInputLocation.district')}:</span> {adminInfo?.district || autofillInfo?.district}</div>
                      )}
                      {(adminInfo?.state || autofillInfo?.state) && (
                        <div><span className="font-medium">{t('dataInputLocation.state')}:</span> {adminInfo?.state || autofillInfo?.state}</div>
                      )}
                    </div>
                  </div>
                  {/* Land Use */}
                  <div className="bg-white border rounded-lg p-3">
                    <div className="font-semibold text-gray-800 mb-2">{t('dataInputLocation.landUse')}</div>
                    <div className="text-gray-600">
                      {autofillInfo.land_use?.class || '-'}
                      {autofillInfo.land_use?.coverage_percent != null && (
                        <span className="text-xs text-gray-500"> ({autofillInfo.land_use.coverage_percent.toFixed(1)}%)</span>
                      )}
                    </div>
                  </div>
                  {/* Soil */}
                  <div className="bg-white border rounded-lg p-3">
                    <div className="font-semibold text-gray-800 mb-2">{t('dataInput.soilType')}</div>
                    <div className="text-gray-600 space-y-1">
                      <div><span className="font-medium">{t('dataInput.soilType')}:</span> {autofillInfo.soil?.soil_type || '-'}</div>
                      {autofillInfo.soil?.soil_depth && (
                        <div><span className="font-medium">{t('dataInputLocation.soilDepth')}:</span> {autofillInfo.soil.soil_depth}</div>
                      )}
                      {autofillInfo.soil?.organic_carbon != null && (
                        <div><span className="font-medium">{t('dataInputLocation.organicCarbon')}:</span> {autofillInfo.soil.organic_carbon}</div>
                      )}
                      <div className="text-xs text-gray-500">{t('dataInputLocation.autofilledFromLocation')} • {t('dataInputLocation.applied')}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Saved profiles management */}
            <div className="mb-6 bg-gray-50 border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">{t('dataInput.savedFieldProfiles')}</h2>
                <button onClick={resetForm} className="text-sm text-leaf-green hover:underline">{t('dataInput.newProfile')}</button>
              </div>
              {profiles.length === 0 ? (
                <p className="text-sm text-gray-600">{t('dataInput.noProfilesSaved')}</p>
              ) : (
                <div className="space-y-2">
                  {profiles.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.field_profile.field_name}</p>
                        <p className="text-xs text-gray-500">{p.field_profile.crops.length} crop(s) • {p.field_profile.soil_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadProfileIntoForm(idx)}
                          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          {t('dataInput.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProfile(idx)}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded flex items-center gap-1"
                        >
                          <Trash2 /> {t('dataInput.delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('manual')}
                className={`pb-3 px-4 font-semibold transition-colors ${
                  activeTab === 'manual'
                    ? 'text-leaf-green border-b-2 border-leaf-green'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('dataInput.manualEntry')}
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`pb-3 px-4 font-semibold transition-colors ${
                  activeTab === 'upload'
                    ? 'text-leaf-green border-b-2 border-leaf-green'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('dataInput.fileUpload')}
              </button>
            </div>

            {activeTab === 'manual' ? (
              <form onSubmit={handleSubmitManual} className="space-y-6">
                {errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Field details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.fieldName')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.field_name}
                        onChange={(e) => setField('field_name', e.target.value)}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        placeholder={t('dataInput.fieldNamePlaceholder')}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleAutoDetectLocation}
                        disabled={detectingLocation}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-leaf-green transition-colors disabled:opacity-50"
                        title={t('dataInput.autoDetectLocationTitle')}
                      >
                        {detectingLocation ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('dataInput.autoDetectLocationHint')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.fieldSize')}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={form.field_size_hectares}
                      onChange={(e) => setField('field_size_hectares', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      placeholder={t('dataInput.fieldSizePlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.soilType')}</label>
                    <select
                      value={form.soil_type}
                      onChange={(e) => setField('soil_type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      required
                    >
                      <option value="">{t('dataInput.selectSoilType')}</option>
                      {soilTypes.map(type => (
                        <option key={type} value={type}>{t(`soilTypes.${type.toLowerCase()}`) || type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.irrigationMethod')}</label>
                    <div className="relative">
                      <GiWateringCan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={form.irrigation_method}
                        onChange={(e) => setField('irrigation_method', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        required
                      >
                        <option value="">{t('dataInput.selectMethod')}</option>
                        {irrigationMethods.map(method => (
                          <option key={method} value={method}>{t(`irrigationMethods.${method.toLowerCase()}`) || method}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.irrigationAvailability')}</label>
                    <select
                      value={form.irrigation_availability}
                      onChange={(e) => setField('irrigation_availability', e.target.value as FieldForm['irrigation_availability'])}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      required
                    >
                      <option value="">{t('dataInput.selectAvailability')}</option>
                      {IRRIGATION_AVAILABILITY.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fields list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">{t('dataInput.fieldManagement')}</h3>
                    <button
                      type="button"
                      onClick={addField}
                      className="flex items-center gap-2 px-3 py-2 bg-leaf-green text-white rounded hover:bg-green-700"
                    >
                      <FiPlus /> {t('dataInput.addField')}
                    </button>
                  </div>

                  {/* Field tabs */}
                  {fields.length > 1 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto">
                      {fields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCurrentFieldIndex(idx)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              currentFieldIndex === idx
                                ? 'bg-leaf-green text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {field.field_name || `Field ${idx + 1}`}
                          </button>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeField(idx)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title={t('dataInput.removeFieldTitle')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>{t('dataInput.currentField')}:</strong> {form.field_name || `${t('dataInput.crop')} ${currentFieldIndex + 1}`} 
                      {fields.length > 1 && `(${currentFieldIndex + 1} of ${fields.length})`}
                    </p>
                  </div>

                  {/* Crops for current field */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-800">{t('dataInput.cropsForThisField')}</h4>
                      <button
                        type="button"
                        onClick={addCrop}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        <FiPlus /> {t('dataInput.addCrop')}
                      </button>
                    </div>

                  {form.crops.map((c, idx) => (
                    <div key={idx} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-700">{t('dataInput.crop')} {idx + 1}</h4>
                        {form.crops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCrop(idx)}
                            className="text-sm text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <Trash2 /> {t('dataInput.removeCrop')}
                          </button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.cropType')}</label>
                          <input
                            type="text"
                            list="cropOptions"
                            value={c.crop_type}
                            onChange={(e) => setCropField(idx, 'crop_type', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            placeholder={t('dataInput.cropTypePlaceholder')}
                            required
                          />
                          <datalist id="cropOptions">
                            {cropTypes.map(option => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.plantingDateLabel')}</label>
                          <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={c.planting_date}
                              onChange={(e) => setCropField(idx, 'planting_date', e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                              placeholder={t('dataInput.plantingDatePlaceholder')}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.fertilizersUsedLabel')}</label>
                          <input
                            type="text"
                            value={c.fertilizers_used}
                            onChange={(e) => setCropField(idx, 'fertilizers_used', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            placeholder={t('dataInput.fertilizerPlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.pesticidesUsedLabel')}</label>
                          <input
                            type="text"
                            value={c.pesticides_used}
                            onChange={(e) => setCropField(idx, 'pesticides_used', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            placeholder={t('dataInput.pesticidePlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('dataInput.previousCropLabel')}</label>
                          <input
                            type="text"
                            value={c.previous_crop}
                            onChange={(e) => setCropField(idx, 'previous_crop', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            placeholder={t('dataInput.previousCropPlaceholder')}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">N</label>
                            <input
                              type="text"
                              value={c.soil_N}
                              onChange={(e) => setCropField(idx, 'soil_N', e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded"
                              placeholder={t('dataInput.soilNPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">P</label>
                            <input
                              type="text"
                              value={c.soil_P}
                              onChange={(e) => setCropField(idx, 'soil_P', e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded"
                              placeholder={t('dataInput.soilPPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">K</label>
                            <input
                              type="text"
                              value={c.soil_K}
                              onChange={(e) => setCropField(idx, 'soil_K', e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded"
                              placeholder={t('dataInput.soilKPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">pH</label>
                            <input
                              type="text"
                              value={c.soil_pH}
                              onChange={(e) => setCropField(idx, 'soil_pH', e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded"
                              placeholder={t('dataInput.soilpHPlaceholder')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-leaf-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save /> {editingIndex !== null ? t('dataInput.updateFieldsContinue') : t('dataInput.saveFieldsContinue')}
                  </button>
                  {!showNewUserMessage && (
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-leaf-green bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FiUpload className="mx-auto text-5xl text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">{t('dataInput.dragDrop')}</p>
                  <p className="text-sm text-gray-500 mb-4">{t('dataInput.supportedFormats')}</p>

                  <label className="inline-block">
                    <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                    <span className="bg-leaf-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors cursor-pointer">
                      {t('dataInput.browseFiles')}
                    </span>
                  </label>
                </div>

                {uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <FiFile className="text-2xl text-leaf-green" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-700">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button onClick={() => setUploadedFile(null)} className="text-red-500 hover:text-red-700">
                      {t('dataInput.remove')}
                    </button>
                  </div>
                )}

                {/* Upload Status Messages */}
                {uploadStatus === 'success' && successMessage && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium">{successMessage}</p>
                      <p className="text-sm mt-1">Redirecting to dashboard...</p>
                    </div>
                  </div>
                )}

                {uploadStatus === 'error' && errors.length > 0 && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium mb-2">Upload Errors:</p>
                    <ul className="list-disc list-inside text-sm">
                      {errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {uploadStatus === 'uploading' && (
                  <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    <p className="font-medium">Processing CSV file...</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadedFile || isSubmitting}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                      uploadedFile && !isSubmitting
                        ? 'bg-leaf-green text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        {t('dataInput.processing')}
                      </span>
                    ) : (
                      showNewUserMessage ? t('dataInput.uploadComplete') : t('dataInput.uploadCSV')
                    )}
                  </button>
                  {!showNewUserMessage && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      disabled={isSubmitting}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-400"
                    >
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Display uploaded crop data */}
            {showDataTable && (
              <div className="mt-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                    <h2 className="text-xl font-bold text-white flex items-center justify-between">
                      <span>📊 Uploaded Crop Data</span>
                      <button
                        onClick={fetchCropData}
                        disabled={loadingData}
                        className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
                      >
                        {loadingData ? 'Refreshing...' : '🔄 Refresh'}
                      </button>
                    </h2>
                    {dataStats && (
                      <div className="mt-2 text-white/90 text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>Total Records: {dataStats.total_records || 0}</div>
                        <div>Unique Crops: {dataStats.unique_crops || 0}</div>
                        <div>Unique States: {dataStats.unique_states || 0}</div>
                        <div>Avg Yield: {dataStats.avg_yield?.toFixed(2) || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    {loadingData ? (
                      <div className="text-center py-8">
                        <Loader className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                        <p className="mt-2 text-gray-600">Loading crop data...</p>
                      </div>
                    ) : cropData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield/Ha</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Size (Ha)</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cropData.slice(0, 50).map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.field_name || 'Unknown'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.state || 'Unknown'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.district || 'Unknown'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.crop_type || 'Unknown'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.yield_per_hectare?.toFixed(2) || '0.00'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {row.field_size_hectares?.toFixed(2) || '0.00'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {row.data_source || 'csv_upload'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {cropData.length > 50 && (
                          <p className="text-sm text-gray-500 text-center mt-4">
                            Showing first 50 of {cropData.length} records
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No crop data available yet.</p>
                        <p className="text-sm mt-2">Upload a CSV file to see your data here.</p>
                      </div>
                    )}
                    
                    {cropData.length > 0 && (
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => setShowDataTable(false)}
                          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          Hide Table
                        </button>
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="px-4 py-2 text-sm bg-leaf-green text-white hover:bg-green-700 rounded"
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!showDataTable && cropData.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowDataTable(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Show Uploaded Data ({cropData.length} records)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Google Maps Picker Modal */}
      <GoogleMapPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelected}
        onFieldDataReceived={handleFieldDataReceived}
        apiKey={(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''}
      />
      
      {/* Debug info for API key (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs z-50 opacity-80">
          API Key: {(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'}
        </div>
      )}
    </div>
  );
};

export default DataInput;
