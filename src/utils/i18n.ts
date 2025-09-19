import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
        haveAccount: "Already have an account?"
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
        rabi: "Rabi"
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
        fieldSize: "Field Size (hectares)",
        fertilzerUsed: "Fertilizer Used",
        pesticidesUsed: "Pesticides Used",
        uploadCSV: "Upload CSV/Excel File",
        dragDrop: "Drag and drop file here or click to browse",
        supportedFormats: "Supported formats: CSV, Excel",
        selectSoilType: "Select soil type",
        selectCropType: "Select crop type",
        selectMethod: "Select method",
        newUserWelcome: "Welcome! Let's set up your farm profile",
        newUserMessage: "Add your farm details to get personalized insights and recommendations",
        saving: "Saving...",
        processing: "Processing...",
        completeSetup: "Complete Setup & Go to Dashboard",
        uploadComplete: "Upload & Complete Setup",
        browseFiles: "Browse Files",
        remove: "Remove",
        fieldSizePlaceholder: "5.5",
        fertilizerPlaceholder: "NPK, Urea",
        pesticidesPlaceholder: "List any pesticides or herbicides used..."
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
        markAsDone: "Mark as Done"
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
      // Common
      welcome: "फसल भविष्यवाणी प्रणाली में आपका स्वागत है",
      login: "लॉग इन करें",
      signup: "साइन अप करें",
      logout: "लॉग आउट",
      submit: "जमा करें",
      cancel: "रद्द करें",
      save: "सहेजें",
      delete: "हटाएं",
      edit: "संपादित करें",
      upload: "अपलोड",
      download: "डाउनलोड",
      
      // Navigation
      nav: {
        dashboard: "डैशबोर्ड",
        dataInput: "डेटा इनपुट",
        suggestions: "सुझाव",
        profile: "प्रोफ़ाइल",
        market: "बाजार",
        community: "समुदाय"
      },
      
      // Auth
      auth: {
        email: "ईमेल",
        password: "पासवर्ड",
        name: "पूरा नाम",
        phone: "फोन नंबर",
        location: "स्थान",
        farmSize: "खेत का आकार",
        selectLanguage: "भाषा चुनें",
        rememberMe: "मुझे याद रखें",
        forgotPassword: "पासवर्ड भूल गए?",
        noAccount: "खाता नहीं है?",
        haveAccount: "पहले से खाता है?"
      },
      
      // Dashboard
      dashboard: {
        title: "खेत डैशबोर्ड",
        welcomeBack: "वापसी पर स्वागत है",
        season: "मौसम",
        field: "खेत",
        hectares: "हेक्टेयर",
        weather: "मौसम की स्थिति",
        currentWeather: "वर्तमान मौसम",
        temperature: "तापमान",
        humidity: "नमी",
        rainfall: "वर्षा",
        windSpeed: "हवा की गति",
        forecast: "5-दिन का पूर्वानुमान",
        weatherForecast: "मौसम पूर्वानुमान",
        predictions: "AI भविष्यवाणियां",
        currentCrop: "वर्तमान फसल",
        predictedYield: "अनुमानित उपज",
        aiConfidence: "AI विश्वसनीयता",
        confidence: "विश्वसनीयता",
        harvestDate: "कटाई की तारीख",
        marketPrice: "बाजार मूल्य",
        marketPriceTrend: "बाजार मूल्य रुझान",
        yieldTrend: "उपज रुझान",
        yieldTrendAnalysis: "उपज रुझान विश्लेषण",
        alerts: "चेतावनी और सूचनाएं",
        alternativeCrops: "वैकल्पिक फसलें",
        bestCropSuggestions: "सर्वश्रेष्ठ फसल सुझाव",
        quickActions: "त्वरित कार्य",
        soilMoisture: "मिट्टी की नमी",
        soilNutrients: "मिट्टी के पोषक तत्व",
        nextIrrigation: "अगली सिंचाई",
        optimal: "इष्टतम",
        vsLast: "पिछले से",
        bestTimeToSell: "बेचने का सबसे अच्छा समय",
        tonsPerHa: "टन/हेक्टेयर",
        moisture: "नमी",
        perQuintal: "/क्विंटल",
        thisMonth: "इस महीने",
        updateFarmData: "खेत का डेटा अपडेट करें",
        viewTips: "सुझाव देखें",
        marketInsights: "बाजार अंतर्दृष्टि",
        getSupport: "सहायता प्राप्त करें",
        viewDetails: "विवरण देखें",
        implementSuggestion: "सुझाव लागू करें",
        fertilizer: "उर्वरक",
        pestControl: "कीट नियंत्रण",
        pestAlert: "कीट चेतावनी",
        currentStatus: "वर्तमान स्थिति",
        noThreatsDetected: "कोई तत्काल खतरा नहीं मिला",
        preventiveAction: "निवारक कार्रवाई",
        neemSprayScheduled: "5 दिनों में नीम स्प्रे निर्धारित",
        viewPreventionTips: "रोकथाम सुझाव देखें",
        lowRisk: "कम जोखिम",
        highPriority: "उच्च प्राथमिकता",
        nitrogen: "नाइट्रोजन",
        phosphorus: "फास्फोरस",
        potassium: "पोटेशियम",
        wheat: "गेहूं",
        corn: "मक्का",
        rice: "चावल",
        yield: "उपज",
        suitability: "उपयुक्तता",
        profit: "लाभ",
        bestSellingWindow: "सर्वोत्तम बिक्री विंडो",
        expectedPrice: "10-20 मार्च: अपेक्षित ₹2,350/क्विंटल",
        setAlert: "अलर्ट सेट करें",
        lastSixMonths: "पिछले 6 महीने",
        lastYear: "पिछला साल",
        allTime: "सभी समय",
        actualYield: "वास्तविक उपज",
        aiPredicted: "AI अनुमानित",
        currentSeason: "वर्तमान मौसम",
        current: "वर्तमान",
        ideal: "आदर्श",
        ppm: "पीपीएम",
        rabi: "रबी"
      },
      
      // Data Input
      dataInput: {
        title: "खेत डेटा इनपुट",
        manualEntry: "मैनुअल प्रविष्टि",
        fileUpload: "फ़ाइल अपलोड",
        soilType: "मिट्टी का प्रकार",
        cropType: "फसल का प्रकार",
        irrigationMethod: "सिंचाई विधि",
        plantingDate: "रोपण तिथि",
        fieldSize: "खेत का आकार (हेक्टेयर)",
        fertilzerUsed: "उर्वरक उपयोग",
        pesticidesUsed: "कीटनाशक उपयोग",
        uploadCSV: "CSV/Excel फ़ाइल अपलोड करें",
        dragDrop: "फ़ाइल यहां खींचें या ब्राउज़ करने के लिए क्लिक करें",
        supportedFormats: "समर्थित प्रारूप: CSV, Excel",
        selectSoilType: "मिट्टी का प्रकार चुनें",
        selectCropType: "फसल का प्रकार चुनें",
        selectMethod: "विधि चुनें",
        newUserWelcome: "स्वागत है! आइए अपना खेत प्रोफ़ाइल सेट करें",
        newUserMessage: "व्यक्तिगत अंतर्दृष्टि और सुझाव प्राप्त करने के लिए अपना खेत विवरण जोड़ें",
        saving: "सहेज रहे हैं...",
        processing: "प्रसंस्करण...",
        completeSetup: "सेटअप पूरा करें और डैशबोर्ड पर जाएं",
        uploadComplete: "अपलोड करें और सेटअप पूरा करें",
        browseFiles: "फ़ाइलें ब्राउज़ करें",
        remove: "हटाएं",
        fieldSizePlaceholder: "5.5",
        fertilizerPlaceholder: "NPK, यूरिया",
        pesticidesPlaceholder: "उपयोग किए गए कीटनाशक या शाकनाशी की सूची..."
      },
      
      // Suggestions
      suggestions: {
        title: "अनुकूलन सुझाव",
        irrigation: "सिंचाई",
        fertilizer: "उर्वरक",
        pestControl: "कीट नियंत्रण",
        soilHealth: "मिट्टी स्वास्थ्य",
        harvest: "कटाई",
        impact: "अपेक्षित प्रभाव",
        priority: "प्राथमिकता",
        high: "उच्च",
        medium: "मध्यम",
        low: "निम्न",
        subtitle: "अपनी खेत की उत्पादकता बढ़ाने के लिए व्यक्तिगत सिफारिशें",
        all: "सभी",
        totalSuggestions: "कुल सुझाव",
        completed: "पूर्ण",
        pending: "लंबित",
        noSuggestionsFound: "इस श्रेणी के लिए कोई सुझाव नहीं मिला।",
        backToDashboard: "डैशबोर्ड पर वापस",
        updateFarmData: "खेत का डेटा अपडेट करें",
        downloadReport: "रिपोर्ट डाउनलोड करें",
        undo: "पूर्ववत करें",
        markAsDone: "पूर्ण के रूप में चिह्नित करें"
      },
      
      // Tutorial
      tutorial: {
        welcome: "CropPredict AI में आपका स्वागत है!",
        subtitle: "आइए एक त्वरित दौरा करें जो आपको शुरू करने में मदद करेगा",
        step1: {
          title: "स्मार्ट फार्म प्रबंधन",
          description: "हमारा AI अधिकतम उपज के लिए व्यक्तिगत अंतर्दृष्टि और सिफारिशें प्रदान करने हेतु आपके फार्म डेटा का विश्लेषण करता है।"
        },
        step2: {
          title: "डेटा-संचालित निर्णय",
          description: "सटीक भविष्यवाणियां प्राप्त करने के लिए मिट्टी के प्रकार, फसल और सिंचाई विधियों जैसे अपने फार्म विवरण दर्ज करें।"
        },
        step3: {
          title: "AI-संचालित सुझाव",
          description: "उर्वरक, सिंचाई कार्यक्रम और कीट प्रबंधन के लिए बुद्धिमान सिफारिशें प्राप्त करें।"
        },
        step4: {
          title: "मौसम एकीकरण",
          description: "वास्तविक समय मौसम डेटा आपके खेती के निर्णयों को अनुकूलित करने और संभावित जोखिमों की भविष्यवाणी करने में मदद करता है।"
        },
        step5: {
          title: "शुरू करने के लिए तैयार हैं?",
          description: "व्यक्तिगत अंतर्दृष्टि प्राप्त करना शुरू करने के लिए अपना फार्म प्रोफ़ाइल सेट अप करते हैं।"
        },
        next: "अगला",
        previous: "पिछला",
        skip: "ट्यूटोरियल छोड़ें",
        getStarted: "शुरू करें",
        stepOf: "चरण {{current}} का {{total}}"
      },
      
      // Profile Settings (existing content preserved)
      profile: {
        settings: "प्रोफ़ाइल सेटिंग्स",
        title: "प्रोफ़ाइल सेटिंग्स",
        subtitle: "अपने खाते और एप्लिकेशन वरीयताओं का प्रबंधन करें",
        backToDashboard: "डैशबोर्ड पर वापस",
        saveChanges: "परिवर्तन सहेजें",
        saving: "सहेज रहे हैं...",
        unsavedChanges: "आपके पास असहेजे परिवर्तन हैं",
        loadingSettings: "सेटिंग्स लोड हो रही हैं...",
        fetchingPreferences: "कृपया प्रतीक्षा करें जबकि हम आपकी वरीयताएं लाते हैं",
        
        // Navigation
        personal: "व्यक्तिगत जानकारी",
        personalDesc: "अपने खाते का विवरण प्रबंधित करें",
        farm: "खेत कॉन्फ़िगरेशन",
        farmDesc: "खेत सेटिंग्स और वरीयताएं",
        language: "भाषा और क्षेत्र",
        languageDesc: "भाषा और क्षेत्रीय सेटिंग्स",
        security: "सुरक्षा",
        securityDesc: "पासवर्ड और सुरक्षा सेटिंग्स",
        data: "डेटा प्रबंधन",
        dataDesc: "निर्यात और बैकअप विकल्प",
        
        // Personal Information
        personalInfo: {
          title: "व्यक्तिगत जानकारी",
          subtitle: "अपनी व्यक्तिगत जानकारी और प्रोफ़ाइल जानकारी प्रबंधित करें",
          edit: "संपादित करें",
          cancel: "रद्द करें",
          fullName: "पूरा नाम",
          farmName: "खेत का नाम",
          email: "ईमेल पता",
          phone: "फोन नंबर",
          address: "पता",
          uploadPhoto: "फोटो अपलोड करें",
          photoFormats: "JPG, PNG या GIF। अधिकतम आकार 5MB।",
          accountStatus: "खाता स्थिति",
          activeVerified: "सक्रिय और सत्यापित",
          memberSince: "से सदस्य",
          subscriptionPlan: "सदस्यता योजना",
          professional: "पेशेवर"
        },
        
        // Farm Configuration
        farmConfig: {
          title: "खेत कॉन्फ़िगरेशन",
          subtitle: "अपनी खेत सेटिंग्स और वरीयताओं को कॉन्फ़िगर करें",
          farmSize: "खेत का आकार (एकड़)",
          currency: "मुद्रा",
          primaryCrops: "मुख्य फसलें",
          cropPlaceholder: "उदाहरण: गेहूं, मक्का, सोयाबीन"
        },
        
        // Language Settings
        languageSettings: {
          title: "भाषा और क्षेत्र",
          subtitle: "अपनी पसंदीदा भाषा और क्षेत्रीय सेटिंग्स निर्धारित करें",
          primaryLanguage: "मुख्य भाषा",
          secondaryLanguage: "द्वितीयक भाषा",
          english: "अंग्रेजी",
          hindi: "हिंदी",
          gujarati: "गुजराती",
          marathi: "मराठी"
        },
        
        // Security Settings
        securitySettings: {
          title: "सुरक्षा सेटिंग्स",
          subtitle: "अपने खाते की सुरक्षा और प्रमाणीकरण वरीयताओं का प्रबंधन करें",
          twoFactor: "द्विकारक प्रमाणीकरण",
          twoFactorDesc: "सुरक्षा की एक अतिरिक्त परत जोड़ें",
          sessionTimeout: "सत्र समयसीमा (मिनट)"
        },
        
        // Data Management
        dataManagement: {
          title: "डेटा प्रबंधन",
          subtitle: "नियंत्रित करें कि आपका डेटा कैसे संग्रहीत, बैकअप और साझा किया जाता है",
          autoBackup: "ऑटो बैकअप",
          autoBackupDesc: "अपने डेटा को स्वचालित रूप से बैकअप करें",
          exportFormat: "निर्यात प्रारूप",
          csv: "CSV",
          json: "JSON",
          pdf: "PDF"
        }
      },
      
      // Weather
      weather: {
        sunny: "धूप",
        cloudy: "बादल",
        rainy: "बारिश",
        stormy: "तूफान",
        partlyCloudy: "आंशिक बादल",
        today: "आज",
        tomorrow: "कल"
      },
      
      // Units
      units: {
        celsius: "°C",
        fahrenheit: "°F",
        percent: "%",
        kmph: "किमी/घंटा",
        mph: "मील/घंटा",
        mm: "मिमी",
        inches: "इंच",
        hectares: "हेक्टेयर",
        acres: "एकड़",
        kg: "किग्रा",
        tons: "टन",
        quintals: "क्विंटल"
      },
      
      // Market Insights
      marketInsights: {
        title: "बाजार अंतर्दृष्टि",
        subtitle: "वास्तविक समय की बाजार कीमतें और व्यापार के अवसर",
        setAlerts: "अलर्ट सेट करें",
        exportData: "निर्यात करें",
        priceTrends: "मूल्य रुझान",
        demandDistribution: "मांग वितरण",
        topBuyers: "शीर्ष खरीदार",
        nearbyMandis: "आसपास की मंडियां",
        viewAllBuyers: "सभी खरीदार देखें",
        viewAllMandis: "सभी मंडियां देखें",
        marketOpportunityAlert: "बाजार अवसर चेतावनी",
        learnMore: "और जानें",
        todaysHigh: "आज का उच्च",
        todaysLow: "आज का निम्न",
        average: "औसत",
        volume: "मात्रा",
        msp: "एमएसपी",
        localMarket: "स्थानीय बाजार",
        stateMarket: "राज्य बाजार",
        export: "निर्यात",
        high: "उच्च",
        medium: "मध्यम",
        low: "निम्न",
        wheat: "गेहूं",
        rice: "चावल",
        corn: "मक्का",
        cotton: "कपास",
        priceAlert: "निर्यात मांग में वृद्धि के कारण अगले 2 हफ्तों में गेहूं की कीमतों में 8-10% की वृद्धि होने की उम्मीद है",
        week1: "1 सप्ताह",
        month1: "1 महीना",
        month3: "3 महीने",
        month6: "6 महीने",
        year1: "1 साल"
      },
      
      // Status
      status: {
        loading: "लोड हो रहा है...",
        error: "त्रुटि",
        success: "सफल",
        warning: "चेतावनी",
        info: "जानकारी",
        pending: "लंबित",
        completed: "पूर्ण",
        failed: "असफल"
      }
    }
  }
};

// Get saved language preference or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en';

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