/**
 * SettingsScreen - App settings
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useSettingsStore } from '../../store/settingsStore';
import { authService } from '../../services/auth/service';
import { Card } from '../../components/common';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import type { SettingsScreenProps } from '../../navigation/types';

const SettingRow: React.FC<{
  icon: string;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}> = ({ icon, iconColor, label, value, onPress, showChevron = true }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.6}
    style={styles.settingRow}
  >
    <View style={[styles.settingIcon, { backgroundColor: iconColor + '18' }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.settingLabel}>{label}</Text>
    {value && <Text style={styles.settingValue}>{value}</Text>}
    {showChevron && (
      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const activeDog = useDogStore((s) => s.dogs.find((d) => d.id === s.activeDogId));
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Settings',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: colors.background.primary },
      headerShadowVisible: false,
    });
  }, [navigation, colors]);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await authService.signOut();
          },
        },
      ]
    );
  };

  const handleDogProfile = () => {
    if (activeDog) {
      navigation.navigate('DogProfile', { dogId: activeDog.id });
    } else {
      Alert.alert('No Dog', 'Please add a dog profile first.');
    }
  };

  const handleDeviceSettings = () => {
    navigation.getParent()?.navigate('Main', { screen: 'Tracking' });
  };

  const handleLocationSettings = () => {
    navigation.getParent()?.navigate('GeofenceManager');
  };

  const handleWeight = () => {
    if (activeDog) {
      navigation.navigate('WeightHistory', { dogId: activeDog.id });
    } else {
      Alert.alert('No Dog', 'Please add a dog profile first.');
    }
  };

  const handleVaccinations = () => {
    if (activeDog) {
      navigation.navigate('VaccinationRecords', { dogId: activeDog.id });
    } else {
      Alert.alert('No Dog', 'Please add a dog profile first.');
    }
  };

  const handleAccount = () => {
    Alert.alert('Account', 'Account settings coming in a future update.');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'For support, contact us at support@dogvita.app');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Dog Profile */}
        <Card variant="default" padding="none" style={styles.section}>
          <SettingRow
            icon="paw"
            iconColor={colors.primary.DEFAULT}
            label="Dog Profile"
            value={activeDog?.name ?? 'Add dog'}
            onPress={handleDogProfile}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="watch"
            iconColor={colors.status.info}
            label="Device"
            value="Connected"
            onPress={handleDeviceSettings}
          />
        </Card>

        {/* Preferences */}
        <Card variant="default" padding="none" style={styles.section}>
          <SettingRow
            icon="location"
            iconColor={colors.status.success}
            label="Location & Geofences"
            onPress={handleLocationSettings}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="moon"
            iconColor={colors.health.sleep}
            label="Appearance"
            value={theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
            onPress={() => {
              Alert.alert(
                'Appearance',
                'Choose your theme',
                [
                  { text: 'Light', onPress: () => setTheme('light') },
                  { text: 'Dark', onPress: () => setTheme('dark') },
                  { text: 'System', onPress: () => setTheme('system') },
                  { text: 'Cancel', style: 'cancel' },
                ],
                { cancelable: true }
              );
            }}
          />
        </Card>

        {/* Health Records */}
        <Card variant="default" padding="none" style={styles.section}>
          <SettingRow
            icon="fitness"
            iconColor={colors.primary.DEFAULT}
            label="Weight"
            onPress={handleWeight}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="medical"
            iconColor={colors.status.success}
            label="Vaccinations"
            onPress={handleVaccinations}
          />
        </Card>

        {/* Account */}
        <Card variant="default" padding="none" style={styles.section}>
          <SettingRow
            icon="person"
            iconColor={colors.text.secondary}
            label="Account"
            onPress={handleAccount}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="help-circle"
            iconColor={colors.status.info}
            label="Help & Support"
            onPress={handleHelp}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="information-circle"
            iconColor={colors.text.tertiary}
            label="About"
            value="v1.0.0"
            onPress={() => Alert.alert('About', 'DogVita v1.0.0\nSmart health monitoring for your best friend')}
          />
        </Card>

        {/* Logout */}
        <Card variant="default" padding="none" style={styles.section}>
          <SettingRow
            icon="log-out"
            iconColor={colors.status.error}
            label="Log Out"
            showChevron={false}
            onPress={handleLogout}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
  },
  backButton: {
    paddingRight: spacing.md,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.styles.headingXL,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    flex: 1,
  },
  settingValue: {
    ...typography.styles.bodySM,
    color: colors.text.tertiary,
    marginRight: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.xl + 32 + spacing.md,
  },
});
