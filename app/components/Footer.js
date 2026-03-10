"use client";
import React, { useContext } from "react";

import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Heart,
  Truck,
  RefreshCw,
  CreditCard,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Award,
  Users,
  TrendingUp,
  Shield,
  FileText,
  Cookie,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SettingContext } from "../context/SettingContext";
import Image from "next/image";
import Link from "next/link";

// Shared footer category cache (memory + sessionStorage)
const FOOTER_CATEGORY_CACHE_KEY = "footer_categories_cache_v1";
const FOOTER_CATEGORY_CACHE_TTL_MS = 30 * 60 * 1000;
let footerCategoryMemoryCache = null;
let footerCategoryMemoryTs = 0;

const readFooterCategoryCache = () => {
  if (
    footerCategoryMemoryCache &&
    Date.now() - footerCategoryMemoryTs < FOOTER_CATEGORY_CACHE_TTL_MS
  ) {
    return footerCategoryMemoryCache;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(FOOTER_CATEGORY_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.categories) || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > FOOTER_CATEGORY_CACHE_TTL_MS) return null;

    footerCategoryMemoryCache = parsed.categories;
    footerCategoryMemoryTs = parsed.ts;
    return parsed.categories;
  } catch {
    return null;
  }
};

const writeFooterCategoryCache = (categories) => {
  if (!Array.isArray(categories) || categories.length === 0) return;

  footerCategoryMemoryCache = categories;
  footerCategoryMemoryTs = Date.now();

  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      FOOTER_CATEGORY_CACHE_KEY,
      JSON.stringify({ categories, ts: footerCategoryMemoryTs }),
    );
  } catch {
    // ignore storage write errors
  }
};

// =============================================
// POPUP COMPONENT
// =============================================

const PolicyPopup = ({ isOpen, onClose, content, isLoading = false }) => {
  if (!isOpen) return null;

  const iconType = content?.icon || "file";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              {iconType === "shield" ? (
                <Shield className="w-5 h-5 text-white" />
              ) : iconType === "cookie" ? (
                <Cookie className="w-5 h-5 text-white" />
              ) : (
                <FileText className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {content?.title || "Policy"}
              </h2>
              <p className="text-xs text-gray-500">
                Last Updated: {content?.lastUpdated || "-"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-pink-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-28 items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {(content?.sections || []).map((section, index) => (
                <div key={index} className="group">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">
                    {section.heading}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
              {!content?.sections?.length && (
                <p className="text-sm text-gray-500">
                  Policy content is not available right now.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-pink-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              By using this website, you agree to our terms.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ModernFooter() {
  const { settings } = useContext(SettingContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("idle");
  
  // Popup state management
  const [activePopup, setActivePopup] = useState(null);
  const [policyContentByType, setPolicyContentByType] = useState({});
  const [policyLoading, setPolicyLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const MAX_FOOTER_CATEGORIES = 20;
  const FALLBACK_FOOTER_CATEGORIES = [
    "Dresses",
    "Tops & Blouses",
    "Bottoms",
    "Accessories",
    "Shoes",
    "Bags",
  ];

  const [footerCategories, setFooterCategories] = useState(
    FALLBACK_FOOTER_CATEGORIES,
  );

  const contactSettings = settings?.contact || {};
  const contactSocial = contactSettings?.social || {};
  const supportEmail = String(contactSettings?.email || "").trim();
  const supportNumber = String(contactSettings?.phone || "").trim();
  const storeAddressText = String(contactSettings?.address || "").trim();

  // Enhanced slider content with more engaging copy
  const sliderContent = [
    {
      title: "New Arrivals Every Week",
      subtitle: "Stay ahead of trends with our weekly drops",
      icon: TrendingUp,
      gradient: "from-pink-500 to-rose-500",
      cta: "Shop New",
    },
    {
      title: "Free Shipping Over Rs.2000",
      subtitle: "Fast delivery across Pakistan",
      icon: Truck,
      gradient: "from-purple-500 to-pink-500",
      cta: "Learn More",
    },
    {
      title: "Join 50K+ Happy Customers",
      subtitle: "Rated 4.8/5 stars by our community",
      icon: Users,
      gradient: "from-rose-500 to-pink-500",
      cta: "Read Reviews",
    },
    {
      title: "Premium Quality Guaranteed",
      subtitle: "7-day exchange guarantee",
      icon: Award,
      gradient: "from-pink-500 to-fuchsia-500",
      cta: "Our Promise",
    },
  ];

  const footerSections = [
    {
      title: "Shop",
      links: [
        { name: "New Arrivals", href: "/new-arrivals", badge: "Hot" },
        { name: "Best Sellers", href: "/best-sellers", badge: "Popular" },
        { name: "Sale Items", href: "/sale", badge: "Up to 70% Off" },
        { name: "Gift Cards", href: "/gift-cards" },
        { name: "Lookbook", href: "/lookbook" },
      ],
    },
    // {
    //   title: 'Support',
    //   links: [
    //     { name: 'Help Center', href: '/help' },
    //     { name: 'Size Guide', href: '/size-guide' },
    //     { name: 'Shipping Info', href: '/shipping' },
    //     { name: 'Returns & Exchanges', href: '/returns' },
    //     { name: 'Track Your Order', href: '/track-order' },
    //     { name: 'Contact Us', href: '/contact' }
    //   ]
    // }
  ];

  const extractCategoryNames = (categories = []) => {
    const uniqueByKey = new Map();

    for (const category of categories) {
      const rawName = typeof category === "string" ? category : category?.name;
      const name = String(rawName || "").trim();
      if (!name) continue;

      const key = name.toLowerCase();
      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, name);
      }
    }

    return Array.from(uniqueByKey.values());
  };

  const visibleFooterCategories = footerCategories.slice(
    0,
    MAX_FOOTER_CATEGORIES,
  );
  const hiddenCategoryCount = Math.max(
    footerCategories.length - MAX_FOOTER_CATEGORIES,
    0,
  );

  const socialLinks = [
    {
      icon: Facebook,
      href: contactSocial.facebook || "#",
      color: "hover:text-blue-600",
      count: "125K",
    },
    {
      icon: Instagram,
      href: contactSocial.instagram || "#",
      color: "hover:text-pink-600",
      count: "89K",
    },
    {
      icon: Twitter,
      href: contactSocial.twitter || "#",
      color: "hover:text-blue-400",
      count: "45K",
    },
    {
      icon: Youtube,
      href: contactSocial.youtube || "#",
      color: "hover:text-red-400",
      count: "23K",
    },
  ];

  const trustFeatures = [
    { icon: Shield, text: "Secure Payment", subtext: "SSL Protected" },
    { icon: Truck, text: "Free Shipping", subtext: "Orders Rs.2000+" },
    { icon: RefreshCw, text: "Easy Returns", subtext: "7 Days" },
    { icon: Heart, text: "Loved by 50K+", subtext: "Happy Customers" },
  ];

  const paymentMethods = [
    "📱 JazzCash",
    "💳 EasyPaisa",
    "🏦 Bank Transfer",
    "💳 Visa/Master",
  ];

  const footerShellStyle = {
    backgroundImage:
      "linear-gradient(135deg, color-mix(in srgb, var(--color-brand-primary) 8%, var(--color-bg-section) 92%), var(--color-bg-section), color-mix(in srgb, var(--color-brand-accent) 10%, var(--color-bg-section) 90%))",
    borderTopColor: "var(--color-border-default)",
  };

  const brandGradientStyle = {
    backgroundImage:
      "linear-gradient(90deg, var(--color-brand-gradient-from), var(--color-brand-gradient-to))",
  };
  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderContent.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadFooterCategories = async () => {
      const cachedCategories = readFooterCategoryCache();
      if (cachedCategories?.length) {
        setFooterCategories(cachedCategories);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/categories?active=true`);
        const data = await response.json();

        if (!mounted) return;

        if (data?.success && Array.isArray(data.categories)) {
          const names = extractCategoryNames(data.categories);
          const resolvedCategories =
            names.length ? names : FALLBACK_FOOTER_CATEGORIES;
          setFooterCategories(resolvedCategories);
          writeFooterCategoryCache(resolvedCategories);
        } else {
          setFooterCategories(FALLBACK_FOOTER_CATEGORIES);
        }
      } catch {
        if (mounted) {
          setFooterCategories(FALLBACK_FOOTER_CATEGORIES);
        }
      }
    };

    loadFooterCategories();

    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderContent.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + sliderContent.length) % sliderContent.length,
    );
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setNewsletterStatus("error");
      setNewsletterMessage("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setNewsletterStatus("error");
      setNewsletterMessage("Please enter a valid email address.");
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage("");
    setNewsletterStatus("idle");

    try {
      const response = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          name: "",
          source: "website",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to subscribe.");
      }

      setNewsletterStatus("success");
      setNewsletterMessage(
        data?.message || "Subscribed successfully. Please check your inbox.",
      );
      setEmail("");
    } catch (error) {
      setNewsletterStatus("error");
      setNewsletterMessage(error.message || "Failed to subscribe.");
    } finally {
      setNewsletterLoading(false);
    }
  };

  const openPolicyPopup = async (policyType) => {
    setActivePopup(policyType);
    if (policyContentByType[policyType]) return;

    setPolicyLoading(true);
    try {
      const { POLICY_CONTENT } = await import("./footerPolicyContent");
      setPolicyContentByType((prev) => ({
        ...prev,
        ...POLICY_CONTENT,
      }));
    } catch {
      setPolicyContentByType((prev) => ({
        ...prev,
        [policyType]: null,
      }));
    } finally {
      setPolicyLoading(false);
    }
  };

  return (
    <footer className="border-t" style={footerShellStyle}>
      {/* Featured Slider Section */}
      <div className="container mx-auto px-4 py-8">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={brandGradientStyle}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <button
                onClick={prevSlide}
                className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex-1 text-center">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      {React.createElement(sliderContent[currentSlide].icon, {
                        className: "w-6 h-6 text-white",
                      })}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {sliderContent[currentSlide].title}
                  </h3>
                  <p className="text-white/90 max-w-md mx-auto">
                    {sliderContent[currentSlide].subtitle}
                  </p>
                  <button className="bg-white text-pink-600 px-6 py-2 rounded-full font-semibold hover:bg-pink-50 transition-colors inline-flex items-center gap-2">
                    {sliderContent[currentSlide].cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </div>

              <button
                onClick={nextSlide}
                className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {sliderContent.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Features */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                style={brandGradientStyle}
              >
                {React.createElement(feature.icon, {
                  className: "w-6 h-6 text-white",
                })}
              </div>
              <h4 className="font-semibold text-gray-800">{feature.text}</h4>
              <p className="text-sm text-gray-600">{feature.subtext}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Column 1: Brand + Social + Newsletter */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Brand */}
            <div className="flex items-center space-x-2">
              {settings?.branding.siteLogo.url ? (
                <Link
                  href="/"
                  className="relative flex items-center justify-start w-32 h-12 sm:w-48 sm:h-14 flex-shrink-0 "
                >
                  <Image
                    src={settings?.branding?.siteLogo?.url}
                    alt={settings?.branding.siteLogo.alt}
                    className="object-contain"
                    fill
                    sizes="(max-width: 640px) 100vw,
                                   (max-width: 1024px) 100vw,
                                   100vw"
                    priority
                  />
                </Link>
              ) : (
                <>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={brandGradientStyle}
                  >
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <span
                    className="text-2xl font-bold bg-clip-text text-transparent"
                    style={brandGradientStyle}
                  >
                    Pink Dreams
                  </span>
                </>
              )}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {settings?.siteDescription ||
                "Your destination for trendy, high-quality fashion that makes every day feel special. Discover styles that speak to your unique personality."}
            </p>

            {/* Social Links */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Follow Us</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <motion.div
                    key={index}
                    className="group relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <a
                      href={social.href}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${social.color} transition-all duration-300 hover:shadow-lg`}
                      style={brandGradientStyle}
                    >
                      {React.createElement(social.icon, {
                        className: "w-5 h-5",
                      })}
                    </a>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {social.count}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Newsletter</h4>
              <p className="text-xs text-gray-500">
                Get product drops and exclusive offers.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (newsletterMessage) {
                        setNewsletterMessage("");
                        setNewsletterStatus("idle");
                      }
                    }}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 text-sm border border-pink-200 rounded-l-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={newsletterLoading}
                  />
                  <button
                    type="submit"
                    className="text-white px-6 py-2 rounded-r-full transition-all duration-300 flex items-center hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={brandGradientStyle}
                    disabled={newsletterLoading}
                  >
                    {newsletterLoading ? "..." : <Mail className="w-4 h-4" />}
                  </button>
                </div>
                {newsletterMessage && (
                  <p
                    className={`text-xs ${
                      newsletterStatus === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {newsletterMessage}
                  </p>
                )}
              </form>
            </div>
          </motion.div>

          {/* Column 2: Footer Links */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li
                      key={link.name}
                      className="flex items-center justify-between"
                    >
                      <a
                        href={link.href}
                        className="text-gray-600 hover:text-pink-600 text-sm transition hover:translate-x-1"
                      >
                        {link.name}
                      </a>
                      {link.badge && (
                        <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-medium">
                          {link.badge}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {visibleFooterCategories.map((categoryName) => (
                  <Link
                    key={categoryName}
                    href={`/shop?category=${encodeURIComponent(categoryName)}`}
                    className="inline-flex items-center bg-pink-100 text-pink-600 text-xs px-3 py-1 rounded-full font-medium hover:bg-pink-200 transition-colors"
                  >
                    {categoryName}
                  </Link>
                ))}

                {hiddenCategoryCount > 0 && (
                  <span className="inline-flex items-center bg-pink-50 border border-pink-200 text-pink-700 text-xs px-3 py-1 rounded-full font-semibold">
                    {hiddenCategoryCount}+ more
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Column 3: Contact Info + Reviews */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-semibold text-gray-800 mb-4 text-lg">
              Get in Touch
            </h3>
            <div className="space-y-4">
              {/* Address */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Our Store</p>
                  <p className="text-gray-600 text-sm">
                    {storeAddressText || "Address not configured"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Call Us</p>
                  <p className="text-gray-600 text-sm">
                    {supportNumber || "Phone not configured"}
                  </p>
                  <p className="text-gray-500 text-xs capitalize">
                    {settings?.contact?.hours?.weekdays?.day || "weekdays"}{" "}
                    {settings?.contact?.hours?.weekdays?.open || "09:00"}-
                    {settings?.contact?.hours?.weekdays?.close || "18:00"} PKT
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Email Us</p>
                  <p className="text-gray-600 text-sm">
                    {supportEmail || "support@pinkdreams.com"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    We reply within 24 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Reviews */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  4.8/5
                </span>
              </div>
              <p className="text-xs text-gray-600 italic">
                "Amazing quality and fast shipping! Love my new dress!"
              </p>
              <p className="text-xs text-gray-500 mt-1">- Sarah K.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-pink-200 bg-white/50">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <p className="text-gray-600 text-sm">
                © 2025 Pink Dreams. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => openPolicyPopup("privacy")}
                  className="text-gray-600 hover:text-pink-600 text-sm transition-colors duration-300"
                >
                  Privacy
                </button>
                <button
                  onClick={() => openPolicyPopup("terms")}
                  className="text-gray-600 hover:text-pink-600 text-sm transition-colors duration-300"
                >
                  Terms
                </button>
                <button
                  onClick={() => openPolicyPopup("cookies")}
                  className="text-gray-600 hover:text-pink-600 text-sm transition-colors duration-300"
                >
                  Cookies
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-600 text-sm mr-2">We accept:</span>
              {paymentMethods.map((method, index) => (
                <div
                  key={index}
                  className="bg-white rounded px-3 py-1 text-xs border border-gray-200 shadow-sm"
                >
                  {method}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Policy Popups */}
      <PolicyPopup
        isOpen={Boolean(activePopup)}
        onClose={() => setActivePopup(null)}
        content={activePopup ? policyContentByType[activePopup] : null}
        isLoading={Boolean(
          policyLoading && activePopup && !policyContentByType[activePopup],
        )}
      />
    </footer>
  );
}
