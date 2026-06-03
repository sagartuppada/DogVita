/**
 * useAlerts - Hook for managing alerts
 */

import { useCallback } from 'react';
import { useAlertStore } from '../store';
import { HealthAlert, AlertType, AlertSeverity } from '../types';

export const useAlerts = () => {
  const {
    alerts,
    unacknowledgedCount,
    criticalAlerts,
    alertRules,
    addAlert,
    acknowledgeAlert,
    acknowledgeAll,
    resolveAlert,
    deleteAlert,
    clearAllAlerts,
    getAlertsByDog,
    getAlertsByType,
    getUnacknowledgedAlerts,
  } = useAlertStore();

  const createAlert = useCallback(
    (data: {
      dogId: string;
      type: AlertType;
      severity: AlertSeverity;
      message: string;
      metricValue?: number;
      threshold?: number;
    }) => {
      addAlert(data);
    },
    [addAlert]
  );

  return {
    alerts,
    unacknowledgedCount,
    criticalAlerts,
    alertRules,
    createAlert,
    acknowledgeAlert,
    acknowledgeAll,
    resolveAlert,
    deleteAlert,
    clearAllAlerts,
    getAlertsByDog,
    getAlertsByType,
    getUnacknowledgedAlerts,
  };
};

export default useAlerts;