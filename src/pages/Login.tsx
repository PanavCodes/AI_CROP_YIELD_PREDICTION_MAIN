import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiLock, FiGlobe, FiX } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';
import { authenticateUser, saveUserSession, needsTutorial, isNewUser } from '../utils/userUtils';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = authenticateUser(email, password);
      
      if (!user) {
        setError(t('auth.invalidCredentials'));
        setLoading(false);
        return;
      }

      // Save user session
      saveUserSession(user);
      
      // Save the currently selected language as the user's default language
      localStorage.setItem('language', i18n.language);
      
      // Apply the selected language
      i18n.changeLanguage(i18n.language);

      // Smart redirect based on user type and status
      if (needsTutorial(user)) {
        // New user who needs tutorial first
        navigate('/onboarding');
      } else if (isNewUser(user) || !user.hasFarmData) {
        // New user who needs to input farm data
        navigate('/data-input');
      } else {
        // Existing user with complete data goes to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-leaf-green via-sky-blue to-wheat-gold dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-colors duration-200">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <GiWheat className="text-6xl text-leaf-green" />
          </div>
          <h2 className="text-3xl font-bold text-soil-dark dark:text-white mb-2">
            {t('welcome')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">{t('login')}</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              i18n.language === 'en'
                ? 'bg-leaf-green text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <FiGlobe />
            English
          </button>
          <button
            onClick={() => changeLanguage('hi')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              i18n.language === 'hi'
                ? 'bg-leaf-green text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <FiGlobe />
            हिंदी
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <FiX className="text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-2"><strong>{t('auth.demoCredentials')}</strong></p>
          <p className="text-xs text-blue-600">📧 {t('auth.existingUser')} <strong>e@gmail.com</strong> {t('auth.goesToDashboard')}</p>
          <p className="text-xs text-blue-600">📧 {t('auth.newUser')} <strong>n@gmail.com</strong> {t('auth.tutorialAndDataInput')}</p>
          <p className="text-xs text-blue-600">📧 {t('auth.legacyUser')} demo@farm.com {t('auth.alsoGoesToDashboard')}</p>
          <p className="text-xs text-blue-600">🔐 {t('auth.anyPassword')}</p>
          <p className="text-xs text-green-600 mt-1">✨ <strong>{t('auth.tryNewUser')}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 text-leaf-green focus:ring-leaf-green border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">
                {t('auth.rememberMe')}
              </span>
            </label>
            <button type="button" className="text-sm text-leaf-green hover:underline">
              {t('auth.forgotPassword')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-leaf-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.signingIn') : t('login')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="text-leaf-green font-semibold hover:underline">
            {t('signup')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;