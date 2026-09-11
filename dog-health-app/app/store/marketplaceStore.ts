import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductCategory = 'food' | 'toys' | 'health' | 'accessories' | 'grooming';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  affiliateUrl?: string;
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PetStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: string;
  distance?: number;
}

interface MarketplaceState {
  products: Product[];
  stores: PetStore[];
  cart: CartItem[];
  selectedCategory: ProductCategory | null;
  searchQuery: string;
}

interface MarketplaceActions {
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCategory: (category: ProductCategory | null) => void;
  setSearchQuery: (query: string) => void;
  setProducts: (products: Product[]) => void;
  setStores: (stores: PetStore[]) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

type MarketplaceStore = MarketplaceState & MarketplaceActions;

const initialState: MarketplaceState = {
  products: [],
  stores: [],
  cart: [],
  selectedCategory: null,
  searchQuery: '',
};

export const useMarketplaceStore = create<MarketplaceStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addToCart: (product) =>
        set((state) => {
          const existing = state.cart.find((c) => c.product.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.product.id === product.id
                  ? { ...c, quantity: Math.min(c.quantity + 1, 10) }
                  : c
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity: 1 }] };
        }),

      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((c) => c.product.id !== productId) })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart
            .map((c) =>
              c.product.id === productId ? { ...c, quantity: Math.max(1, Math.min(quantity, 10)) } : c
            )
            .filter((c) => c.quantity > 0),
        })),

      clearCart: () => set({ cart: [] }),

      setCategory: (category) => set({ selectedCategory: category }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setProducts: (products) => set({ products }),

      setStores: (stores) => set({ stores }),

      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },

      getCartItemCount: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'marketplace-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);