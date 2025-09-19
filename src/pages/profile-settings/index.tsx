import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import profile components
import PersonalInformation from './components/PersonalInformation';
import FarmConfiguration from './components/FarmConfiguration';
import SecuritySettings from './components/SecuritySettings';
import DataManagement from './components/DataManagement';
import LanguageSettings from './components/LanguageSettings';

interface UserProfile {
  personal: {
    name: string;
    email: string;
    phone: string;
    profilePhoto: string | null;
    address: string;
    farmName: string;
  };
  farm: {
    defaultUnits: string;
    currency: string;
    timezone: string;
    region: string;
    farmSize: number;
    primaryCrops: string[];
    irrigationSystem: string;
    soilType: string;
  };
  security: {
    twoFactorEnabled: boolean;
    trustedDevices: any[];
    sessionTimeout: number;
    lastPasswordChange: Date;
    loginHistory: any[];
  };
  language: {
    primary: string;
    secondary: string;
    interfaceLanguage: string;
  };
  data: {
    autoBackup: boolean;
    exportFormat: string;
    retentionPeriod: number;
    shareAnalytics: boolean;
  };
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

const ProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mock user profile data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    personal: {
      name: 'Rajesh Patel',
      email: 'rajesh.patel@email.com',
      phone: '+91 98765 43210',
      profilePhoto: null,
      address: 'Village Kheda, District Anand, Gujarat',
      farmName: 'Patel Agri Farms'
    },
    farm: {
      defaultUnits: 'metric',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      region: 'western-india',
      farmSize: 42.7,
      primaryCrops: ['wheat', 'corn', 'soybeans', 'tomatoes'],
      irrigationSystem: 'mixed',
      soilType: 'mixed'
    },
    security: {
      twoFactorEnabled: false,
      trustedDevices: [],
      sessionTimeout: 60,
      lastPasswordChange: new Date('2024-12-01'),
      loginHistory: []
    },
    language: {
      primary: 'EN',
      secondary: 'HI',
      interfaceLanguage: 'EN'
    },
    data: {
      autoBackup: true,
      exportFormat: 'csv',
      retentionPeriod: 24,
      shareAnalytics: true
    }
  });

  const settingSections: SettingSection[] = [
    {
      id: 'personal',
      title: t('profile.personal'),
      description: t('profile.personalDesc'),
      icon: 'User',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'farm',
      title: t('profile.farm'),
      description: t('profile.farmDesc'),
      icon: 'MapPin',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'language',
      title: t('profile.language'),
      description: t('profile.languageDesc'),
      icon: 'Globe',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'security',
      title: t('profile.security'),
      description: t('profile.securityDesc'),
      icon: 'Shield',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      id: 'data',
      title: t('profile.data'),
      description: t('profile.dataDesc'),
      icon: 'Download',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleProfileUpdate = (section: keyof UserProfile, data: any) => {
    setUserProfile(prev => ({
      ...prev,
      [section]: { ...prev?.[section], ...data }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setHasUnsavedChanges(false);
        setIsLoading(false);

        alert(t('status.success') + '!');
      } catch (error) {
        setIsLoading(false);
        alert(t('status.error') + ': ' + t('status.failed'));
      }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <PersonalInformation 
            data={userProfile?.personal}
            onUpdate={(data) => handleProfileUpdate('personal', data)}
          />
        );
      case 'farm':
        return (
          <FarmConfiguration 
            data={userProfile?.farm}
            onUpdate={(data) => handleProfileUpdate('farm', data)}
          />
        );
      case 'language':
        return (
          <LanguageSettings 
            data={userProfile?.language}
            onUpdate={(data) => handleProfileUpdate('language', data)}
          />
        );
      case 'security':
        return (
          <SecuritySettings 
            data={userProfile?.security}
            onUpdate={(data) => handleProfileUpdate('security', data)}
          />
        );
      case 'data':
        return (
          <DataManagement 
            data={userProfile?.data}
            onUpdate={(data) => handleProfileUpdate('data', data)}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading && !hasUnsavedChanges) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Icon name="Loader2" size={48} className="mx-auto text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900">{t('profile.loadingSettings')}</p>
            <p className="text-sm text-gray-600">{t('profile.fetchingPreferences')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Settings" size={24} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
                  <p className="text-gray-600">
                    {t('profile.subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <Icon name="ArrowLeft" size={16} className="mr-2" />
                  {t('profile.backToDashboard')}
                </Button>
                {hasUnsavedChanges && (
                  <Button onClick={handleSaveChanges} disabled={isLoading}>
                    {isLoading ? (
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Icon name="Save" size={16} className="mr-2" />
                    )}
                    {isLoading ? t('profile.saving') : t('profile.saveChanges')}
                  </Button>
                )}
              </div>
            </div>

            {/* Unsaved changes notification */}
            {hasUnsavedChanges && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Icon name="AlertCircle" size={16} className="text-yellow-600" />
                  <p className="text-sm text-yellow-700">{t('profile.unsavedChanges')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>
                <nav className="space-y-2">
                  {settingSections?.map((section) => (
                    <button
                      key={section?.id}
                      onClick={() => setActiveSection(section?.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        activeSection === section?.id 
                          ? 'bg-blue-50 border border-blue-200 text-blue-600' 
                          : 'hover:bg-gray-50 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg ${
                          activeSection === section?.id ? 'bg-blue-100' : section?.bgColor
                        } flex items-center justify-center`}>
                          <Icon 
                            name={section?.icon} 
                            size={16} 
                            className={activeSection === section?.id ? 'text-blue-600' : section?.color} 
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{section?.title}</p>
                          <p className="text-xs text-gray-500">{section?.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200">
                {renderActiveSection()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;