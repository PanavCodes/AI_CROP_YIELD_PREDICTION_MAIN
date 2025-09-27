import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DiagnosticTest: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const goTo = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Diagnostic Test Page
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Current State</h2>
            <div className="bg-gray-100 rounded-lg p-4">
              <p><strong>Current Path:</strong> {location.pathname}</p>
              <p><strong>Authentication Status:</strong> {localStorage.getItem('isAuthenticated')}</p>
              <p><strong>User Email:</strong> {localStorage.getItem('userEmail')}</p>
              <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => goTo('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={() => goTo('/data-input')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Data Input
              </button>
              <button 
                onClick={() => goTo('/crop-analysis')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Crop Analysis
              </button>
              <button 
                onClick={() => goTo('/yield-prediction')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Yield Prediction
              </button>
              <button 
                onClick={() => goTo('/suggestions')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Suggestions
              </button>
              <button 
                onClick={() => goTo('/market-insights')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Market Insights
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Console Output</h2>
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
              <p>Check your browser's console (F12) for debugging information.</p>
              <p>Each navigation attempt will log relevant data.</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instructions</h3>
            <ul className="text-yellow-700 space-y-1">
              <li>• This page should always render without issues</li>
              <li>• Click navigation buttons and check if pages load</li>
              <li>• Open browser console to see navigation logs</li>
              <li>• Note any console errors that appear</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTest;