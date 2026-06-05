/**
 * App.tsx - Main application entry point
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import { RootNavigator } from './navigation/RootNavigator';
import { Loader } from './components/common';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { notificationsService } from './services/notifications';
import { authService } from './services/auth';

const AppContent: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([
          notificationsService.requestPermissions(),
          authService.getCurrentUser(),
        ]);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
        SplashScreen.hide();
      }
    };

    initialize();

    const unsubscribeNotification = notificationsService.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    const unsubscribeResponse = notificationsService.addNotificationResponseListener((response) => {
      console.log('Notification response:', response);
    });

    return () => {
      unsubscribeNotification.remove();
      unsubscribeResponse.remove();
    };
  }, []);

  if (isInitializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <Loader fullScreen text="Loading..." />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background.primary}
        />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EAD3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;