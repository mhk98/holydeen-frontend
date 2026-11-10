import { apiFetch } from "@/lib/api";
import { ApiResponse, ApiOrder, CreateOrderPayload } from "@/types/api";

export interface AddonOfferVariant {
  id: number;
  options: Record<string, string>;
  label: string;
  stock: number;
  /** Normal selling price, shown struck through next to the offer price. */
  regularPrice?: number;
}

export interface AddonOffer {
  categoryId: number;
  price: number;
  qualifyingProductIds: number[];
  product: {
    id: number;
    name: string;
    file: string | null;
    variants: AddonOfferVariant[];
  };
}

const ADDON_OFFER_ATTEMPTS = 3;

// Checkout treats a failed lookup as "no offer", so one brief server error must not hide it.
export async function fetchAddonOffers(productIds: string): Promise<AddonOffer[]> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await apiFetch<ApiResponse<AddonOffer[]>>("/menu/addon-offers", {
        params: { productIds },
      });
      return res.data || [];
    } catch (err) {
      if (attempt >= ADDON_OFFER_ATTEMPTS) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

export async function saveIncompleteOrder(
  payload: CreateOrderPayload,
  signal?: AbortSignal,
): Promise<ApiOrder> {
  const res = await apiFetch<ApiResponse<ApiOrder>>("/orders/incomplete", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
  return res.data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<ApiOrder> {
  // Safe to retry: the backend returns the already-created order for a repeated checkoutKey.
  const res = await apiFetch<ApiResponse<ApiOrder>>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    retries: payload.checkoutKey ? 2 : 0,
  });
  return res.data;
}

export async function sendReconfirmOtp(
  orderId: number | string,
  phone: string,
): Promise<{ alreadyConfirmed?: boolean; maskedPhone?: string; expiresAt?: string }> {
  const res = await apiFetch<ApiResponse<{ alreadyConfirmed?: boolean; maskedPhone?: string; expiresAt?: string }>>(
    `/orders/${encodeURIComponent(String(orderId))}/reconfirm/send-otp`,
    {
      method: "POST",
      body: JSON.stringify({ phone }),
    },
  );
  return res.data;
}

export async function verifyReconfirmOtp(
  orderId: number | string,
  phone: string,
  otp: string,
): Promise<ApiOrder> {
  const res = await apiFetch<ApiResponse<ApiOrder>>(
    `/orders/${encodeURIComponent(String(orderId))}/reconfirm/verify`,
    {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    },
  );
  return res.data;
}
