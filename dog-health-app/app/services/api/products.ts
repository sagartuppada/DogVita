import { SEED_PRODUCTS } from '../../data/products';
import type { Product, ProductCategory } from '../../store/marketplaceStore';

const DUMMY_JSON_URL = 'https://dummyjson.com/products?limit=20&select=id,title,description,price,thumbnail,category,rating';

const CATEGORY_MAP: Record<string, ProductCategory> = {
  beauty: 'health',
  'skin-care': 'health',
  groceries: 'food',
  'kitchen-accessories': 'accessories',
  'mobile-accessories': 'accessories',
  'sports-accessories': 'accessories',
  sunglasses: 'accessories',
  'womens-bags': 'accessories',
  'womens-jewellery': 'accessories',
  'womens-watches': 'accessories',
  'mens-watches': 'accessories',
  furniture: 'toys',
  'home-decoration': 'toys',
  laptops: 'accessories',
  smartphones: 'accessories',
  tablets: 'accessories',
  'mens-shirts': 'accessories',
  'mens-shoes': 'accessories',
  fragrances: 'grooming',
  'womens-shoes': 'accessories',
  'womens-dresses': 'accessories',
  tops: 'accessories',
  motorcycle: 'accessories',
  'vehicle-accessories': 'accessories',
};

interface DummyJSONProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
}

const mapDummyJSON = (p: DummyJSONProduct): Product => ({
  id: `online_${p.id}`,
  name: p.title,
  description: p.description,
  price: Math.round(p.price * 100),
  imageUrl: p.thumbnail,
  category: CATEGORY_MAP[p.category] ?? 'accessories',
  rating: p.rating,
  reviewCount: Math.floor(Math.random() * 500) + 10,
});

export const getProducts = (): Product[] => SEED_PRODUCTS;

export const fetchOnlineProducts = async (): Promise<Product[]> => {
  try {
    const res = await fetch(DUMMY_JSON_URL);
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    return data.products.map(mapDummyJSON);
  } catch {
    return [];
  }
};

export const getProductsByCategory = (category: ProductCategory): Product[] =>
  SEED_PRODUCTS.filter((p) => p.category === category);

export const searchProducts = (query: string): Product[] => {
  const lower = query.toLowerCase();
  return SEED_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  );
};

export const getProductById = (id: string): Product | undefined =>
  SEED_PRODUCTS.find((p) => p.id === id);