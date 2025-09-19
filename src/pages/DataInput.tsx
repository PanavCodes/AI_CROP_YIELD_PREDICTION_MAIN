import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUpload, FiFile, FiCalendar, FiCheck } from 'react-icons/fi';
import { GiWheat, GiWateringCan } from 'react-icons/gi';
import { soilTypes, cropTypes, irrigationMethods } from '../mockData/mockData';
import { getCurrentUser, updateUserFarmData, saveUserSession, isNewUser } from '../utils/userUtils';

const DataInput: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [showNewUserMessage, setShowNewUserMessage] = useState(false);
  const [formData, setFormData] = useState({
    soilType: '',
    cropType: '',
    irrigationMethod: '',
    plantingDate: '',
    fieldSize: '',
    fertilizerUsed: '',
    pesticidesUsed: ''
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (user && isNewUser(user)) {
      setShowNewUserMessage(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save farm data
      localStorage.setItem('farmData', JSON.stringify(formData));
      
      if (currentUser) {
        // Mark user as having completed farm data
        updateUserFarmData(currentUser.email);
        
        // Update local user session
        const updatedUser = { ...currentUser, hasFarmData: true };
        saveUserSession(updatedUser);
        setCurrentUser(updatedUser);
      }
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving farm data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
      // Mock file upload process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save mock data from file
      const mockUploadedData = {
        soilType: 'Loamy',
        cropType: 'Wheat',
        irrigationMethod: 'Drip Irrigation',
        plantingDate: '2024-11-01',
        fieldSize: '10',
        fertilizerUsed: 'NPK, Organic Compost',
        pesticidesUsed: 'Neem oil spray, Minimal chemical pesticides'
      };
      
      localStorage.setItem('farmData', JSON.stringify(mockUploadedData));
      
      if (currentUser) {
        // Mark user as having completed farm data
        updateUserFarmData(currentUser.email);
        
        // Update local user session
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
                <p className="text-white/90 text-sm mt-1">
                  {t('dataInput.newUserMessage')}
                </p>
              </div>
            )}
          </div>

          <div className="p-6">
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dataInput.soilType')}
                    </label>
                    <select
                      name="soilType"
                      value={formData.soilType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      required
                    >
                      <option value="">{t('dataInput.selectSoilType')}</option>
                      {soilTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dataInput.cropType')}
                    </label>
                    <select
                      name="cropType"
                      value={formData.cropType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      required
                    >
                      <option value="">{t('dataInput.selectCropType')}</option>
                      {cropTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dataInput.irrigationMethod')}
                    </label>
                    <div className="relative">
                      <GiWateringCan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        name="irrigationMethod"
                        value={formData.irrigationMethod}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        required
                      >
                        <option value="">{t('dataInput.selectMethod')}</option>
                        {irrigationMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dataInput.plantingDate')}
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="plantingDate"
                        value={formData.plantingDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dataInput.fieldSize')}
                    </label>
                    <input
                      type="number"
                      name="fieldSize"
                      value={formData.fieldSize}
                      onChange={handleChange}
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      placeholder={t('dataInput.fieldSizePlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dataInput.fertilzerUsed')}
                    </label>
                    <input
                      type="text"
                      name="fertilizerUsed"
                      value={formData.fertilizerUsed}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      placeholder={t('dataInput.fertilizerPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dataInput.pesticidesUsed')}
                  </label>
                  <textarea
                    name="pesticidesUsed"
                    value={formData.pesticidesUsed}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                    placeholder={t('dataInput.pesticidesPlaceholder')}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-leaf-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('dataInput.saving')}
                      </span>
                    ) : (
                      showNewUserMessage ? t('dataInput.completeSetup') : t('submit')
                    )}
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
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {t('dataInput.dragDrop')}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('dataInput.supportedFormats')}
                  </p>
                  
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
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
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
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