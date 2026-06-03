/**
 * MainTabNavigator - Bottom tab navigation
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import {
  MainTabParamList,
  DashboardStackParamList,
  HealthStackParamList,
  TrackingStackParamList,
  AlertsStackParamList,
  SettingsStackParamList,
} from './types';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { HealthOverviewScreen } from '../screens/health/HealthOverviewScreen';
import { TrackingOverviewScreen } from '../screens/tracking/TrackingOverviewScreen';
import { AlertsListScreen } from '../screens/alerts/AlertsListScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const HealthStack = createNativeStackNavigator<HealthStackParamList>();
const TrackingStack = createNativeStackNavigator<TrackingStackParamList>();
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const createStackNavigator = (Screen: React.FC) => {
  return function StackScreen() {
    return <Screen />;
  };
};

const DashboardStackScreen = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="Dashboard" component={DashboardScreen} />
  </DashboardStack.Navigator>
);

const HealthStackScreen = () => (
  <HealthStack.Navigator screenOptions={{ headerShown: false }}>
    <HealthStack.Screen name="HealthOverview" component={HealthOverviewScreen} />
  </HealthStack.Navigator>
);

const TrackingStackScreen = () => (
  <TrackingStack.Navigator screenOptions={{ headerShown: false }}>
    <TrackingStack.Screen name="TrackingOverview" component={TrackingOverviewScreen} />
  </TrackingStack.Navigator>
);

const AlertsStackScreen = () => (
  <AlertsStack.Navigator screenOptions={{ headerShown: false }}>
    <AlertsStack.Screen name="AlertsList" component={AlertsListScreen} />
  </AlertsStack.Navigator>
);

const SettingsStackScreen = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
  </SettingsStack.Navigator>
);

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'HealthTab':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'TrackingTab':
              iconName = focused ? 'location' : 'location-outline';
              break;
            case 'AlertsTab':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'SettingsTab':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.default,
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="HealthTab" component={HealthStackScreen} options={{ tabBarLabel: 'Health' }} />
      <Tab.Screen name="TrackingTab" component={TrackingStackScreen} options={{ tabBarLabel: 'Tracking' }} />
      <Tab.Screen name="AlertsTab" component={AlertsStackScreen} options={{ tabBarLabel: 'Alerts' }} />
      <Tab.Screen name="SettingsTab" component={SettingsStackScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;