"use client";

import { useState, useRef, useEffect } from "react";
import {
  Settings,
  CreditCard,
  Search as SearchIcon,
  Phone,
  Plus,
  Trash2,
  Save,
  Upload,
  Eye,
  EyeOff,
  X,
  Check,
  Info,
  Loader,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Youtube,
} from "lucide-react";
import { toast } from "react-toastify";

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
    emails: [],
    phones: [],
    addresses: [
      { line1: "", line2: "", city: "", state: "", zip: "", country: "" },
    ],
    social: { instagram: "", facebook: "", twitter: "", youtube: "" },
    hours: {
      weekdays: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "10:00", close: "16:00", closed: false },
      sunday: { open: "", close: "", closed: true },
    },
  },
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
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "seo", label: "SEO", icon: SearchIcon },
  { id: "contact", label: "Contact", icon: Phone },
];

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
      emails: s?.contact?.emails || [],
      phones: s?.contact?.phones || [],
      addresses: [
        s?.contact?.address || EMPTY_UI_SETTINGS.contact.addresses[0],
      ],
      social: s?.contact?.social || EMPTY_UI_SETTINGS.contact.social,
      hours: s?.contact?.hours || EMPTY_UI_SETTINGS.contact.hours,
    },
  };
};

const buildApiPayload = (uiSettings, secretsDraft) => {
  const primaryAddress =
    uiSettings?.contact?.addresses?.[0] ||
    EMPTY_UI_SETTINGS.contact.addresses[0];

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
      emails: uiSettings.contact.emails,
      phones: uiSettings.contact.phones,
      // backend model uses `contact.address` (singular)
      address: primaryAddress,
      social: uiSettings.contact.social,
      hours: uiSettings.contact.hours,
    },
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
  const token =
    typeof window !== "undefined" ? localStorage.getItem("staffUserToken") : "";

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
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const loadAdminSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
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

      const res = await fetch(`${API_BASE}/admin/settings`, {
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

      const res = await fetch(
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

    const res = await fetch(`${API_BASE}/admin/settings/upload?type=${type}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  // Contact list helpers
  const addEmail = () =>
    setSettings((p) => ({
      ...p,
      contact: {
        ...p.contact,
        emails: [...p.contact.emails, { label: "", email: "" }],
      },
    }));
  const removeEmail = (i) =>
    setSettings((p) => ({
      ...p,
      contact: {
        ...p.contact,
        emails: p.contact.emails.filter((_, idx) => idx !== i),
      },
    }));
  const addPhone = () =>
    setSettings((p) => ({
      ...p,
      contact: {
        ...p.contact,
        phones: [...p.contact.phones, { label: "", number: "" }],
      },
    }));
  const removePhone = (i) =>
    setSettings((p) => ({
      ...p,
      contact: {
        ...p.contact,
        phones: p.contact.phones.filter((_, idx) => idx !== i),
      },
    }));
  const addAddress = () =>
    setSettings((p) => ({
      ...p,
      contact: {
        ...p.contact,
        addresses: [
          ...p.contact.addresses,
          { line1: "", line2: "", city: "", state: "", zip: "", country: "" },
        ],
      },
    }));
  const removeAddress = (i) =>
    setSettings((p) => ({
      ...p,
      contact: {
        ...p.contact,
        addresses: p.contact.addresses.filter((_, idx) => idx !== i),
      },
    }));

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
            <img
              src={imageData.url}
              alt={label}
              className="max-h-16 max-w-full object-contain rounded mb-2"
            />
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
                {/* <div
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
                </div> */}
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
              {/* Emails */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Email Addresses
                  </h3>
                  <button
                    onClick={addEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {settings.contact.emails.map((em, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={em.label}
                          onChange={(e) => {
                            const n = [...settings.contact.emails];
                            n[i].label = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, emails: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="Label (e.g. Support)"
                        />
                        <input
                          type="email"
                          value={em.email}
                          onChange={(e) => {
                            const n = [...settings.contact.emails];
                            n[i].email = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, emails: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="email@example.com"
                        />
                      </div>
                      <button
                        onClick={() => removeEmail(i)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {settings.contact.emails.length === 0 && (
                    <div className="text-center py-8">
                      <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        No email addresses added
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Phones */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Phone Numbers
                  </h3>
                  <button
                    onClick={addPhone}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {settings.contact.phones.map((ph, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={ph.label}
                          onChange={(e) => {
                            const n = [...settings.contact.phones];
                            n[i].label = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, phones: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="Label"
                        />
                        <input
                          type="tel"
                          value={ph.number}
                          onChange={(e) => {
                            const n = [...settings.contact.phones];
                            n[i].number = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, phones: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <button
                        onClick={() => removePhone(i)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {settings.contact.phones.length === 0 && (
                    <div className="text-center py-8">
                      <Phone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        No phone numbers added
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Addresses */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Addresses
                  </h3>
                  <button
                    onClick={addAddress}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-4">
                  {settings.contact.addresses.map((addr, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg relative">
                      <button
                        onClick={() => removeAddress(i)}
                        className="absolute top-3 right-3 p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                        <input
                          type="text"
                          value={addr.line1}
                          onChange={(e) => {
                            const n = [...settings.contact.addresses];
                            n[i].line1 = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, addresses: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="Street address"
                        />
                        <input
                          type="text"
                          value={addr.line2}
                          onChange={(e) => {
                            const n = [...settings.contact.addresses];
                            n[i].line2 = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, addresses: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="Apt, Suite (optional)"
                        />
                        <input
                          type="text"
                          value={addr.city}
                          onChange={(e) => {
                            const n = [...settings.contact.addresses];
                            n[i].city = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, addresses: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={addr.state}
                          onChange={(e) => {
                            const n = [...settings.contact.addresses];
                            n[i].state = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, addresses: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="State / Province"
                        />
                        <input
                          type="text"
                          value={addr.zip}
                          onChange={(e) => {
                            const n = [...settings.contact.addresses];
                            n[i].zip = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, addresses: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="ZIP / Postal"
                        />
                        <input
                          type="text"
                          value={addr.country}
                          onChange={(e) => {
                            const n = [...settings.contact.addresses];
                            n[i].country = e.target.value;
                            setSettings((p) => ({
                              ...p,
                              contact: { ...p.contact, addresses: n },
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  ))}
                  {settings.contact.addresses.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400">
                        No addresses added
                      </p>
                    </div>
                  )}
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
          onClick={() => setSettings(defaultSettings)}
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
