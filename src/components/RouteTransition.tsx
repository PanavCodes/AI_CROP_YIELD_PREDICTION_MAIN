import React from 'react';

interface RouteTransitionProps {
  children: React.ReactNode;
}

const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
  // No transitions - just render children directly
  return <>{children}</>;
};

export default RouteTransition;
