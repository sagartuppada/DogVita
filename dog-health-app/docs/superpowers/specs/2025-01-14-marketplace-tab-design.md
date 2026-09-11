# Marketplace Tab Design Spec

**Date:** 2025-01-14
**Status:** Approved
**Author:** Ponytail (auto-generated from brainstorming session)

## Overview

Add a Marketplace tab to the DogVita app between Home and Health. The marketplace combines three features: a curated pet product catalog, in-app e-commerce with full cart and Stripe checkout, and a local pet stores directory with map + list views.

## Goals

- Allow users to browse and purchase pet products (food, toys, accessories, health items)
- Provide full e-commerce flow: cart, checkout, payment vault, order confirmation
- Help users find nearby pet stores with map and list views
- Monetize via affiliate links and direct product sales

## Architecture

Single `MarketplaceScreen` with horizontal scrollable sections. Cart accessible via header icon with badge count. Separate detail screens for products, stores, cart, and order confirmation.

### Screen hierarchy

```
MainTabNavigator
├── Dashboard (tab)
├── Marketplace (tab) ← NEW
│   ├── MarketplaceScreen (tab content)
│   ├── ProductDetailScreen (stack push)
│   ├── CartScreen (stack push)
│   ├── StoreDetailScreen (stack push)
│   └── OrderConfirmationScreen (stack push)
├── Health (tab)
├── Tracking (tab)
└── AI (tab)
```

### Tab bar

- Add `Marketplace` tab between `Dashboard` and `Health`
- Icon: `storefront` / `storefront-outline` (Ionicons)
- Tab order: Home → Marketplace → Health → Tracking → AI
- 5 tabs total — pill width accommodates this

## Data Model

### Product

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;          // in cents
  currency: string;       // 'USD'
  imageUrl: string;
  category: 'food' | 'toys' | 'health' | 'accessories' | 'grooming';
  affiliateUrl?: string;  // external buy link (Amazon, Chewy)
  inStock: boolean;
  rating: number;         // 1-5
  reviewCount: number;
}
```

### PetStore

```typescript
interface PetStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  hours: string;          // e.g. "Mon-Sat 9am-8pm"
  isOpen: boolean;        // computed from hours
  distanceMeters?: number; // computed from user location
  website?: string;
}
```

### CartItem

```typescript
interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  addedAt: string;
}
```

### Zustand Store (`marketplaceStore`)

```typescript
interface MarketplaceStore {
  products: Product[];
  stores: PetStore[];
  cart: CartItem[];
  selectedCategory: string;
  searchQuery: string;
  isLoading: boolean;

  // Actions
  loadProducts: () => Promise<void>;
  loadStores: (userLat: number, userLng: number) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}
```

Persisted to AsyncStorage via Zustand persist middleware (same pattern as other stores).

## MarketplaceScreen Layout

```
┌─────────────────────────────────┐
│ [Search bar]        [Cart icon 1]│
├─────────────────────────────────┤
│ Categories horizontal scroll     │
│ [All] [Food] [Toys] [Health]    │
│ [Accessories] [Grooming]         │
├─────────────────────────────────┤
│ Featured Products                │
│ ┌────────┐ ┌────────┐ ┌────────┐│
│ │ image  │ │ image  │ │ image  ││
│ │ name   │ │ name   │ │ name   ││
│ │$price  │ │$price  │ │$price  ││
│ │★ 4.5   │ │★ 4.2   │ │★ 4.8   ││
│ └────────┘ └────────┘ └────────┘│
├─────────────────────────────────┤
│ Nearby Pet Stores                │
│ ┌─────────────────────────────┐ │
│ │  [Map with store pins]      │ │
│ └─────────────────────────────┘ │
│ 📍 Happy Paws · 0.5mi · Open   │
│ 📍 PetWorld · 1.2mi · Closed   │
├─────────────────────────────────┤
│ All Products (2-column grid)     │
│ ┌────────┐ ┌────────┐           │
│ │ image  │ │ image  │           │
│ │ name   │ │ name   │           │
│ │$price  │ │$price  │           │
│ │[+ Cart]│ │[+ Cart]│           │
│ └────────┘ └────────┘           │
└─────────────────────────────────┘
```

### Search bar
- Text input with search icon
- Filters products by name (client-side filter)

### Category chips
- Horizontal scrollable row
- Filters product list by category
- "All" selected by default

### Featured Products
- Horizontal `FlatList` of product cards
- Shows first 6 products sorted by rating
- Tap → `ProductDetailScreen`

### Nearby Stores
- Small map preview (fixed height ~150px)
- Store pins on map
- Below map: list of store cards sorted by distance
- Tap card → `StoreDetailScreen`

### All Products
- 2-column `FlatList` grid
- Filtered by selected category + search query
- Each card: image, name, price, "Add to Cart" button

## ProductDetailScreen

- Large product image (full width, ~300px height)
- Product name (large text)
- Price (primary color, large)
- Rating stars + review count
- Description text
- Quantity selector: [-] [1] [+]
- "Add to Cart" button (primary orange, full width)
- "Buy on [Retailer]" button (secondary, only if `affiliateUrl` exists)

## CartScreen

- Header with "Cart" title and item count
- List of cart items:
  - Product image thumbnail
  - Product name
  - Price
  - Quantity selector [-] [qty] [+]
  - Remove button (trash icon)
- Divider
- Subtotal, estimated tax (8%), total
- "Proceed to Checkout" button (primary, full width)
- Empty state: "Your cart is empty" with "Browse Products" button

## Checkout Flow

1. User taps "Proceed to Checkout"
2. `CheckoutScreen` shows order summary + saved payment methods
3. If no saved payment method: collect card details via Stripe CardField
4. User confirms → call Supabase Edge Function `create-payment-intent`
5. Edge Function creates Stripe PaymentIntent, returns client secret
6. Confirm payment via `stripe.confirmPayment()`
7. On success → `OrderConfirmationScreen`
8. Save payment method to Stripe Customer for vault

### Stripe Integration

- Package: `@stripe/stripe-react-native`
- Publishable key from env: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Server-side: Supabase Edge Function `create-payment-intent`
- Customer vault: Stripe Customers API (save PaymentMethod ID)
- Webhook: Stripe webhook in Supabase for order fulfillment (optional, future)

## StoreDetailScreen

- Store name (large text)
- Address with map preview
- Phone number (tappable → phone dialer)
- Hours of operation
- "Get Directions" button (opens Google Maps / Apple Maps)
- "Call" button
- Website link (if available)

### Location Features

- User location from `react-native-geolocation-service`
- Distance calculated using Haversine formula (`gpsService.calculateDistance()`)
- Stores sorted by distance (nearest first)
- Map uses `react-native-maps` with `Marker` components

## New Files

```
app/
├── screens/marketplace/
│   ├── MarketplaceScreen.tsx
│   ├── ProductDetailScreen.tsx
│   ├── CartScreen.tsx
│   ├── CheckoutScreen.tsx
│   ├── StoreDetailScreen.tsx
│   └── OrderConfirmationScreen.tsx
├── store/marketplaceStore.ts
├── services/api/products.ts
├── services/api/stores.ts
├── services/payments/stripe.ts
└── data/products.ts
```

## Modified Files

- `app/navigation/types.ts` — add `Marketplace`, `ProductDetail`, `Cart`, `Checkout`, `StoreDetail`, `OrderConfirmation` to `MainTabParamList` and `RootStackParamList`
- `app/navigation/MainTabNavigator.tsx` — add Marketplace tab + import
- `app/navigation/RootNavigator.tsx` — add stack screens for detail screens

## Dependencies

| Package | Purpose |
|---------|---------|
| `@stripe/stripe-react-native` | In-app payment processing |
| `react-native-maps` | Map component for store locations |

## Supabase Tables

### products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,  -- cents
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  category TEXT NOT NULL,
  affiliate_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### pet_stores

```sql
CREATE TABLE pet_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  hours TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stripe_payment_intent_id TEXT,
  total INTEGER NOT NULL,  -- cents
  status TEXT DEFAULT 'pending',
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Implementation Order

1. Navigation + tab bar change
2. `marketplaceStore` with hardcoded products
3. `MarketplaceScreen` layout with product cards
4. `ProductDetailScreen`
5. `CartScreen` + cart state
6. `CheckoutScreen` + Stripe integration
7. `OrderConfirmationScreen`
8. Local stores: Supabase table + `storesService`
9. Map component + `StoreDetailScreen`
10. Polish: search, category filters, empty states

## Edge Cases

- Empty product list → show "No products available" empty state
- Empty cart → show "Your cart is empty" with browse button
- GPS permission denied → hide map, show list only
- Stripe payment failure → show error alert, stay on checkout
- Product out of stock → disable "Add to Cart" button, show "Out of Stock" badge
- Store hours unknown → don't show open/closed badge
