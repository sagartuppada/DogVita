import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketplaceStore } from '../../store/marketplaceStore';
import { spacing, borderRadius, colors } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { formatCurrency } from '../../utils/formatCurrency';

type CheckoutRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CheckoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CheckoutRouteProp>();
  const { cartTotal } = route.params;

  const { cart, getCartItemCount, clearCart } = useMarketplaceStore();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const itemCount = getCartItemCount();

  const handlePay = async () => {
    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim()) {
      Alert.alert('Missing Info', 'Please fill in all card details.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const orderId = `ORD-${Date.now()}`;
      clearCart();
      navigation.replace('OrderConfirmation', { orderId });
    } catch {
      Alert.alert('Payment Failed', 'Please check your card details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.navTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.product.name} x{item.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  {formatCurrency(item.product.price * item.quantity)}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.totalLabel}>Total ({itemCount} items)</Text>
              <Text style={styles.totalPrice}>{formatCurrency(cartTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.cardForm}>
            <View style={styles.cardField}>
              <Text style={styles.cardFieldLabel}>Card Number</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
                maxLength={19}
                value={cardNumber}
                onChangeText={setCardNumber}
              />
            </View>
            <View style={styles.cardRow}>
              <View style={[styles.cardField, { flex: 1 }]}>
                <Text style={styles.cardFieldLabel}>Expiry</Text>
                <TextInput
                  style={styles.cardInput}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  maxLength={5}
                  value={expiry}
                  onChangeText={setExpiry}
                />
              </View>
              <View style={[styles.cardField, { flex: 1 }]}>
                <Text style={styles.cardFieldLabel}>CVC</Text>
                <TextInput
                  style={styles.cardInput}
                  placeholder="123"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={cvc}
                  onChangeText={setCvc}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={loading}
        >
          <Ionicons name="lock-closed" size={18} color={colors.white} />
          <Text style={styles.payBtnText}>
            {loading ? 'Processing...' : `Pay ${formatCurrency(cartTotal)}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text.primary },
  body: { flex: 1 },
  section: { padding: spacing.page },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.md },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryItemName: { fontSize: 14, color: colors.text.secondary, flex: 1, marginRight: spacing.md },
  summaryItemPrice: { fontSize: 14, color: colors.text.primary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border.light, marginVertical: spacing.sm },
  totalLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  totalPrice: { fontSize: 18, fontWeight: '700', color: colors.primary.dark },
  cardForm: { gap: spacing.md },
  cardField: { marginBottom: spacing.md },
  cardFieldLabel: { fontSize: 13, color: colors.text.secondary, marginBottom: spacing.xs, fontWeight: '500' },
  cardInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  footer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.page,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
});

export default CheckoutScreen;