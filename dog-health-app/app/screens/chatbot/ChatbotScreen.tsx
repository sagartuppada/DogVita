/**
 * ChatbotScreen - Coming soon placeholder
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';

const ChatbotScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.text.tertiary} />
      <Text style={[styles.title, { color: colors.text.primary }]}>AI Health Assistant</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Coming Soon</Text>
      <Text style={[styles.description, { color: colors.text.tertiary }]}>
        Get personalized health insights and answers about your dog's wellbeing.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});

export default ChatbotScreen;
