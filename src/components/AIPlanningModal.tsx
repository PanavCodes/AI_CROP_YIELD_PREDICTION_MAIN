import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiX, FiDroplet, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { GiWateringCan } from 'react-icons/gi';
import { useTranslation } from 'react-i18next';
import { fertilizerPlanData, irrigationPlanData } from '../mockData/mockData';

interface AIPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'fertilizer' | 'irrigation';
  selectedField?: string;
}

const AIPlanningModal: React.FC<AIPlanningModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  selectedField 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'schedule' | 'analytics' | 'savings'>('schedule');

  const planData = type === 'fertilizer' ? {
    title: 'AI-Optimized Fertilizer Plan',
    icon: GiWateringCan,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    data: fertilizerPlanData
  } : {
    title: 'AI-Optimized Irrigation Plan',
    icon: FiDroplet,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    data: irrigationPlanData
  };

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

  const tabVariants = {
    inactive: { opacity: 0.6, y: 10 },
    active: { opacity: 1, y: 0 }
  };

  if (!isOpen) return null;

  const IconComponent = planData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-ai-purple to-ai-purple-light p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <IconComponent className="absolute top-4 right-4 text-8xl" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <IconComponent size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{planData.title}</h2>
                    <p className="text-white/80">
                      {selectedField ? `Field ${selectedField}` : 'All Fields'} • AI-Optimized Schedule
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

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {type === 'fertilizer' ? (
                  <>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{fertilizerPlanData.currentPhase}</p>
                      <p className="text-white/80">Current Phase</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success-green">{fertilizerPlanData.costSavings.efficiency}</p>
                      <p className="text-white/80">Efficiency Boost</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{fertilizerPlanData.costSavings.yearly}</p>
                      <p className="text-white/80">Annual Savings</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{irrigationPlanData.waterSaved}%</p>
                      <p className="text-white/80">Water Saved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{irrigationPlanData.soilMoisture}%</p>
                      <p className="text-white/80">Soil Moisture</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{irrigationPlanData.nextIrrigation}</p>
                      <p className="text-white/80">Next Schedule</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex space-x-8 px-6">
              {['schedule', 'analytics', 'savings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-ai-purple text-ai-purple'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabVariants}
                initial="inactive"
                animate="active"
                exit="inactive"
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    {/* Schedule Chart */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                        <FiCalendar className="mr-2 text-ai-purple" />
                        {type === 'fertilizer' ? 'Nutrient Application Schedule' : 'Irrigation Schedule'}
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          {type === 'fertilizer' ? (
                            <BarChart data={fertilizerPlanData.schedule}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                              <YAxis stroke="#6b7280" fontSize={12} label={{ value: 'kg/ha', angle: -90, position: 'insideLeft' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1f2937', 
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#f3f4f6'
                                }}
                              />
                              <Bar dataKey="nitrogen" fill="#10b981" name="Nitrogen (N)" />
                              <Bar dataKey="phosphorus" fill="#3b82f6" name="Phosphorus (P)" />
                              <Bar dataKey="potassium" fill="#f59e0b" name="Potassium (K)" />
                            </BarChart>
                          ) : (
                            <BarChart data={irrigationPlanData.schedule}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                              <YAxis stroke="#6b7280" fontSize={12} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1f2937', 
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#f3f4f6'
                                }}
                              />
                              <Bar dataKey="morning" fill="#60a5fa" name="Morning" stackId="a" />
                              <Bar dataKey="evening" fill="#3b82f6" name="Evening" stackId="a" />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Schedule Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {type === 'fertilizer' ? (
                        <>
                          {/* Current Nutrients */}
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-foreground mb-4">Current Soil Nutrients</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Nitrogen (N)</span>
                                <span className="font-bold text-success-green">{fertilizerPlanData.currentNutrients.nitrogen} ppm</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Phosphorus (P)</span>
                                <span className="font-bold text-warning-orange">{fertilizerPlanData.currentNutrients.phosphorus} ppm</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Potassium (K)</span>
                                <span className="font-bold text-info-blue">{fertilizerPlanData.currentNutrients.potassium} ppm</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-gray-600">pH Level</span>
                                <span className="font-bold text-foreground">{fertilizerPlanData.currentNutrients.pH}</span>
                              </div>
                            </div>
                          </div>

                          {/* Application Guide */}
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-foreground mb-4">Next Application</h4>
                            <div className="space-y-4">
                              <div className="p-4 bg-ai-purple/5 rounded-lg border border-ai-purple/20">
                                <div className="flex items-center space-x-3 mb-2">
                                  <FiCalendar className="text-ai-purple" />
                                  <span className="font-medium text-ai-purple">AI Recommendation</span>
                                </div>
                                <p className="text-sm text-foreground">{fertilizerPlanData.nextApplication}</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Apply during {fertilizerPlanData.currentPhase} for optimal nutrient uptake.
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Irrigation Insights */}
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-foreground mb-4">AI Insights</h4>
                            <div className="space-y-3">
                              {irrigationPlanData.insights.map((insight, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                                  <FiCalendar className="text-ai-purple mt-1 flex-shrink-0" size={16} />
                                  <p className="text-sm text-foreground">{insight}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Water Usage */}
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-foreground mb-4">Water Management</h4>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-foreground">Current Soil Moisture</span>
                                <span className="font-bold text-info-blue">{irrigationPlanData.soilMoisture}%</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="text-foreground">Water Saved</span>
                                <span className="font-bold text-success-green">{irrigationPlanData.waterSaved}%</span>
                              </div>
                              <div className="p-4 bg-ai-purple/5 rounded-lg border border-ai-purple/20">
                                <p className="text-sm text-foreground">
                                  <strong>Next Irrigation:</strong> {irrigationPlanData.nextIrrigation}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Duration: {irrigationPlanData.duration}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-foreground mb-4">Performance Analytics</h3>
                      <div className="text-center py-12">
                        <FiTrendingUp className="mx-auto text-6xl text-ai-purple mb-4" />
                        <h4 className="text-xl font-semibold text-foreground mb-2">Advanced Analytics</h4>
                        <p className="text-muted-foreground">
                          Detailed performance metrics and trends will be displayed here.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'savings' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-success-green/5 to-success-green/10 rounded-xl p-6 border border-success-green/20">
                        <div className="flex items-center space-x-3 mb-4">
                          <FiTrendingUp className="text-2xl text-success-green" />
                          <h3 className="text-xl font-semibold text-foreground">Cost Savings</h3>
                        </div>
                        {type === 'fertilizer' ? (
                          <div className="space-y-4">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-success-green">{fertilizerPlanData.costSavings.yearly}</p>
                              <p className="text-muted-foreground">Annual Savings</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-success-green">{fertilizerPlanData.costSavings.monthly}</p>
                              <p className="text-muted-foreground">Monthly Savings</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-success-green">{fertilizerPlanData.costSavings.efficiency}</p>
                              <p className="text-muted-foreground">Efficiency Improvement</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-success-green">{irrigationPlanData.waterSaved}%</p>
                              <p className="text-muted-foreground">Water Savings</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-success-green">$890/year</p>
                              <p className="text-muted-foreground">Cost Reduction</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-foreground mb-4">Environmental Impact</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-foreground">CO₂ Reduced</span>
                            <span className="font-bold text-success-green">2.1 tons/year</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-foreground">Water Conserved</span>
                            <span className="font-bold text-info-blue">15,000 L/season</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                            <span className="text-foreground">Soil Health Score</span>
                            <span className="font-bold text-ai-purple">85/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                AI-optimized for maximum efficiency and sustainability
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-ai-purple text-white rounded-lg hover:bg-ai-purple-light transition-colors"
              >
                Apply Schedule
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AIPlanningModal;