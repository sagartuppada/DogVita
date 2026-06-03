/**
 * PairDeviceScreen - BLE device pairing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button, Card, StatusBadge, Loader } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { OnboardingStackParamList } from '../../navigation/types';
import { useBLE } from '../../hooks';
import { useSettingsStore } from '../../store';
import { BLEDevice } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PairDevice'>;

export const PairDeviceScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedDevice, setSelectedDevice] = useState<BLEDevice | null>(null);
  const { isScanning, devices, isConnected, connectionStatus, connectedDeviceName, startScan, stopScan, connect } = useBLE();
  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  const handleConnect = async () => {
    if (!selectedDevice) return;
    const success = await connect(selectedDevice.id);
    if (success) {
      Alert.alert('Success', 'Device connected successfully', [
        {
          text: 'Continue',
          onPress: () => {
            setOnboardingComplete();
          },
        },
      ]);
    } else {
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  const renderDeviceItem = ({ item }: { item: BLEDevice }) => (
    <Card
      style={[styles.deviceCard, selectedDevice?.id === item.id && styles.selectedCard]}
      onPress={() => setSelectedDevice(item)}
    >
      <View style={styles.deviceRow}>
        <View style={styles.deviceInfo}>
          <Ionicons name="bluetooth" size={24} color={colors.ble.connected} />
          <View style={styles.deviceDetails}>
            <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
            <Text style={styles.deviceId}>ID: {item.id}</Text>
          </View>
        </View>
        <StatusBadge
          label={item.rssi > -50 ? 'Strong' : item.rssi > -70 ? 'Good' : 'Weak'}
          variant={item.rssi > -50 ? 'success' : item.rssi > -70 ? 'info' : 'warning'}
          size="sm"
          dot
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pair your device</Text>
        <Text style={styles.subtitle}>Make sure your ESP32-S3 collar is turned on</Text>
      </View>

      {isScanning ? (
        <View style={styles.scanningContainer}>
          <Loader size="large" message="Scanning for devices..." />
        </View>
      ) : (
        <>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={renderDeviceItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="bluetooth-outline" size={64} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No devices found</Text>
                <Text style={styles.emptySubtext}>Tap scan to search again</Text>
              </View>
            }
          />
          <View style={styles.footer}>
            <Button
              title={isScanning ? 'Scanning...' : 'Scan for Devices'}
              onPress={startScan}
              variant={isScanning ? 'outline' : 'primary'}
              style={styles.scanButton}
            />
            <Button
              title="Connect"
              onPress={handleConnect}
              disabled={!selectedDevice || connectionStatus === 'connecting'}
              loading={connectionStatus === 'connecting'}
              style={styles.connectButton}
            />
            <Button
              title="Skip for now"
              onPress={() => {
                setOnboardingComplete();
              }}
              variant="ghost"
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.page,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.styles.headlineMedium,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.styles.bodyLarge,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.page,
    gap: spacing.md,
  },
  deviceCard: {
    marginBottom: spacing.sm,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deviceDetails: {
    gap: spacing.xxs,
  },
  deviceName: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
  },
  deviceId: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.styles.titleMedium,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.styles.bodyMedium,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.page,
    gap: spacing.sm,
  },
  scanButton: {
    marginBottom: spacing.xs,
  },
  connectButton: {
    marginBottom: spacing.xs,
  },
});

export default PairDeviceScreen;