import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: 10, // Reduced from 20
    scale: 0.99 // Reduced from 0.98
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: -10, // Reduced from -20
    scale: 0.99 // Reduced from 0.98
  }
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.43, 0.13, 0.23, 0.96] as const,
  duration: 0.15 // Reduced from 0.4 to 0.15 for instant feel
};

// Different animation variants for different page types
const getPageVariants = (pathname: string) => {
  // Slide up animation for auth pages
  if (pathname === '/login' || pathname === '/signup') {
    return {
      initial: { opacity: 0, y: 15, scale: 0.98 }, // Reduced from y: 30
      in: { opacity: 1, y: 0, scale: 1 },
      out: { opacity: 0, y: -15, scale: 0.98 } // Reduced from y: -30
    };
  }
  
  // Fade and slide for dashboard
  if (pathname === '/dashboard') {
    return {
      initial: { opacity: 0, x: 20, scale: 0.99 }, // Reduced from x: 50
      in: { opacity: 1, x: 0, scale: 1 },
      out: { opacity: 0, x: -20, scale: 0.99 } // Reduced from x: -50
    };
  }
  
  // Slide from right for data input
  if (pathname === '/data-input') {
    return {
      initial: { opacity: 0, x: 30, scale: 0.98 }, // Reduced from x: 100
      in: { opacity: 1, x: 0, scale: 1 },
      out: { opacity: 0, x: -30, scale: 0.98 } // Reduced from x: -100
    };
  }
  
  // Slide from left for suggestions
  if (pathname === '/suggestions') {
    return {
      initial: { opacity: 0, x: -20, scale: 0.99 }, // Reduced from x: -50
      in: { opacity: 1, x: 0, scale: 1 },
      out: { opacity: 0, x: 20, scale: 0.99 } // Reduced from x: 50
    };
  }
  
  // Scale animation for market insights
  if (pathname === '/market-insights') {
    return {
      initial: { opacity: 0, scale: 0.95, y: 10 }, // Reduced from scale: 0.9, y: 20
      in: { opacity: 1, scale: 1, y: 0 },
      out: { opacity: 0, scale: 0.95, y: -10 } // Reduced from y: -20
    };
  }
  
  // Default animation
  return pageVariants;
};

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const variants = getPageVariants(location.pathname);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={variants}
        transition={pageTransition}
        className="w-full"
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
