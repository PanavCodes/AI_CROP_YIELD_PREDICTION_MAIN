import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './utils/i18n';
import { isAuthenticated, getCurrentUser, needsTutorial, performAutoLogout } from './utils/userUtils';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navigation from './components/Navigation';
import AIChatbotEnhanced from './components/AIChatbotEnhanced';
import OnboardingFlow from './components/OnboardingFlow';
import RouteTransition from './components/RouteTransition';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DataInput from './pages/DataInput';
import Suggestions from './pages/Suggestions';
import ProfileSettings from './pages/profile-settings';
import MarketInsights from './pages/MarketInsights';
import CropAnalysis from './pages/CropAnalysis';
import YieldPrediction from './pages/YieldPrediction';
import DiagnosticTest from './pages/DiagnosticTest';

function App() {
  // Enhanced automatic sign-out when browser/tab is closed or localhost stops
  useEffect(() => {
    // Set a session flag to detect server restarts
    const sessionId = sessionStorage.getItem('devSessionId');
    const currentSessionId = Date.now().toString();
    
    if (!sessionId) {
      // First time or after server restart
      sessionStorage.setItem('devSessionId', currentSessionId);
    } else if (sessionId !== currentSessionId) {
      // Different session detected, likely server restart
      console.log('Development server restart detected, clearing session...');
      performAutoLogout();
      sessionStorage.setItem('devSessionId', currentSessionId);
    }
    let visibilityTimeout: NodeJS.Timeout | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Clear user session when browser/tab is closed
      performAutoLogout();
      // Don't prevent closing, just logout silently
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start a timer when tab becomes hidden
        visibilityTimeout = setTimeout(() => {
          if (document.hidden && isAuthenticated()) {
            console.log('Tab hidden for extended period, signing out...');
            performAutoLogout();
            // Force reload to reflect logout state
            window.location.reload();
          }
        }, 300000); // 5 minutes of inactivity
      } else {
        // Clear timeout when tab becomes visible again
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
          visibilityTimeout = null;
        }
      }
    };

    const handlePageHide = () => {
      // Handle when page is being unloaded (covers more cases than beforeunload)
      performAutoLogout();
    };

    const handleUnload = () => {
      // Final cleanup when page is unloaded
      performAutoLogout();
    };

    // Check if localhost server is still running (optional heartbeat)
    const checkServerConnection = () => {
      if (!isAuthenticated()) return;
      
      fetch(window.location.origin + '/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-store'
      })
      .catch(() => {
        // If localhost is not reachable, sign out
        console.log('Localhost server not reachable, signing out...');
        performAutoLogout();
        window.location.reload();
      });
    };

    // Additional event handlers for edge cases
    const handleFocus = () => {
      // When window regains focus, check if we're still authenticated
      // and if the server is still running
      if (isAuthenticated()) {
        checkServerConnection();
      }
    };
    
    const handleOnline = () => {
      // When connection is restored, check server
      if (isAuthenticated()) {
        checkServerConnection();
      }
    };
    
    const handleOffline = () => {
      // When going offline, sign out after a delay
      setTimeout(() => {
        if (!navigator.onLine && isAuthenticated()) {
          console.log('Device offline, signing out...');
          performAutoLogout();
          window.location.reload();
        }
      }, 10000); // 10 seconds grace period
    };

    // Set up heartbeat to check server connection every 30 seconds
    // TEMPORARILY DISABLED FOR DEBUGGING
    // if (isAuthenticated()) {
    //   heartbeatInterval = setInterval(checkServerConnection, 30000);
    // }

    // Add all event listeners for comprehensive coverage
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup all event listeners and timers
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, []);

  const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
    const authenticated = isAuthenticated();
    const user = getCurrentUser();
    const location = useLocation();
    
    console.log('PrivateRoute check:', {
      authenticated,
      user: user?.email,
      path: location.pathname
    });
    
    // If not authenticated, redirect to login
    if (!authenticated) {
      console.log('User not authenticated, redirecting to login');
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
    // Don't show navigation on landing page, login, or signup
    const showNavigation = location.pathname !== '/login' && 
                          location.pathname !== '/signup' && 
                          location.pathname !== '/' && 
                          location.pathname !== '/landing' && 
                          isAuthenticated();
    
    console.log('AppLayout render:', {
      path: location.pathname,
      showNavigation,
      authenticated: isAuthenticated()
    });
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {showNavigation && <Navigation />}
        <ErrorBoundary>
          <RouteTransition>
            {children}
          </RouteTransition>
        </ErrorBoundary>
        {showNavigation && <AIChatbotEnhanced />}
      </div>
    );
  };

  // Redirect authenticated users to dashboard, show landing for unauthenticated users
  const DefaultRoute = () => {
    const authenticated = isAuthenticated();
    const user = getCurrentUser();
    
    if (authenticated) {
      // For new users (n@gmail.com), redirect based on their progress
      if (user && user.email === 'n@gmail.com') {
        if (needsTutorial(user)) {
          return <Navigate to="/onboarding" />;
        } else {
          return <Navigate to="/data-input" />;
        }
      }
      // For existing users, go to dashboard
      return <Navigate to="/dashboard" />;
    }
    
    // Unauthenticated users see landing page
    return <Landing />;
  };

  return (
    <ThemeProvider>
      <Router>
        <AppLayout>
          <Routes>
          <Route path="/" element={<DefaultRoute />} />
          <Route path="/landing" element={<Landing />} />
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
            path="/crop-analysis"
            element={
              <PrivateRoute>
                <CropAnalysis />
              </PrivateRoute>
            }
          />
          <Route
            path="/yield-prediction"
            element={
              <PrivateRoute>
                <YieldPrediction />
              </PrivateRoute>
            }
          />
          <Route
            path="/diagnostic-test"
            element={
              <PrivateRoute>
                <DiagnosticTest />
              </PrivateRoute>
            }
          />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
