import React, { useState } from 'react';
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
  MapPin
} from 'lucide-react';

const MarketInsights: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [timeRange, setTimeRange] = useState('1M');

  // Mock data for market prices
  const priceHistory = [
    { date: 'Jan 1', wheat: 2100, rice: 2800, corn: 1800, cotton: 5200 },
    { date: 'Jan 8', wheat: 2150, rice: 2850, corn: 1850, cotton: 5300 },
    { date: 'Jan 15', wheat: 2200, rice: 2900, corn: 1900, cotton: 5400 },
    { date: 'Jan 22', wheat: 2250, rice: 2950, corn: 1950, cotton: 5500 },
    { date: 'Feb 1', wheat: 2300, rice: 3000, corn: 2000, cotton: 5600 },
    { date: 'Feb 8', wheat: 2350, rice: 3050, corn: 2050, cotton: 5700 },
  ];

  const demandData = [
    { name: t('marketInsights.localMarket'), value: 35, color: '#10b981' },
    { name: t('marketInsights.stateMarket'), value: 40, color: '#3b82f6' },
    { name: t('marketInsights.export'), value: 25, color: '#8b5cf6' },
  ];

  const topBuyers = [
    { name: 'AgriCorp Ltd.', volume: '450 tons', price: '₹2,320/q', trend: 'up', change: '+5%' },
    { name: 'FarmFresh Co.', volume: '380 tons', price: '₹2,280/q', trend: 'up', change: '+3%' },
    { name: 'GreenHarvest', volume: '320 tons', price: '₹2,250/q', trend: 'down', change: '-2%' },
    { name: 'Rural Traders', volume: '280 tons', price: '₹2,200/q', trend: 'up', change: '+1%' },
  ];

  const nearbyMandis = [
    { name: 'Hisar Mandi', distance: '12 km', price: '₹2,280/q', availability: 'High' },
    { name: 'Rohtak Mandi', distance: '25 km', price: '₹2,320/q', availability: 'Medium' },
    { name: 'Jind Mandi', distance: '38 km', price: '₹2,250/q', availability: 'High' },
    { name: 'Karnal Mandi', distance: '45 km', price: '₹2,340/q', availability: 'Low' },
  ];

  const cropPrices = [
    { crop: t('marketInsights.wheat'), current: 2300, msp: 2125, change: +8.2, icon: '🌾' },
    { crop: t('marketInsights.rice'), current: 3050, msp: 2040, change: +49.5, icon: '🌾' },
    { crop: t('marketInsights.corn'), current: 2050, msp: 2090, change: -1.9, icon: '🌽' },
    { crop: t('marketInsights.cotton'), current: 5700, msp: 6620, change: -13.9, icon: '🏵️' },
  ];

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

        {/* Current Crop Prices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cropPrices.map((crop, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{crop.icon}</span>
                <span className={`flex items-center gap-1 text-sm font-medium ${crop.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {crop.change > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {Math.abs(crop.change)}%
                </span>
              </div>
              <h3 className="font-bold text-gray-800">{crop.crop}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{crop.current}</p>
              <p className="text-xs text-gray-500 mt-1">{t('marketInsights.msp')}: ₹{crop.msp}</p>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${crop.current > crop.msp ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((crop.current / crop.msp) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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