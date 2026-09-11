import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketplaceStore } from '../../store/marketplaceStore';
import { getProducts, fetchOnlineProducts } from '../../services/api/products';
import { getPetStores } from '../../services/api/stores';
import { gpsService } from '../../services/gps/service';
import { spacing, borderRadius, colors } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { Product, ProductCategory, PetStore } from '../../store/marketplaceStore';
import { FEATURED_PRODUCT_IDS, SEED_PRODUCTS } from '../../data/products';
import { formatCurrency } from '../../utils/formatCurrency';

const CATEGORIES: { label: string; value: ProductCategory | null }[] = [
  { label: 'All', value: null },
  { label: 'Food', value: 'food' },
  { label: 'Toys', value: 'toys' },
  { label: 'Health', value: 'health' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Grooming', value: 'grooming' },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProductCard: React.FC<{ product: Product; onPress: () => void; onAddToCart: () => void }> = ({
  product,
  onPress,
  onAddToCart,
}) => (
  <Pressable style={pcStyles.container} onPress={onPress}>
    {product.imageUrl ? (
      <Image source={{ uri: product.imageUrl }} style={pcStyles.image} resizeMode="cover" />
    ) : (
      <View style={pcStyles.imageFallback}>
        <Ionicons name="image-outline" size={32} color={colors.text.tertiary} />
      </View>
    )}
    <View style={pcStyles.info}>
      <Text style={pcStyles.name} numberOfLines={1}>{product.name}</Text>
      <View style={pcStyles.rating}>
        <Ionicons name="star" size={12} color={colors.primary.dark} />
        <Text style={pcStyles.ratingText}>{product.rating} ({product.reviewCount})</Text>
      </View>
      <Text style={pcStyles.price}>{formatCurrency(product.price)}</Text>
    </View>
    <Pressable style={pcStyles.addBtn} onPress={onAddToCart}>
      <Ionicons name="add" size={20} color={colors.white} />
    </Pressable>
  </Pressable>
);

const pcStyles = StyleSheet.create({
  container: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { height: 120, width: '100%' },
  imageFallback: {
    height: 120,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { padding: spacing.sm, flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs },
  rating: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  ratingText: { fontSize: 11, color: colors.text.tertiary, marginLeft: 2 },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary.dark },
  addBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.pill,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const StoreCard: React.FC<{ store: PetStore; onPress: () => void }> = ({ store, onPress }) => (
  <Pressable style={scStyles.container} onPress={onPress}>
    <View style={scStyles.icon}>
      <Ionicons name="storefront-outline" size={22} color={colors.primary.DEFAULT} />
    </View>
    <View style={scStyles.info}>
      <Text style={scStyles.name} numberOfLines={1}>{store.name}</Text>
      <Text style={scStyles.address} numberOfLines={1}>{store.address}</Text>
      {store.distance !== undefined && (
        <Text style={scStyles.distance}>{store.distance.toFixed(1)} km away</Text>
      )}
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
  </Pressable>
);

const scStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  address: { fontSize: 12, color: colors.text.secondary, marginBottom: 2 },
  distance: { fontSize: 11, color: colors.primary.dark, fontWeight: '500' },
});

const MarketplaceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const {
    cart,
    selectedCategory,
    searchQuery,
    products,
    stores,
    setProducts,
    setStores,
    setCategory,
    setSearchQuery,
    addToCart,
    getCartItemCount,
  } = useMarketplaceStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingOnline, setLoadingOnline] = useState(false);

  const loadData = useCallback(async () => {
    setProducts(getProducts());

    const [onlineProducts, fetchedStores] = await Promise.all([
      fetchOnlineProducts(),
      (async () => {
        const loc = await gpsService.getCurrentLocation();
        const lat = loc?.latitude ?? 37.7749;
        const lng = loc?.longitude ?? -122.4194;
        return getPetStores(lat, lng);
      })(),
    ]);

    if (onlineProducts.length > 0) {
      setProducts(onlineProducts);
    }
    setStores(fetchedStores);
  }, [setProducts, setStores]);

  useEffect(() => {
    setLoadingOnline(true);
    loadData().finally(() => setLoadingOnline(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const allProducts = useMarketplaceStore((s) => s.products);

  const filteredProducts = selectedCategory
    ? allProducts.filter((p) => p.category === selectedCategory)
    : searchQuery
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allProducts;

  const featuredProducts = allProducts.filter((p) => FEATURED_PRODUCT_IDS.includes(p.id)).slice(0, 3);
  const cartCount = getCartItemCount();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Pressable onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={24} color={colors.text.primary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>

        {loadingOnline && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Loading products online...</Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => {
              const isActive = cat.value === selectedCategory;
              return (
                <Pressable
                  key={cat.label}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  onAddToCart={() => addToCart(product)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {stores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pet Stores Near You</Text>
              <Pressable onPress={() => navigation.navigate('StoreDetail', { storeId: 'all' })}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stores.slice(0, 5).map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onPress={() => navigation.navigate('StoreDetail', { storeId: store.id })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? CATEGORIES.find((c) => c.value === selectedCategory)?.label : 'All Products'}
            </Text>
          </View>
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                onAddToCart={() => addToCart(product)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary },
  cartButton: { position: 'relative', padding: spacing.xs },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
  body: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 15, color: colors.text.primary, padding: 0 },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  loadingText: { fontSize: 12, color: colors.text.tertiary },
  categoriesScroll: { marginBottom: spacing.lg },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.page,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  categoryPillActive: { backgroundColor: colors.primary.DEFAULT, borderColor: colors.primary.DEFAULT },
  categoryPillText: { fontSize: 13, fontWeight: '500', color: colors.text.secondary },
  categoryPillTextActive: { color: colors.white },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.page },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text.primary },
  viewAll: { fontSize: 13, fontWeight: '500', color: colors.primary.DEFAULT },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});

export default MarketplaceScreen;