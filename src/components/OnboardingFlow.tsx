import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataInput from '../pages/DataInput';
import { getCurrentUser, needsTutorial, markTutorialComplete, saveUserSession } from '../utils/userUtils';

interface OnboardingFlowProps {
  children?: React.ReactNode;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ children }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [onboardingStep, setOnboardingStep] = useState<'data-input' | 'complete'>('complete');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      
      // Determine onboarding step based on user state
      if (!user.hasFarmData) {
        setOnboardingStep('data-input');
      } else {
        setOnboardingStep('complete');
      }
    }
  }, []);

  // If user is in data input phase, show data input page
  if (onboardingStep === 'data-input') {
    return <DataInput />;
  }

  // Otherwise, show normal app content
  return <>{children}</>;
};

export default OnboardingFlow;