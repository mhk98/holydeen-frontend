// Admin-entered social links often lack a protocol ("wa.me/880...") or are a bare
// phone number, which the browser treats as a relative path and 404s.
export function waUrlFromPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const phone = digits.startsWith("880")
    ? digits
    : digits.startsWith("0")
      ? `88${digits}`
      : digits;
  return `https://wa.me/${phone}`;
}

export function normalizeSocialUrl(value?: string | null, isWhatsapp = false) {
  const url = String(value || "").trim();
  if (!url || url === "#") return "#";
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(url)) return url;
  if (isWhatsapp && /^[+\d][\d\s()-]*$/.test(url)) return waUrlFromPhone(url) || "#";
  return `https://${url.replace(/^\/+/, "")}`;
}
