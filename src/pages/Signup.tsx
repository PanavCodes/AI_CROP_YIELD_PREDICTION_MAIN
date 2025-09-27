import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiLock, FiMail, FiPhone, FiMapPin, FiGlobe, FiX } from 'react-icons/fi';
import { GiWheat, GiField } from 'react-icons/gi';
import { registerUser, saveUserSession } from '../utils/userUtils';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    location: '',
    farmSize: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Register new user
      const newUser = registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        location: formData.location,
        farmSize: formData.farmSize
      });

      // Save user session
      saveUserSession(newUser);

      // New users always go to data input first
      navigate('/data-input');
    } catch (err) {
      setError(t('auth.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-leaf-green via-sky-blue to-wheat-gold flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <GiWheat className="text-6xl text-leaf-green" />
          </div>
          <h2 className="text-3xl font-bold text-soil-dark mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600">Join thousands of farmers using AI to improve their crops</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              i18n.language === 'en'
                ? 'bg-leaf-green text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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

        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <p className="text-sm text-green-700 font-semibold">What happens after you sign up?</p>
          </div>
          <ul className="text-xs text-green-600 space-y-1 ml-4">
            <li>✅ Instant access to your personalized dashboard</li>
            <li>✅ Set up your farm profile and field information</li>
            <li>✅ Get AI-powered crop recommendations</li>
            <li>✅ Access weather insights and market prices</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Create Password *
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                placeholder="Create a secure password"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Choose a strong password with at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Farm Location *
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                placeholder="e.g., Punjab, India or Village Name, District"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">This helps us provide location-specific recommendations</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Farm Size *
            </label>
            <div className="relative">
              <GiField className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="farmSize"
                value={formData.farmSize}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                placeholder="e.g., 5 hectares, 12 acres, 2 bighas"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Approximate size of your farming land</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-leaf-green text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Your Account...' : 'Create Account & Get Started'}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-center text-xs text-gray-500 mb-3">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-leaf-green font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;