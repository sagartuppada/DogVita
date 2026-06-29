import type { AlertSeverity, AlertType } from "@/lib/types";

/**
 * Maps an AlertType → { icon key, label, default severity color }.
 * Mirrors the mobile app's ALERT_TYPE_LABELS / ALERT_TYPE_ICONS in
 * DashboardScreen.tsx so the two surfaces describe alerts identically.
 */
export const ALERT_META: Record<
  AlertType,
  { label: string; icon: string; blurb: string }
> = {
  heart_rate_high: { label: "Heart rate high", icon: "heart", blurb: "Above safe zone" },
  heart_rate_low: { label: "Heart rate low", icon: "heart", blurb: "Below resting zone" },
  temperature_high: { label: "Temperature high", icon: "thermometer", blurb: "Elevated body temp" },
  temperature_low: { label: "Temperature low", icon: "thermometer", blurb: "Below normal range" },
  battery_low: { label: "Battery low", icon: "battery-low", blurb: "Collar needs charging" },
  geofence_enter: { label: "Entered safe zone", icon: "map-pin", blurb: "Geofence breach" },
  geofence_exit: { label: "Left safe zone", icon: "map-pin", blurb: "Geofence breach" },
  activity_abnormal: { label: "Abnormal activity", icon: "activity", blurb: "Outside normal pattern" },
  sleep_disruption: { label: "Sleep disruption", icon: "moon", blurb: "Restless night" },
  device_disconnect: { label: "Device offline", icon: "bluetooth-off", blurb: "Collar disconnected" },
};

export const SEVERITY_TONE: Record<
  AlertSeverity,
  "neutral" | "info" | "warning" | "danger"
> = {
  info: "info",
  warning: "warning",
  critical: "danger",
};
