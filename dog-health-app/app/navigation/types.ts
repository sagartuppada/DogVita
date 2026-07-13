/**
 * Navigation types
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type OnboardingStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Login: undefined;
  AddPhone: undefined;
  OTP: { phoneNumber: string };
  SetupDog: undefined;
  PairDevice: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Health: undefined;
  Tracking: undefined;
  AIOverview: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: undefined;
  Settings: undefined;
  RouteHistory: undefined;
  RouteDetail: { routeId: string };
  GeofenceManager: undefined;
  DogProfile: { dogId: string };
  WeightHistory: { dogId: string };
  VaccinationRecords: { dogId: string };
  SymptomChecker: undefined;
  DietFeeding: undefined;
  Chat: undefined;
  AddPet: undefined;
  PrivacyPolicy: undefined;
};

// Screen props types
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type DashboardScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type HealthTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type TrackingTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type AIOverviewTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type RouteHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'RouteHistory'>;
export type RouteDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'RouteDetail'>;
export type GeofenceManagerScreenProps = NativeStackScreenProps<RootStackParamList, 'GeofenceManager'>;
export type DogProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'DogProfile'>;
export type WeightHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'WeightHistory'>;
export type VaccinationRecordsScreenProps = NativeStackScreenProps<RootStackParamList, 'VaccinationRecords'>;
export type SymptomCheckerScreenProps = NativeStackScreenProps<RootStackParamList, 'SymptomChecker'>;
export type DietFeedingScreenProps = NativeStackScreenProps<RootStackParamList, 'DietFeeding'>;
export type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;
export type AddPetScreenProps = NativeStackScreenProps<RootStackParamList, 'AddPet'>;
export type PrivacyPolicyScreenProps = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
