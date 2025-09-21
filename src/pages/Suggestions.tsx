import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiClock, FiTarget } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';
import { mockOptimizations } from '../mockData/mockData';

const Suggestions: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('all');
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Irrigation': '💧',
      'Fertilizer': '🌱',
      'Pest Control': '🐛',
      'Soil Health': '🏔️',
      'Harvest': '🌾'
    };
    return icons[category] || '📋';
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'irrigation': t('suggestions.irrigationCategory'),
      'fertilizer': t('suggestions.fertilizerCategory'),
      'pest control': t('suggestions.pestControlCategory'),
      'soil health': t('suggestions.soilHealthCategory'),
      'harvest': t('suggestions.harvestCategory')
    };
    return categoryMap[category] || category;
  };

  const filteredSuggestions = filter === 'all' 
    ? mockOptimizations 
    : mockOptimizations.filter(opt => opt.category.toLowerCase() === filter);

  const toggleCompleted = (id: number) => {
    setCompletedTasks(prev => 
      prev.includes(id) 
        ? prev.filter(taskId => taskId !== id)
        : [...prev, id]
    );
  };

  const categories = ['all', 'irrigation', 'fertilizer', 'pest control', 'soil health', 'harvest'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-leaf-green to-green-600 p-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <GiWheat className="text-4xl" />
              {t('suggestions.title')}
            </h1>
            <p className="text-green-100 mt-2">
              {t('suggestions.subtitle')}
            </p>
          </div>

          <div className="p-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === cat
                      ? 'bg-leaf-green text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? t('suggestions.all') : getCategoryDisplayName(cat)}
                </button>
              ))}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('suggestions.totalSuggestions')}</p>
                    <p className="text-2xl font-bold text-blue-700">{filteredSuggestions.length}</p>
                  </div>
                  <FiTarget className="text-3xl text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('suggestions.completed')}</p>
                    <p className="text-2xl font-bold text-green-700">{completedTasks.length}</p>
                  </div>
                  <FiCheck className="text-3xl text-green-500" />
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('suggestions.pending')}</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {filteredSuggestions.length - completedTasks.length}
                    </p>
                  </div>
                  <FiClock className="text-3xl text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Suggestion Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSuggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className={`border rounded-xl p-5 transition-all hover:shadow-lg ${
                    completedTasks.includes(suggestion.id)
                      ? 'bg-gray-50 opacity-75'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-lg font-bold ${
                          completedTasks.includes(suggestion.id)
                            ? 'line-through text-gray-500'
                            : 'text-gray-800'
                        }`}>
                          {suggestion.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                          getPriorityBadge(suggestion.priority)
                        }`}>
                          {t(`suggestions.${suggestion.priority}`)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 text-sm">
                        {suggestion.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                          {t('suggestions.impact')}: {suggestion.impact}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {getCategoryDisplayName(suggestion.category.toLowerCase())}
                        </span>
                        <button
                          onClick={() => toggleCompleted(suggestion.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            completedTasks.includes(suggestion.id)
                              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              : 'bg-leaf-green text-white hover:bg-green-700'
                          }`}
                        >
                          {completedTasks.includes(suggestion.id) ? t('suggestions.undo') : t('suggestions.markAsDone')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredSuggestions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{t('suggestions.noSuggestionsFound')}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                {t('suggestions.backToDashboard')}
              </button>
              <button
                onClick={() => navigate('/data-input')}
                className="bg-leaf-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                {t('suggestions.updateFarmData')}
              </button>
              <button
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                {t('suggestions.downloadReport')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;