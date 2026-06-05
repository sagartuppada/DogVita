/**
 * Alert store - manages health alerts and notifications
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthAlert, AlertType, AlertSeverity } from '../types';

interface AlertState {
  alerts: HealthAlert[];
  unacknowledgedCount: number;
  criticalAlerts: HealthAlert[];
  alertRules: AlertRule[];
  isProcessing: boolean;
}

interface AlertRule {
  id: string;
  type: AlertType;
  enabled: boolean;
  threshold: number;
  severity: AlertSeverity;
  notify: boolean;
  dogId: string;
}

interface AlertActions {
  addAlert: (alert: Omit<HealthAlert, 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAll: () => void;
  resolveAlert: (alertId: string) => void;
  deleteAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  setAlertRule: (rule: AlertRule) => void;
  removeAlertRule: (ruleId: string) => void;
  getAlertsByDog: (dogId: string) => HealthAlert[];
  getAlertsByType: (type: AlertType) => HealthAlert[];
  getUnacknowledgedAlerts: () => HealthAlert[];
  loadDemoData: () => void;
}

type AlertStore = AlertState & AlertActions;

const initialState: AlertState = {
  alerts: [],
  unacknowledgedCount: 0,
  criticalAlerts: [],
  alertRules: [],
  isProcessing: false,
};

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addAlert: (alertData) =>
        set((state) => {
          const alert: HealthAlert = {
            ...alertData,
            id: `alert_${Date.now()}`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          };
          const newAlerts = [alert, ...state.alerts].slice(0, 500);
          const unacknowledgedCount = newAlerts.filter((a) => !a.acknowledged).length;
          const criticalAlerts = newAlerts.filter(
            (a) => a.severity === 'critical' && !a.acknowledged
          );
          return { alerts: newAlerts, unacknowledgedCount, criticalAlerts };
        }),

      acknowledgeAlert: (alertId) =>
        set((state) => {
          const alerts = state.alerts.map((a) =>
            a.id === alertId ? { ...a, acknowledged: true } : a
          );
          return {
            alerts,
            unacknowledgedCount: alerts.filter((a) => !a.acknowledged).length,
            criticalAlerts: alerts.filter(
              (a) => a.severity === 'critical' && !a.acknowledged
            ),
          };
        }),

      acknowledgeAll: () =>
        set((state) => ({
          alerts: state.alerts.map((a) => ({ ...a, acknowledged: true })),
          unacknowledgedCount: 0,
          criticalAlerts: [],
        })),

      resolveAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? { ...a, resolvedAt: new Date().toISOString() }
              : a
          ),
        })),

      deleteAlert: (alertId) =>
        set((state) => {
          const alerts = state.alerts.filter((a) => a.id !== alertId);
          return {
            alerts,
            unacknowledgedCount: alerts.filter((a) => !a.acknowledged).length,
            criticalAlerts: alerts.filter(
              (a) => a.severity === 'critical' && !a.acknowledged
            ),
          };
        }),

      clearAllAlerts: () => set(initialState),

      setAlertRule: (rule) =>
        set((state) => {
          const exists = state.alertRules.some((r) => r.id === rule.id);
          const alertRules = exists
            ? state.alertRules.map((r) => (r.id === rule.id ? rule : r))
            : [...state.alertRules, rule];
          return { alertRules };
        }),

      removeAlertRule: (ruleId) =>
        set((state) => ({
          alertRules: state.alertRules.filter((r) => r.id !== ruleId),
        })),

      getAlertsByDog: (dogId) => {
        const { alerts } = get();
        return alerts.filter((a) => a.dogId === dogId);
      },

      getAlertsByType: (type) => {
        const { alerts } = get();
        return alerts.filter((a) => a.type === type);
      },

      getUnacknowledgedAlerts: () => {
        const { alerts } = get();
        return alerts.filter((a) => !a.acknowledged);
      },

      loadDemoData: () => {
        const now = Date.now();
        const demoAlerts: HealthAlert[] = [
          {
            id: 'demo_alert_1',
            dogId: 'demo_dog_1',
            type: 'heart_rate_high',
            severity: 'warning',
            message: 'Heart rate elevated: 115 bpm detected',
            metricValue: 115,
            threshold: 120,
            timestamp: new Date(now - 300000).toISOString(),
            acknowledged: false,
          },
          {
            id: 'demo_alert_2',
            dogId: 'demo_dog_1',
            type: 'battery_low',
            severity: 'info',
            message: 'Collar battery at 15%',
            metricValue: 15,
            threshold: 20,
            timestamp: new Date(now - 1800000).toISOString(),
            acknowledged: false,
          },
          {
            id: 'demo_alert_3',
            dogId: 'demo_dog_1',
            type: 'temperature_high',
            severity: 'warning',
            message: 'Body temperature slightly elevated: 38.9°C',
            metricValue: 38.9,
            threshold: 39,
            timestamp: new Date(now - 3600000).toISOString(),
            acknowledged: true,
          },
        ];
        set({
          alerts: demoAlerts,
          unacknowledgedCount: demoAlerts.filter((a) => !a.acknowledged).length,
          criticalAlerts: demoAlerts.filter(
            (a) => a.severity === 'critical' && !a.acknowledged
          ),
        });
      },
    }),
    {
      name: 'alert-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        alerts: state.alerts.slice(0, 100),
        alertRules: state.alertRules,
      }),
    }
  )
);

export const selectUnacknowledgedCount = (state: AlertStore) => state.unacknowledgedCount;
export const selectCriticalAlerts = (state: AlertStore) => state.criticalAlerts;