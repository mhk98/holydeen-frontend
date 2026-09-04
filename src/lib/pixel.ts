declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; };
    _fbq: unknown;
    ttq?: { track?: (...args: unknown[]) => void; page?: () => void; instance?: (pixelCode: string) => { track?: (...args: unknown[]) => void } };
    gtag?: (...args: unknown[]) => void;
    dataLayer: unknown[];
    __googleAdsConfigs?: { conversionId: string; conversionLabel?: string | null }[];
  }
}

import { BASE } from "@/lib/api";

export interface PixelUserData {
  customerId?: number;
  name?: string;
  phone?: string;
  email?: string;
}

export interface PixelProductData {
  content_ids: (string | number)[];
  content_name: string;
  content_type: string;
  value: number;
  currency: string;
  num_items?: number;
}

// Meta standard events — everything else goes through trackCustom
const STANDARD_EVENTS = new Set([
  "PageView", "ViewContent", "Search", "AddToCart", "AddToWishlist",
  "InitiateCheckout", "AddPaymentInfo", "Purchase", "Lead", "Contact", "CompleteRegistration",
]);

const TIKTOK_EVENT_NAMES: Record<string, string> = {
  PageView: "Pageview",
  ViewContent: "ViewContent",
  Search: "Search",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  AddPaymentInfo: "AddPaymentInfo",
  Lead: "SubmitForm",
  Contact: "Contact",
  Purchase: "CompletePayment",
};

const GOOGLE_EVENT_NAMES: Record<string, string> = {
  ViewContent: "view_item",
  Search: "search",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  AddPaymentInfo: "add_payment_info",
  Lead: "generate_lead",
  Contact: "contact",
  Purchase: "purchase",
};

function eventId(eventName: string) {
  return `${eventName}.${Date.now()}.${Math.random().toString(16).slice(2)}`;
}

function cookie(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1] || "";
}

function param(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

export function getPixelClickData() {
  const fbclid = param("fbclid");
  return {
    fbp: cookie("_fbp") || undefined,
    fbc: cookie("_fbc") || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined),
    ttp: cookie("_ttp") || undefined,
    ttclid: param("ttclid") || undefined,
    gclid: param("gclid") || undefined,
    gbraid: param("gbraid") || undefined,
    wbraid: param("wbraid") || undefined,
  };
}

function currentUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function sendServerEvent(
  eventName: string,
  id: string,
  data: PixelProductData,
  userData?: PixelUserData,
) {
  fetch(`${BASE}/tracking/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId: id,
      eventSourceUrl: currentUrl(),
      referrerUrl: typeof document === "undefined" ? undefined : document.referrer || undefined,
      customData: data,
      userData: {
        ...userData,
        ...getPixelClickData(),
      },
    }),
    keepalive: true,
  }).catch(() => {});
}

export function trackPixelEvent(
  eventName: string,
  data: PixelProductData,
  userData?: PixelUserData
) {
  if (typeof window === "undefined") return;

  const id = eventId(eventName);
  const payload: Record<string, unknown> = { ...data };

  if (userData) {
    if (userData.customerId) payload.customer_id = userData.customerId;
    if (userData.name)       payload.customer_name = userData.name;
    if (userData.phone)      payload.customer_phone = userData.phone;
  }

  if (typeof window.fbq === "function") {
    const method = STANDARD_EVENTS.has(eventName) ? "track" : "trackCustom";
    window.fbq(method, eventName, payload, { eventID: id });
  }

  window.ttq?.track?.(TIKTOK_EVENT_NAMES[eventName] || eventName, { ...payload, event_id: id });

  if (typeof window.gtag === "function") {
    const googleEventName = GOOGLE_EVENT_NAMES[eventName];
    if (googleEventName) {
      window.gtag("event", googleEventName, {
        value: data.value,
        currency: data.currency,
        items: data.content_ids.map((item) => ({
          item_id: String(item),
          item_name: data.content_name,
          quantity: data.num_items || 1,
        })),
      });
    }
  }

  if (typeof window.gtag === "function" && eventName === "Purchase") {
    window.__googleAdsConfigs
      ?.filter((item) => item.conversionId && item.conversionLabel)
      .forEach((googleConfig) => window.gtag?.("event", "conversion", {
      send_to: `${googleConfig.conversionId}/${googleConfig.conversionLabel}`,
      value: data.value,
      currency: data.currency,
      transaction_id: id,
      }));
  }

  sendServerEvent(eventName, id, data, userData);
}
