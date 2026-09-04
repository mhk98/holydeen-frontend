// ─── Types ───────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  image: string;
  gallery?: string[];
  features?: string[];
  sku?: string | null;
  freeShipping?: boolean;
  hasVariants?: boolean;
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  inStock?: boolean;
  category?: string | null;
  subCategory?: string | null;
  childCategory?: string | null;
}

export interface ProductVariant {
  colorId?: number | null;
  colorName?: string | null;
  attribute?: string | null;
  oldPrice?: number | string | null;
  newPrice?: number | string | null;
  stock?: number | string | null;
  availability?: string | null;
}

export interface NavItem {
  label: string;
  sub: NavSubItem[];
}

export interface NavSubItem {
  Id?: number;
  label: string;
  childItems?: NavChildItem[];
}

export interface NavChildItem {
  Id?: number;
  label: string;
}
