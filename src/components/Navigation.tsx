import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiDatabase, FiTrendingUp, FiLogOut, FiMenu, FiX, FiGlobe, FiUser } from 'react-icons/fi';
import { FaDollarSign, FaUsers } from 'react-icons/fa';
import { GiWheat } from 'react-icons/gi';
import NotificationIcon from './NotificationIcon';
import { getNotifications } from '../utils/notificationUtils';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState(getNotifications());

  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const userName = userEmail.split('@')[0] || 'User';
  const isNewUser = userEmail === 'n@gmail.com';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // For new users (n@gmail.com), show all navigation items but make them non-clickable
  // For existing users, show all navigation items as normal
  const navItems: { path: string; label: string; icon: React.ComponentType<any>; disabled?: boolean }[] = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: FiHome, disabled: isNewUser },
    { path: '/data-input', label: t('nav.dataInput'), icon: FiDatabase, disabled: false }, // Always enabled
    { path: '/suggestions', label: t('nav.suggestions'), icon: FiTrendingUp, disabled: isNewUser },
    { path: '/market-insights', label: t('nav.market'), icon: FaDollarSign as React.ComponentType<any>, disabled: isNewUser },
    { path: '/community', label: t('nav.community'), icon: FaUsers as React.ComponentType<any>, disabled: isNewUser },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <GiWheat className="text-3xl text-leaf-green" />
            <span className="text-xl font-bold text-soil-dark hidden sm:block">
              CropPredict AI
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return item.disabled ? (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -5 }} // Reduced from y: -10
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }} // Reduced delay and duration
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed"
                  title="Complete data input first"
                >
                  <Icon />
                  <span>{item.label}</span>
                </motion.div>
              ) : (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -5 }} // Reduced from y: -10
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }} // Reduced delay and duration
                  whileHover={{ scale: 1.02 }} // Reduced from 1.05
                  whileTap={{ scale: 0.98 }} // Reduced from 0.95
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-leaf-green text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                    }`}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Right side - Language & Profile */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiGlobe className="text-gray-600" />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="hi">हि</option>
              </select>
            </div>
            
            {/* Notification Icon */}
            <NotificationIcon notifications={notifications} />
            
            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-leaf-green to-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden lg:block">{userName}</span>
                <span className="text-xs">▼</span>
              </button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: -5 }} // Reduced from scale: 0.95, y: -10
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -5 }} // Reduced from scale: 0.95, y: -10
                    transition={{ duration: 0.15 }} // Reduced from 0.2
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{userEmail}</p>
                    </div>
                    
                    <motion.div
                      whileHover={{ backgroundColor: "rgb(249, 250, 251)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to="/profile-settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors"
                      >
                        <FiUser className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </motion.div>
                    
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <motion.button
                        whileHover={{ backgroundColor: "rgb(254, 242, 242)" }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors w-full text-left"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>{t('logout')}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }} // Reduced from 0.3
            className="md:hidden bg-white border-t overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return item.disabled ? (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }} // Reduced from x: -20
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }} // Reduced delay
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 cursor-not-allowed"
                    title="Complete data input first"
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }} // Reduced from x: -20
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }} // Reduced delay
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        location.pathname === item.path
                          ? 'bg-leaf-green text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                      }`}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="border-t pt-3 mt-3"
              >
                {/* Profile Section */}
                <div className="px-4 py-3 bg-gray-50 rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-leaf-green to-green-600 rounded-full flex items-center justify-center text-white font-medium">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{userEmail}</p>
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/profile-settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
                    location.pathname === '/profile-settings'
                      ? 'bg-leaf-green text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiUser />
                  <span>Profile Settings</span>
                </Link>
                
                <div className="flex items-center justify-between px-4 py-2 mt-2">
                  <div className="flex items-center gap-2">
                    <FiGlobe className="text-gray-600" />
                    <select
                      value={i18n.language}
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full mt-2"
                >
                  <FiLogOut />
                  <span>{t('logout')}</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;