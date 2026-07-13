/**
 * MainTabNavigator - Floating rounded elevated bottom tab bar
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows, colors } from '../theme';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import HealthOverviewScreen from '../screens/health/HealthOverviewScreen';
import TrackingOverviewScreen from '../screens/tracking/TrackingOverviewScreen';
import AIOverviewScreen from '../screens/ai/AIOverviewScreen';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { active: string; inactive: string }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Health: { active: 'heart', inactive: 'heart-outline' },
  Tracking: { active: 'map', inactive: 'map-outline' },
  AIOverview: { active: 'sparkles', inactive: 'sparkles-outline' },
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const iconSet = TAB_ICONS[route.name];
          const iconName = focused ? iconSet.active : iconSet.inactive;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          position: 'absolute',
          bottom: spacing.lg,
          alignSelf: 'center',
          width: 280,
          height: 56,
          borderRadius: borderRadius.xl,
          backgroundColor: colors.white,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
          ...shadows.tabBar,
          ...Platform.select({
            ios: {},
            android: { elevation: 8 },
          }),
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen name="Health" component={HealthOverviewScreen} />
      <Tab.Screen name="Tracking" component={TrackingOverviewScreen} />
      <Tab.Screen name="AIOverview" component={AIOverviewScreen} options={{ tabBarLabel: 'AI' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
});

export default MainTabNavigator;
