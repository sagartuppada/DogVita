/**
 * RootNavigator - Root navigation with auth guard
 */

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store';
import { useDogStore } from '../store/dogStore';
import { supabase } from '../services/api/supabase';
import { RootStackParamList, OnboardingStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import SignUpScreen from '../screens/onboarding/SignUpScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';
import AddPhoneNumberScreen from '../screens/onboarding/AddPhoneNumberScreen';
import OTPVerificationScreen from '../screens/onboarding/OTPVerificationScreen';
import SetupDogProfileScreen from '../screens/onboarding/SetupDogProfileScreen';
import PairDeviceScreen from '../screens/onboarding/PairDeviceScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import RouteHistoryScreen from '../screens/tracking/RouteHistoryScreen';
import RouteDetailScreen from '../screens/tracking/RouteDetailScreen';
import GeofenceManagerScreen from '../screens/tracking/GeofenceManagerScreen';
import DogProfileScreen from '../screens/dog/DogProfileScreen';
import WeightHistoryScreen from '../screens/dog/WeightHistoryScreen';
import VaccinationRecordsScreen from '../screens/dog/VaccinationRecordsScreen';
import SymptomCheckerScreen from '../screens/ai/SymptomCheckerScreen';
import DietFeedingScreen from '../screens/ai/DietFeedingScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator = () => (
  <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
    <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
    <OnboardingStack.Screen name="SignUp" component={SignUpScreen} />
    <OnboardingStack.Screen name="Login" component={LoginScreen} />
    <OnboardingStack.Screen name="AddPhone" component={AddPhoneNumberScreen} />
    <OnboardingStack.Screen name="OTP" component={OTPVerificationScreen} />
    <OnboardingStack.Screen name="SetupDog" component={SetupDogProfileScreen} />
    <OnboardingStack.Screen name="PairDevice" component={PairDeviceScreen} />
  </OnboardingStack.Navigator>
);

export const RootNavigator: React.FC = () => {
  const hasCompletedOnboarding = useSettingsStore((state) => state.hasCompletedOnboarding);
  const fetchDogs = useDogStore((s) => s.fetchDogs);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setHasSession(!!session);
      setAuthChecked(true);
      if (session) {
        await fetchDogs();
        const dogs = useDogStore.getState().dogs;
        if (dogs.length > 0 && !useSettingsStore.getState().hasCompletedOnboarding) {
          useSettingsStore.getState().setOnboardingComplete();
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setHasSession(!!session);
      if (session) {
        await fetchDogs();
        const dogs = useDogStore.getState().dogs;
        if (dogs.length > 0 && !useSettingsStore.getState().hasCompletedOnboarding) {
          useSettingsStore.getState().setOnboardingComplete();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const showOnboarding = !hasCompletedOnboarding;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!showOnboarding ? (
          <>
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen name="Settings" component={SettingsScreen} />
            <RootStack.Screen name="RouteHistory" component={RouteHistoryScreen} />
            <RootStack.Screen name="RouteDetail" component={RouteDetailScreen} />
            <RootStack.Screen name="GeofenceManager" component={GeofenceManagerScreen} />
            <RootStack.Screen name="DogProfile" component={DogProfileScreen} />
            <RootStack.Screen name="WeightHistory" component={WeightHistoryScreen} />
            <RootStack.Screen name="VaccinationRecords" component={VaccinationRecordsScreen} />
            <RootStack.Screen name="SymptomChecker" component={SymptomCheckerScreen} />
            <RootStack.Screen name="DietFeeding" component={DietFeedingScreen} />
          </>
        ) : (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
