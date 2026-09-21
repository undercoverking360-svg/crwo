import { LocalNotifications } from '@capacitor/local-notifications';

export interface TelemetryNotification {
  id: string;
  title: string;
  message: string;
  type: 'advance' | 'support' | 'kyc' | 'referral' | 'community' | 'guide' | 'system';
  timestamp: string;
  status: 'PENDING' | 'RESOLVED' | 'INFO';
  userEmail?: string;
  userId?: string;
  userName?: string;
  metadata?: any;
}

// Request Native Android / Web Notification Permission
export const requestNativeNotificationPermission = async (): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
  } catch (err) {
    console.warn('Native notification permission error:', err);
  }
  return false;
};

// Check if notification permission is already granted
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
  } catch (err) {
    console.warn('Check notification permission error:', err);
  }
  return false;
};

// Dispatch a real Android system-level push/local notification to phone screen / notification bar
export const sendNativePushNotification = async (
  title: string,
  body: string,
  id: number = Math.floor(Math.random() * 1000000),
  extraData?: any
) => {
  try {
    // 1. Native Capacitor Android Notification
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: new Date(Date.now() + 200) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: extraData || null
          }
        ]
      });
      return;
    }

    // 2. Web browser / HTML5 Notification fallback
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    }
  } catch (err) {
    console.warn('Failed to dispatch native push notification:', err);
  }
};
