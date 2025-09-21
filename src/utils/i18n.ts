import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import hiCommon from '../locales/hi/common.json';
import hiWeather from '../locales/hi/weather.json';

// Get saved language preference or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en';

const resources = {
  en: {
    translation: {
      // Common
      welcome: "Welcome to Crop Prediction System",
      login: "Login",
      signup: "Sign Up",
      logout: "Logout",
      submit: "Submit",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      upload: "Upload",
      download: "Download",
      
      // Navigation
      nav: {
        dashboard: "Dashboard",
        dataInput: "Data Input",
        suggestions: "Suggestions",
        profile: "Profile",
        market: "Market",
        community: "Community"
      },
      
      // Auth
      auth: {
        email: "Email",
        password: "Password",
        name: "Full Name",
        phone: "Phone Number",
        location: "Location",
        farmSize: "Farm Size",
        selectLanguage: "Select Language",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password?",
        noAccount: "Don't have an account?",
        haveAccount: "Already have an account?",
        invalidCredentials: "Invalid email or password. Try e@gmail.com or n@gmail.com with any password.",
        loginFailed: "Login failed. Please try again.",
        signupFailed: "Signup failed. Please try again.",
        signingIn: "Signing in...",
        creatingAccount: "Creating account...",
        demoCredentials: "Demo Credentials:",
        existingUser: "Existing User:",
        newUser: "New User:",
        legacyUser: "Legacy:",
        anyPassword: "Password: Any password works",
        tryNewUser: "Try n@gmail.com to see the tutorial!",
        goesToDashboard: "(goes to Dashboard)",
        tutorialAndDataInput: "(tutorial + data input)",
        alsoGoesToDashboard: "(also goes to Dashboard)",
        newUserRegistration: "New User Registration:",
        afterSignupGuide: "After signup, you'll be guided to input your farm data",
        emailPlaceholder: "demo@farm.com",
        passwordPlaceholder: "••••••••",
        namePlaceholder: "John Farmer",
        signupEmailPlaceholder: "farmer@example.com",
        phonePlaceholder: "+91 98765 43210",
        locationPlaceholder: "Punjab, India",
        farmSizePlaceholder: "5 hectares"
      },
      
      // Dashboard
      dashboard: {
        title: "Farm Dashboard",
        welcomeBack: "Welcome back",
        season: "Season",
        field: "Field",
        hectares: "Hectares",
        weather: "Weather Conditions",
        currentWeather: "Current Weather",
        temperature: "Temperature",
        humidity: "Humidity",
        rainfall: "Rainfall",
        windSpeed: "Wind Speed",
        forecast: "5-Day Forecast",
        weatherForecast: "Weather Forecast",
        predictions: "AI Predictions",
        currentCrop: "Current Crop",
        predictedYield: "Predicted Yield",
        aiConfidence: "AI Confidence",
        confidence: "Confidence",
        harvestDate: "Harvest Date",
        marketPrice: "Market Price",
        marketPriceTrend: "Market Price Trend",
        yieldTrend: "Yield Trend",
        yieldTrendAnalysis: "Yield Trend Analysis",
        alerts: "Alerts & Notifications",
        alternativeCrops: "Alternative Crops",
        bestCropSuggestions: "Best Crop Suggestions",
        quickActions: "Quick Actions",
        soilMoisture: "Soil Moisture",
        soilNutrients: "Soil Nutrients",
        nextIrrigation: "Next irrigation",
        optimal: "Optimal",
        vsLast: "vs last",
        bestTimeToSell: "Best time to sell",
        tonsPerHa: "tons/ha",
        moisture: "moisture",
        perQuintal: "/quintal",
        thisMonth: "this month",
        updateFarmData: "Update Farm Data",
        viewTips: "View Tips",
        marketInsights: "Market Insights",
        getSupport: "Get Support",
        viewDetails: "View Details",
        implementSuggestion: "Implement Suggestion",
        fertilizer: "Fertilizer",
        pestControl: "Pest Control",
        pestAlert: "Pest Alert",
        currentStatus: "Current Status",
        noThreatsDetected: "No immediate threats detected",
        preventiveAction: "Preventive Action",
        neemSprayScheduled: "Neem spray scheduled in 5 days",
        viewPreventionTips: "View Prevention Tips",
        lowRisk: "Low Risk",
        highPriority: "High Priority",
        nitrogen: "Nitrogen",
        phosphorus: "Phosphorus",
        potassium: "Potassium",
        wheat: "Wheat",
        corn: "Corn",
        rice: "Rice",
        yield: "Yield",
        suitability: "Suitability",
        profit: "Profit",
        bestSellingWindow: "Best Selling Window",
        expectedPrice: "March 10-20: Expected ₹2,350/quintal",
        setAlert: "Set Alert",
        lastSixMonths: "Last 6 Months",
        lastYear: "Last Year",
        allTime: "All Time",
        actualYield: "Actual Yield",
        aiPredicted: "AI Predicted",
        currentSeason: "Current Season",
        current: "Current",
        ideal: "Ideal",
        ppm: "ppm",
        rabi: "Rabi",
        selectField: "Select Field",
        activeField: "Active Field",
        currentLevel: "Current Level",
        idealForCrop: "Ideal for Crop",
        weekdays: {
          sunday: "Sunday",
          monday: "Monday", 
          tuesday: "Tuesday",
          wednesday: "Wednesday",
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday"
        },
        months: {
          jan: "Jan",
          feb: "Feb",
          mar: "Mar",
          apr: "Apr",
          may: "May",
          jun: "Jun",
          jul: "Jul",
          aug: "Aug",
          sep: "Sep",
          oct: "Oct",
          nov: "Nov",
          dec: "Dec"
        },
        chartLabels: {
          tonsPerHa: "Tons/ha",
          actualYield: "Actual Yield",
          aiPredicted: "AI Predicted",
          currentYield: "Current Yield",
          currentSeason: "Current Season"
        }
      },
      
      // Data Input
      dataInput: {
        title: "Farm Data Input",
        manualEntry: "Manual Entry",
        fileUpload: "File Upload",
        soilType: "Soil Type",
        cropType: "Crop Type",
        irrigationMethod: "Irrigation Method",
        plantingDate: "Planting Date",
        fertilzerUsed: "Fertilizer Used",
        uploadCSV: "Upload CSV/Excel File",
        dragDrop: "Drag and drop file here or click to browse",
        supportedFormats: "Supported formats: CSV, Excel",
        selectCropType: "Select crop type",
        newUserWelcome: "Welcome! Let's set up your farm profile",
        newUserMessage: "Add your farm details to get personalized insights and recommendations",
        saving: "Saving...",
        processing: "Processing...",
        completeSetup: "Complete Setup & Go to Dashboard",
        uploadComplete: "Upload & Complete Setup",
        browseFiles: "Browse Files",
        remove: "Remove",
        addField: "Add Field",
        removeField: "Remove Field",
        addCrop: "Add Crop",
        removeCrop: "Remove Crop",
        fieldName: "Field name/ID",
        fieldSize: "Field size (hectares)",
        irrigationAvailability: "Irrigation availability",
        fieldManagement: "Field Management",
        cropsForThisField: "Crops for this field",
        currentField: "Current Field",
        savedFieldProfiles: "Saved Field Profiles",
        newProfile: "New Profile",
        noProfilesSaved: "No profiles saved yet.",
        edit: "Edit",
        delete: "Delete",
        crop: "Crop",
        selectSoilType: "Select soil type",
        selectMethod: "Select method",
        selectAvailability: "Select availability",
        autoDetectLocationTitle: "Auto-detect location for field name",
        autoDetectLocationHint: "Click the location icon to auto-detect your area and set weather location",
        removeFieldTitle: "Remove field",
        plantingDateLabel: "Planting date (dd-mm-yyyy)",
        fertilizersUsedLabel: "Fertilizers used (comma-separated)",
        pesticidesUsedLabel: "Pesticides/herbicides used (comma-separated)",
        previousCropLabel: "Previous crop (optional)",
        soilTestLabel: "Soil test results (optional)",
        fieldSizePlaceholder: "5.0",
        fieldNamePlaceholder: "North Field",
        plantingDatePlaceholder: "15-06-2025",
        fertilizerPlaceholder: "NPK, Urea, DAP",
        pesticidePlaceholder: "Neem Oil",
        previousCropPlaceholder: "Wheat",
        soilNPlaceholder: "e.g., 85",
        soilPPlaceholder: "e.g., 40",
        soilKPlaceholder: "e.g., 42",
        soilpHPlaceholder: "e.g., 6.5",
        cropTypePlaceholder: "e.g., Rice",
        saveFieldsContinue: "Save Fields & Continue",
        updateFieldsContinue: "Update Fields & Continue",
        pesticidesPlaceholder: "List any pesticides or herbicides used..."
      },
      
      // Added: Field Location selection & autofill
      dataInputLocation: {
        fieldLocation: "Field Location",
        pickOnMap: "Pick on Map",
        selectedLocation: "Selected Location",
        fetchingLocationData: "Fetching location data...",
        autofilledFromLocation: "Autofilled from location",
        village: "Village",
        district: "District",
        state: "State",
        landUse: "Land Use",
        soilDepth: "Soil Depth",
        organicCarbon: "Organic Carbon",
        applied: "Applied",
        details: "Details",
        yourFieldIsInVD: "Your field is in {{village}}, {{district}}.",
        yourFieldIsInD: "Your field is in {{district}}.",
        yourFieldIsInVillage: "Your field is in {{village}}."
      },
      
      // Suggestions
      suggestions: {
        title: "Optimization Suggestions",
        irrigation: "Irrigation",
        fertilizer: "Fertilizer",
        pestControl: "Pest Control",
        soilHealth: "Soil Health",
        harvest: "Harvest",
        impact: "Expected Impact",
        priority: "Priority",
        high: "High",
        medium: "Medium",
        low: "Low",
        subtitle: "Personalized recommendations to optimize your farm productivity",
        all: "All",
        totalSuggestions: "Total Suggestions",
        completed: "Completed",
        pending: "Pending",
        noSuggestionsFound: "No suggestions found for this category.",
        backToDashboard: "Back to Dashboard",
        updateFarmData: "Update Farm Data",
        downloadReport: "Download Report",
        undo: "Undo",
        markAsDone: "Mark as Done",
        irrigationCategory: "Irrigation",
        fertilizerCategory: "Fertilizer", 
        pestControlCategory: "Pest Control",
        soilHealthCategory: "Soil Health",
        harvestCategory: "Harvest"
      },
      
      // Tutorial
      tutorial: {
        welcome: "Welcome to CropPredict AI!",
        subtitle: "Let's take a quick tour to get you started",
        step1: {
          title: "Smart Farm Management",
          description: "Our AI analyzes your farm data to provide personalized insights and recommendations for maximum yield."
        },
        step2: {
          title: "Data-Driven Decisions",
          description: "Input your farm details like soil type, crops, and irrigation methods to get accurate predictions."
        },
        step3: {
          title: "AI-Powered Suggestions",
          description: "Receive intelligent recommendations for fertilizers, irrigation schedules, and pest management."
        },
        step4: {
          title: "Weather Integration",
          description: "Real-time weather data helps optimize your farming decisions and predict potential risks."
        },
        step5: {
          title: "Ready to Get Started?",
          description: "Let's set up your farm profile to begin receiving personalized insights."
        },
        next: "Next",
        previous: "Previous",
        skip: "Skip Tutorial",
        getStarted: "Get Started",
        stepOf: "Step {{current}} of {{total}}"
      },
      
      // Profile Settings
      profile: {
        settings: "Profile Settings",
        title: "Profile Settings",
        subtitle: "Manage your account and application preferences",
        backToDashboard: "Back to Dashboard",
        saveChanges: "Save Changes",
        saving: "Saving...",
        unsavedChanges: "You have unsaved changes",
        loadingSettings: "Loading settings...",
        fetchingPreferences: "Please wait while we fetch your preferences",
        
        // Navigation
        personal: "Personal Information",
        personalDesc: "Manage your account details",
        farm: "Farm Configuration",
        farmDesc: "Farm settings and preferences", 
        language: "Language & Region",
        languageDesc: "Language and regional settings",
        security: "Security",
        securityDesc: "Password and security settings",
        data: "Data Management",
        dataDesc: "Export and backup options",
        
        // Personal Information
        personalInfo: {
          title: "Personal Information",
          subtitle: "Manage your personal details and profile information",
          edit: "Edit",
          cancel: "Cancel",
          fullName: "Full Name",
          farmName: "Farm Name",
          email: "Email Address",
          phone: "Phone Number",
          address: "Address",
          uploadPhoto: "Upload Photo",
          photoFormats: "JPG, PNG or GIF. Max size 5MB.",
          accountStatus: "Account Status",
          activeVerified: "Active & Verified",
          memberSince: "Member Since",
          subscriptionPlan: "Subscription Plan",
          professional: "Professional"
        },
        
        // Farm Configuration  
        farmConfig: {
          title: "Farm Configuration",
          subtitle: "Configure your farm settings and preferences",
          farmSize: "Farm Size (acres)",
          currency: "Currency",
          primaryCrops: "Primary Crops",
          cropPlaceholder: "e.g., wheat, corn, soybeans"
        },
        
        // Language Settings
        languageSettings: {
          title: "Language & Region", 
          subtitle: "Set your preferred language and regional settings",
          primaryLanguage: "Primary Language",
          secondaryLanguage: "Secondary Language",
          english: "English",
          hindi: "Hindi",
          gujarati: "Gujarati",
          marathi: "Marathi"
        },
        
        // Security Settings
        securitySettings: {
          title: "Security Settings",
          subtitle: "Manage your account security and authentication preferences",
          twoFactor: "Two-Factor Authentication",
          twoFactorDesc: "Add an extra layer of security",
          sessionTimeout: "Session Timeout (minutes)"
        },
        
        // Data Management
        dataManagement: {
          title: "Data Management",
          subtitle: "Control how your data is stored, backed up, and shared",
          autoBackup: "Auto Backup",
          autoBackupDesc: "Automatically backup your data",
          exportFormat: "Export Format",
          csv: "CSV",
          json: "JSON",
          pdf: "PDF"
        }
      },
      
      // Weather
      weather: {
        sunny: "Sunny",
        cloudy: "Cloudy",
        rainy: "Rainy",
        stormy: "Stormy",
        partlyCloudy: "Partly Cloudy",
        today: "Today",
        tomorrow: "Tomorrow"
      },
      
      // Units
      units: {
        celsius: "°C",
        fahrenheit: "°F",
        percent: "%",
        kmph: "km/h",
        mph: "mph",
        mm: "mm",
        inches: "inches",
        hectares: "hectares",
        acres: "acres",
        kg: "kg",
        tons: "tons",
        quintals: "quintals"
      },
      
      // Market Insights
      marketInsights: {
        title: "Market Insights",
        subtitle: "Real-time market prices and trade opportunities",
        setAlerts: "Set Alerts",
        exportData: "Export",
        priceTrends: "Price Trends",
        demandDistribution: "Demand Distribution",
        topBuyers: "Top Buyers",
        nearbyMandis: "Nearby Mandis",
        viewAllBuyers: "View All Buyers",
        viewAllMandis: "View All Mandis",
        marketOpportunityAlert: "Market Opportunity Alert",
        learnMore: "Learn More",
        todaysHigh: "Today's High",
        todaysLow: "Today's Low",
        average: "Average",
        volume: "Volume",
        msp: "MSP",
        localMarket: "Local Market",
        stateMarket: "State Market",
        export: "Export",
        high: "High",
        medium: "Medium",
        low: "Low",
        wheat: "Wheat",
        rice: "Rice",
        corn: "Corn",
        cotton: "Cotton",
        priceAlert: "Wheat prices are expected to rise by 8-10% in the next 2 weeks due to increased export demand",
        week1: "1W",
        month1: "1M",
        month3: "3M",
        month6: "6M",
        year1: "1Y"
      },
      
      // Navigation
      navigation: {
        completeDataInputFirst: "Complete data input first"
      },
      
      // General
      general: {
        high: "High",
        medium: "Medium",
        low: "Low"
      },
      
      // Status
      status: {
        loading: "Loading...",
        error: "Error",
        success: "Success",
        warning: "Warning",
        info: "Information",
        pending: "Pending",
        completed: "Completed",
        failed: "Failed"
      }
    }
  },
  hi: {
    translation: {
      // Import from common.json and weather.json
      ...hiCommon,
      ...hiWeather
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;