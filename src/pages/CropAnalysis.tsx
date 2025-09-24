import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Droplets,
  Thermometer,
  Sun,
  CloudRain,
  Leaf,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  MapPin,
  Activity,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const CropAnalysis: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [analysisType, setAnalysisType] = useState('yield');
  const [timeRange, setTimeRange] = useState('6months');
  const [loading, setLoading] = useState(false);

  // Mock crop data - in real app, this would come from API
  const cropData = {
    wheat: {
      name: 'Wheat',
      icon: '🌾',
      currentYield: 3.2,
      expectedYield: 3.8,
      growthStage: 'Flowering',
      healthScore: 85,
      riskLevel: 'Low',
      marketPrice: 2100,
      soilMoisture: 65,
      temperature: 24,
      humidity: 58,
      rainfall: 45
    },
    rice: {
      name: 'Rice',
      icon: '🌾',
      currentYield: 4.1,
      expectedYield: 4.5,
      growthStage: 'Tillering',
      healthScore: 92,
      riskLevel: 'Very Low',
      marketPrice: 2800,
      soilMoisture: 85,
      temperature: 28,
      humidity: 75,
      rainfall: 120
    },
    corn: {
      name: 'Corn',
      icon: '🌽',
      currentYield: 5.8,
      expectedYield: 6.2,
      growthStage: 'Grain Filling',
      healthScore: 78,
      riskLevel: 'Medium',
      marketPrice: 1950,
      soilMoisture: 55,
      temperature: 26,
      humidity: 62,
      rainfall: 65
    }
  };

  const yieldTrendData = [
    { month: 'Jan', wheat: 2.8, rice: 3.9, corn: 5.2 },
    { month: 'Feb', wheat: 2.9, rice: 4.0, corn: 5.4 },
    { month: 'Mar', wheat: 3.0, rice: 4.1, corn: 5.6 },
    { month: 'Apr', wheat: 3.1, rice: 4.2, corn: 5.7 },
    { month: 'May', wheat: 3.2, rice: 4.3, corn: 5.8 },
    { month: 'Jun', wheat: 3.2, rice: 4.1, corn: 5.8 }
  ];

  const soilAnalysisData = [
    { nutrient: 'Nitrogen', current: 75, optimal: 80, status: 'Good' },
    { nutrient: 'Phosphorus', current: 45, optimal: 50, status: 'Low' },
    { nutrient: 'Potassium', current: 85, optimal: 70, status: 'High' },
    { nutrient: 'pH Level', current: 6.8, optimal: 6.5, status: 'Good' },
    { nutrient: 'Organic Matter', current: 3.2, optimal: 3.5, status: 'Good' }
  ];

  const weatherImpactData = [
    { factor: 'Temperature', impact: 85, color: '#ff6b6b' },
    { factor: 'Rainfall', impact: 70, color: '#4ecdc4' },
    { factor: 'Humidity', impact: 60, color: '#45b7d1' },
    { factor: 'Sunlight', impact: 90, color: '#f9ca24' },
    { factor: 'Wind', impact: 40, color: '#6c5ce7' }
  ];

  const riskFactors = [
    { risk: 'Pest Infestation', probability: 25, severity: 'Medium', color: '#ffa726' },
    { risk: 'Disease Outbreak', probability: 15, severity: 'High', color: '#ef5350' },
    { risk: 'Water Stress', probability: 35, severity: 'Low', color: '#42a5f5' },
    { risk: 'Nutrient Deficiency', probability: 20, severity: 'Medium', color: '#ab47bc' }
  ];

  const currentCrop = cropData[selectedCrop as keyof typeof cropData];

  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'very low': return 'text-green-600 bg-green-100';
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good': return 'text-green-600';
      case 'low': return 'text-red-600';
      case 'high': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Crop Analysis Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive analysis and insights for your crops
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefreshData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Crop:</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="wheat">🌾 Wheat</option>
                <option value="rice">🌾 Rice</option>
                <option value="corn">🌽 Corn</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis:</label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="yield">Yield Analysis</option>
                <option value="health">Health Monitoring</option>
                <option value="risk">Risk Assessment</option>
                <option value="weather">Weather Impact</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Yield</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentCrop.currentYield} t/ha
                  </p>
                </div>
              </div>
              <span className="text-2xl">{currentCrop.icon}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">
                +{((currentCrop.expectedYield - currentCrop.currentYield) / currentCrop.currentYield * 100).toFixed(1)}% expected
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Health Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentCrop.healthScore}%
                  </p>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Growth Stage:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentCrop.growthStage}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Risk Level</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentCrop.riskLevel}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(currentCrop.riskLevel)}`}>
                {currentCrop.riskLevel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600">View risk details</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Market Price</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{currentCrop.marketPrice}
                  </p>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600">+5.2% from last week</span>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Yield Trend Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Yield Trend Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={yieldTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={selectedCrop} stroke="#10b981" strokeWidth={3} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weather Impact Radar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Weather Impact Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={weatherImpactData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Impact"
                  dataKey="impact"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Environmental Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Droplets className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">Soil Moisture</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-2">{currentCrop.soilMoisture}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentCrop.soilMoisture}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Thermometer className="w-6 h-6 text-red-600" />
              <span className="font-medium text-gray-900 dark:text-white">Temperature</span>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-2">{currentCrop.temperature}°C</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Optimal range: 20-30°C</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Sun className="w-6 h-6 text-yellow-600" />
              <span className="font-medium text-gray-900 dark:text-white">Humidity</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 mb-2">{currentCrop.humidity}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Good for growth</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <CloudRain className="w-6 h-6 text-indigo-600" />
              <span className="font-medium text-gray-900 dark:text-white">Rainfall</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600 mb-2">{currentCrop.rainfall}mm</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">This month</div>
          </div>
        </div>

        {/* Soil Analysis & Risk Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Soil Nutrient Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Soil Nutrient Analysis
            </h3>
            <div className="space-y-4">
              {soilAnalysisData.map((nutrient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{nutrient.nutrient}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current: {nutrient.current} | Optimal: {nutrient.optimal}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(nutrient.status)}`}>
                    {nutrient.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Risk Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risk Assessment
            </h3>
            <div className="space-y-4">
              {riskFactors.map((risk, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{risk.risk}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.severity)}`}>
                      {risk.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${risk.probability}%`,
                            backgroundColor: risk.color
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{risk.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CropAnalysis;
