import React from 'react';
import { motion } from 'framer-motion';
// Using Unicode symbols instead of react-icons to avoid import issues
// import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center p-2 rounded-lg
        transition-all duration-200 ease-in-out
        bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${showLabel ? 'gap-2 px-3' : ''}
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Icon Container with Animation */}
      <div className="relative w-5 h-5 overflow-hidden">
        <motion.div
          initial={false}
          animate={{
            rotate: isDark ? 180 : 0,
            scale: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-xl">☀️</span>
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{
            rotate: isDark ? 0 : -180,
            scale: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-xl">🌙</span>
        </motion.div>
      </div>

      {/* Optional Label */}
      {showLabel && (
        <span className="text-sm font-medium select-none">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}

      {/* Background Glow Effect */}
      <motion.div
        className={`
          absolute inset-0 rounded-lg opacity-0 pointer-events-none
          ${isDark 
            ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20' 
            : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20'
          }
        `}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
};

export default ThemeToggle;