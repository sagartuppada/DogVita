/**
 * RootNavigator - Root navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store';
import { RootStackParamList, OnboardingStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import AddPhoneNumberScreen from '../screens/onboarding/AddPhoneNumberScreen';
import OTPVerificationScreen from '../screens/onboarding/OTPVerificationScreen';
import SetupDogProfileScreen from '../screens/onboarding/SetupDogProfileScreen';
import PairDeviceScreen from '../screens/onboarding/PairDeviceScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator = () => (
  <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
    <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
    <OnboardingStack.Screen name="AddPhone" component={AddPhoneNumberScreen} />
    <OnboardingStack.Screen name="OTP" component={OTPVerificationScreen} />
    <OnboardingStack.Screen name="SetupDog" component={SetupDogProfileScreen} />
    <OnboardingStack.Screen name="PairDevice" component={PairDeviceScreen} />
  </OnboardingStack.Navigator>
);

export const RootNavigator: React.FC = () => {
  const hasCompletedOnboarding = useSettingsStore((state) => state.hasCompletedOnboarding);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
