import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Truck,
  AlertCircle,
  Download,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  MapPin,
  Loader,
  RefreshCw,
  ArrowDownCircle
} from 'lucide-react';
import { mockMarketData, mockGovernmentSchemes } from '../mockData/mockData';

// API Service for fetching crop prices
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiService = {
  fetchCropPrices: async (token: string | null, filters = {}) => {
    try {
      // Use test endpoint if no token, or farmer endpoint with token
      const endpoint = token 
        ? '/farmer/crop-prices' 
        : '/api/test/market-prices';
      
      const params = new URLSearchParams(filters);
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}?${params.toString()}`, {
        headers
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || `HTTP error ${response.status}`);
      }
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching crop prices:', errorMessage, error);
      return { error: errorMessage };
    }
  }
};

const MarketInsights: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [timeRange, setTimeRange] = useState('1M');
  
  // Real market data states
  const [cropPricesData, setCropPricesData] = useState<any[]>([]);
  const [isPricesLoading, setIsPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    state: '',
    commodity: '',
    minPrice: '',
    maxPrice: '',
    modalPrice: '',
    limit: '20'
  });
  
  // Function to load crop prices
  const loadCropPrices = async (newOffset = 0, append = false) => {
    setIsPricesLoading(true);
    setPricesError(null);
    try {
      const token = localStorage.getItem('token');
      // No longer require token - test endpoint works without it
      
      const params = {
        ...filters,
        offset: newOffset.toString()
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        const paramKey = key as keyof typeof params;
        if (!params[paramKey] || (typeof params[paramKey] === 'string' && (params[paramKey] as string).trim() === '')) {
          delete params[paramKey];
        }
      });
      
      const response = await apiService.fetchCropPrices(token, params);
      console.log('Crop prices response:', response);
      
      if (response.error) {
        setPricesError(response.error);
        setCropPricesData(append ? cropPricesData : []);
      } else if (response.data?.records && Array.isArray(response.data.records)) {
        // Handle government API response format
        setCropPricesData(append ? [...cropPricesData, ...response.data.records] : response.data.records);
        setHasMore(response.data.records.length === parseInt(filters.limit));
      } else if (Array.isArray(response)) {
        // Handle direct array response
        setCropPricesData(append ? [...cropPricesData, ...response] : response);
        setHasMore(response.length === parseInt(filters.limit));
      } else {
        setPricesError('No price data available');
        setCropPricesData(append ? cropPricesData : []);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading crop prices:', error);
      setPricesError('Failed to fetch crop prices');
      setCropPricesData(append ? cropPricesData : []);
      setHasMore(false);
    }
    setIsPricesLoading(false);
  };
  
  // Load data on component mount
  useEffect(() => {
    loadCropPrices(0, false);
  }, []);
  
  // Filter handlers
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApplyFilters = async () => {
    setOffset(0);
    await loadCropPrices(0, false);
  };
  
  const handleLoadMore = async () => {
    const newOffset = offset + parseInt(filters.limit);
    setOffset(newOffset);
    await loadCropPrices(newOffset, true);
  };

  // Enhanced data service with comprehensive fallbacks
  const getMarketDataWithFallback = () => {
    try {
      // If real market data is available, use it, otherwise fallback to mock data
      if (cropPricesData && cropPricesData.length > 0) {
        // Transform real API data to match expected format
        const transformedData = cropPricesData.map(item => ({
          commodity: item.commodity || 'Unknown',
          price: parseInt(item.modal_price) || parseInt(item.min_price) || 0,
          unit: '₹/quintal',
          change: Math.floor(Math.random() * 100) - 50,
          changePercent: `${(Math.random() * 10 - 5).toFixed(1)}%`,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          market: item.market || item.district || 'Local Market',
          lastUpdated: item.arrival_date || 'Today',
          quality: item.grade || 'FAQ',
          volume: '100-500 quintals'
        }));
        
        return {
          currentPrices: transformedData,
          priceHistory: mockMarketData.priceHistory || {},
          demandForecast: mockMarketData.demandForecast || [],
          bestMarkets: mockMarketData.bestMarkets || []
        };
      }
      // Return mock data if no real data available
      return mockMarketData || {
        currentPrices: [],
        priceHistory: {},
        demandForecast: [],
        bestMarkets: []
      };
    } catch (error) {
      console.error('Error in getMarketDataWithFallback:', error);
      // Return safe fallback data
      return {
        currentPrices: [
          {
            commodity: 'Wheat',
            price: 2250,
            unit: '₹/quintal',
            change: '+50',
            changePercent: '+2.3%',
            trend: 'up',
            market: 'Local Market',
            lastUpdated: 'Today',
            quality: 'FAQ',
            volume: '100 quintals'
          }
        ],
        priceHistory: {},
        demandForecast: [],
        bestMarkets: []
      };
    }
  };
  
  const marketData = getMarketDataWithFallback();

  // Enhanced price history with fallback
  const priceHistory = [
    { date: 'Jan 1', wheat: 2100, rice: 2800, corn: 1800, cotton: 5200 },
    { date: 'Jan 8', wheat: 2150, rice: 2850, corn: 1850, cotton: 5300 },
    { date: 'Jan 15', wheat: 2200, rice: 2900, corn: 1900, cotton: 5400 },
    { date: 'Jan 22', wheat: 2250, rice: 2950, corn: 1950, cotton: 5500 },
    { date: 'Feb 1', wheat: 2300, rice: 3000, corn: 2000, cotton: 5600 },
    { date: 'Feb 8', wheat: 2350, rice: 3050, corn: 2050, cotton: 5700 },
  ];

  const demandData = [
    { name: 'Local Market', value: 35, color: '#10b981' },
    { name: 'State Market', value: 40, color: '#3b82f6' },
    { name: 'Export', value: 25, color: '#8b5cf6' },
  ];

  const topBuyers = [
    { name: 'AgriCorp Ltd.', volume: '450 tons', price: '₹2,320/q', trend: 'up', change: '+5%' },
    { name: 'FarmFresh Co.', volume: '380 tons', price: '₹2,280/q', trend: 'up', change: '+3%' },
    { name: 'GreenHarvest', volume: '320 tons', price: '₹2,250/q', trend: 'down', change: '-2%' },
    { name: 'Rural Traders', volume: '280 tons', price: '₹2,200/q', trend: 'up', change: '+1%' },
  ];

  // Use comprehensive mock data for nearby markets with enhanced availability data
  const nearbyMandis = (marketData.bestMarkets || [
    { name: 'Hisar Mandi', distance: '12 km', commission: '2.0%', facilities: ['Grading', 'Storage'] },
    { name: 'Rohtak Mandi', distance: '25 km', commission: '1.8%', facilities: ['Direct Payment'] },
    { name: 'Jind Mandi', distance: '38 km', commission: '2.2%', facilities: ['Quality Testing'] },
    { name: 'Karnal Mandi', distance: '45 km', commission: '2.5%', facilities: ['Insurance', 'Transport'] },
  ]).map((mandi, index) => ({
    ...mandi,
    price: `₹${2200 + index * 40}/q`,
    availability: ['High', 'Medium', 'High', 'Medium'][index] || 'High'
  }));

  // Use enhanced crop prices from mock data with MSP fallback
  const cropPrices = (marketData.currentPrices || []).map(item => {
    const mspValues: { [key: string]: number } = {
      'Wheat': 2125,
      'Rice': 2100,
      'Cotton': 6080,
      'Maize': 1962,
      'Sugarcane': 315,
      'Onion': 1800
    };
    
    return {
      crop: item.commodity || 'Unknown',
      current: item.price || item.modal_price || 0,
      change: item.changePercent ? parseFloat(item.changePercent.replace('%', '').replace('+', '')) : Math.random() * 10 - 5,
      icon: getCropIcon(item.commodity || 'Unknown'),
      trend: item.trend || (Math.random() > 0.5 ? 'up' : 'down'),
      market: item.market || item.district || 'Local Market',
      volume: item.volume || '100-200 tons',
      quality: item.quality || item.grade || 'FAQ',
      lastUpdated: item.lastUpdated || item.arrival_date || new Date().toLocaleDateString(),
      msp: mspValues[item.commodity] || (typeof item.price === 'number' ? item.price * 0.9 : parseInt(item.modal_price) * 0.9) || 2000
    };
  });

  // Helper function to get crop icons
  function getCropIcon(cropName: string) {
    const icons = {
      'Wheat': '🌾',
      'Rice': '🌾', 
      'Cotton': '🏵️',
      'Maize': '🌽',
      'Sugarcane': '🎋',
      'Onion': '🧅'
    };
    return icons[cropName as keyof typeof icons] || '🌱';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <DollarSign className="text-purple-600" />
                {t('marketInsights.title')}
              </h1>
              <p className="text-gray-600 mt-2">{t('marketInsights.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                <Bell size={18} />
                {t('marketInsights.setAlerts')}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download size={18} />
                {t('marketInsights.exportData')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Real-time Market Prices Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="text-purple-600" />
                Live Market Prices
              </h2>
              <p className="text-gray-600 mt-1">Real-time crop prices from various markets across India</p>
            </div>
            <button
              onClick={() => loadCropPrices(0, false)}
              disabled={isPricesLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isPricesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
              placeholder="State (e.g., Karnataka)"
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="text"
              name="commodity"
              value={filters.commodity}
              onChange={handleFilterChange}
              placeholder="Commodity (e.g., Rice)"
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min Price (₹)"
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="number"
              name="modalPrice"
              value={filters.modalPrice}
              onChange={handleFilterChange}
              placeholder="Modal Price (₹)"
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleApplyFilters}
            disabled={isPricesLoading}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg disabled:opacity-50 mb-6"
          >
            {isPricesLoading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Apply Filters
              </>
            )}
          </button>

          {/* Market Prices Table */}
          {isPricesLoading && cropPricesData.length === 0 ? (
            <div className="text-center py-16">
              <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading market prices...</p>
            </div>
          ) : pricesError ? (
            <div className="text-center py-16 bg-red-50 rounded-xl">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-red-700">Error</h4>
              <p className="text-red-600 mt-2">{pricesError}</p>
            </div>
          ) : cropPricesData.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No price data available</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commodity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variety</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Price (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Price (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modal Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cropPricesData.map((price, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition-colors'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{price.state || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{price.district || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{price.market || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">{price.commodity || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{price.variety || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{price.grade || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{price.arrival_date || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{price.min_price ? `₹${price.min_price}` : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{price.max_price ? `₹${price.max_price}` : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{price.modal_price ? `₹${price.modal_price}` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={isPricesLoading}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg disabled:opacity-50 mx-auto"
                  >
                    {isPricesLoading ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="w-5 h-5 mr-2" />
                        Load More
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>


        <div className="grid lg:grid-cols-3 gap-6">
          {/* Price Trend Chart */}
          <motion.div 
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-purple-600" />
                {t('marketInsights.priceTrends')}
              </h2>
              <div className="flex gap-2">
                <select 
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white"
                >
                  <option value="wheat">{t('marketInsights.wheat')}</option>
                  <option value="rice">{t('marketInsights.rice')}</option>
                  <option value="corn">{t('marketInsights.corn')}</option>
                  <option value="cotton">{t('marketInsights.cotton')}</option>
                </select>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[{ key: '1W', label: t('marketInsights.week1') },
                    { key: '1M', label: t('marketInsights.month1') },
                    { key: '3M', label: t('marketInsights.month3') },
                    { key: '6M', label: t('marketInsights.month6') },
                    { key: '1Y', label: t('marketInsights.year1') }].map((range) => (
                    <button
                      key={range.key}
                      onClick={() => setTimeRange(range.key)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        timeRange === range.key 
                          ? 'bg-white text-purple-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceHistory}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`₹${value}/quintal`, selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)]}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedCrop} 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fill="url(#colorGradient)"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">{t('marketInsights.todaysHigh')}</p>
                <p className="text-lg font-bold text-green-600">₹2,380</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-500">{t('marketInsights.todaysLow')}</p>
                <p className="text-lg font-bold text-red-600">₹2,280</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-500">{t('marketInsights.average')}</p>
                <p className="text-lg font-bold text-purple-600">₹2,330</p>
              </div>
            </div>
          </motion.div>

          {/* Demand Distribution */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="text-purple-600" />
              {t('marketInsights.demandDistribution')}
            </h2>
            
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={demandData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {demandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-2 mt-4">
              {demandData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Buyers */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="text-purple-600" />
              {t('marketInsights.topBuyers')}
            </h2>
            
            <div className="space-y-3">
              {topBuyers.map((buyer, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">{buyer.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600">{t('marketInsights.volume')}: {buyer.volume}</span>
                        <span className="text-sm font-medium text-purple-600">{buyer.price}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      buyer.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {buyer.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="text-xs font-medium">{buyer.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
              {t('marketInsights.viewAllBuyers')}
            </button>
          </motion.div>

          {/* Nearby Mandis */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="text-purple-600" />
              {t('marketInsights.nearbyMandis')}
            </h2>
            
            <div className="space-y-3">
              {nearbyMandis.map((mandi, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">{mandi.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Truck size={12} />
                          {mandi.distance}
                        </span>
                        <span className="text-sm font-medium text-purple-600">{mandi.price}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      mandi.availability === 'High' 
                        ? 'bg-green-100 text-green-700' 
                        : mandi.availability === 'Medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {t(`general.${mandi.availability.toLowerCase()}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
              {t('marketInsights.viewAllMandis')}
            </button>
          </motion.div>
        </div>

        {/* Price Alert */}
        <motion.div 
          className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl shadow-lg p-6 border border-purple-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-lg">
                <AlertCircle className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{t('marketInsights.marketOpportunityAlert')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t('marketInsights.priceAlert')}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
              {t('marketInsights.learnMore')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MarketInsights;