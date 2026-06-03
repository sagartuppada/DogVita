/**
 * App.tsx - Main application entry point
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { Loader } from './components/common';
import { colors } from './theme';
import { notificationsService } from './services/notifications';
import { authService } from './services/auth';

export const App: React.FC = () => {
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
      <View style={styles.loadingContainer}>
        <Loader fullScreen message="Loading..." />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default App;