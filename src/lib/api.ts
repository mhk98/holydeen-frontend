const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Server-side Node.js fetch needs absolute URL; browser uses relative (goes through Next.js rewrites)
export const BASE =
  typeof window === "undefined" ? `${API_URL}/api/v1` : "/api/v1";

export const IMAGES = "/images";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiFetch<T>(
  path: string,
  { params, signal: externalSignal, ...init }: FetchOptions = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  let urlStr = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    if (qs) urlStr += `?${qs}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) abort();
    else externalSignal.addEventListener("abort", abort, { once: true });
  }

  try {
    const res = await fetch(urlStr, {
      headers: { "Content-Type": "application/json", ...init.headers },
      signal: controller.signal,
      ...init,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "API error");
    return json;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abort);
  }
}
