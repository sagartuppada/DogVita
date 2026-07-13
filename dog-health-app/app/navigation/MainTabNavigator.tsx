/**
 * MainTabNavigator - Floating rounded elevated bottom tab bar
 */

import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform, View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { spacing, borderRadius, shadows, colors } from '../theme';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import HealthOverviewScreen from '../screens/health/HealthOverviewScreen';
import TrackingOverviewScreen from '../screens/tracking/TrackingOverviewScreen';
import AIOverviewScreen from '../screens/ai/AIOverviewScreen';

import type { MainTabParamList } from './types';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TABS: { route: keyof MainTabParamList; icon: string; iconOutline: string; label: string }[] = [
  { route: 'Dashboard', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
  { route: 'Health', icon: 'heart', iconOutline: 'heart-outline', label: 'Health' },
  { route: 'Tracking', icon: 'map', iconOutline: 'map-outline', label: 'Tracking' },
  { route: 'AIOverview', icon: 'sparkles', iconOutline: 'sparkles-outline', label: 'AI' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.tabBarOuter]}>
      <View style={[styles.tabBarPill, { bottom: insets.bottom + spacing.lg }]}>
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          const iconName = isFocused ? tab.icon : tab.iconOutline;
          const color = isFocused ? colors.primary.DEFAULT : colors.text.tertiary;

          const onPress = useCallback(() => {
            if (!isFocused) {
              navigation.navigate(tab.route);
            }
          }, [isFocused, navigation, tab.route]);

          return (
            <Pressable key={tab.route} style={styles.tabItem} onPress={onPress}>
              <Ionicons name={iconName} size={22} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Health" component={HealthOverviewScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Tracking" component={TrackingOverviewScreen} options={{ headerShown: false }} />
      <Tab.Screen name="AIOverview" component={AIOverviewScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBarPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    height: 62,
    paddingHorizontal: spacing.lg,
    ...shadows.tabBar,
    ...Platform.select({
      ios: {},
      android: { elevation: 8 },
    }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default MainTabNavigator;
