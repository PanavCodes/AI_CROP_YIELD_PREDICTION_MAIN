import React, { useState } from 'react';
import { BsBell } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import { markAllAsRead } from '../utils/notificationUtils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

interface NotificationIconProps {
  notifications?: Notification[];
  onMarkAllRead?: () => void;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ 
  notifications = [],
  onMarkAllRead
}) => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMarkAllRead = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    } else {
      markAllAsRead();
    }
    setShowDropdown(false);
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="relative">
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        onClick={toggleDropdown}
        aria-label={t('notifications.toggle') || 'Toggle notifications'}
      >
        <BsBell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-800">Notifications</h3>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <span className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
          
          {notifications.length > 0 && (
            <div className="p-2 text-center border-t border-gray-100">
              <button 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;