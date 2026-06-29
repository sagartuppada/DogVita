/**
 * Notifications Service - Local push notifications for health alerts
 * 
 * Uses react-native-push-notification for local notifications.
 * 
 * SETUP REQUIRED (one-time, per-platform):
 * 
 * Android:
 *   1. Create notification channels in android/app/src/main/java/.../MainApplication.java or a new NotificationChannelModule.java
 *   2. Add to AndroidManifest.xml:
 *      <uses-permission android:name="android.permission.VIBRATE" />
 *      <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
 *      <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
 *   3. Run: npm install react-native-push-notification @react-native-community/push-notification-ios
 *   4. cd android && ./gradlew clean
 * 
 * iOS:
 *   1. Add to Info.plist: UIBackgroundModes = ["remote-notification"]
 *   2. Enable Push Notifications capability in Xcode
 *   3. Run: cd ios && pod install
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { HealthAlert, GeofenceAlert } from '../../types';

// ── Types ──

export interface NotificationConfig {
  title: string;
  body: string;
  channelId?: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  playSound?: boolean;
  vibrate?: boolean;
  ongoing?: boolean;
  userInfo?: Record<string, unknown>;
}

// ── Notification Channels (Android) ──

export const NOTIFICATION_CHANNELS = {
  HEALTH_ALERTS: {
    id: 'dogvita-health-alerts',
    name: 'Health Alerts',
    importance: 'high' as const,
    description: 'Critical and warning health alerts for your dog',
  },
  GEOFENCE: {
    id: 'dogvita-geofence',
    name: 'Geofence Alerts',
    importance: 'high' as const,
    description: 'Alerts when your dog enters or exits geofences',
  },
  LOW_BATTERY: {
    id: 'dogvita-low-battery',
    name: 'Low Battery',
    importance: 'default' as const,
    description: 'Collar low battery warnings',
  },
  VACCINATION_REMINDERS: {
    id: 'dogvita-vaccinations',
    name: 'Vaccination Reminders',
    importance: 'default' as const,
    description: 'Upcoming vaccination due date reminders',
  },
} as const;

// ── Service ──

class NotificationsService {
  private static instance: NotificationsService;
  private initialized = false;
  private receivedListeners: Array<(notification: any) => void> = [];
  private responseListeners: Array<(response: any) => void> = [];
  private notificationIds: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  // ── Initialization ──

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Try to use react-native-push-notification if available
      const PushNotification = this.getPushNotification();
      if (!PushNotification) {
        console.warn('[Notifications] react-native-push-notification not installed. Using console fallback.');
        this.initialized = true;
        return true;
      }

      // Create Android notification channels
      if (Platform.OS === 'android') {
        Object.values(NOTIFICATION_CHANNELS).forEach((channel) => {
          PushNotification.createChannel(
            {
              channelId: channel.id,
              channelName: channel.name,
              channelDescription: channel.description,
              importance: channel.importance === 'high' ? 4 : 3, // HIGH : DEFAULT
              vibrate: true,
            },
            () => {} // callback required by lib
          );
        });
      }

      // Request permissions
      await this.requestPermissions();

      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('[Notifications] Initialization failed:', (error as Error).message);
      this.initialized = true; // mark as init'd so we don't retry forever
      return false;
    }
  }

  // ── Permissions ──

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      const PushNotification = this.getPushNotification();
      if (PushNotification && Platform.OS === 'ios') {
        return new Promise((resolve) => {
          PushNotification.requestPermissions()
            .then(() => resolve(true))
            .catch(() => resolve(false));
        });
      }

      return true;
    } catch {
      return false;
    }
  }

  // ── Health Alert Notifications ──

  async scheduleHealthAlert(alert: HealthAlert): Promise<string> {
    const channelId = alert.severity === 'critical'
      ? NOTIFICATION_CHANNELS.HEALTH_ALERTS.id
      : NOTIFICATION_CHANNELS.HEALTH_ALERTS.id;

    const notificationId = `health_${alert.id}`;
    const severityEmoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';

    await this.sendLocalNotification({
      title: `${severityEmoji} ${this.getAlertTitle(alert.type)}`,
      body: alert.message,
      channelId,
      priority: alert.severity === 'critical' ? 'max' : 'high',
      playSound: true,
      vibrate: true,
      userInfo: { alertId: alert.id, dogId: alert.dogId, type: 'health_alert' },
    }, notificationId);

    return notificationId;
  }

  // ── Geofence Alert Notifications ──

  async scheduleGeofenceAlert(alert: GeofenceAlert): Promise<string> {
    const action = alert.type === 'enter' ? 'entered' : 'left';
    const emoji = alert.type === 'enter' ? '📍' : '🚶';
    const notificationId = `geofence_${alert.id}`;

    await this.sendLocalNotification({
      title: `${emoji} Geofence ${alert.type === 'enter' ? 'Entry' : 'Exit'}`,
      body: `Your dog has ${action} a geofenced area.`,
      channelId: NOTIFICATION_CHANNELS.GEOFENCE.id,
      priority: 'high',
      playSound: true,
      vibrate: true,
      userInfo: { alertId: alert.id, geofenceId: alert.geofenceId, type: 'geofence_alert' },
    }, notificationId);

    return notificationId;
  }

  // ── Low Battery Notifications ──

  async scheduleLowBatteryAlert(dogId: string, batteryLevel: number): Promise<string> {
    const notificationId = `battery_${dogId}_${Date.now()}`;
    const isCritical = batteryLevel <= 10;

    await this.sendLocalNotification({
      title: isCritical ? '🔋 Critical Battery' : '🔋 Low Battery',
      body: isCritical
        ? `Collar battery at ${batteryLevel}%. Charge immediately!`
        : `Collar battery at ${batteryLevel}%. Consider charging soon.`,
      channelId: NOTIFICATION_CHANNELS.LOW_BATTERY.id,
      priority: isCritical ? 'high' : 'default',
      playSound: isCritical,
      vibrate: isCritical,
      userInfo: { dogId, batteryLevel, type: 'low_battery' },
    }, notificationId);

    return notificationId;
  }

  // ── Vaccination Reminders ──

  async scheduleVaccinationReminder(
    dogId: string,
    dogName: string,
    vaccineName: string,
    dueDate: string,
    daysUntilDue: number
  ): Promise<string> {
    const notificationId = `vacc_${dogId}_${vaccineName}_${dueDate}`;
    const emoji = daysUntilDue <= 0 ? '🚨' : daysUntilDue <= 7 ? '⏰' : '💉';
    const urgency = daysUntilDue <= 0
      ? `${dogName}'s ${vaccineName} is overdue!`
      : daysUntilDue <= 7
      ? `${dogName}'s ${vaccineName} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`
      : `${dogName}'s ${vaccineName} is due on ${dueDate}.`;

    await this.sendLocalNotification({
      title: `${emoji} Vaccination ${daysUntilDue <= 0 ? 'Overdue' : 'Reminder'}`,
      body: urgency,
      channelId: NOTIFICATION_CHANNELS.VACCINATION_REMINDERS.id,
      priority: daysUntilDue <= 0 ? 'high' : 'default',
      playSound: daysUntilDue <= 7,
      vibrate: false,
      userInfo: { dogId, vaccineName, dueDate, type: 'vaccination_reminder' },
    }, notificationId);

    return notificationId;
  }

  // ── Cancellation ──

  async cancelNotification(notificationId: string): Promise<void> {
    const PushNotification = this.getPushNotification();
    if (PushNotification) {
      PushNotification.cancelLocalNotification(notificationId);
    }
    this.notificationIds.delete(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    const PushNotification = this.getPushNotification();
    if (PushNotification) {
      PushNotification.cancelAllLocalNotifications();
    }
    this.notificationIds.clear();
  }

  async cancelNotificationsByPrefix(prefix: string): Promise<void> {
    const idsToCancel: string[] = [];
    this.notificationIds.forEach((_numId, strId) => {
      if (strId.startsWith(prefix)) idsToCancel.push(strId);
    });
    for (const id of idsToCancel) {
      await this.cancelNotification(id);
    }
  }

  // ── Badge Count ──

  async getBadgeCount(): Promise<number> {
    try {
      if (Platform.OS === 'ios') {
        const PushNotification = this.getPushNotification();
        if (PushNotification) {
          return await PushNotification.getApplicationIconBadgeNumber();
        }
      }
    } catch {}
    return 0;
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        const PushNotification = this.getPushNotification();
        if (PushNotification) {
          PushNotification.setApplicationIconBadgeNumber(count);
        }
      }
    } catch {}
  }

  // ── Listeners ──

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

  // ── Internal ──

  private async sendLocalNotification(config: NotificationConfig, id?: string): Promise<void> {
    const PushNotification = this.getPushNotification();
    if (!PushNotification) {
      // Fallback: log to console when library is not installed
      console.log(`[Notification] ${config.title}: ${config.body}`);
      return;
    }

    const notifId = id || `notif_${Date.now()}`;

    PushNotification.localNotification({
      channelId: config.channelId || NOTIFICATION_CHANNELS.HEALTH_ALERTS.id,
      title: config.title,
      message: config.body,
      playSound: config.playSound !== false,
      vibrate: config.vibrate !== false,
      priority: config.priority || 'default',
      ongoing: config.ongoing || false,
      userInfo: { ...config.userInfo, notificationId: notifId },
      // Android-specific
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      // iOS-specific
      soundName: config.playSound !== false ? 'default' : undefined,
    });

    this.notificationIds.set(notifId, Date.now());
  }

  private getAlertTitle(type: string): string {
    const titles: Record<string, string> = {
      heart_rate_high: 'High Heart Rate',
      heart_rate_low: 'Low Heart Rate',
      temperature_high: 'High Temperature',
      temperature_low: 'Low Temperature',
      battery_low: 'Low Battery',
      device_disconnect: 'Device Disconnected',
      activity_abnormal: 'Unusual Activity',
      sleep_disruption: 'Sleep Disruption',
      geofence_enter: 'Geofence Entry',
      geofence_exit: 'Geofence Exit',
    };
    return titles[type] || 'Health Alert';
  }

  private getPushNotification(): any {
    try {
      return require('react-native-push-notification');
    } catch {
      return null;
    }
  }
}

export const notificationsService = NotificationsService.getInstance();
export default notificationsService;
