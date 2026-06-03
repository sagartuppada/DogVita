/**
 * Navigation type definitions
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator params
export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  DevicePairing: undefined;
  AddDog: undefined;
  EditDog: { dogId: string };
  DogDetail: { dogId: string };
  HealthDetail: { metric: string; dogId: string };
  GeofenceEdit: { geofenceId?: string; dogId: string };
  AlertDetail: { alertId: string };
  SettingsDetail: { setting: string };
  Modal: NavigatorScreenParams<ModalStackParamList>;
};

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
  QuickStats: undefined;
};

export type HealthStackParamList = {
  HealthOverview: undefined;
  HeartRateDetail: undefined;
  TemperatureDetail: undefined;
  ActivityDetail: undefined;
  SleepDetail: undefined;
};

export type TrackingStackParamList = {
  TrackingOverview: undefined;
  LiveTracking: undefined;
  Geofences: undefined;
  History: undefined;
};

export type AlertsStackParamList = {
  AlertsList: undefined;
  AlertRules: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  AccountSettings: undefined;
  NotificationSettings: undefined;
  DeviceSettings: undefined;
  PrivacySettings: undefined;
  About: undefined;
};

export type ModalStackParamList = {
  ImageViewer: { imageUrl: string };
  DatePicker: { selectedDate: string; onSelect: (date: string) => void };
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<OnboardingStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type DashboardScreenProps<T extends keyof DashboardStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<DashboardStackParamList, T>,
  MainTabScreenProps<'DashboardTab'>
>;

export type HealthScreenProps<T extends keyof HealthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HealthStackParamList, T>,
  MainTabScreenProps<'HealthTab'>
>;

export type TrackingScreenProps<T extends keyof TrackingStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<TrackingStackParamList, T>,
  MainTabScreenProps<'TrackingTab'>
>;

export type AlertsScreenProps<T extends keyof AlertsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AlertsStackParamList, T>,
  MainTabScreenProps<'AlertsTab'>
>;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, T>,
  MainTabScreenProps<'SettingsTab'>
>;

// Navigation prop types for useNavigation hook
export type NavigationProp<T extends keyof RootStackParamList> = 
  RootStackScreenProps<T>['navigation'];

// Declare global navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}