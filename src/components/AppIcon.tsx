import React from 'react';
import * as Icons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const AppIcon: React.FC<IconProps> = ({ name, size = 24, className = '' }) => {
  // Convert icon name to PascalCase for Lucide
  const iconName = name.charAt(0).toUpperCase() + name.slice(1);
  
  // Get the icon component from Lucide
  const IconComponent = (Icons as any)[iconName] as React.ComponentType<any>;
  
  if (!IconComponent) {
    // Fallback to a default icon if not found
    const DefaultIcon = Icons.Circle;
    return <DefaultIcon size={size} className={className} />;
  }
  
  return <IconComponent size={size} className={className} />;
};

export default AppIcon;