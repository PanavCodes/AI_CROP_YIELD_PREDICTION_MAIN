import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './utils/i18n';
import { isAuthenticated, getCurrentUser, needsTutorial } from './utils/userUtils';

// Components
import Navigation from './components/Navigation';
import AIChatbot from './components/AIChatbot';
import OnboardingFlow from './components/OnboardingFlow';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DataInput from './pages/DataInput';
import Suggestions from './pages/Suggestions';
import ProfileSettings from './pages/profile-settings';
import MarketInsights from './pages/MarketInsights';
import Community from './pages/Community';

function App() {

  const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
    const authenticated = isAuthenticated();
    const user = getCurrentUser();
    const location = useLocation();
    
    // If not authenticated, redirect to login
    if (!authenticated) {
      return <Navigate to="/login" />;
    }
    
    // For new users (n@gmail.com), restrict access to only onboarding and data-input
    if (user && user.email === 'n@gmail.com') {
      // Allow access only to onboarding and data-input
      if (location.pathname !== '/onboarding' && location.pathname !== '/data-input') {
        // If they need tutorial, send to onboarding, otherwise to data-input
        return <Navigate to={needsTutorial(user) ? '/onboarding' : '/data-input'} />;
      }
    }
    
    return children;
  };

  const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const showNavigation = location.pathname !== '/login' && location.pathname !== '/signup' && isAuthenticated();
    
    return (
      <div className="min-h-screen bg-gray-50">
        {showNavigation && <Navigation />}
        {children}
        {showNavigation && <AIChatbot />}
      </div>
    );
  };

  const AuthenticatedRedirect = () => {
    const user = getCurrentUser();
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    // Check if user needs tutorial first
    if (needsTutorial(user)) {
      return <Navigate to="/onboarding" />;
    }
    
    // Check if user needs to complete farm data input
    if (!user.hasFarmData) {
      return <Navigate to="/data-input" />;
    }
    
    // Existing user with complete data goes to dashboard
    return <Navigate to="/dashboard" />;
  };

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<AuthenticatedRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/onboarding"
            element={
              <PrivateRoute>
                <OnboardingFlow>
                  <Dashboard />
                </OnboardingFlow>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/data-input"
            element={
              <PrivateRoute>
                <DataInput />
              </PrivateRoute>
            }
          />
          <Route
            path="/suggestions"
            element={
              <PrivateRoute>
                <Suggestions />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile-settings"
            element={
              <PrivateRoute>
                <ProfileSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/market-insights"
            element={
              <PrivateRoute>
                <MarketInsights />
              </PrivateRoute>
            }
          />
          <Route
            path="/community"
            element={
              <PrivateRoute>
                <Community />
              </PrivateRoute>
            }
          />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
