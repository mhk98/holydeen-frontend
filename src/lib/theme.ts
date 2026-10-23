/**
 * Holy Deen Brand Color Palette
 * Derived directly from the official logo:
 * - Primary: Deep Royal Navy Blue (#0B1B4F) from "HOLY DEEN"
 * - Secondary / Gold: Warm Islamic Royal Gold (#C59B27) from Arabic calligraphy & "ATTAR & LIFESTYLE"
 */

export const THEME = {
  // Brand Primary (Deep Royal Navy)
  primary: "#0B1B4F",
  primaryHover: "#071233",
  primaryDark: "#050E29",
  primaryLight: "#EEF2F9",
  primaryBorder: "#C8D5E8",

  // Brand Secondary (Royal Warm Gold)
  gold: "#C59B27",
  goldHover: "#A87F18",
  goldDark: "#8A6D12",
  goldLight: "#FAF4E6",
  goldBorder: "#E5D2A0",

  // Common UI aliases
  secondary: "#C59B27",
  secondaryHover: "#A87F18",

  // Alerts & Accents
  accentRed: "#D7262E",
  whatsappGreen: "#12C64B",
  successGreen: "#16A34A",

  // Neutrals
  dark: "#111827",
  muted: "#6B7280",
  lightBg: "#F7F8FA",
  border: "#E5E7EB",
} as const;

export const PRIMARY = THEME.primary;
export const SECONDARY = THEME.secondary;
export const GOLD = THEME.gold;
export const ACCENT = THEME.accentRed;

