import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketplaceStore } from '../../store/marketplaceStore';
import { spacing, borderRadius, colors } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { CartItem } from '../../store/marketplaceStore';
import { formatCurrency } from '../../utils/formatCurrency';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CartItemRow: React.FC<{
  item: CartItem;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}> = ({ item, onUpdateQuantity, onRemove }) => (
  <View style={itemStyles.row}>
    {item.product.imageUrl ? (
      <Image source={{ uri: item.product.imageUrl }} style={itemStyles.image} resizeMode="cover" />
    ) : (
      <View style={itemStyles.imageFallback}>
        <Ionicons name="image-outline" size={24} color={colors.text.tertiary} />
      </View>
    )}
    <View style={itemStyles.info}>
      <Text style={itemStyles.name} numberOfLines={1}>{item.product.name}</Text>
      <Text style={itemStyles.price}>{formatCurrency(item.product.price)}</Text>
    </View>
    <View style={itemStyles.stepper}>
      <Pressable style={itemStyles.stepperBtn} onPress={() => onUpdateQuantity(item.quantity - 1)}>
        <Ionicons name="remove" size={14} color={colors.primary.DEFAULT} />
      </Pressable>
      <Text style={itemStyles.stepperValue}>{item.quantity}</Text>
      <Pressable style={itemStyles.stepperBtn} onPress={() => onUpdateQuantity(item.quantity + 1)}>
        <Ionicons name="add" size={14} color={colors.primary.DEFAULT} />
      </Pressable>
    </View>
    <Pressable onPress={onRemove} style={itemStyles.removeBtn}>
      <Ionicons name="trash-outline" size={18} color={colors.status.error} />
    </Pressable>
  </View>
);

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  imageFallback: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  price: { fontSize: 14, fontWeight: '600', color: colors.primary.dark },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  stepperBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepperValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: { padding: spacing.xs },
});

const CartScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useMarketplaceStore();
  const total = getCartTotal();
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (cart.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.navTitle}>Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={72} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Browse products and add items to get started</Text>
          <Pressable style={styles.browseBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.navTitle}>Cart ({itemCount})</Text>
        <Pressable onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(c) => c.product.id}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onUpdateQuantity={(qty) => updateQuantity(item.product.id, qty)}
            onRemove={() => removeFromCart(item.product.id)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(total)}</Text>
        </View>
        <Pressable
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout', { cartTotal: total })}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
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
  clearText: { fontSize: 14, color: colors.status.error },
  list: { padding: spacing.page, paddingBottom: spacing.xl },
  footer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.page,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryLabel: { fontSize: 15, color: colors.text.secondary },
  summaryTotal: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
  checkoutBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  checkoutBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
  emptyContainer: { flex: 1, backgroundColor: colors.background.primary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.page },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptySubtitle: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl },
  browseBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  browseBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
});

export default CartScreen;