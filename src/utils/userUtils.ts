import { Location } from '../types/weather';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  farmSize?: string;
  hasCompletedProfile: boolean;
  hasFarmData: boolean;
  hasCompletedTutorial: boolean;
  registrationDate: string;
  lastLogin?: string;
  // Weather-related location data
  primaryLocation?: Location;
  fieldLocations?: Location[];
  weatherPreferences?: {
    autoDetectLocation: boolean;
    preferredUnits: 'metric' | 'imperial';
    language: 'en' | 'hi';
  };
}

// Mock user database - in a real app, this would be in a backend
const mockUsers: { [email: string]: User } = {
  'demo@farm.com': {
    id: '1',
    name: 'Demo Farmer',
    email: 'demo@farm.com',
    phone: '+91 98765 43210',
    location: 'Punjab, India',
    farmSize: '5 hectares',
    hasCompletedProfile: true,
    hasFarmData: true,
    hasCompletedTutorial: true,
    registrationDate: '2024-01-15',
    lastLogin: '2024-12-18'
  },
  'e@gmail.com': {
    id: '2',
    name: 'Existing User',
    email: 'e@gmail.com',
    phone: '+91 98765 43211',
    location: 'Maharashtra, India',
    farmSize: '10 hectares',
    hasCompletedProfile: true,
    hasFarmData: true,
    hasCompletedTutorial: true,
    registrationDate: '2024-02-10',
    lastLogin: '2024-12-18'
  },
  'n@gmail.com': {
    id: '3',
    name: 'New User',
    email: 'n@gmail.com',
    phone: '+91 98765 43212',
    location: 'Gujarat, India',
    farmSize: '7 hectares',
    hasCompletedProfile: true,
    hasFarmData: false, // New user - needs to input farm data
    hasCompletedTutorial: false, // New user - needs tutorial
    registrationDate: '2024-12-18',
    lastLogin: '2024-12-18'
  },
  'existing@farm.com': {
    id: '4',
    name: 'Another Existing User',
    email: 'existing@farm.com',
    phone: '+91 98765 43213',
    location: 'Haryana, India',
    farmSize: '8 hectares',
    hasCompletedProfile: true,
    hasFarmData: true,
    hasCompletedTutorial: true,
    registrationDate: '2024-02-10',
    lastLogin: '2024-12-17'
  }
};

export const authenticateUser = (email: string, password: string): User | null => {
  // Mock authentication - in a real app, verify password hash
  if (password.length === 0) return null;
  
  const user = mockUsers[email.toLowerCase()];
  if (user) {
    // Update last login
    user.lastLogin = new Date().toISOString().split('T')[0];
    return user;
  }
  
  return null;
};

// Demo login helper functions
export interface DemoUser {
  email: string;
  name: string;
  description: string;
  destination: string;
}

export const demoUsers: DemoUser[] = [
  {
    email: 'e@gmail.com',
    name: 'Existing Farmer',
    description: 'Experienced user with complete profile',
    destination: 'Dashboard'
  },
  {
    email: 'n@gmail.com',
    name: 'New Farmer',
    description: 'First-time user needing tutorial',
    destination: 'Tutorial & Setup'
  },
  {
    email: 'demo@farm.com',
    name: 'Legacy User',
    description: 'Established farmer with full access',
    destination: 'Dashboard'
  }
];

export const performDemoLogin = (demoEmail: string): User | null => {
  const user = mockUsers[demoEmail.toLowerCase()];
  if (user) {
    user.lastLogin = new Date().toISOString().split('T')[0];
    return user;
  }
  return null;
};

export const registerUser = (userData: {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  farmSize?: string;
  password: string;
}): User => {
  const newUser: User = {
    id: Date.now().toString(),
    name: userData.name,
    email: userData.email.toLowerCase(),
    phone: userData.phone,
    location: userData.location,
    farmSize: userData.farmSize,
    hasCompletedProfile: !!(userData.location && userData.farmSize),
    hasFarmData: false, // New users haven't entered farm data yet
    hasCompletedTutorial: false, // New users need tutorial
    registrationDate: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString().split('T')[0]
  };
  
  // Save to mock database
  mockUsers[userData.email.toLowerCase()] = newUser;
  
  return newUser;
};

export const updateUserFarmData = (email: string): void => {
  const user = mockUsers[email.toLowerCase()];
  if (user) {
    user.hasFarmData = true;
  }
};

export const getUserByEmail = (email: string): User | null => {
  return mockUsers[email.toLowerCase()] || null;
};

export const isNewUser = (user: User): boolean => {
  // For n@gmail.com, they're new until both tutorial and farm data are complete
  if (user.email === 'n@gmail.com') {
    return !user.hasFarmData || !user.hasCompletedTutorial;
  }
  // For other users, they're new only if they don't have farm data
  return !user.hasFarmData;
};

export const needsTutorial = (user: User): boolean => {
  // Only show tutorial for the specific new user n@gmail.com
  return user.email === 'n@gmail.com' && !user.hasCompletedTutorial;
};

export const markTutorialComplete = (email: string): void => {
  const user = mockUsers[email.toLowerCase()];
  if (user) {
    user.hasCompletedTutorial = true;
  }
};

export const needsProfileCompletion = (user: User): boolean => {
  return !user.hasCompletedProfile;
};

// Local storage helpers
export const saveUserSession = (user: User): void => {
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('userEmail', user.email);
};
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const clearUserSession = (): void => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userData');
  localStorage.removeItem('fieldProfiles');
  localStorage.removeItem('weatherCache');
  localStorage.removeItem('locationCache');
};

// Enhanced logout function for automatic sign-out
export const performAutoLogout = (): void => {
  try {
    // Clear all user-related data
    clearUserSession();
    
    // Clear any additional localStorage items that might exist
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('user') || 
        key.startsWith('auth') || 
        key.startsWith('session') ||
        key.includes('token') ||
        key.includes('login')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove identified keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    console.log('User automatically signed out - all session data cleared');
  } catch (error) {
    console.error('Error during auto logout:', error);
    // Fallback: clear everything
    localStorage.clear();
    sessionStorage.clear();
  }
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isAuthenticated') === 'true' && !!getCurrentUser();
};

// Weather location management functions
export const updateUserLocation = (email: string, location: Location, isPrimary: boolean = true): void => {
  const user = mockUsers[email.toLowerCase()];
  if (user) {
    if (isPrimary) {
      user.primaryLocation = location;
    } else {
      if (!user.fieldLocations) {
        user.fieldLocations = [];
      }
      // Check if location already exists
      const existingIndex = user.fieldLocations.findIndex(
        loc => Math.abs(loc.latitude - location.latitude) < 0.01 && 
               Math.abs(loc.longitude - location.longitude) < 0.01
      );
      
      if (existingIndex === -1) {
        user.fieldLocations.push(location);
      } else {
        user.fieldLocations[existingIndex] = location;
      }
    }
    
    // Update localStorage
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email === email) {
      saveUserSession(user);
    }
  }
};

export const getUserLocation = (email: string): Location | null => {
  const user = mockUsers[email.toLowerCase()];
  return user?.primaryLocation || null;
};

export const getUserFieldLocations = (email: string): Location[] => {
  const user = mockUsers[email.toLowerCase()];
  return user?.fieldLocations || [];
};

export const updateWeatherPreferences = (
  email: string, 
  preferences: {
    autoDetectLocation?: boolean;
    preferredUnits?: 'metric' | 'imperial';
    language?: 'en' | 'hi';
  }
): void => {
  const user = mockUsers[email.toLowerCase()];
  if (user) {
    user.weatherPreferences = {
      autoDetectLocation: preferences.autoDetectLocation ?? true,
      preferredUnits: preferences.preferredUnits ?? 'metric',
      language: preferences.language ?? 'en',
      ...user.weatherPreferences,
      ...preferences
    };
    
    // Update localStorage
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email === email) {
      saveUserSession(user);
    }
  }
};

export const getWeatherPreferences = (email: string) => {
  const user = mockUsers[email.toLowerCase()];
  return user?.weatherPreferences || {
    autoDetectLocation: true,
    preferredUnits: 'metric' as const,
    language: 'en' as const
  };
};