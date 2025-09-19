import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiX, FiTrendingUp, FiTarget, FiAlertTriangle } from 'react-icons/fi';
import { GiWheat, GiPlantSeed } from 'react-icons/gi';
// import { useTranslation } from 'react-i18next';
import { aiPredictionData, mockYieldTrends, mockCropPredictions } from '../mockData/mockData';

interface AIYieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedField?: string;
}

const AIYieldModal: React.FC<AIYieldModalProps> = ({ isOpen, onClose, selectedField }) => {
  // const { t } = useTranslation();

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50
    }
  };

  const getFactorColor = (status: string) => {
    switch (status) {
      case 'positive': return 'text-success-green';
      case 'negative': return 'text-danger-red';
      default: return 'text-gray-600';
    }
  };

  const getFactorIcon = (status: string) => {
    switch (status) {
      case 'positive': return FiTarget;
      case 'negative': return FiAlertTriangle;
      default: return FiTarget;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 20) return 'text-success-green';
    if (risk < 40) return 'text-warning-orange';
    return 'text-danger-red';
  };

  const getRiskBgColor = (risk: number) => {
    if (risk < 20) return 'bg-success-green/10';
    if (risk < 40) return 'bg-warning-orange/10';
    return 'bg-danger-red/10';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-ai-purple to-ai-purple-light p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <GiWheat className="absolute top-4 right-4 text-8xl" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <FiTarget size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI-Powered Yield Prediction</h2>
                    <p className="text-white/80">
                      {selectedField ? `Field ${selectedField}` : 'All Fields'} • {aiPredictionData.lastUpdated}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{mockCropPredictions.predictedYield} tons/ha</p>
                  <p className="text-white/80">Predicted Yield</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-success-green">+12%</p>
                  <p className="text-white/80">vs. Last Season</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <motion.div
                      className="w-3 h-3 bg-success-green rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <p className="text-3xl font-bold">{aiPredictionData.confidence}%</p>
                  </div>
                  <p className="text-white/80">AI Confidence</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
            
            {/* Yield Trend Chart */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <FiTrendingUp className="mr-2 text-ai-purple" />
                Yield Trend Analysis
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockYieldTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} label={{ value: 'Tons/ha', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f3f4f6'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#3C9718" 
                      strokeWidth={3}
                      name="Actual Yield"
                      dot={{ fill: '#3C9718', r: 5 }}
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#613AF5" 
                      strokeWidth={3}
                      strokeDasharray="8 4"
                      name="AI Predicted"
                      dot={{ fill: '#613AF5', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Factors Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <FiTarget className="mr-2 text-ai-purple" />
                  Key Success Factors
                </h3>
                <div className="space-y-4">
                  {aiPredictionData.factors.map((factor, index) => {
                    const IconComponent = getFactorIcon(factor.status);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`w-5 h-5 ${getFactorColor(factor.status)}`} />
                          <div>
                            <p className="font-medium text-foreground">{factor.name}</p>
                            <p className="text-sm text-muted-foreground">{factor.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getFactorColor(factor.status)}`}>
                            {factor.impact}%
                          </p>
                          <p className="text-xs text-muted-foreground">Impact</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <FiTarget className="mr-2 text-ai-purple" />
                  Risk Assessment
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-success-green/10 rounded-lg border border-success-green/20">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-success-green">Overall Risk</p>
                      <p className="text-2xl font-bold text-success-green uppercase">
                        {aiPredictionData.riskAssessment.overall}
                      </p>
                    </div>
                  </div>
                  
                  {Object.entries(aiPredictionData.riskAssessment).filter(([key]) => key !== 'overall').map(([key, value], index) => (
                    <div key={key} className={`flex items-center justify-between p-3 rounded-lg ${getRiskBgColor(value as number)}`}>
                      <p className="font-medium text-foreground capitalize">
                        {key.replace('Risk', ' Risk')}
                      </p>
                      <p className={`text-lg font-bold ${getRiskColor(value as number)}`}>
                        {value}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rainfall Impact Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <GiPlantSeed className="mr-2 text-ai-purple" />
                Environmental Impact Analysis
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockYieldTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f3f4f6'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rainfall" 
                      stroke="#00AAFF" 
                      fill="#00AAFF" 
                      fillOpacity={0.3}
                      name="Rainfall (mm)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Model Info */}
            <div className="bg-gradient-to-r from-ai-purple/5 to-ai-purple-light/5 rounded-xl p-6 border border-ai-purple/20">
              <div className="flex items-center space-x-3 mb-4">
                <FiTarget className="text-2xl text-ai-purple" />
                <div>
                  <h4 className="text-lg font-semibold text-foreground">AI Model Performance</h4>
                  <p className="text-muted-foreground">Model: AgriPredict {aiPredictionData.modelVersion}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-ai-purple">{aiPredictionData.accuracyScore}%</p>
                  <p className="text-sm text-muted-foreground">Historical Accuracy</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-success-green">Live</p>
                  <p className="text-sm text-muted-foreground">Real-time Analysis</p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <motion.div
                  className="w-2 h-2 bg-success-green rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span>Last updated: {aiPredictionData.lastUpdated}</span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-ai-purple text-white rounded-lg hover:bg-ai-purple-light transition-colors"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AIYieldModal;