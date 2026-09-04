import { apiFetch, IMAGES, BASE } from "@/lib/api";
import { ApiProduct, ApiResponse } from "@/types/api";
import { Product } from "@/data/products";

interface StorefrontParams {
  searchTerm?: string;
  limit?: number;
  page?: number;
}

export interface StorefrontResult {
  products: Product[];
  meta: { total: number; page: number; limit: number };
}

export interface ProductReview {
  Id: number;
  productId: number | null;
  productName: string | null;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

function toImgUrl(file: string | null | undefined): string {
  if (!file) return "/placeholder.jpg";
  return file.startsWith("http") ? file : `${IMAGES}/${file}`;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  }
  return false;
}

function uniqueImages(images: string[]): string[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (!image || seen.has(image)) return false;
    seen.add(image);
    return true;
  });
}

function mapToProduct(item: ApiProduct): Product {
  const sizes: string[] = [];
  const colors: string[] = [];
  const variants = Array.isArray(item.variants) ? item.variants : [];
  if (item.variants && Array.isArray(item.variants)) {
    item.variants.forEach((v) => {
      if (v.attribute) sizes.push(v.attribute);
      if (v.colorName) colors.push(v.colorName);
      if (v.size) sizes.push(...(Array.isArray(v.size) ? v.size : [v.size]));
      if (v.color) colors.push(...(Array.isArray(v.color) ? v.color : [v.color]));
    });
  }
  const uniqueSizes = [...new Set(sizes.filter(Boolean))];
  const uniqueColors = [...new Set(colors.filter(Boolean))];
  const originalPrice = Number(item.original_price ?? item.sale_price ?? 0);
  const discountedPrice = Number(item.sale_price ?? item.original_price ?? 0);
  const apiDiscount = Number(item.discount ?? 0);
  const discount =
    apiDiscount > 0
      ? apiDiscount
      : originalPrice > 0 && discountedPrice > 0 && originalPrice > discountedPrice
        ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
        : 0;

  return {
    id: item.Id,
    name: item.name,
    originalPrice,
    discountedPrice,
    discount,
    image: toImgUrl(item.file),
    gallery: uniqueImages((item.gallery || []).map((f) => toImgUrl(f))),
    features: item.features || [],
    sku: item.sku ?? null,
    freeShipping: toBoolean(item.freeShipping),
    hasVariants: uniqueSizes.length > 0 || uniqueColors.length > 0,
    sizes: uniqueSizes.length > 0 ? uniqueSizes : undefined,
    colors: uniqueColors.length > 0 ? uniqueColors : undefined,
    variants,
    inStock: item.inStock,
    category: item.category,
    subCategory: item.subCategory,
    childCategory: item.childCategory ?? item.childcategory ?? null,
  };
}

export async function fetchProductById(id: number): Promise<Product | null> {
  try {
    const res = await fetch(`${BASE}/product/storefront/${id}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) } as RequestInit);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.data) return null;
    return mapToProduct(json.data as ApiProduct);
  } catch {
    return null;
  }
}

export async function fetchStorefrontProducts(
  params: StorefrontParams = {}
): Promise<StorefrontResult> {
  const raw = await fetch(`${BASE}/product/storefront`, { cache: "no-store", signal: AbortSignal.timeout(15_000) } as RequestInit);
  if (!raw.ok) throw new Error("Failed to fetch storefront products");
  const res: ApiResponse<ApiProduct[]> = await raw.json();

  let products = (res.data || []).map(mapToProduct);

  if (params.searchTerm) {
    const q = params.searchTerm.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }

  const total = products.length;
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const start = (page - 1) * limit;
  products = products.slice(start, start + limit);

  return {
    products,
    meta: { total, page, limit },
  };
}

export async function fetchProductReviews(
  product: Pick<Product, "id" | "name">,
): Promise<ProductReview[]> {
  const qs = new URLSearchParams({
    productId: String(product.id),
    productName: product.name,
    limit: "20",
  });

  try {
    const res = await fetch(`${BASE}/review/public?${qs.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    } as RequestInit);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}
