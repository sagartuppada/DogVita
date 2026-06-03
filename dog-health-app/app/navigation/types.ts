/**
 * Navigation types
 */

import { NavigatorScreenParams } from '@react-navigation/native';

export type OnboardingStackParamList = {
  Welcome: undefined;
  AddPhoneNumber: undefined;
  OTPVerification: { phoneNumber: string };
  SetupDogProfile: undefined;
  PairDevice: undefined;
};

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  HealthTab: NavigatorScreenParams<HealthStackParamList>;
  TrackingTab: NavigatorScreenParams<TrackingStackParamList>;
  AlertsTab: NavigatorScreenParams<AlertsStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
};

export type HealthStackParamList = {
  HealthOverview: undefined;
  HeartRateDetail: undefined;
  TemperatureDetail: undefined;
  SleepDetail: undefined;
};

export type TrackingStackParamList = {
  TrackingOverview: undefined;
  LiveTracking: undefined;
  Geofences: undefined;
};

export type AlertsStackParamList = {
  AlertsList: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  DevicePairing: undefined;
  AddDog: undefined;
  DogDetail: { dogId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}