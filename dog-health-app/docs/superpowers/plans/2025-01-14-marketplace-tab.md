# Marketplace Tab — Implementation Plan

**Date:** 2025-01-14
**Status:** Draft
**Spec:** `docs/superpowers/specs/2025-01-14-marketplace-tab-design.md`

---

## Overview

Add a **Marketplace** tab to the DogVita app — between Dashboard and Health — providing a curated product catalog, full e-commerce (cart + Stripe checkout), and local pet store discovery (map + list).

---

## Task Breakdown

### 1. Navigation Types + Tab Navigator
**Files:**
- `app/navigation/types.ts` — add 6 routes to `RootStackParamList`; add `Marketplace` tab to `MainTabParamList`
- `app/navigation/MainTabNavigator.tsx` — insert Marketplace tab at index 1 (after Dashboard), icon `storefront-outline`
- `app/navigation/RootNavigator.tsx` — register 6 marketplace stack screens

**Routes to add to `RootStackParamList`:**
- `Marketplace`
- `ProductDetail` — `{ productId: string }`
- `Cart`
- `Checkout` — `{ cartTotal: number }`
- `StoreDetail` — `{ storeId: string }`
- `OrderConfirmation` — `{ orderId: string }`

**Changes to `MainTabParamList`:**
```ts
Marketplace: undefined;  // between Dashboard and Health
```

**TABS array insert at index 1:**
```ts
{ name: 'Marketplace', icon: 'storefront-outline', label: 'Marketplace' }
```

**Stack screens to register in `RootNavigator`:**
```ts
<Stack.Screen name="Marketplace" component={MarketplaceScreen} />
<Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
<Stack.Screen name="Cart" component={CartScreen} />
<Stack.Screen name="Checkout" component={CheckoutScreen} />
<Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
<Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
```

---

### 2. Marketplace Store (Zustand)
**File:** `app/store/marketplaceStore.ts` — NEW

**State shape:**
```ts
interface MarketplaceState {
  products: Product[];
  stores: PetStore[];
  cart: CartItem[];
  selectedCategory: string | null;  // null = all
  searchQuery: string;
  // actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
}
```

**Product type:**
```ts
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;  // in cents
  imageUrl: string;
  category: 'food' | 'toys' | 'health' | 'accessories' | 'grooming';
  affiliateUrl?: string;  // external buy link
  rating: number;
  reviewCount: number;
}
```

**CartItem type:**
```ts
interface CartItem {
  product: Product;
  quantity: number;
}
```

**PetStore type:**
```ts
interface PetStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  distance?: number;  // km, calculated client-side
  hours?: string;
}
```

**Persistence:** `cart` array only — persisted to AsyncStorage via Zustand persist middleware. Products and stores are fetched fresh each time.

---

### 3. Seed Data
**File:** `app/data/products.ts` — NEW

12 hardcoded products across 5 categories:
- **food:** "Premium Kibble Blend", "Senior Dog Formula", "Puppy Growth Mix"
- **toys:** "Interactive Chew Toy", "Squeaky Ball Set"
- **health:** "Joint Health Supplement", "Calming CBD Oil"
- **accessories:** "Reflective Collar", "Travel Carrier"
- **grooming:** "De-shedding Brush", "Gentle Shampoo"

---

### 4. API Services
**File:** `app/services/api/products.ts` — NEW
- `getProducts()` — returns hardcoded products (future: Supabase)
- `getProductsByCategory(category)` — filter by category
- `searchProducts(query)` — filter by name/description

**File:** `app/services/api/stores.ts` — NEW
- `getPetStores(lat, lng)` — fetch from Supabase `pet_stores` table, calculate distances, return sorted by distance
- Schema: `id, name, address, latitude, longitude, phone, hours`

---

### 5. Payments Service
**File:** `app/services/payments/stripe.ts` — NEW
- `createPaymentIntent(amount)` — calls backend Stripe endpoint, returns `clientSecret`
- `formatCurrency(cents)` — converts cents to display string

---

### 6. MarketplaceScreen
**File:** `app/screens/marketplace/MarketplaceScreen.tsx` — NEW

**Layout (top to bottom):**
1. Header — "Marketplace" title
2. SearchBar — text input, filters `searchQuery` in store
3. CategoryPills — horizontal scroll, 5 category buttons + "All"
4. FeaturedSection — horizontal ScrollView of 3 featured products (hardcoded featured IDs)
5. LocalStoresSection — "Pet Stores Near You" + "View All" link to StoreDetail
6. AllProductsSection — vertical FlatList of all products, filtered by category + search

**Interactions:**
- Tap category pill → `setCategory`
- Tap product card → `navigation.navigate('ProductDetail', { productId })`
- Tap store card → `navigation.navigate('StoreDetail', { storeId })`
- Tap "View All" → `navigation.navigate('StoreDetail', { storeId: 'all' })`
- Add to cart button on each product card → `addToCart`

**Styling:** Use `spacing`, `borderRadius`, `colors` from theme. No hardcoded hex values.

---

### 7. ProductDetailScreen
**File:** `app/screens/marketplace/ProductDetailScreen.tsx` — NEW

**Layout:**
1. Back button + "Product Details" title
2. Product image (placeholder or icon)
3. Name, price, rating + review count
4. Description text
5. Quantity selector (1-10 stepper)
6. "Add to Cart" button — calls `addToCart` + `navigation.goBack()`
7. "Buy on Amazon" button (if `affiliateUrl`) — opens external browser

**Quantity selector:** simple `−` / `+` with count between. Min 1, max 10.

---

### 8. CartScreen
**File:** `app/screens/marketplace/CartScreen.tsx` — NEW

**Layout:**
1. Header — "Cart" + item count
2. FlatList of CartItem cards — product image (icon), name, price, quantity stepper, remove button (trash icon)
3. OrderSummary — subtotal, "Proceed to Checkout" button
4. Empty state — icon + "Your cart is empty" + "Browse Products" button

**Interactions:**
- `updateQuantity` / `removeFromCart` on stepper/trash tap
- "Proceed to Checkout" → `navigation.navigate('Checkout', { cartTotal: subtotal })`

**Math:** All prices in cents, display formatted as `$XX.XX`.

---

### 9. CheckoutScreen
**File:** `app/screens/marketplace/CheckoutScreen.tsx` — NEW

**Layout:**
1. Header — "Checkout"
2. Order Summary — list of cart items + subtotal
3. Stripe CardField (card number, expiry, CVC)
4. "Pay $XX.XX" button — calls `createPaymentIntent`, handles Stripe confirmation
5. On success → `navigation.replace('OrderConfirmation', { orderId: 'ORD-' + timestamp })`
6. On error → alert with message

**Stripe integration:** Use `@stripe/stripe-react-native` with a `CardField` component and `confirmPayment` call against the returned `clientSecret`.

---

### 10. OrderConfirmationScreen
**File:** `app/screens/marketplace/OrderConfirmationScreen.tsx` — NEW

**Layout:**
1. Large checkmark icon (Ionicons `checkmark-circle`)
2. "Order Confirmed!" heading
3. Order ID display
4. "Thank you for your purchase" message
5. "Continue Shopping" button → pops to `Marketplace`
6. "Back to Home" button → pops to root

---

### 11. StoreDetailScreen
**File:** `app/screens/marketplace/StoreDetailScreen.tsx` — NEW

**Layout:**
1. Header — store name
2. Store icon (placeholder)
3. Address + "Get Directions" button → opens Google Maps
4. Phone (if available) + "Call" button
5. Hours (if available)
6. Distance (if available, from GPS service)

**"Get Directions":** ` Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng)`
**"Call":** ` Linking.openURL('tel:' + phone)`

---

## File Manifest

**New files:**
```
app/data/products.ts
app/store/marketplaceStore.ts
app/services/api/products.ts
app/services/api/stores.ts
app/services/payments/stripe.ts
app/screens/marketplace/MarketplaceScreen.tsx
app/screens/marketplace/ProductDetailScreen.tsx
app/screens/marketplace/CartScreen.tsx
app/screens/marketplace/CheckoutScreen.tsx
app/screens/marketplace/StoreDetailScreen.tsx
app/screens/marketplace/OrderConfirmationScreen.tsx
```

**Modified files:**
```
app/navigation/types.ts
app/navigation/MainTabNavigator.tsx
app/navigation/RootNavigator.tsx
```

---

## Verification

After each task:
```bash
npm run typecheck  # tsc --noEmit
```

Final build:
```bash
npm run lint
```

Build copy to `C:\R\dog-health-app` before APK build.

---

## Dependencies

- `@stripe/stripe-react-native` — Stripe payments
- `@react-native-async-storage/async-storage` — Zustand persist
- `react-native-vector-icons/Ionicons` — existing, used throughout

No new native modules or complex dependencies.