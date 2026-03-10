"use client";

import { useState, useRef, useEffect } from "react";
import {
  Settings,
  CreditCard,
  Search as SearchIcon,
  Phone,
  MapPin,
  Palette,
  Save,
  Upload,
  Eye,
  EyeOff,
  X,
  Check,
  Info,
  Loader,
  Heart,
  User2,
  ShoppingCart,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Youtube,
} from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";
import { adminFetch } from "../../utils/adminApi";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
  DEFAULT_THEME_SETTINGS,
  mergeThemeSettings,
} from "../../utils/themeTokens";

const EMPTY_UI_SETTINGS = {
  general: {
    branding: { siteLogo: null, adminLogo: null, favicon: null },
    guestCheckout: true,
  },
  seo: {
    siteTitle: "",
    siteDescription: "",
  },
  payment: {
    stripe: {
      enabled: true,
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
    },
    paypal: { enabled: true, clientId: "", clientSecret: "" },
    cod: { enabled: false },
    bankTransfer: { enabled: false, instructions: "" },
  },
  contact: {
    email: "",
    phone: "",
    address: "",
    social: { instagram: "", facebook: "", twitter: "", youtube: "" },
    hours: {
      weekdays: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "10:00", close: "16:00", closed: false },
      sunday: { open: "", close: "", closed: true },
    },
  },
  appearance: mergeThemeSettings(DEFAULT_THEME_SETTINGS, {}),
};

const EMPTY_META = {
  stripe: {
    secretKeySet: false,
    webhookSecretSet: false,
    secretKeyPreview: "",
    webhookSecretPreview: "",
  },
  paypal: {
    clientSecretSet: false,
    clientSecretPreview: "",
  },
};

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "seo", label: "SEO", icon: SearchIcon },
  { id: "contact", label: "Contact", icon: Phone },
];

const APPEARANCE_GROUPS = [
  {
    key: "brand",
    title: "Brand Colors",
    description: "Primary and gradient colors used across buttons, badges, and highlights.",
    fields: [
      { key: "primary", label: "Primary" },
      { key: "primaryHover", label: "Primary Hover" },
      { key: "secondary", label: "Secondary" },
      { key: "accent", label: "Accent" },
      { key: "gradientFrom", label: "Gradient From" },
      { key: "gradientTo", label: "Gradient To" },
    ],
  },
  {
    key: "text",
    title: "Text Colors",
    description: "Controls headings, body copy, and muted labels.",
    fields: [
      { key: "heading", label: "Heading" },
      { key: "body", label: "Body" },
      { key: "muted", label: "Muted" },
      { key: "onPrimary", label: "On Primary" },
    ],
  },
  {
    key: "background",
    title: "Background Colors",
    description: "Base surfaces for pages, sections, and cards.",
    fields: [
      { key: "page", label: "Page" },
      { key: "section", label: "Section" },
      { key: "card", label: "Card" },
    ],
  },
  {
    key: "buttonPrimary",
    title: "Primary Button",
    description: "Main CTA styling for key actions.",
    fields: [
      { key: "bg", label: "Background" },
      { key: "hover", label: "Hover" },
      { key: "text", label: "Text" },
    ],
  },
  {
    key: "buttonSecondary",
    title: "Secondary Button",
    description: "Secondary actions and neutral buttons.",
    fields: [
      { key: "bg", label: "Background" },
      { key: "hover", label: "Hover" },
      { key: "text", label: "Text" },
      { key: "border", label: "Border" },
    ],
  },
  {
    key: "state",
    title: "Status Colors",
    description: "System states for success, warning, error, and info.",
    fields: [
      { key: "success", label: "Success" },
      { key: "warning", label: "Warning" },
      { key: "error", label: "Error" },
      { key: "info", label: "Info" },
    ],
  },
];

const APPEARANCE_PRESETS = [
  {
    id: "default",
    label: "Default",
    hint: "Pink Dreams",
    theme: DEFAULT_THEME_SETTINGS,
  },
  {
    id: "light",
    label: "Light",
    hint: "Soft Ocean",
    theme: {
      brand: {
        primary: "#0ea5a6",
        primaryHover: "#0b8a8b",
        secondary: "#2563eb",
        accent: "#0f766e",
        gradientFrom: "#2563eb",
        gradientTo: "#0ea5a6",
      },
      text: {
        heading: "#0f172a",
        body: "#1e293b",
        muted: "#475569",
        onPrimary: "#ffffff",
      },
      background: {
        page: "#f4f8ff",
        section: "#ffffff",
        card: "#fdfefe",
      },
      border: {
        default: "#cbd5e1",
      },
      buttonPrimary: {
        bg: "#2563eb",
        hover: "#1d4ed8",
        text: "#ffffff",
      },
      buttonSecondary: {
        bg: "#ffffff",
        hover: "#eff6ff",
        text: "#0f172a",
        border: "#93c5fd",
      },
      state: {
        success: "#16a34a",
        warning: "#d97706",
        error: "#dc2626",
        info: "#0284c7",
      },
    },
  },
  {
    id: "dark",
    label: "Dark",
    hint: "Midnight",
    theme: {
      brand: {
        primary: "#7c3aed",
        primaryHover: "#6d28d9",
        secondary: "#0ea5e9",
        accent: "#c084fc",
        gradientFrom: "#7c3aed",
        gradientTo: "#0ea5e9",
      },
      text: {
        heading: "#f8fafc",
        body: "#e2e8f0",
        muted: "#94a3b8",
        onPrimary: "#ffffff",
      },
      background: {
        page: "#0b1020",
        section: "#111827",
        card: "#172033",
      },
      border: {
        default: "#334155",
      },
      buttonPrimary: {
        bg: "#7c3aed",
        hover: "#6d28d9",
        text: "#ffffff",
      },
      buttonSecondary: {
        bg: "#1e293b",
        hover: "#334155",
        text: "#e2e8f0",
        border: "#475569",
      },
      state: {
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#38bdf8",
      },
    },
  },
];

const AppearanceColorField = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      const target = event.target;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleChange = (nextValue) => {
    onChange(nextValue);
  };

  return (
    <div className="relative flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white/80 p-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {String(value).toUpperCase()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-11 w-11 rounded-lg border border-gray-300 shadow-sm"
          style={{ background: value }}
          aria-label={`Pick ${label} color`}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Edit
        </button>
      </div>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-3 z-50 w-[260px] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl"
        >
          <HexColorPicker
            color={value}
            onChange={handleChange}
            className="w-full h-40"
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-lg border border-gray-200"
                style={{ background: value }}
              />
              <HexColorInput
                color={value}
                onChange={handleChange}
                prefixed
                className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-[10px] text-gray-400">
            Drag inside the picker to fine-tune. Input accepts hex codes.
          </p>
        </div>
      )}
    </div>
  );
};

const toUiSettings = (apiSettings) => {
  const s = apiSettings || {};
  return {
    general: {
      branding: {
        siteLogo: s?.generalSettings?.branding?.siteLogo || null,
        adminLogo: s?.generalSettings?.branding?.adminLogo || null,
        favicon: s?.generalSettings?.branding?.favicon || null,
      },
      guestCheckout: s?.allowGuestCheckout ?? true,
    },
    seo: {
      siteTitle: s?.generalSettings?.seo?.siteTitle || "",
      siteDescription: s?.generalSettings?.seo?.siteDescription || "",
    },
    payment: {
      stripe: {
        enabled: s?.paymentSettings?.methods?.stripe?.enabled ?? true,
        publishableKey:
          s?.paymentSettings?.credentials?.stripe?.publishableKey || "",
        secretKey: "", // never hydrate plain secret
        webhookSecret: "", // never hydrate plain secret
      },
      paypal: {
        enabled: s?.paymentSettings?.methods?.paypal?.enabled ?? true,
        clientId: s?.paymentSettings?.credentials?.paypal?.clientId || "",
        clientSecret: "", // never hydrate plain secret
      },
      cod: {
        enabled: s?.paymentSettings?.methods?.cod?.enabled ?? false,
      },
      bankTransfer: {
        enabled: s?.paymentSettings?.methods?.bankTransfer?.enabled ?? false,
        instructions:
          s?.paymentSettings?.methods?.bankTransfer?.instructions || "",
      },
    },
    contact: {
      email: s?.contact?.email || "",
      phone: s?.contact?.phone || "",
      address: s?.contact?.address || "",
      social: s?.contact?.social || EMPTY_UI_SETTINGS.contact.social,
      hours: s?.contact?.hours || EMPTY_UI_SETTINGS.contact.hours,
    },
    appearance: mergeThemeSettings(
      DEFAULT_THEME_SETTINGS,
      s?.themeSettings || {},
    ),
  };
};

const buildApiPayload = (uiSettings, secretsDraft) => {
  return {
    allowGuestCheckout: uiSettings.general.guestCheckout,
    generalSettings: {
      branding: {
        siteLogo: uiSettings.general.branding.siteLogo,
        adminLogo: uiSettings.general.branding.adminLogo,
        favicon: uiSettings.general.branding.favicon,
      },
      seo: {
        siteTitle: uiSettings.seo.siteTitle,
        siteDescription: uiSettings.seo.siteDescription,
      },
    },
    contact: {
      email: uiSettings.contact.email,
      phone: uiSettings.contact.phone,
      address: uiSettings.contact.address,
      social: uiSettings.contact.social,
      hours: uiSettings.contact.hours,
    },
    themeSettings: uiSettings.appearance,
    paymentSettings: {
      methods: {
        stripe: { enabled: uiSettings.payment.stripe.enabled },
        paypal: { enabled: uiSettings.payment.paypal.enabled },
        cod: { enabled: uiSettings.payment.cod.enabled },
        bankTransfer: {
          enabled: uiSettings.payment.bankTransfer.enabled,
          instructions: uiSettings.payment.bankTransfer.instructions,
        },
      },
      credentials: {
        stripe: {
          publishableKey: uiSettings.payment.stripe.publishableKey,
          // backend keeps unchanged when value is ""
          secretKey: secretsDraft.stripeSecretKey || "",
          webhookSecret: secretsDraft.stripeWebhookSecret || "",
        },
        paypal: {
          clientId: uiSettings.payment.paypal.clientId,
          // backend keeps unchanged when value is ""
          clientSecret: secretsDraft.paypalClientSecret || "",
        },
      },
    },
  };
};

const SettingsManager = () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(EMPTY_UI_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [visibleFields, setVisibleFields] = useState({});
  const [credentialsMeta, setCredentialsMeta] = useState(EMPTY_META);
  const [secretsDraft, setSecretsDraft] = useState({
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    paypalClientSecret: "",
  });
  const [testLoading, setTestLoading] = useState({
    stripe: false,
    paypal: false,
  });

  const siteLogoRef = useRef(null);
  const adminLogoRef = useRef(null);
  const faviconRef = useRef(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
  });

  const loadAdminSettings = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/settings`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to fetch settings");
      }

      setSettings(toUiSettings(data.settings));
      setCredentialsMeta(
        data?.settings?.paymentSettings?.credentialsMeta || EMPTY_META,
      );
      setSecretsDraft({
        stripeSecretKey: "",
        stripeWebhookSecret: "",
        paypalClientSecret: "",
      });
    } catch (err) {
      showNotification(err.message || "Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async ({ silent = false } = {}) => {
    setSaving(true);
    try {
      const payload = buildApiPayload(settings, secretsDraft);

      const res = await adminFetch(`${API_BASE}/admin/settings`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Save failed");
      }

      await loadAdminSettings();
      if (!silent) showNotification("Settings saved successfully", "success");
      return true;
    } catch (err) {
      if (!silent)
        showNotification(err.message || "Failed to save settings", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await saveSettings();
  };

  const handleTestConnection = async (provider) => {
    const key = provider === "stripe" ? "stripe" : "paypal";
    setTestLoading((p) => ({ ...p, [key]: true }));

    try {
      // test endpoint checks DB credentials, so save first
      const saved = await saveSettings({ silent: true });
      if (!saved) throw new Error("Save failed before test");

      const res = await adminFetch(
        `${API_BASE}/admin/settings/test-payment/${provider}`,
        {
          method: "POST",
          headers: authHeaders(),
        },
      );
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to test ${provider}`);
      }

      // showNotification(
      //   data.message || `${provider} connection successful`,
      //   "success",
      // );
      toast.success(`${provider} connection successful`)

    } catch (err) {
      // showNotification(err.message || `Failed to test ${provider}`, "error");
      toast.error(`${provider} connection Failed`)

    } finally {
      setTestLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const uploadImageToServer = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await adminFetch(`${API_BASE}/admin/settings/upload?type=${type}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Upload failed");
    }

    return {
      public_id: data.public_id || "",
      url: data.imageUrl || "",
      alt: file.name || "",
      uploadedAt: new Date().toISOString(),
      name: file.name || "",
    };
  };

  const handleImageUpload = async (key, file) => {
    if (!file) return;
    try {
      const uploaded = await uploadImageToServer(file, key);
      setSettings((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          branding: {
            ...prev.general.branding,
            [key]: uploaded,
          },
        },
      }));
      showNotification("Image uploaded", "success");
    } catch (err) {
      showNotification(err.message || "Upload failed", "error");
    }
  };

  const removeImage = (key) => {
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        branding: {
          ...prev.general.branding,
          [key]: null,
        },
      },
    }));
  };

  const toggleFieldVisibility = (key) => {
    setVisibleFields((p) => ({ ...p, [key]: !p[key] }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader className="w-4 h-4 animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  // ─── Masked input component ─────────────────────────────────────
  const SecretInput = ({ label, value, fieldKey, onChange, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={visibleFields[fieldKey] ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => toggleFieldVisibility(fieldKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {visibleFields[fieldKey] ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  // ─── Upload box component ───────────────────────────────────────
  const UploadBox = ({
    label,
    recommendation,
    imageData,
    fileRef,
    onUpload,
    onRemove,
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-400 transition-colors bg-gray-50/50 min-h-[140px] flex flex-col items-center justify-center">
        {imageData ? (
          <>
            <Image
              src={imageData.url}
              alt={label}
              className="max-h-16 max-w-full object-contain rounded mb-2"
             width={1200} height={1200} sizes="100vw"/>
            <p className="text-xs text-gray-500 truncate max-w-full">
              {imageData.name}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs px-3 py-1 bg-pink-100 text-pink-600 rounded hover:bg-pink-200 font-medium"
              >
                Change
              </button>
              <button
                onClick={onRemove}
                className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 font-medium"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-7 h-7 text-gray-400 mb-2" />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs px-4 py-1.5 bg-pink-500 text-white rounded hover:bg-pink-600 font-medium"
            >
              Upload
            </button>
          </>
        )}
      </div>
      {recommendation && (
        <p className="text-xs text-gray-400 mt-1.5">{recommendation}</p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
    </div>
  );

  // ─── Toggle switch component ────────────────────────────────────
  const Toggle = ({ enabled, onChange, label, hint }) => (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-pink-500" : "bg-gray-300"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${enabled ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );

  const updateAppearanceColor = (group, key, value) => {
    setSettings((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [group]: {
          ...prev.appearance[group],
          [key]: value,
        },
      },
    }));
  };

  const applyAppearancePreset = (presetTheme) => {
    setSettings((prev) => ({
      ...prev,
      appearance: mergeThemeSettings(DEFAULT_THEME_SETTINGS, presetTheme),
    }));
  };

  const AppearancePreview = () => {
    const theme = settings.appearance;
    const pageStyle = {
      background: `linear-gradient(135deg, ${theme.background.page}, ${theme.background.section})`,
      color: theme.text.body,
      borderColor: theme.border.default,
    };
    const sectionStyle = {
      background: theme.background.section,
      borderColor: theme.border.default,
    };
    const cardStyle = {
      background: theme.background.card,
      borderColor: theme.border.default,
      color: theme.text.body,
    };
    const gradientStyle = {
      background: `linear-gradient(90deg, ${theme.brand.gradientFrom}, ${theme.brand.gradientTo})`,
    };
    const gradientTextStyle = {
      background: `linear-gradient(90deg, ${theme.brand.gradientFrom}, ${theme.brand.gradientTo})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };
    const primaryButtonStyle = {
      background: theme.buttonPrimary.bg,
      color: theme.buttonPrimary.text,
    };
    const secondaryButtonStyle = {
      background: theme.buttonSecondary.bg,
      color: theme.buttonSecondary.text,
      borderColor: theme.buttonSecondary.border,
    };
    const inputStyle = {
      background: `color-mix(in srgb, ${theme.background.card} 88%, #ffffff 12%)`,
      color: theme.text.body,
      borderColor: theme.border.default,
    };
    const subtleTagStyle = {
      background: `color-mix(in srgb, ${theme.brand.primary} 15%, ${theme.background.section})`,
      color: theme.brand.primaryHover,
      borderColor: `color-mix(in srgb, ${theme.brand.primary} 25%, ${theme.background.section})`,
    };
    const statePill = (stateColor) => ({
      background: `color-mix(in srgb, ${stateColor} 18%, ${theme.background.section})`,
      color: stateColor,
      borderColor: `color-mix(in srgb, ${stateColor} 40%, ${theme.background.section})`,
    });

    return (
      <div className="rounded-2xl border overflow-hidden" style={pageStyle}>
        <div className="border-b px-4 py-3" style={sectionStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={gradientStyle}
              >
                P
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: theme.text.heading }}>
                  Pink Dreams
                </p>
                <p className="text-[11px]" style={{ color: theme.text.muted }}>
                  Theme Preview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: theme.text.muted }}>
              <span style={{ color: theme.brand.primary }}>Home</span>
              <span>Shop</span>
              <span>Blog</span>
              <span>Contact</span>
            </div>
            <div className="flex items-center gap-2">
              {[Heart, User2, ShoppingCart].map((Icon, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border flex items-center justify-center"
                  style={inputStyle}
                >
                  <Icon className="w-4 h-4" style={{ color: theme.text.body }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-xl border p-4 space-y-3" style={sectionStyle}>
            <span
              className="inline-flex items-center text-xs px-2 py-1 rounded-full border"
              style={subtleTagStyle}
            >
              New Collection
            </span>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h5 className="text-lg font-bold" style={{ color: theme.text.heading }}>
                  Discover Your <span style={gradientTextStyle}>Perfect Style</span>
                </h5>
                <p className="text-xs mt-1" style={{ color: theme.text.muted }}>
                  Headings, body text and gradients preview.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={primaryButtonStyle}
                >
                  Primary CTA
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                  style={secondaryButtonStyle}
                >
                  Secondary CTA
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Featured Product", "Order #1029"].map((title) => (
              <div key={title} className="rounded-xl border p-4 space-y-2" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: theme.text.heading }}>
                    {title}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border" style={subtleTagStyle}>
                    Badge
                  </span>
                </div>
                <p className="text-xs" style={{ color: theme.text.body }}>
                  Minimal card preview for products, orders or blog posts.
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full border" style={statePill(theme.state.success)}>
                    Success
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border" style={statePill(theme.state.warning)}>
                    Warning
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border" style={statePill(theme.state.error)}>
                    Error
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border p-4 space-y-3" style={cardStyle}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: theme.text.muted }}>
                  Search
                </label>
                <div className="relative">
                  <SearchIcon
                    className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: theme.text.muted }}
                  />
                  <input
                    value="Sample query"
                    readOnly
                    className="w-full pl-8 pr-3 py-2 rounded-lg border text-xs"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: theme.text.muted }}>
                  Email Input
                </label>
                <input
                  value="admin@pinkdreams.com"
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border text-xs"
                  style={inputStyle}
                />
              </div>
            </div>
            <textarea
              readOnly
              value="Textarea preview to test contrast in light and dark modes."
              className="w-full px-3 py-2 rounded-lg border text-xs min-h-[64px]"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border" style={statePill(theme.state.success)}>
              <Check className="w-3.5 h-3.5" />
              Saved
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border" style={statePill(theme.state.info)}>
              <Info className="w-3.5 h-3.5" />
              Info
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border" style={statePill(theme.state.error)}>
              <X className="w-3.5 h-3.5" />
              Error
            </div>
            <div className="ml-auto flex items-center gap-2">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-8 h-8 rounded-lg text-white flex items-center justify-center"
                  style={gradientStyle}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={primaryButtonStyle}
              >
                Action
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${notification.type === "success" ? "bg-green-500" : "bg-red-500"} text-white max-w-md`}
        >
          {notification.type === "success" ? (
            <Check size={20} />
          ) : (
            <X size={20} />
          )}
          <span className="text-sm">{notification.message}</span>
          <button onClick={() => setNotification({ message: "", type: "" })}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Settings
            </h2>
            <p className="text-gray-600 text-sm">
              Configure your store preferences
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all disabled:opacity-50 text-sm font-medium shadow"
          >
            {saving ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-pink-500 text-pink-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="p-4 sm:p-6">
          {/* ═══ GENERAL TAB ═══════════════════════════════════════ */}
          {activeTab === "general" && (
            <div className="space-y-8">
              {/* Branding */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Branding
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <UploadBox
                    label="Site Logo"
                    recommendation="Recommended: 200×60px, PNG or SVG with transparent background. Max 2MB."
                    imageData={settings.general.branding.siteLogo}
                    fileRef={siteLogoRef}
                    onUpload={(f) => handleImageUpload("siteLogo", f)}
                    onRemove={() => removeImage("siteLogo")}
                  />
                  <UploadBox
                    label="Admin Logo"
                    recommendation="Recommended: 180×50px, PNG or SVG. This appears in the admin sidebar. Max 2MB."
                    imageData={settings.general.branding.adminLogo}
                    fileRef={adminLogoRef}
                    onUpload={(f) => handleImageUpload("adminLogo", f)}
                    onRemove={() => removeImage("adminLogo")}
                  />
                  <UploadBox
                    label="Favicon"
                    recommendation="Recommended: 32×32px or 64×64px, PNG or ICO format. Max 1MB."
                    imageData={settings.general.branding.favicon}
                    fileRef={faviconRef}
                    onUpload={(f) => handleImageUpload("favicon", f)}
                    onRemove={() => removeImage("favicon")}
                  />
                </div>
              </section>

              {/* Guest Checkout */}
              <section className="bg-gray-50 rounded-lg p-4 sm:p-5">
                <Toggle
                  enabled={settings.general.guestCheckout}
                  onChange={(v) =>
                    setSettings((p) => ({
                      ...p,
                      general: { ...p.general, guestCheckout: v },
                    }))
                  }
                  label="Guest Checkout"
                  hint="Allow customers to place orders without creating an account."
                />
              </section>
            </div>
          )}

          {/* ═══ PAYMENT TAB ══════════════════════════════════════ */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Appearance & Color System
                    </h3>
                    <p className="text-sm text-gray-500">
                      Edit brand tokens that power the storefront. Changes apply
                      instantly to the theme preview and live site.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {APPEARANCE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyAppearancePreset(preset.theme)}
                        className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        title={`Apply ${preset.label}`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-300"
                          style={{
                            background: `linear-gradient(90deg, ${preset.theme.brand.gradientFrom}, ${preset.theme.brand.gradientTo})`,
                          }}
                        />
                        <span className="font-medium">{preset.label}</span>
                        <span className="text-[10px] text-gray-500">
                          {preset.hint}
                        </span>
                      </button>
                    ))}
                    {/* <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          appearance: mergeThemeSettings(DEFAULT_THEME_SETTINGS, {}),
                        }))
                      }
                      className="px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Reset Default Palette
                    </button> */}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
                <div className="space-y-4">
                  {APPEARANCE_GROUPS.map((group) => (
                    <section
                      key={group.key}
                      className="bg-white border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-800">
                          {group.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                          {group.fields.length} tokens
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-xs text-gray-500 mb-3">
                          {group.description}
                        </p>
                      )}
                      <div className="space-y-2.5">
                        {group.fields.map((field) => (
                        <AppearanceColorField
                          key={`${group.key}.${field.key}`}
                          label={field.label}
                          value={
                            settings?.appearance?.[group.key]?.[field.key] ||
                            "#000000"
                          }
                          onChange={(nextValue) =>
                            updateAppearanceColor(group.key, field.key, nextValue)
                          }
                        />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="space-y-4 xl:sticky xl:top-24 h-fit">
                  <section className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                      Live Preview
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Clean snapshot of headers, cards, buttons and inputs.
                    </p>
                    <AppearancePreview />
                  </section>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Payment Methods
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Stripe */}
                <div
                  className={`border rounded-lg overflow-hidden transition-colors ${settings.payment.stripe.enabled ? "border-pink-200 bg-pink-50/30" : "border-gray-200"}`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          Stripe
                        </p>
                        <p className="text-xs text-gray-500">
                          Credit & debit cards
                        </p>
                      </div>
                    </div>
                    <Toggle
                      enabled={settings.payment.stripe.enabled}
                      onChange={(v) =>
                        setSettings((p) => ({
                          ...p,
                          payment: {
                            ...p.payment,
                            stripe: { ...p.payment.stripe, enabled: v },
                          },
                        }))
                      }
                      label=""
                    />
                  </div>
                  {settings.payment.stripe.enabled && (
                    <div className="p-4 pt-0 space-y-3 border-t border-pink-100">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Publishable Key
                        </label>
                        <input
                          type="text"
                          value={settings.payment.stripe.publishableKey}
                          onChange={(e) =>
                            setSettings((p) => ({
                              ...p,
                              payment: {
                                ...p.payment,
                                stripe: {
                                  ...p.payment.stripe,
                                  publishableKey: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="pk_live_..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <SecretInput
                        label="Secret Key"
                        value={secretsDraft.stripeSecretKey}
                        fieldKey="stripe_sk"
                        placeholder={
                          credentialsMeta?.stripe?.secretKeySet
                            ? `Saved (${credentialsMeta.stripe.secretKeyPreview})`
                            : "sk_live_..."
                        }
                        onChange={(e) =>
                          setSecretsDraft((p) => ({
                            ...p,
                            stripeSecretKey: e.target.value,
                          }))
                        }
                      />

                      <SecretInput
                        label="Webhook Secret (optional)"
                        value={secretsDraft.stripeWebhookSecret}
                        fieldKey="stripe_wh"
                        placeholder={
                          credentialsMeta?.stripe?.webhookSecretSet
                            ? `Saved (${credentialsMeta.stripe.webhookSecretPreview})`
                            : "whsec_..."
                        }
                        onChange={(e) =>
                          setSecretsDraft((p) => ({
                            ...p,
                            stripeWebhookSecret: e.target.value,
                          }))
                        }
                      />

                      <button
                        type="button"
                        onClick={() => handleTestConnection("stripe")}
                        disabled={testLoading.stripe}
                        className="text-xs px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium transition-colors disabled:opacity-60"
                      >
                        {testLoading.stripe ? "Testing..." : "Test Connection"}
                      </button>
                    </div>
                  )}
                </div>

                {/* PayPal */}
                <div
                  className={`border rounded-lg overflow-hidden transition-colors ${settings.payment.paypal.enabled ? "border-pink-200 bg-pink-50/30" : "border-gray-200"}`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">
                          PP
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          PayPal
                        </p>
                        <p className="text-xs text-gray-500">PayPal payments</p>
                      </div>
                    </div>
                    <Toggle
                      enabled={settings.payment.paypal.enabled}
                      onChange={(v) =>
                        setSettings((p) => ({
                          ...p,
                          payment: {
                            ...p.payment,
                            paypal: { ...p.payment.paypal, enabled: v },
                          },
                        }))
                      }
                      label=""
                    />
                  </div>
                  {settings.payment.paypal.enabled && (
                    <div className="p-4 pt-0 space-y-3 border-t border-pink-100">
                      <SecretInput
                        label="Client ID"
                        value={settings.payment.paypal.clientId}
                        fieldKey="paypal_id"
                        placeholder="Your PayPal Client ID"
                        onChange={(e) =>
                          setSettings((p) => ({
                            ...p,
                            payment: {
                              ...p.payment,
                              paypal: {
                                ...p.payment.paypal,
                                clientId: e.target.value,
                              },
                            },
                          }))
                        }
                      />

                      <SecretInput
                        label="Client Secret"
                        value={secretsDraft.paypalClientSecret}
                        fieldKey="paypal_secret"
                        placeholder={
                          credentialsMeta?.paypal?.clientSecretSet
                            ? `Saved (${credentialsMeta.paypal.clientSecretPreview})`
                            : "Your PayPal Client Secret"
                        }
                        onChange={(e) =>
                          setSecretsDraft((p) => ({
                            ...p,
                            paypalClientSecret: e.target.value,
                          }))
                        }
                      />

                      <button
                        type="button"
                        onClick={() => handleTestConnection("paypal")}
                        disabled={testLoading.paypal}
                        className="text-xs px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors disabled:opacity-60"
                      >
                        {testLoading.paypal ? "Testing..." : "Test Connection"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Cash on Delivery */}
                <div
                  className={`border rounded-lg overflow-hidden transition-colors ${settings.payment.cod.enabled ? "border-pink-200 bg-pink-50/30" : "border-gray-200"}`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">
                          $
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          Cash on Delivery
                        </p>
                        <p className="text-xs text-gray-500">
                          Pay when the order arrives
                        </p>
                      </div>
                    </div>
                    <Toggle
                      enabled={settings.payment.cod.enabled}
                      onChange={(v) =>
                        setSettings((p) => ({
                          ...p,
                          payment: {
                            ...p.payment,
                            cod: { ...p.payment.cod, enabled: v },
                          },
                        }))
                      }
                      label=""
                    />
                  </div>
                  {settings.payment.cod.enabled && (
                    <div className="p-4 pt-0 border-t border-pink-100">
                      <div className="flex items-start gap-2 text-xs text-gray-500 bg-green-50 p-3 rounded">
                        <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>No additional configuration required.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Transfer */}
                <div
                  className={`border rounded-lg overflow-hidden transition-colors ${settings.payment.bankTransfer.enabled ? "border-pink-200 bg-pink-50/30" : "border-gray-200"}`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <span className="text-amber-600 font-bold text-xs">
                          BT
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          Bank Transfer
                        </p>
                        <p className="text-xs text-gray-500">
                          Direct bank/wire transfer
                        </p>
                      </div>
                    </div>
                    <Toggle
                      enabled={settings.payment.bankTransfer.enabled}
                      onChange={(v) =>
                        setSettings((p) => ({
                          ...p,
                          payment: {
                            ...p.payment,
                            bankTransfer: {
                              ...p.payment.bankTransfer,
                              enabled: v,
                            },
                          },
                        }))
                      }
                      label=""
                    />
                  </div>
                  {settings.payment.bankTransfer.enabled && (
                    <div className="p-4 pt-0 border-t border-pink-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transfer Instructions
                      </label>
                      <textarea
                        value={settings.payment.bankTransfer.instructions}
                        onChange={(e) =>
                          setSettings((p) => ({
                            ...p,
                            payment: {
                              ...p.payment,
                              bankTransfer: {
                                ...p.payment.bankTransfer,
                                instructions: e.target.value,
                              },
                            },
                          }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm resize-none"
                        placeholder={
                          "Bank Name: ABC Bank\nAccount #: 12345678\nRouting #: 87654321"
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ SEO TAB ═══════════════════════════════════════════ */}
          {activeTab === "seo" && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-800">
                Search Engine Optimization
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Title
                  <span className="text-gray-400 font-normal ml-1.5">
                    ({settings.seo.siteTitle.length}/60)
                  </span>
                </label>
                <input
                  type="text"
                  value={settings.seo.siteTitle}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      seo: { ...p.seo, siteTitle: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Your store name"
                  maxLength={60}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Appears as the main title in browser tabs and search results.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                  <span className="text-gray-400 font-normal ml-1.5">
                    ({settings.seo.siteDescription.length}/160)
                  </span>
                </label>
                <textarea
                  value={settings.seo.siteDescription}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      seo: { ...p.seo, siteDescription: e.target.value },
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm resize-none"
                  placeholder="A brief description of your store..."
                  maxLength={160}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Shown below the title in search results. Keep it concise.
                </p>
              </div>

              {/* Google Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Search Preview
                </p>
                <div>
                  <p className="text-blue-700 text-base sm:text-lg hover:underline cursor-pointer truncate">
                    {settings.seo.siteTitle || "Your Site Title"}
                  </p>
                  <p className="text-green-700 text-xs sm:text-sm">
                    www.pinkdreams.com
                  </p>
                  <p className="text-gray-600 text-xs sm:text-sm mt-0.5 line-clamp-2">
                    {settings.seo.siteDescription ||
                      "Your site description will appear here..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CONTACT TAB ══════════════════════════════════════ */}
          {activeTab === "contact" && (
            <div className="space-y-8">
              {/* Contact Details */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Contact Details
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  These values are shown on the Contact page and footer.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-pink-500" /> Phone Number
                    </label>
                    <input
                      type="text"
                      value={settings.contact.phone}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          contact: {
                            ...p.contact,
                            phone: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-pink-500" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.contact.email}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          contact: {
                            ...p.contact,
                            email: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="support@pinkdreams.com"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-pink-500" /> Physical Address
                  </label>
                  <input
                    type="text"
                    value={settings.contact.address}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        contact: {
                          ...p.contact,
                          address: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                    placeholder="123 Fashion Avenue, New York, NY"
                  />
                </div>
              </section>

              {/* Social Media */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Social Media
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Instagram className="w-4 h-4 text-pink-500" /> Instagram
                    </label>
                    <input
                      type="url"
                      value={settings.contact.social.instagram}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          contact: {
                            ...p.contact,
                            social: {
                              ...p.contact.social,
                              instagram: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                    </label>
                    <input
                      type="url"
                      value={settings.contact.social.facebook}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          contact: {
                            ...p.contact,
                            social: {
                              ...p.contact.social,
                              facebook: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Twitter className="w-4 h-4 text-sky-500" /> Twitter / X
                    </label>
                    <input
                      type="url"
                      value={settings.contact.social.twitter}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          contact: {
                            ...p.contact,
                            social: {
                              ...p.contact.social,
                              twitter: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Youtube className="w-4 h-4 text-red-500" /> YouTube
                    </label>
                    <input
                      type="url"
                      value={settings.contact.social.youtube}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          contact: {
                            ...p.contact,
                            social: {
                              ...p.contact.social,
                              youtube: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="https://youtube.com/@..."
                    />
                  </div>
                </div>
              </section>

              {/* Business Hours */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Business Hours
                </h3>
                <div className="space-y-3">
                  {[
                    { key: "weekdays", label: "Weekdays", sub: "Mon – Fri" },
                    { key: "saturday", label: "Saturday", sub: "Sat" },
                    { key: "sunday", label: "Sunday", sub: "Sun" },
                  ].map((d) => (
                    <div
                      key={d.key}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="w-24 sm:w-28">
                        <p className="font-medium text-gray-800 text-sm">
                          {d.label}
                        </p>
                        <p className="text-xs text-gray-400">{d.sub}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={settings.contact.hours[d.key].closed}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                contact: {
                                  ...p.contact,
                                  hours: {
                                    ...p.contact.hours,
                                    [d.key]: {
                                      ...p.contact.hours[d.key],
                                      closed: e.target.checked,
                                    },
                                  },
                                },
                              }))
                            }
                            className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                          />
                          Closed
                        </label>
                      </div>
                      {!settings.contact.hours[d.key].closed ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={settings.contact.hours[d.key].open}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                contact: {
                                  ...p.contact,
                                  hours: {
                                    ...p.contact.hours,
                                    [d.key]: {
                                      ...p.contact.hours[d.key],
                                      open: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          />
                          <span className="text-gray-400 text-sm">to</span>
                          <input
                            type="time"
                            value={settings.contact.hours[d.key].close}
                            onChange={(e) =>
                              setSettings((p) => ({
                                ...p,
                                contact: {
                                  ...p.contact,
                                  hours: {
                                    ...p.contact.hours,
                                    [d.key]: {
                                      ...p.contact.hours[d.key],
                                      close: e.target.value,
                                    },
                                  },
                                },
                              }))
                            }
                            className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                          Closed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={loadAdminSettings}
          disabled={saving}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all disabled:opacity-50 text-sm font-medium shadow"
        >
          {saving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default SettingsManager;
