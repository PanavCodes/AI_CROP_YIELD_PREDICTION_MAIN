import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tutorial from './Tutorial';
import DataInput from '../pages/DataInput';
import { getCurrentUser, needsTutorial, markTutorialComplete, saveUserSession } from '../utils/userUtils';

interface OnboardingFlowProps {
  children?: React.ReactNode;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ children }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [showTutorial, setShowTutorial] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'tutorial' | 'data-input' | 'complete'>('complete');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      
      // Determine onboarding step based on user state
      if (needsTutorial(user)) {
        setOnboardingStep('tutorial');
        setShowTutorial(true);
      } else if (!user.hasFarmData) {
        setOnboardingStep('data-input');
      } else {
        setOnboardingStep('complete');
      }
    }
  }, []);

  const handleTutorialComplete = async () => {
    if (currentUser) {
      // Mark tutorial as complete
      markTutorialComplete(currentUser.email);
      
      // Update user session
      const updatedUser = { ...currentUser, hasCompletedTutorial: true };
      saveUserSession(updatedUser);
      setCurrentUser(updatedUser);
      
      setShowTutorial(false);
      
      // Check if user still needs to input farm data
      if (!updatedUser.hasFarmData) {
        setOnboardingStep('data-input');
        navigate('/data-input');
      } else {
        setOnboardingStep('complete');
        navigate('/dashboard');
      }
    }
  };

  const handleTutorialSkip = () => {
    if (currentUser) {
      // Mark tutorial as complete even if skipped
      markTutorialComplete(currentUser.email);
      
      // Update user session
      const updatedUser = { ...currentUser, hasCompletedTutorial: true };
      saveUserSession(updatedUser);
      setCurrentUser(updatedUser);
      
      setShowTutorial(false);
      
      // Check if user still needs to input farm data
      if (!updatedUser.hasFarmData) {
        setOnboardingStep('data-input');
        navigate('/data-input');
      } else {
        setOnboardingStep('complete');
        navigate('/dashboard');
      }
    }
  };


  // If user is in tutorial phase, show tutorial overlay
  if (onboardingStep === 'tutorial' && showTutorial) {
    return (
      <>
        {children}
        <Tutorial
          isOpen={showTutorial}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      </>
    );
  }

  // If user is in data input phase, show data input page
  if (onboardingStep === 'data-input') {
    return <DataInput />;
  }

  // Otherwise, show normal app content
  return <>{children}</>;
};

export default OnboardingFlow;