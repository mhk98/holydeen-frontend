// Backend API response wrapper
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: ApiMeta;
  data: T;
}

export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
}

// Product storefront (from /product/storefront)
export interface ApiProduct {
  Id: number;
  name: string;
  category: string | null;
  categoryId: number | null;
  subCategory: string | null;
  subCategoryId: number | null;
  childCategory?: string | null;
  childCategoryId?: number | null;
  childcategory?: string | null;
  childcategoryId?: number | null;
  sale_price: number;
  original_price: number;
  discount?: number | string;
  quantity: number;
  file: string | null;
  gallery: string[];
  features: string[];
  variants: ApiVariant[] | null;
  sku: string | null;
  freeShipping?: boolean | string | number;
  inStock: boolean;
}

export interface ApiVariant {
  colorId?: number | null;
  colorName?: string | null;
  attribute?: string | null;
  size?: string[];
  color?: string[];
  weight?: number;
  unit?: string;
  oldPrice?: number | string | null;
  newPrice?: number | string | null;
  stock?: number | string | null;
  availability?: string | null;
}

// CustomerOrder
export interface ApiOrderItem {
  id: number;
  name: string;
  image: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
  freeShipping?: boolean;
}

export interface CreateOrderPayload {
  incompleteOrderId?: number;
  deviceId?: string;
  source?: string;
  orderSource?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerDistrict?: string;
  paymentMethod: "bkash" | "nagad" | "rocket" | "cod";
  items: ApiOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount?: number;
  couponCode?: string | null;
  advance?: number;
  total: number;
  tracking?: Record<string, unknown>;
}

export interface ApiAccountInfo {
  created: boolean;
  tempPassword: string | null;
}

export interface ApiOrder {
  Id: number;
  orderId?: string;
  invoiceId?: string;
  accountInfo?: ApiAccountInfo;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  items: ApiOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  advance: number;
  total: number;
  createdAt: string;
}
