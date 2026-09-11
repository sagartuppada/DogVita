import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Linking, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketplaceStore } from '../../store/marketplaceStore';
import { getProductById, fetchOnlineProducts } from '../../services/api/products';
import { spacing, borderRadius, colors } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { Product } from '../../store/marketplaceStore';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QuantityStepper: React.FC<{ value: number; onChange: (n: number) => void }> = ({ value, onChange }) => (
  <View style={qsStyles.container}>
    <Pressable style={qsStyles.btn} onPress={() => onChange(Math.max(1, value - 1))}>
      <Ionicons name="remove" size={18} color={colors.primary.DEFAULT} />
    </Pressable>
    <Text style={qsStyles.value}>{value}</Text>
    <Pressable style={qsStyles.btn} onPress={() => onChange(Math.min(10, value + 1))}>
      <Ionicons name="add" size={18} color={colors.primary.DEFAULT} />
    </Pressable>
  </View>
);

const qsStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md },
  value: { fontSize: 16, fontWeight: '600', color: colors.text.primary, minWidth: 40, textAlign: 'center' },
});

const ProductDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;

  const { addToCart } = useMarketplaceStore();
  const [product, setProduct] = useState<Product | undefined>(getProductById(productId));
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) return;
    fetchOnlineProducts().then((online) => {
      const found = online.find((p) => p.id === productId);
      if (found) setProduct(found);
    });
  }, [productId, product]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product);
    navigation.goBack();
  };

  const handleExternalBuy = () => {
    if (product?.affiliateUrl) {
      Linking.openURL(product.affiliateUrl).catch(() => Alert.alert('Error', 'Could not open link'));
    }
  };

  if (!product) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.navTitle}>Product Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.notFound}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.navTitle}>Product Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={64} color={colors.text.tertiary} />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons
                  key={n}
                  name={n <= Math.round(product.rating) ? 'star' : 'star-outline'}
                  size={16}
                  color={colors.primary.dark}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{product.rating} ({product.reviewCount} reviews)</Text>
          </View>

          <Text style={styles.price}>${(product.price / 100).toFixed(2)}</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </View>

          <Pressable style={styles.addToCartBtn} onPress={handleAddToCart}>
            <Ionicons name="cart" size={20} color={colors.white} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </Pressable>

          {product.affiliateUrl && (
            <Pressable style={styles.externalBuyBtn} onPress={handleExternalBuy}>
              <Ionicons name="open-outline" size={20} color={colors.primary.DEFAULT} />
              <Text style={styles.externalBuyText}>Buy on Amazon</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
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
  image: { height: 280, width: '100%' },
  imageFallback: {
    height: 280,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.page },
  name: { fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  stars: { flexDirection: 'row', marginRight: spacing.sm },
  ratingText: { fontSize: 13, color: colors.text.secondary },
  price: { fontSize: 26, fontWeight: '700', color: colors.primary.dark, marginBottom: spacing.lg },
  description: { fontSize: 15, lineHeight: 22, color: colors.text.secondary, marginBottom: spacing.xl },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  quantityLabel: { fontSize: 16, fontWeight: '500', color: colors.text.primary },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addToCartText: { fontSize: 16, fontWeight: '600', color: colors.white },
  externalBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    gap: spacing.sm,
  },
  externalBuyText: { fontSize: 16, fontWeight: '600', color: colors.primary.DEFAULT },
  notFound: { fontSize: 16, color: colors.text.secondary, textAlign: 'center', marginTop: 100 },
});

export default ProductDetailScreen;