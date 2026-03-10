export const DEFAULT_THEME_SETTINGS = {
  brand: {
    primary: "#ec4899",
    primaryHover: "#db2777",
    secondary: "#f43f5e",
    accent: "#be185d",
    gradientFrom: "#ec4899",
    gradientTo: "#f43f5e",
  },
  text: {
    heading: "#111827",
    body: "#374151",
    muted: "#6b7280",
    onPrimary: "#ffffff",
  },
  background: {
    page: "#fff7fb",
    section: "#ffffff",
    card: "#ffffff",
  },
  border: {
    default: "#e5e7eb",
  },
  buttonPrimary: {
    bg: "#ec4899",
    hover: "#db2777",
    text: "#ffffff",
  },
  buttonSecondary: {
    bg: "#ffffff",
    hover: "#fdf2f8",
    text: "#be185d",
    border: "#f9a8d4",
  },
  state: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
};

const HEX_6_REGEX = /^#([0-9a-fA-F]{6})$/;
const HEX_3_REGEX = /^#([0-9a-fA-F]{3})$/;

const expandHex = (hex) => {
  if (!HEX_3_REGEX.test(hex)) return hex;
  const [, value] = HEX_3_REGEX.exec(hex);
  return `#${value
    .split("")
    .map((char) => `${char}${char}`)
    .join("")}`;
};

export const normalizeHexColor = (value, fallback) => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  const prefixed = raw.startsWith("#") ? raw : `#${raw}`;
  const expanded = expandHex(prefixed);

  if (!HEX_6_REGEX.test(expanded)) return fallback;
  return expanded.toLowerCase();
};

export const mergeThemeSettings = (baseTheme, incomingTheme = {}) => {
  const nextTheme = {};
  const source = incomingTheme && typeof incomingTheme === "object" ? incomingTheme : {};

  Object.keys(baseTheme || {}).forEach((groupKey) => {
    const baseGroup = baseTheme[groupKey] || {};
    const incomingGroup =
      source[groupKey] && typeof source[groupKey] === "object"
        ? source[groupKey]
        : {};

    nextTheme[groupKey] = {};
    Object.keys(baseGroup).forEach((tokenKey) => {
      nextTheme[groupKey][tokenKey] = normalizeHexColor(
        incomingGroup[tokenKey],
        baseGroup[tokenKey],
      );
    });
  });

  return nextTheme;
};

export const TOKEN_TO_CSS_VAR = {
  "brand.primary": "--color-brand-primary",
  "brand.primaryHover": "--color-brand-primary-hover",
  "brand.secondary": "--color-brand-secondary",
  "brand.accent": "--color-brand-accent",
  "brand.gradientFrom": "--color-brand-gradient-from",
  "brand.gradientTo": "--color-brand-gradient-to",
  "text.heading": "--color-text-heading",
  "text.body": "--color-text-body",
  "text.muted": "--color-text-muted",
  "text.onPrimary": "--color-text-on-primary",
  "background.page": "--color-bg-page",
  "background.section": "--color-bg-section",
  "background.card": "--color-bg-card",
  "border.default": "--color-border-default",
  "buttonPrimary.bg": "--color-btn-primary-bg",
  "buttonPrimary.hover": "--color-btn-primary-hover",
  "buttonPrimary.text": "--color-btn-primary-text",
  "buttonSecondary.bg": "--color-btn-secondary-bg",
  "buttonSecondary.hover": "--color-btn-secondary-hover",
  "buttonSecondary.text": "--color-btn-secondary-text",
  "buttonSecondary.border": "--color-btn-secondary-border",
  "state.success": "--color-state-success",
  "state.warning": "--color-state-warning",
  "state.error": "--color-state-error",
  "state.info": "--color-state-info",
};

const getTokenByPath = (obj, path) =>
  path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);

export const getThemeCssVarMap = (themeSettings) => {
  const mergedTheme = mergeThemeSettings(DEFAULT_THEME_SETTINGS, themeSettings);
  const vars = {};

  Object.entries(TOKEN_TO_CSS_VAR).forEach(([tokenPath, cssVar]) => {
    const value = getTokenByPath(mergedTheme, tokenPath);
    if (value) vars[cssVar] = value;
  });

  return vars;
};

export const getThemeCssVarString = (themeSettings) => {
  const vars = getThemeCssVarMap(themeSettings);
  const body = Object.entries(vars)
    .map(([key, value]) => `${key}:${value};`)
    .join("");
  return `:root{${body}}`;
};

export const applyThemeCssVariables = (themeSettings) => {
  if (typeof document === "undefined") return mergeThemeSettings(DEFAULT_THEME_SETTINGS, themeSettings);

  const mergedTheme = mergeThemeSettings(DEFAULT_THEME_SETTINGS, themeSettings);
  const root = document.documentElement;

  Object.entries(TOKEN_TO_CSS_VAR).forEach(([tokenPath, cssVar]) => {
    const value = getTokenByPath(mergedTheme, tokenPath);
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  });

  return mergedTheme;
};
