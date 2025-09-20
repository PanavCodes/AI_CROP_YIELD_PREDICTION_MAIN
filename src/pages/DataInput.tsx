import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUpload, FiFile, FiCalendar, FiCheck, FiPlus } from 'react-icons/fi';
import { Trash2, Save, MapPin, Loader } from 'lucide-react';
import { GiWheat, GiWateringCan } from 'react-icons/gi';
import { soilTypes, cropTypes, irrigationMethods } from '../mockData/mockData';
import { getCurrentUser, updateUserFarmData, saveUserSession, isNewUser, updateUserLocation } from '../utils/userUtils';
import locationService from '../services/locationService';

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
  const [form, setForm] = useState<FieldForm>(defaultFieldForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && isNewUser(user)) {
      setShowNewUserMessage(true);
    }
  }, []);

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
    const errs = validateForm(form);
    if (errs.length) {
      setErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const json = buildJSON(form);
      const next = [...profiles];
      if (editingIndex !== null) {
        next[editingIndex] = json;
      } else {
        next.push(json);
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
      console.error('Error saving field profile:', error);
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

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Example: create a mock profile from uploaded file
      const mock: FieldProfileJSON = {
        field_profile: {
          field_name: 'Uploaded Field',
          field_size_hectares: 10,
          soil_type: 'Loamy',
          irrigation: { method: 'Drip', availability: 'High' },
          crops: [
            {
              crop_type: 'Wheat',
              planting_date: '01-11-2024',
              fertilizers_used: ['NPK', 'Urea'],
              pesticides_used: ['Neem Oil'],
              previous_crop: null,
              soil_test_results: { N: 80, P: 40, K: 42, pH: 6.5 },
            },
          ],
        },
      };

      const next = [...profiles, mock];
      saveProfilesToStorage(next);

      if (currentUser) {
        updateUserFarmData(currentUser.email);
        const updatedUser = { ...currentUser, hasFarmData: true };
        saveUserSession(updatedUser);
        setCurrentUser(updatedUser);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadProfileIntoForm = (index: number) => {
    const p = profiles[index];
    if (!p) return;
    setEditingIndex(index);
    const f = p.field_profile;
    setForm({
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
    });
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
            {/* Saved profiles management */}
            <div className="mb-6 bg-gray-50 border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Saved Field Profiles</h2>
                <button onClick={resetForm} className="text-sm text-leaf-green hover:underline">New Profile</button>
              </div>
              {profiles.length === 0 ? (
                <p className="text-sm text-gray-600">No profiles saved yet.</p>
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
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProfile(idx)}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded flex items-center gap-1"
                        >
                          <Trash2 /> Delete
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Field name/ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.field_name}
                        onChange={(e) => setField('field_name', e.target.value)}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        placeholder="North Field"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleAutoDetectLocation}
                        disabled={detectingLocation}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-leaf-green transition-colors disabled:opacity-50"
                        title="Auto-detect location for field name"
                      >
                        {detectingLocation ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Click the location icon to auto-detect your area and set weather location
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Field size (hectares)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={form.field_size_hectares}
                      onChange={(e) => setField('field_size_hectares', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      placeholder="5.0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Soil type</label>
                    <select
                      value={form.soil_type}
                      onChange={(e) => setField('soil_type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      required
                    >
                      <option value="">Select soil type</option>
                      {soilTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Irrigation method</label>
                    <div className="relative">
                      <GiWateringCan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={form.irrigation_method}
                        onChange={(e) => setField('irrigation_method', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        required
                      >
                        <option value="">Select method</option>
                        {irrigationMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Irrigation availability</label>
                    <select
                      value={form.irrigation_availability}
                      onChange={(e) => setField('irrigation_availability', e.target.value as FieldForm['irrigation_availability'])}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      required
                    >
                      <option value="">Select availability</option>
                      {IRRIGATION_AVAILABILITY.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Crops list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Crops for this field</h3>
                    <button
                      type="button"
                      onClick={addCrop}
                      className="flex items-center gap-2 px-3 py-2 bg-leaf-green text-white rounded hover:bg-green-700"
                    >
                      <FiPlus /> Add crop
                    </button>
                  </div>

                  {form.crops.map((c, idx) => (
                    <div key={idx} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-700">Crop {idx + 1}</h4>
                        {form.crops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCrop(idx)}
                            className="text-sm text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <Trash2 /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Crop type</label>
                          <input
                            type="text"
                            list="cropOptions"
                            value={c.crop_type}
                            onChange={(e) => setCropField(idx, 'crop_type', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            placeholder="e.g., Rice"
                            required
                          />
                          <datalist id="cropOptions">
                            {cropTypes.map(option => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Planting date (dd-mm-yyyy)</label>
                          <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={c.planting_date}
                              onChange={(e) => setCropField(idx, 'planting_date', e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                              placeholder="15-06-2025"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fertilizers used (comma-separated)</label>
                          <input
                            type="text"
                            value={c.fertilizers_used}
                            onChange={(e) => setCropField(idx, 'fertilizers_used', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            placeholder="NPK, Urea, DAP"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Pesticides/herbicides used (comma-separated)</label>
                          <input
                            type="text"
                            value={c.pesticides_used}
                            onChange={(e) => setCropField(idx, 'pesticides_used', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            placeholder="Neem Oil"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Previous crop (optional)</label>
                          <input
                            type="text"
                            value={c.previous_crop}
                            onChange={(e) => setCropField(idx, 'previous_crop', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            placeholder="Wheat"
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
                              placeholder="e.g., 85"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">P</label>
                            <input
                              type="text"
                              value={c.soil_P}
                              onChange={(e) => setCropField(idx, 'soil_P', e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded"
                              placeholder="e.g., 40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">K</label>
                            <input
                              type="text"
                              value={c.soil_K}
                              onChange={(e) => setCropField(idx, 'soil_K', e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded"
                              placeholder="e.g., 42"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">pH</label>
                            <input
                              type="text"
                              value={c.soil_pH}
                              onChange={(e) => setCropField(idx, 'soil_pH', e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded"
                              placeholder="e.g., 6.5"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-leaf-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save /> {editingIndex !== null ? 'Update Profile & Continue' : 'Save Profile & Continue'}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataInput;
