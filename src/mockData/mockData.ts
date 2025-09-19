export const mockWeatherData = {
  current: {
    temperature: 28,
    humidity: 65,
    rainfall: 12,
    windSpeed: 8,
    condition: "Partly Cloudy"
  },
  forecast: [
    { day: "Mon", temp: 29, rainfall: 5, condition: "Sunny" },
    { day: "Tue", temp: 27, rainfall: 15, condition: "Light Rain" },
    { day: "Wed", temp: 26, rainfall: 20, condition: "Moderate Rain" },
    { day: "Thu", temp: 28, rainfall: 8, condition: "Cloudy" },
    { day: "Fri", temp: 30, rainfall: 0, condition: "Sunny" },
  ]
};

export const mockCropPredictions = {
  currentCrop: "Wheat",
  predictedYield: 45.5, // quintals per hectare
  confidence: 82,
  harvestDate: "2024-03-15",
  marketPrice: 2200, // per quintal
  riskFactors: ["Pest Alert: Aphids detected", "Water stress in next week"],
  alternativeCrops: [
    { name: "Rice", yield: 50, profit: "₹85,000/hectare" },
    { name: "Maize", yield: 40, profit: "₹65,000/hectare" },
    { name: "Sugarcane", yield: 80, profit: "₹120,000/hectare" }
  ]
};

export const mockYieldTrends = [
  { month: "Jan", yield: 42, actual: 41, predicted: 42, rainfall: 45 },
  { month: "Feb", yield: 43, actual: 44, predicted: 43, rainfall: 52 },
  { month: "Mar", yield: 45, actual: 45, predicted: 45, rainfall: 68 },
  { month: "Apr", yield: 44, actual: 43, predicted: 44, rainfall: 82 },
  { month: "May", yield: 46, actual: 47, predicted: 46, rainfall: 95 },
  { month: "Jun", yield: 45.5, actual: null, predicted: 45.5, rainfall: 120 },
  { month: "Jul", yield: 46.2, actual: null, predicted: 46.2, rainfall: 135 },
  { month: "Aug", yield: 47.1, actual: null, predicted: 47.1, rainfall: 128 },
];

export const mockOptimizations = [
  {
    id: 1,
    category: "Irrigation",
    title: "Optimize Water Usage",
    description: "Irrigate during evening hours (6-8 PM) for 30 minutes",
    impact: "Save 20% water",
    icon: "💧",
    priority: "high"
  },
  {
    id: 2,
    category: "Fertilizer",
    title: "Nitrogen Application",
    description: "Apply 20kg Urea per acre in the next 3 days",
    impact: "Increase yield by 15%",
    icon: "🌱",
    priority: "medium"
  },
  {
    id: 3,
    category: "Pest Control",
    title: "Preventive Spray",
    description: "Apply neem-based pesticide (2ml/liter) tomorrow morning",
    impact: "Prevent aphid infestation",
    icon: "🐛",
    priority: "high"
  },
  {
    id: 4,
    category: "Soil Health",
    title: "pH Balance",
    description: "Add 50kg lime per acre to balance soil pH",
    impact: "Improve nutrient absorption",
    icon: "🏔️",
    priority: "low"
  },
  {
    id: 5,
    category: "Harvest",
    title: "Optimal Harvest Time",
    description: "Plan harvest for March 10-15 based on moisture levels",
    impact: "Maximum grain quality",
    icon: "🌾",
    priority: "medium"
  }
];


export const mockNotifications = [
  {
    id: 1,
    type: "weather",
    title: "Heavy Rainfall Alert",
    message: "Expected 40mm rainfall in next 24 hours. Ensure proper drainage.",
    timestamp: "10 minutes ago",
    priority: "high"
  },
  {
    id: 2,
    type: "pest",
    title: "Pest Warning",
    message: "Aphid activity detected in nearby farms. Take preventive measures.",
    timestamp: "1 hour ago",
    priority: "medium"
  },
  {
    id: 3,
    type: "market",
    title: "Price Update",
    message: "Wheat prices increased by ₹100/quintal in local market.",
    timestamp: "3 hours ago",
    priority: "low"
  }
];

export const soilTypes = [
  "Clay",
  "Sandy",
  "Loamy",
  "Silt",
  "Peat",
  "Chalk",
  "Black Cotton"
];

export const cropTypes = [
  "Wheat",
  "Rice",
  "Maize",
  "Cotton",
  "Sugarcane",
  "Pulses",
  "Vegetables",
  "Fruits"
];

export const irrigationMethods = [
  "Drip Irrigation",
  "Sprinkler",
  "Flood Irrigation",
  "Furrow Irrigation",
  "Manual Watering"
];

// AI-Enhanced Data
export const aiPredictionData = {
  confidence: 87,
  accuracyScore: 92,
  lastUpdated: '2 hours ago',
  modelVersion: 'v2.1.3',
  factors: [
    { name: 'Soil Health', impact: 85, status: 'positive', description: 'pH 6.8, optimal nutrient levels' },
    { name: 'Weather Pattern', impact: 72, status: 'positive', description: '28°C avg, 68% humidity' },
    { name: 'Irrigation Schedule', impact: 90, status: 'positive', description: 'AI-optimized timing saves 23% water' },
    { name: 'Pest Risk', impact: 25, status: 'negative', description: 'Low aphid activity detected' },
    { name: 'Fertilizer Usage', impact: 88, status: 'positive', description: 'NPK balance optimal' },
    { name: 'Market Conditions', impact: 78, status: 'positive', description: 'High demand, good prices' }
  ],
  riskAssessment: {
    overall: 'low',
    weatherRisk: 15,
    pestRisk: 12,
    marketRisk: 8,
    soilRisk: 5
  }
};

export const fertilizerPlanData = {
  currentPhase: 'Growth Phase',
  nextApplication: 'In 3 days',
  schedule: [
    { week: 'Week 1', nitrogen: 40, phosphorus: 20, potassium: 30, phase: 'Initial Application' },
    { week: 'Week 3', nitrogen: 30, phosphorus: 15, potassium: 25, phase: 'Growth Phase' },
    { week: 'Week 5', nitrogen: 20, phosphorus: 25, potassium: 35, phase: 'Flowering Phase' },
    { week: 'Week 7', nitrogen: 15, phosphorus: 30, potassium: 40, phase: 'Fruiting Phase' },
    { week: 'Week 9', nitrogen: 10, phosphorus: 20, potassium: 30, phase: 'Maturity Phase' }
  ],
  costSavings: {
    monthly: '$145',
    yearly: '$1,740',
    efficiency: '+18%'
  },
  currentNutrients: {
    nitrogen: 45, // ppm
    phosphorus: 22,
    potassium: 38,
    pH: 6.8
  }
};

export const irrigationPlanData = {
  nextIrrigation: 'Tomorrow 6:00 AM',
  duration: '4 hours',
  soilMoisture: 68,
  waterSaved: 23, // percentage
  schedule: [
    { day: 'Mon', morning: 2.5, evening: 1.5, total: 4.0, efficiency: 85, skip: false },
    { day: 'Tue', morning: 0, evening: 0, total: 0, efficiency: 0, skip: true, reason: 'Rain forecast' },
    { day: 'Wed', morning: 3.0, evening: 2.0, total: 5.0, efficiency: 88, skip: false },
    { day: 'Thu', morning: 2.0, evening: 1.0, total: 3.0, efficiency: 82, skip: false },
    { day: 'Fri', morning: 0, evening: 0, total: 0, efficiency: 0, skip: true, reason: 'Rain forecast' },
    { day: 'Sat', morning: 3.5, evening: 2.5, total: 6.0, efficiency: 90, skip: false },
    { day: 'Sun', morning: 2.5, evening: 1.5, total: 4.0, efficiency: 86, skip: false }
  ],
  insights: [
    'Morning irrigation more effective (lower evaporation)',
    'Skip Tuesday & Friday due to rain forecast',
    'Current soil moisture optimal at 68%',
    'Consider drip irrigation for 15% more savings'
  ]
};

export const cropRecommendations = [
  {
    name: 'Premium Wheat',
    suitabilityScore: 94,
    expectedYield: '4.8 tons/ha',
    profitMargin: '₹95,000/ha',
    growthDuration: '120 days',
    riskLevel: 'Low',
    marketDemand: 'High',
    reasons: ['Optimal soil pH', 'Favorable climate', 'High market demand']
  },
  {
    name: 'Rice (Basmati)',
    suitabilityScore: 89,
    expectedYield: '5.2 tons/ha',
    profitMargin: '₹108,000/ha',
    growthDuration: '140 days',
    riskLevel: 'Medium',
    marketDemand: 'Very High',
    reasons: ['Good water availability', 'Premium variety', 'Export potential']
  },
  {
    name: 'Maize (Hybrid)',
    suitabilityScore: 82,
    expectedYield: '6.5 tons/ha',
    profitMargin: '₹78,000/ha',
    growthDuration: '100 days',
    riskLevel: 'Low',
    marketDemand: 'Medium',
    reasons: ['Short duration', 'Pest resistant', 'Good yield potential']
  }
];

export const mockUserData = {
  name: "Farmer Demo",
  email: "demo@farm.com",
  phone: "+91 98765 43210",
  location: "Punjab, India",
  farmSize: "5 hectares",
  language: "en"
};

export const mockUserProfiles = {
  'e@gmail.com': {
    name: "Existing Farmer",
    email: "e@gmail.com",
    phone: "+91 98765 43211",
    location: "Maharashtra, India",
    farmSize: "10 hectares",
    cropType: "Cotton",
    experienceYears: 8,
    farmingMethod: "Organic"
  },
  'n@gmail.com': {
    name: "New Farmer",
    email: "n@gmail.com",
    phone: "+91 98765 43212",
    location: "Gujarat, India",
    farmSize: "7 hectares",
    cropType: "Wheat",
    experienceYears: 2,
    farmingMethod: "Traditional"
  }
};
