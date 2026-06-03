/**
 * SettingsScreen - App settings
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { useSettingsStore } from '../../store';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, title, subtitle, rightElement, onPress }) => (
  <TouchableOpacity onPress={onPress} disabled={!onPress}>
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />)}
    </View>
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const notifications = useSettingsStore((s) => s.notifications);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const autoSync = useSettingsStore((s) => s.autoSync);
  const isBLEEnabled = useSettingsStore((s) => s.isBLEEnabled);
  const isLocationEnabled = useSettingsStore((s) => s.isLocationEnabled);
  const setNotifications = useSettingsStore((s) => s.setNotifications);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const setAutoSync = useSettingsStore((s) => s.setAutoSync);
  const setBLEEnabled = useSettingsStore((s) => s.setBLEEnabled);
  const setLocationEnabled = useSettingsStore((s) => s.setLocationEnabled);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionHeader}>DEVICE</Text>
        <Card style={styles.section}>
          <SettingItem
            icon="bluetooth"
            iconColor={colors.ble.connected}
            title="Bluetooth"
            subtitle={isBLEEnabled ? 'Enabled' : 'Disabled'}
            rightElement={<Switch value={isBLEEnabled} onValueChange={setBLEEnabled} trackColor={{ true: colors.primary[600] }} />}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="location"
            iconColor={colors.health.gps}
            title="Location"
            subtitle={isLocationEnabled ? 'Enabled' : 'Disabled'}
            rightElement={<Switch value={isLocationEnabled} onValueChange={setLocationEnabled} trackColor={{ true: colors.primary[600] }} />}
          />
        </Card>

        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <Card style={styles.section}>
          <SettingItem
            icon="notifications"
            iconColor={colors.status.warning}
            title="Push Notifications"
            subtitle="Receive alerts and updates"
            rightElement={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: colors.primary[600] }} />}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="sync"
            iconColor={colors.secondary[600]}
            title="Auto Sync"
            subtitle="Sync data automatically"
            rightElement={<Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ true: colors.primary[600] }} />}
          />
        </Card>

        <Text style={styles.sectionHeader}>APPEARANCE</Text>
        <Card style={styles.section}>
          <SettingItem
            icon="moon"
            iconColor={colors.accent[600]}
            title="Dark Mode"
            subtitle="Use dark theme"
            rightElement={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: colors.primary[600] }} />}
          />
        </Card>

        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <Card style={styles.section}>
          <SettingItem icon="person" iconColor={colors.primary[600]} title="Account" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="help-circle" iconColor={colors.status.info} title="Help & Support" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="document-text" iconColor={colors.neutral[600]} title="Privacy Policy" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="information-circle" iconColor={colors.neutral[600]} title="About" subtitle="Version 1.0.0" onPress={() => {}} />
        </Card>

        <TouchableOpacity style={styles.signOutButton}>
          <Ionicons name="log-out" size={20} color={colors.status.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    padding: spacing.page,
  },
  title: {
    ...typography.styles.displaySmall,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.styles.overline,
    color: colors.text.tertiary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  section: {
    padding: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...typography.styles.bodyLarge,
    color: colors.text.primary,
  },
  settingSubtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginLeft: 52,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  signOutText: {
    ...typography.styles.bodyLarge,
    color: colors.status.error,
    fontWeight: '600',
  },
});

export default SettingsScreen;