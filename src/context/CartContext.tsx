"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Product } from "@/data/products";
import { fetchProductById } from "@/services/productService";

export interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
  freeShipping?: boolean;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (
    product: Product,
    qty?: number,
    size?: string,
    color?: string,
  ) => void;
  removeFromCart: (index: number) => void;
  updateQty: (index: number, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQty: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

const CART_KEY = "kafela_cart";

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadCart());
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback(
    (product: Product, qty = 1, size?: string, color?: string) => {
      setItems((prev) => {
        // match by id + size + color
        const idx = prev.findIndex(
          (i) => i.id === product.id && i.size === size && i.color === color,
        );
        if (idx !== -1) {
          return prev.map((item, i) =>
            i === idx ? { ...item, qty: item.qty + qty } : item,
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            image: product.image,
            price: product.discountedPrice,
            qty,
            size,
            color,
            freeShipping: Boolean(product.freeShipping),
          },
        ];
      });
    },
    [],
  );

  useEffect(() => {
    const missingShippingFlag = items.filter(
      (item) => item.freeShipping === undefined,
    );
    if (missingShippingFlag.length === 0) return;

    let active = true;
    Promise.all(
      [...new Set(missingShippingFlag.map((item) => item.id))].map((id) =>
        fetchProductById(id).then(
          (product) => [id, Boolean(product?.freeShipping)] as const,
        ),
      ),
    )
      .then((entries) => {
        if (!active) return;
        const flags = new Map(entries);
        setItems((prev) =>
          prev.map((item) =>
            item.freeShipping === undefined
              ? { ...item, freeShipping: flags.get(item.id) || false }
              : item,
          ),
        );
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [items]);

  const removeFromCart = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQty = useCallback((index: number, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty } : item)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.setItem(CART_KEY, JSON.stringify([]));
  }, []);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
