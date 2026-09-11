import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, colors } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type OrderConfirmationRouteProp = RouteProp<RootStackParamList, 'OrderConfirmation'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OrderConfirmationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderConfirmationRouteProp>();
  const { orderId } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.status.success} />
        </View>

        <Text style={styles.heading}>Order Confirmed!</Text>
        <Text style={styles.subheading}>Thank you for your purchase</Text>

        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderId}>{orderId}</Text>
        </View>

        <Text style={styles.message}>
          Your order has been placed successfully. You will receive a confirmation email shortly.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable style={styles.primaryBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.primaryBtnText}>Continue Shopping</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.page },
  iconContainer: { marginBottom: spacing.xl },
  heading: { fontSize: 26, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },
  subheading: { fontSize: 16, color: colors.text.secondary, marginBottom: spacing.xxl },
  orderIdContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  orderIdLabel: { fontSize: 12, color: colors.text.tertiary, marginBottom: spacing.xs },
  orderId: { fontSize: 16, fontWeight: '700', color: colors.text.primary, letterSpacing: 1 },
  message: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: { padding: spacing.page, gap: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
  secondaryBtn: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.DEFAULT,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
});

export default OrderConfirmationScreen;