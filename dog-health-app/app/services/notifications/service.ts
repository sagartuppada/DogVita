/**
 * Notifications Service - Handles push notifications and alerts
 * Stub implementation - replace with react-native-push-notification for production
 */

import { Platform } from 'react-native';
import { HealthAlert, GeofenceAlert } from '../../types';

class NotificationsService {
  private static instance: NotificationsService;
  private receivedListeners: Array<(notification: any) => void> = [];
  private responseListeners: Array<(response: any) => void> = [];

  private constructor() {}

  public static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    console.warn('Notifications: stub - implement with react-native-push-notification');
    return true;
  }

  async scheduleHealthAlert(alert: HealthAlert): Promise<string> {
    console.log('Health alert:', alert.type, alert.message);
    return `notification_${Date.now()}`;
  }

  async scheduleGeofenceAlert(alert: GeofenceAlert): Promise<string> {
    const action = alert.type === 'enter' ? 'entered' : 'left';
    console.log('Geofence alert: dog has', action);
    return `notification_${Date.now()}`;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    console.log('Cancel notification:', notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    console.log('Cancel all notifications');
  }

  async getBadgeCount(): Promise<number> {
    return 0;
  }

  async setBadgeCount(count: number): Promise<void> {
    console.log('Set badge count:', count);
  }

  addNotificationReceivedListener(
    callback: (notification: any) => void
  ): { remove: () => void } {
    this.receivedListeners.push(callback);
    return {
      remove: () => {
        this.receivedListeners = this.receivedListeners.filter((l) => l !== callback);
      },
    };
  }

  addNotificationResponseListener(
    callback: (response: any) => void
  ): { remove: () => void } {
    this.responseListeners.push(callback);
    return {
      remove: () => {
        this.responseListeners = this.responseListeners.filter((l) => l !== callback);
      },
    };
  }
}

export const notificationsService = NotificationsService.getInstance();
export default notificationsService;
