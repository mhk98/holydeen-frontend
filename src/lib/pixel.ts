declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
    _fbq: unknown;
    ttq?: {
      track?: (...args: unknown[]) => void;
      page?: () => void;
      instance?: (pixelCode: string) => { track?: (...args: unknown[]) => void };
    };
    gtag?: (...args: unknown[]) => void;
    dataLayer: unknown[];
    __googleAdsConfigs?: { conversionId: string; conversionLabel?: string | null }[];
  }
}

import { BASE } from "@/lib/api";

export interface PixelUserData {
  customerId?: number | string;
  externalId?: string;
  deviceId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  fbp?: string;
  fbc?: string;
  [key: string]: unknown;
}

export interface PixelProductItem {
  id: string | number;
  quantity?: number;
  item_price?: number;
  name?: string;
}

export interface PixelProductData {
  content_ids: (string | number)[];
  content_name: string;
  content_type: string;
  value: number;
  currency: string;
  num_items?: number;
  order_id?: string | number;
  contents?: PixelProductItem[];
}

// Meta standard events — everything else goes through trackCustom
const STANDARD_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "Contact",
  "CompleteRegistration",
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

function eventId(eventName: string, orderId?: string | number) {
  // Order-based id lets Meta/TikTok dedupe repeated Purchase hits for the same order
  if (orderId !== undefined && orderId !== "") return `${eventName}.${orderId}`;
  return `${eventName}.${Date.now()}.${Math.random().toString(16).slice(2)}`;
}

function setCookie(name: string, value: string, days = 90) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[]\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : "";
}

function setStorage(key: string, val: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, val);
    sessionStorage.setItem(key, val);
  } catch {}
}

function getStorage(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function param(name: string): string {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get(name) || "";
  } catch {
    return "";
  }
}

function normalizeBangladeshPhone(value?: string): string {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "").replace(/^00/, "");
  if (!digits) return "";
  if (digits.startsWith("8801") && digits.length === 13) return digits;
  if (digits.startsWith("01") && digits.length === 11) return `88${digits}`;
  if (digits.startsWith("1") && digits.length === 10) return `880${digits}`;
  return digits;
}

function parseName(fullName?: string): { firstName?: string; lastName?: string } {
  if (!fullName) return {};
  const parts = fullName.trim().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  if (!parts.length) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function getOrInitFbc(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const fbclid = param("fbclid");
  const cookieFbc = getCookie("_fbc");
  const storedFbc = getStorage("_fbc");

  if (fbclid) {
    setStorage("fbclid", fbclid);
    if (cookieFbc && cookieFbc.endsWith(`.${fbclid}`)) {
      setStorage("_fbc", cookieFbc);
      return cookieFbc;
    }
    if (storedFbc && storedFbc.endsWith(`.${fbclid}`)) {
      setCookie("_fbc", storedFbc);
      return storedFbc;
    }
    const newFbc = `fb.1.${Date.now()}.${fbclid}`;
    setCookie("_fbc", newFbc);
    setStorage("_fbc", newFbc);
    return newFbc;
  }

  if (cookieFbc && /^fb\.1\.\d+\..+$/.test(cookieFbc)) {
    setStorage("_fbc", cookieFbc);
    return cookieFbc;
  }

  if (storedFbc && /^fb\.1\.\d+\..+$/.test(storedFbc)) {
    setCookie("_fbc", storedFbc);
    return storedFbc;
  }

  const storedFbclid = getStorage("fbclid");
  if (storedFbclid) {
    const recoveredFbc = `fb.1.${Date.now()}.${storedFbclid}`;
    setCookie("_fbc", recoveredFbc);
    setStorage("_fbc", recoveredFbc);
    return recoveredFbc;
  }

  return undefined;
}

export function getOrInitFbp(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const cookieFbp = getCookie("_fbp");
  if (cookieFbp && /^fb\.1\.\d+\.\d+$/.test(cookieFbp)) {
    setStorage("_fbp", cookieFbp);
    return cookieFbp;
  }

  const storedFbp = getStorage("_fbp");
  if (storedFbp && /^fb\.1\.\d+\.\d+$/.test(storedFbp)) {
    setCookie("_fbp", storedFbp);
    return storedFbp;
  }

  // Generate first-party valid Meta browser ID so fbp is never empty
  const random = Math.floor(1000000000 + Math.random() * 9000000000);
  const newFbp = `fb.1.${Date.now()}.${random}`;
  setCookie("_fbp", newFbp);
  setStorage("_fbp", newFbp);
  return newFbp;
}

// Persist ad click params immediately on load
if (typeof window !== "undefined") {
  getOrInitFbc();
  getOrInitFbp();

  const ttclid = param("ttclid");
  if (ttclid) setStorage("ttclid", ttclid);

  const gclid = param("gclid");
  if (gclid) setStorage("gclid", gclid);

  const gbraid = param("gbraid");
  if (gbraid) setStorage("gbraid", gbraid);

  const wbraid = param("wbraid");
  if (wbraid) setStorage("wbraid", wbraid);
}

export function getPixelClickData() {
  return {
    fbp: getOrInitFbp(),
    fbc: getOrInitFbc(),
    ttp: getCookie("_ttp") || getStorage("_ttp") || undefined,
    ttclid: param("ttclid") || getStorage("ttclid") || undefined,
    gclid: param("gclid") || getStorage("gclid") || undefined,
    gbraid: param("gbraid") || getStorage("gbraid") || undefined,
    wbraid: param("wbraid") || getStorage("wbraid") || undefined,
  };
}

let pixelsReady = false;
const pendingBrowserEvents: (() => void)[] = [];

function runWhenPixelsReady(send: () => void) {
  if (pixelsReady) send();
  else pendingBrowserEvents.push(send);
}

export function markPixelsReady() {
  pixelsReady = true;
  pendingBrowserEvents.splice(0).forEach((send) => send());
}

function currentUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function sendServerEvent(
  eventName: string,
  id: string,
  data: Partial<PixelProductData>,
  userData?: PixelUserData,
) {
  const clickData = getPixelClickData();
  const payloadUserData = {
    ...clickData,
    ...userData,
    country: userData?.country || "bd",
  };

  fetch(`${BASE}/tracking/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId: id,
      eventSourceUrl: currentUrl(),
      referrerUrl: typeof document === "undefined" ? undefined : document.referrer || undefined,
      customData: {
        ...data,
        contents:
          data.contents ||
          (data.content_ids && data.content_ids.length > 0
            ? data.content_ids.map((cid) => ({
                id: String(cid),
                quantity: data.num_items || 1,
                item_price: data.value ? Number(data.value) : 0,
              }))
            : undefined),
      },
      userData: payloadUserData,
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

  const id = eventId(eventName, eventName === "Purchase" ? data.order_id : undefined);
  const payload: Record<string, unknown> = { ...data };
  if (userData?.customerId) payload.customer_id = userData.customerId;

  runWhenPixelsReady(() => sendBrowserEvent(eventName, id, data, payload, userData));
  sendServerEvent(eventName, id, data, userData);
}

function sendBrowserEvent(
  eventName: string,
  id: string,
  data: PixelProductData,
  payload: Record<string, unknown>,
  userData?: PixelUserData,
) {
  if (typeof window.fbq === "function") {
    // Advanced matching in browser
    if (userData?.phone || userData?.name) {
      const { firstName, lastName } = parseName(userData.name);
      const phone = normalizeBangladeshPhone(userData.phone);
      const city = userData.city || (userData.district === "inside" ? "Dhaka" : userData.district);

      window.fbq("setUserProperties", undefined, {
        ph: phone || undefined,
        fn: firstName || undefined,
        ln: lastName || undefined,
        ct: city || undefined,
        country: "bd",
        external_id: userData.customerId ? String(userData.customerId) : undefined,
      });
    }

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
        ...(data.order_id !== undefined ? { transaction_id: String(data.order_id) } : {}),
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
      .forEach((googleConfig) =>
        window.gtag?.("event", "conversion", {
          send_to: `${googleConfig.conversionId}/${googleConfig.conversionLabel}`,
          value: data.value,
          currency: data.currency,
          transaction_id: String(data.order_id ?? id),
        })
      );
  }
}

export function trackPageView() {
  if (typeof window === "undefined") return;

  const id = eventId("PageView");
  const pageLocation = currentUrl();

  runWhenPixelsReady(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView", {}, { eventID: id });
    }

    window.ttq?.page?.();

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_location: pageLocation,
        page_referrer: document.referrer || undefined,
      });
    }
  });

  sendServerEvent("PageView", id, {});
}