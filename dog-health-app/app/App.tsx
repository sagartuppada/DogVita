/**
 * App.tsx - Main application entry point
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import { RootNavigator } from './navigation/RootNavigator';
import { Loader } from './components/common';
import { lightColors } from './theme/colors';
import { notificationsService } from './services/notifications';
import { authService } from './services/auth';
import { useLLMLifecycle } from './hooks/useLLMLifecycle';
import { isBundledModel, extractBundledModel, AVAILABLE_MODELS } from './services/ai/modelManager';

const AppContent: React.FC = () => {
  const colors = lightColors;
  const [isInitializing, setIsInitializing] = useState(true);
  useLLMLifecycle();

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([
          notificationsService.requestPermissions().catch(() => false),
          authService.getCurrentUser().catch(() => null),
        ]);
      } catch (error) {
        // Initialization failed — proceed anyway
      } finally {
        setIsInitializing(false);
        SplashScreen.hide();
      }
    };

    initialize();

    // Fire-and-forget: extract the primary bundled GGUF model to document dir
    // in the background so it's ready when the user opens the chat screen.
    isBundledModel('llama-3.2-1b').then((bundled) => {
      if (bundled) {
        extractBundledModel('llama-3.2-1b').catch(() => {});
      }
    });

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
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background.primary}
        />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
