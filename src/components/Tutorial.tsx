import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDatabase, FiX, FiTarget, FiTrendingUp, FiGlobe, FiCheck } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';

interface TutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ isOpen, onComplete, onSkip }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const steps = [
    {
      id: 1,
      icon: <FiTarget className="text-4xl text-leaf-green" />,
      title: t('tutorial.step1.title'),
      description: t('tutorial.step1.description'),
      bgColor: 'from-green-100 to-emerald-100',
      iconBg: 'bg-green-50'
    },
    {
      id: 2,
      icon: <FiDatabase className="text-4xl text-blue-600" />,
      title: t('tutorial.step2.title'),
      description: t('tutorial.step2.description'),
      bgColor: 'from-blue-100 to-sky-100',
      iconBg: 'bg-blue-50'
    },
    {
      id: 3,
      icon: <FiTrendingUp className="text-4xl text-amber-600" />,
      title: t('tutorial.step3.title'),
      description: t('tutorial.step3.description'),
      bgColor: 'from-amber-100 to-yellow-100',
      iconBg: 'bg-amber-50'
    },
    {
      id: 4,
      icon: <FiGlobe className="text-4xl text-indigo-600" />,
      title: t('tutorial.step4.title'),
      description: t('tutorial.step4.description'),
      bgColor: 'from-indigo-100 to-purple-100',
      iconBg: 'bg-indigo-50'
    },
    {
      id: 5,
      icon: <FiCheck className="text-4xl text-emerald-600" />,
      title: t('tutorial.step5.title'),
      description: t('tutorial.step5.description'),
      bgColor: 'from-emerald-100 to-green-100',
      iconBg: 'bg-emerald-50'
    }
  ];

  const currentStepData = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${currentStepData.bgColor} p-6 relative`}>
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Close tutorial"
          >
            <FiX className="text-2xl" />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <GiWheat className="text-3xl text-leaf-green" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t('tutorial.welcome')}</h1>
              <p className="text-gray-600">{t('tutorial.subtitle')}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index + 1)}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  index + 1 <= currentStep
                    ? 'bg-leaf-green shadow-md'
                    : 'bg-white bg-opacity-60 hover:bg-opacity-80'
                }`}
              />
            ))}
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            {t('tutorial.stepOf', { current: currentStep, total: totalSteps })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className={`${currentStepData.iconBg} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg`}>
              {currentStepData.icon}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {currentStepData.title}
            </h2>
            
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
              {currentStepData.description}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>←</span>
              {t('tutorial.previous')}
            </button>

            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t('tutorial.skip')}
              </button>
              
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-leaf-green text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
              >
                {currentStep === totalSteps ? t('tutorial.getStarted') : t('tutorial.next')}
                {currentStep < totalSteps && <span>→</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <GiWheat className="w-full h-full text-leaf-green transform rotate-12" />
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Tutorial;