import { Notification } from '../components/NotificationIcon';

// Mock notifications for demonstration
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Weather Alert',
    message: 'Heavy rain expected in your area tomorrow.',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  {
    id: '2',
    title: 'Market Price Update',
    message: 'Corn prices have increased by 5% this week.',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  },
  {
    id: '3',
    title: 'Planting Season',
    message: 'Optimal planting time for wheat begins next week.',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  }
];

// Get all notifications
export const getNotifications = (): Notification[] => {
  const storedNotifications = localStorage.getItem('notifications');
  if (storedNotifications) {
    const parsed = JSON.parse(storedNotifications);
    return parsed.map((notification: any) => ({
      ...notification,
      timestamp: new Date(notification.timestamp)
    }));
  }
  
  // Return mock data if no stored notifications
  return mockNotifications;
};

// Mark a notification as read
export const markAsRead = (id: string): Notification[] => {
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(notification => 
    notification.id === id ? { ...notification, read: true } : notification
  );
  
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  return updatedNotifications;
};

// Mark all notifications as read
export const markAllAsRead = (): Notification[] => {
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(notification => ({ 
    ...notification, 
    read: true 
  }));
  
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  return updatedNotifications;
};

// Add a new notification
export const addNotification = (title: string, message: string): Notification[] => {
  const notifications = getNotifications();
  const newNotification: Notification = {
    id: Date.now().toString(),
    title,
    message,
    read: false,
    timestamp: new Date()
  };
  
  const updatedNotifications = [newNotification, ...notifications];
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  return updatedNotifications;
};