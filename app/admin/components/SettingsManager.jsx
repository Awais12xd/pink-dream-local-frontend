import React, { useState, useRef, useEffect } from "react";
import {
  Settings,
  Sliders,
  Mail,
  Globe,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Plus,
  Trash2,
  Save,
  Upload,
  Eye,
  Palette,
  Shield,
  Bell,
  ChevronRight,
  Youtube,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------------------
   Minimal helpers
   --------------------------- */
const isValidEmail = (email) => {
  if (!email) return false;
  // simple RFC-lite regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const showToast = (setToast, type, message) => {
  setToast({ type, message });
  setTimeout(() => setToast(null), 4000);
};

/* ---------------------------
   Default (static) settings
   --------------------------- */
const defaultSettings = {
  generalSettings: {
    branding: {
      siteLogo: {
        public_id: "logo1",
        url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=80&fit=crop",
        alt: "Site Logo",
        uploadedAt: new Date(),
      },
      adminLogo: null,
      favicon: {
        public_id: "fav1",
        url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=32&h=32&fit=crop",
        alt: "Favicon",
        uploadedAt: new Date(),
      },
    },
    seo: {
      siteTitle: "Pink Dreams - Premium Fashion Store",
      siteDescription:
        "Discover the latest trends in fashion. Shop premium clothing, accessories, and more at Pink Dreams.",
    },
  },
  contact: {
    emails: [
      { label: "General Inquiries", email: "hello@pinkdreams.com" },
      { label: "Customer Support", email: "support@pinkdreams.com" },
    ],
    phones: [
      { label: "Main Line", number: "+1 (555) 123-4567" },
      { label: "Support Hotline", number: "+1 (555) 987-6543" },
    ],
    address: {
      line1: "123 Fashion Avenue",
      line2: "Suite 456",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
    },
    social: {
      instagram: "https://instagram.com/pinkdreams",
      facebook: "https://facebook.com/pinkdreams",
      twitter: "https://twitter.com/pinkdreams",
      youtube: "https://youtube.com/pinkdreams",
    },
    hours: {
      weekdays: {
        day: "weekdays",
        open: "09:00",
        close: "18:00",
        closed: false,
      },
      saturday: {
        day: "saturday",
        open: "10:00",
        close: "16:00",
        closed: false,
      },
      sunday: { day: "sunday", open: "00:00", close: "00:00", closed: true },
    },
  },
  // email: {
  //   from: 'noreply@pinkdreams.com',
  //   admin: 'admin@pinkdreams.com',
  // },
};

const SettingsManager = () => {
  const token = localStorage.getItem("staffUserToken");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [allowGuestCheckout, setAllowGuestCheckout] = useState(false);

  // per-image uploading states
  const [uploading, setUploading] = useState({
    siteLogo: false,
    adminLogo: false,
    favicon: false,
  });

  // Image upload refs
  const siteLogoRef = useRef(null);
  const adminLogoRef = useRef(null);
  const faviconRef = useRef(null);

  // load settings on mount
  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("staffUserToken")
        : null;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/settings`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          // fallback to defaultSettings but don't crash
          const text = await res.text();
          console.warn("Failed to fetch settings:", res.status, text);
          if (mounted) {
            setSettings(defaultSettings);
            showToast(
              setToast,
              "error",
              "Failed to load settings (using defaults).",
            );
          }
          return;
        }

        const json = await res.json();
        if (json && json.success && json.settings) {
          if (mounted) {
            setSettings(json.settings);
          }
        } else {
          if (mounted) {
            setSettings(defaultSettings);
            showToast(
              setToast,
              "error",
              "Settings response was unexpected (using defaults).",
            );
          }
        }
      } catch (err) {
        console.error("fetchSettings error", err);
        if (mounted) {
          setSettings(defaultSettings);
          showToast(setToast, "error", "Unable to fetch settings (offline?)");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------------------
     Upload helper (calls backend)
     --------------------------- */
  const uploadToServer = async (file, type) => {
    const token = localStorage.getItem("staffUserToken");
    const formData = new FormData();
    formData.append("file", file);

    // optional: pass type so server can tag folder/name
    const url = `${API_BASE}/admin/settings/upload?type=${encodeURIComponent(type)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Upload failed: ${res.status} ${txt}`);
    }

    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Upload failed");
    // Accept either imageUrl or upload.url
    const imageUrl =
      json.imageUrl ||
      (json.upload && (json.upload.url || json.upload.secure_url)) ||
      json.url ||
      null;
    const public_id =
      json.public_id || (json.upload && json.upload.public_id) || null;
    return { imageUrl, public_id };
  };

  /* ---------------------------
     Image handlers
     --------------------------- */
  const handleImageFile = async (type, file) => {
    if (!file) return;
    // immediate local preview while uploading (optimistic)
    const previewUrl = URL.createObjectURL(file);
    setSettings((prev) => ({
      ...prev,
      generalSettings: {
        ...prev.generalSettings,
        branding: {
          ...prev.generalSettings.branding,
          [type]: {
            public_id: `temp_${type}`,
            url: previewUrl,
            alt: file.name,
            uploadedAt: new Date(),
          },
        },
      },
    }));

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const { imageUrl, public_id } = await uploadToServer(file, type);
      if (!imageUrl) throw new Error("No image URL returned from upload");

      setSettings((prev) => ({
        ...prev,
        generalSettings: {
          ...prev.generalSettings,
          branding: {
            ...prev.generalSettings.branding,
            [type]: {
              public_id: public_id || `uploaded_${type}`,
              url: imageUrl,
              alt: file.name,
              uploadedAt: new Date(),
            },
          },
        },
      }));

      showToast(setToast, "success", "Image uploaded.");
    } catch (err) {
      console.error("Image upload failed", err);
      showToast(setToast, "error", "Image upload failed.");
      // revert preview by reloading settings from server or clearing preview
      // simple approach: clear that slot
      setSettings((prev) => ({
        ...prev,
        generalSettings: {
          ...prev.generalSettings,
          branding: {
            ...prev.generalSettings.branding,
            [type]: null,
          },
        },
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  // wrapper used by file input onChange
  const handleImageUpload = (type, file) => {
    // minimal mime check for favicon: allow png or ico, other images allowed for logos
    if (!file) return;
    if (type === "favicon") {
      const allowed = [
        "image/png",
        "image/x-icon",
        "image/vnd.microsoft.icon",
        "image/svg+xml",
      ];
      if (!allowed.includes(file.type)) {
        showToast(setToast, "error", "Favicon must be PNG/ICO/SVG.");
        return;
      }
    }
    handleImageFile(type, file);
  };

  const handleRemoveImage = (type) => {
    if (!window.confirm("Remove image?")) return;
    setSettings((prev) => ({
      ...prev,
      generalSettings: {
        ...prev.generalSettings,
        branding: {
          ...prev.generalSettings.branding,
          [type]: null,
        },
      },
    }));
  };

  /* ---------------------------
     Save settings
     --------------------------- */
  const handleSave = async () => {
    // client-side validation: ensure at least one valid admin email (the admin notification)
    // if (settings.email && settings.email.admin && !isValidEmail(settings.email.admin)) {
    //   showToast(setToast, 'error', 'Admin email is invalid.');
    //   return;
    // }
    if (settings.contact && Array.isArray(settings.contact.emails)) {
      for (const e of settings.contact.emails) {
        if (e.email && !isValidEmail(e.email)) {
          showToast(setToast, "error", `Invalid contact email: ${e.email}`);
          return;
        }
      }
    }

    setSaving(true);
    const token = localStorage.getItem("staffUserToken");
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Save failed: ${res.status} ${txt}`);
      }

      const json = await res.json();
      if (json && json.success) {
        // showToast(setToast, 'success', 'Settings saved.');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
        // update local copy with whatever server returned (if provided)
        if (json.settings) setSettings(json.settings);
      } else {
        throw new Error(json.message || "Save failed");
      }
    } catch (err) {
      console.error("Save settings error", err);
      showToast(setToast, "error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------
     Small UI render helpers
     --------------------------- */
  const tabCards = [
    {
      id: "general",
      title: "General Settings",
      description: "Branding, logos, and SEO configuration",
      icon: Sliders,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50",
    },
    {
      id: "contact",
      title: "Contact Settings",
      description: "Emails, phones, address & business hours",
      icon: Phone,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    // { id: 'email', title: 'Email Settings', description: 'Delivery and notification settings', icon: Mail, gradient: 'from-purple-500 to-violet-500', bgGradient: 'from-purple-50 to-violet-50' },
  ];

  // render loading state
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-xl">
          <div className="animate-spin w-10 h-10 border-b-2 border-pink-500 rounded-full mx-auto mb-4"></div>
          <div className="text-gray-700 font-medium">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}
          >
            {toast.message}
          </motion.div>
        )}

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl bg-green-600 text-white"
          >
            Settings saved successfully
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-2.5 rounded-xl shadow-lg shadow-pink-200">
                <Settings className="w-7 h-7 text-white" />
              </div>
              Settings Management
            </h1>
            <p className="text-gray-600 mt-2">
              Configure your store settings, branding, and preferences
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2.5 rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg disabled:opacity-70 font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tabCards.map((tab, index) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative cursor-pointer bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${activeTab === tab.id ? "border-pink-500 ring-4 ring-pink-100" : "border-transparent hover:border-gray-200"}`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`bg-gradient-to-br ${tab.gradient} p-3.5 rounded-xl shadow-lg`}
                >
                  <tab.icon className="w-7 h-7 text-white" />
                </div>
                {activeTab === tab.id && (
                  <div className="bg-pink-500 text-white p-1.5 rounded-full">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mt-4">
                {tab.title}
              </h3>
              <p className="text-gray-500 text-sm mt-2">{tab.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* General (branding & SEO) */}
            {activeTab === "general" && (
              <div className="divide-y divide-gray-100">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-2 rounded-lg">
                      <Palette className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Branding
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Upload your logos and favicon
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="">
                      <label
                        htmlFor="guestCheckout"
                        className="block text-sm font-semibold text-gray-700"
                      >
                        Guest Checkout
                      </label>
                      <input
                        type="checkbox"
                        name="guestCheckout"
                        id="guestCheckout"
                        checked={!!settings?.allowGuestCheckout}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            allowGuestCheckout: e.target.checked,
                          }))
                        }
                      />
                    </div>
                    {/* Site Logo */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Site Logo
                      </label>
                      <div className="relative group">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-pink-400 transition-colors bg-gray-50/50 min-h-[160px] flex flex-col items-center justify-center">
                          {settings.generalSettings.branding.siteLogo ? (
                            <>
                              <img
                                src={
                                  settings.generalSettings.branding.siteLogo.url
                                }
                                alt="Site Logo"
                                className="max-h-20 max-w-full object-contain rounded-lg"
                              />
                              <p className="text-xs text-gray-500 mt-3 truncate max-w-full">
                                Recommended size: 300×100 px (PNG, SVG or JPG up
                                to 5MB)
                              </p>
                              <div className="flex gap-2 mt-3">
                                <label className="text-xs bg-pink-100 text-pink-600 px-3 py-1.5 rounded-lg hover:bg-pink-200 transition-colors font-medium cursor-pointer">
                                  {uploading.siteLogo
                                    ? "Uploading..."
                                    : "Change"}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      e.target.files?.[0] &&
                                      handleImageUpload(
                                        "siteLogo",
                                        e.target.files[0],
                                      )
                                    }
                                  />
                                </label>
                                <button
                                  onClick={() => handleRemoveImage("siteLogo")}
                                  className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className="w-10 h-10 text-gray-400 mb-3" />
                              <p className="text-sm text-gray-500">
                                Drop image here or click to upload
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {" "}
                                Recommended size: 300×100 px (PNG, SVG or JPG up
                                to 5MB)
                              </p>
                              <label className="mt-3 text-sm bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors font-medium cursor-pointer">
                                Upload Logo
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    e.target.files?.[0] &&
                                    handleImageUpload(
                                      "siteLogo",
                                      e.target.files[0],
                                    )
                                  }
                                />
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Logo */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Admin Panel Logo
                      </label>
                      <div className="relative group">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-pink-400 transition-colors bg-gray-50/50 min-h-[160px] flex flex-col items-center justify-center">
                          {settings.generalSettings.branding.adminLogo ? (
                            <>
                              <img
                                src={
                                  settings.generalSettings.branding.adminLogo
                                    .url
                                }
                                alt="Admin Logo"
                                className="max-h-20 max-w-full object-contain rounded-lg"
                              />
                              <p className="text-xs text-gray-500 mt-3 truncate max-w-full">
                                Recommended size: 300×100 px (PNG, SVG or JPG up
                                to 5MB)
                              </p>
                              <div className="flex gap-2 mt-3">
                                <label className="text-xs bg-pink-100 text-pink-600 px-3 py-1.5 rounded-lg hover:bg-pink-200 transition-colors font-medium cursor-pointer">
                                  {uploading.adminLogo
                                    ? "Uploading..."
                                    : "Change"}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      e.target.files?.[0] &&
                                      handleImageUpload(
                                        "adminLogo",
                                        e.target.files[0],
                                      )
                                    }
                                  />
                                </label>
                                <button
                                  onClick={() => handleRemoveImage("adminLogo")}
                                  className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className="w-10 h-10 text-gray-400 mb-3" />
                              <p className="text-sm text-gray-500">
                                Drop image here or click to upload
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Recommended size: 300×100 px (PNG, SVG or JPG up
                                to 5MB)
                              </p>
                              <label className="mt-3 text-sm bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors font-medium cursor-pointer">
                                Upload Logo
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    e.target.files?.[0] &&
                                    handleImageUpload(
                                      "adminLogo",
                                      e.target.files[0],
                                    )
                                  }
                                />
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Favicon */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Favicon
                      </label>
                      <div className="relative group">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-pink-400 transition-colors bg-gray-50/50 min-h-[160px] flex flex-col items-center justify-center">
                          {settings.generalSettings.branding.favicon ? (
                            <>
                              <div className="bg-gray-100 p-4 rounded-xl">
                                <img
                                  src={
                                    settings.generalSettings.branding.favicon
                                      .url
                                  }
                                  alt="Favicon"
                                  className="w-12 h-12 object-contain"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-3">
                                32x32 or 64x64 recommended
                              </p>
                              <div className="flex gap-2 mt-3">
                                <label className="text-xs bg-pink-100 text-pink-600 px-3 py-1.5 rounded-lg hover:bg-pink-200 transition-colors font-medium cursor-pointer">
                                  {uploading.favicon
                                    ? "Uploading..."
                                    : "Change"}
                                  <input
                                    type="file"
                                    accept="image/*,.ico"
                                    className="hidden"
                                    onChange={(e) =>
                                      e.target.files?.[0] &&
                                      handleImageUpload(
                                        "favicon",
                                        e.target.files[0],
                                      )
                                    }
                                  />
                                </label>
                                <button
                                  onClick={() => handleRemoveImage("favicon")}
                                  className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className="w-10 h-10 text-gray-400 mb-3" />
                              <p className="text-sm text-gray-500">
                                Upload favicon
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                ICO, PNG 32x32
                              </p>
                              <label className="mt-3 text-sm bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors font-medium cursor-pointer">
                                Upload Icon
                                <input
                                  type="file"
                                  accept="image/*,.ico"
                                  className="hidden"
                                  onChange={(e) =>
                                    e.target.files?.[0] &&
                                    handleImageUpload(
                                      "favicon",
                                      e.target.files[0],
                                    )
                                  }
                                />
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO */}
                <div className="p-8 bg-gradient-to-r from-pink-50/50 to-transparent">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-lg">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        SEO Settings
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Optimize your store for search engines
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 max-w-3xl">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Site Title
                        <span className="text-gray-400 font-normal ml-2">
                          (
                          {
                            (settings.generalSettings.seo.siteTitle || "")
                              .length
                          }
                          /60 characters)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={settings.generalSettings.seo.siteTitle || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            generalSettings: {
                              ...prev.generalSettings,
                              seo: {
                                ...prev.generalSettings.seo,
                                siteTitle: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                        placeholder="Enter site title"
                        maxLength={60}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Site Description
                        <span className="text-gray-400 font-normal ml-2">
                          (
                          {
                            (settings.generalSettings.seo.siteDescription || "")
                              .length
                          }
                          /160 characters)
                        </span>
                      </label>
                      <textarea
                        value={
                          settings.generalSettings.seo.siteDescription || ""
                        }
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            generalSettings: {
                              ...prev.generalSettings,
                              seo: {
                                ...prev.generalSettings.seo,
                                siteDescription: e.target.value,
                              },
                            },
                          }))
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter site meta description"
                        maxLength={160}
                      />
                    </div>

                    {/* SEO Preview */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <p className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Search Engine Preview
                      </p>
                      <div className="space-y-1">
                        <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                          {settings.generalSettings.seo.siteTitle ||
                            "Your Site Title"}
                        </p>
                        <p className="text-green-700 text-sm">
                          www.pinkdreams.com
                        </p>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {settings.generalSettings.seo.siteDescription ||
                            "Your site description will appear here..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact tab (unchanged structure except API-backed state) */}
            {activeTab === "contact" && (
              <div className="divide-y divide-gray-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          Email Addresses
                        </h2>
                        <p className="text-gray-500 text-sm">
                          Manage your contact email addresses
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          contact: {
                            ...prev.contact,
                            emails: [
                              ...prev.contact.emails,
                              { label: "", email: "" },
                            ],
                          },
                        }))
                      }
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium text-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Email
                    </button>
                  </div>

                  <div className="space-y-4">
                    {settings.contact.emails.map((email, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl"
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                              Label
                            </label>
                            <input
                              type="text"
                              value={email.label}
                              onChange={(e) => {
                                const newEmails = [...settings.contact.emails];
                                newEmails[index].label = e.target.value;
                                setSettings((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    emails: newEmails,
                                  },
                                }));
                              }}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Support"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={email.email}
                              onChange={(e) => {
                                const newEmails = [...settings.contact.emails];
                                newEmails[index].email = e.target.value;
                                setSettings((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    emails: newEmails,
                                  },
                                }));
                              }}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                emails: prev.contact.emails.filter(
                                  (_, i) => i !== index,
                                ),
                              },
                            }))
                          }
                          className="mt-6 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                    {settings.contact.emails.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No email addresses added yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phones */}
                <div className="p-8 bg-gradient-to-r from-blue-50/30 to-transparent">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-lg">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          Phone Numbers
                        </h2>
                        <p className="text-gray-500 text-sm">
                          Manage your contact phone numbers
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          contact: {
                            ...prev.contact,
                            phones: [
                              ...prev.contact.phones,
                              { label: "", number: "" },
                            ],
                          },
                        }))
                      }
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl hover:bg-green-600 transition-colors font-medium text-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Phone
                    </button>
                  </div>

                  <div className="space-y-4">
                    {settings.contact.phones.map((phone, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-4 items-start bg-white p-4 rounded-xl border border-gray-100"
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                              Label
                            </label>
                            <input
                              type="text"
                              value={phone.label}
                              onChange={(e) => {
                                const newPhones = [...settings.contact.phones];
                                newPhones[index].label = e.target.value;
                                setSettings((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    phones: newPhones,
                                  },
                                }));
                              }}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="e.g., Main Office"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={phone.number}
                              onChange={(e) => {
                                const newPhones = [...settings.contact.phones];
                                newPhones[index].number = e.target.value;
                                setSettings((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    phones: newPhones,
                                  },
                                }));
                              }}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                phones: prev.contact.phones.filter(
                                  (_, i) => i !== index,
                                ),
                              },
                            }))
                          }
                          className="mt-6 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                    {settings.contact.phones.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Phone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No phone numbers added yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Single address */}
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-lg">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          Business Address
                        </h2>
                        <p className="text-gray-500 text-sm">
                          Manage your primary physical location
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 p-6 rounded-xl relative"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Address Line 1
                          </label>
                          <input
                            type="text"
                            value={settings.contact.address?.line1 || ""}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                contact: {
                                  ...prev.contact,
                                  address: {
                                    ...prev.contact.address,
                                    line1: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Street address"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={settings.contact.address?.line2 || ""}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                contact: {
                                  ...prev.contact,
                                  address: {
                                    ...prev.contact.address,
                                    line2: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Apt, Suite, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            City
                          </label>
                          <input
                            type="text"
                            value={settings.contact.address?.city || ""}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                contact: {
                                  ...prev.contact,
                                  address: {
                                    ...prev.contact.address,
                                    city: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            State/Province
                          </label>
                          <input
                            type="text"
                            value={settings.contact.address?.state || ""}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                contact: {
                                  ...prev.contact,
                                  address: {
                                    ...prev.contact.address,
                                    state: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            ZIP/Postal Code
                          </label>
                          <input
                            type="text"
                            value={settings.contact.address?.zip || ""}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                contact: {
                                  ...prev.contact,
                                  address: {
                                    ...prev.contact.address,
                                    zip: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="ZIP Code"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Country
                          </label>
                          <input
                            type="text"
                            value={settings.contact.address?.country || ""}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                contact: {
                                  ...prev.contact,
                                  address: {
                                    ...prev.contact.address,
                                    country: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Social */}
                <div className="p-8 bg-gradient-to-r from-purple-50/50 to-transparent">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-violet-500 p-2 rounded-lg">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Social Media Links
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Connect your social media profiles
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />{" "}
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={settings.contact.social.instagram || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              social: {
                                ...prev.contact.social,
                                instagram: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                      </label>
                      <input
                        type="url"
                        value={settings.contact.social.facebook || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              social: {
                                ...prev.contact.social,
                                facebook: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-sky-500" /> Twitter/X
                      </label>
                      <input
                        type="url"
                        value={settings.contact.social.twitter || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              social: {
                                ...prev.contact.social,
                                twitter: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-sky-500" /> Youtube
                      </label>
                      <input
                        type="url"
                        value={settings.contact.social.youtube || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              social: {
                                ...prev.contact.social,
                                youtube: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Business hours */}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Business Hours
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Set your operating hours
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-2xl">
                    {["weekdays", "saturday", "sunday"].map((day) => (
                      <div
                        key={day}
                        className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl"
                      >
                        <div className="w-28">
                          <p className="font-semibold text-gray-800 capitalize">
                            {day}
                          </p>
                          <p className="text-xs text-gray-500">
                            {day === "weekdays"
                              ? "Mon - Fri"
                              : day === "saturday"
                                ? "Saturday"
                                : "Sunday"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 flex-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.contact.hours[day].closed}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    hours: {
                                      ...prev.contact.hours,
                                      [day]: {
                                        ...prev.contact.hours[day],
                                        closed: e.target.checked,
                                      },
                                    },
                                  },
                                }))
                              }
                              className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm text-gray-600">
                              Closed
                            </span>
                          </label>
                        </div>

                        {!settings.contact.hours[day].closed ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={settings.contact.hours[day].open}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    hours: {
                                      ...prev.contact.hours,
                                      [day]: {
                                        ...prev.contact.hours[day],
                                        open: e.target.value,
                                      },
                                    },
                                  },
                                }))
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                              type="time"
                              value={settings.contact.hours[day].close}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    hours: {
                                      ...prev.contact.hours,
                                      [day]: {
                                        ...prev.contact.hours[day],
                                        close: e.target.value,
                                      },
                                    },
                                  },
                                }))
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                            />
                          </div>
                        ) : (
                          <span className="text-red-500 font-medium text-sm px-3 py-1.5 bg-red-50 rounded-lg">
                            Closed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Email tab */}
            {/* {activeTab === 'email' && (
              <div className="divide-y divide-gray-100">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-violet-500 p-2 rounded-lg"><Mail className="w-5 h-5 text-white" /></div>
                    <div><h2 className="text-xl font-bold text-gray-800">Email Configuration</h2><p className="text-gray-500 text-sm">Configure email sender and notification settings</p></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-100 p-2 rounded-lg"><Mail className="w-5 h-5 text-purple-600" /></div>
                        <div><h3 className="font-semibold text-gray-800">From Address</h3><p className="text-xs text-gray-500">Visible sender email for customers</p></div>
                      </div>
                      <input type="email" value={settings.email.from || ''} onChange={(e) => setSettings(prev => ({ ...prev, email: { ...prev.email, from: e.target.value } }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white" placeholder="noreply@example.com" />
                      <p className="text-xs text-gray-500 mt-3">This email will appear as the sender for automated emails</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-pink-100 p-2 rounded-lg"><Bell className="w-5 h-5 text-pink-600" /></div>
                        <div><h3 className="font-semibold text-gray-800">Admin Notifications</h3><p className="text-xs text-gray-500">Receive order and system notifications</p></div>
                      </div>
                      <input type="email" value={settings.email.admin || ''} onChange={(e) => setSettings(prev => ({ ...prev, email: { ...prev.email, admin: e.target.value } }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white" placeholder="admin@example.com" />
                      <p className="text-xs text-gray-500 mt-3">Admin will receive notifications for new orders, low stock, etc.</p>
                    </div>
                  </div>
                </div>
              </div>
            )} */}
          </motion.div>
        </AnimatePresence>

        {/* Footer Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-10 py-4 rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg disabled:opacity-70 font-semibold text-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>{" "}
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save All Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
