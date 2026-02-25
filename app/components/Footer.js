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

// =============================================
// POPUP CONTENT DATA - Professional & Production Ready
// =============================================

const PRIVACY_POLICY_CONTENT = {
  title: "Privacy Policy",
  lastUpdated: "January 15, 2025",
  sections: [
    {
      heading: "1. Introduction",
      content: "At Pink Dreams, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, make purchases, or interact with our services. By accessing or using our website, you agree to the terms of this Privacy Policy."
    },
    {
      heading: "2. Information We Collect",
      content: "We collect information you provide directly to us, including: Name, email address, phone number, shipping and billing addresses, payment information (processed securely through our payment partners), order history and preferences, and communication history when you contact our support team."
    },
    {
      heading: "3. How We Use Your Information",
      content: "We use the information we collect to: Process and fulfill your orders, including shipping and delivery, Communicate with you about your orders, promotions, and updates, Provide customer support and respond to your inquiries, Personalize your shopping experience and recommend products, Comply with legal obligations and prevent fraud, Improve our website, services, and customer experience."
    },
    {
      heading: "4. Information Sharing",
      content: "We may share your information with: Service providers who assist with payment processing, shipping, and marketing, Business partners for promotional purposes (with your consent), Legal authorities when required by law or to protect our rights, In the event of a merger or sale of our business."
    },
    {
      heading: "5. Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All sensitive data is encrypted using industry-standard SSL/TLS technology. However, no method of transmission over the Internet is 100% secure."
    },
    {
      heading: "6. Your Rights",
      content: "You have the right to: Access the personal information we hold about you, Request correction of inaccurate data, Request deletion of your personal information (subject to legal requirements), Opt-out of marketing communications at any time, Request a copy of your data in a portable format."
    },
    {
      heading: "7. Cookies & Tracking Technologies",
      content: "We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookies through your browser settings, though disabling them may affect some website functionality."
    },
    {
      heading: "8. Third-Party Links",
      content: "Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any website you visit."
    },
    {
      heading: "9. Children's Privacy",
      content: "Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child, please contact us immediately."
    },
    {
      heading: "10. Changes to This Policy",
      content: "We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the 'Last Updated' date. Your continued use of our website after any changes constitutes acceptance of the new terms."
    },
    {
      heading: "11. Contact Us",
      content: "If you have any questions or concerns about this Privacy Policy, please contact our Privacy Team at privacy@pinkdreams.com or call our customer service hotline."
    }
  ]
};

const TERMS_OF_SERVICE_CONTENT = {
  title: "Terms of Service",
  lastUpdated: "January 15, 2025",
  sections: [
    {
      heading: "1. Acceptance of Terms",
      content: "Welcome to Pink Dreams. By accessing and using our website (www.pinkdreams.com), you accept and agree to be bound by the terms and provision of this agreement. Additionally, when using Pink Dreams services, you shall be subject to any posted guidelines or rules applicable to such services."
    },
    {
      heading: "2. Description of Service",
      content: "Pink Dreams provides users with access to a rich collection of resources, including various communications tools, forums, shopping services, personalized content, and branded programming through its network of properties. You also understand and agree that the service may include advertisements and that these advertisements are necessary for Pink Dreams to provide the service."
    },
    {
      heading: "3. Registration Obligations",
      content: "In consideration of your use of the Service, you agree to: (a) Provide true, accurate, current, and complete information about yourself as prompted by the Service's registration form and (b) Maintain and promptly update the registration data to keep it true, accurate, current, and complete. If you provide any information that is untrue, inaccurate, not current, or incomplete, Pink Dreams has the right to suspend or terminate your account and refuse any and all current or future use of the Service."
    },
    {
      heading: "4. Privacy Policy",
      content: "Registration data and certain other information about you is subject to our Privacy Policy. You understand that through your use of the Service, you consent to the collection and use of this information, including the transfer of this information to other countries for storage, processing, and use."
    },
    {
      heading: "5. User Conduct",
      content: "You agree not to use the Service to: Upload, post, email, transmit, or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable; Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity; Upload, post, email, transmit, or otherwise make available any content that you do not have a right to make available under any law or under contractual or fiduciary relationships; Upload, post, email, transmit, or otherwise make available any content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights of any party."
    },
    {
      heading: "6. Purchases & Payments",
      content: "By placing an order through Pink Dreams, you agree to pay all charges incurred in connection with your purchase at the prices then in effect. All prices are listed in Pakistani Rupees (PKR) and are subject to change without notice. We reserve the right to refuse or cancel any order for any reason, including but not limited to: product availability, pricing errors, suspected fraud, or violation of these terms."
    },
    {
      heading: "7. Shipping & Delivery",
      content: "Pink Dreams will make every effort to deliver products within the estimated delivery timeframes. However, delivery times are estimates and not guaranteed. Risk of loss and title for products pass to you upon delivery to the shipping carrier. We are not responsible for delays caused by customs clearance or circumstances beyond our control."
    },
    {
      heading: "8. Returns & Exchanges",
      content: "We want you to be completely satisfied with your purchase. Items may be returned or exchanged within 7 days of delivery, provided they are unworn, unwashed, and have all original tags attached. Sale items, intimate apparel, and accessories may not be eligible for return. Please refer to our Returns & Exchanges page for detailed instructions."
    },
    {
      heading: "9. Intellectual Property Rights",
      content: "All content on Pink Dreams, including but not limited to text, graphics, logos, button icons, images, audio clips, digital downloads, and data compilations, is the property of Pink Dreams or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, display, or create derivative works from any content without our express written permission."
    },
    {
      heading: "10. Disclaimer of Warranties",
      content: "THE SERVICE IS PROVIDED ON AN 'AS IS' AND 'AS AVAILABLE' BASIS. PINK DREAMS MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE SERVICE, OR THE INFORMATION, CONTENT, OR MATERIALS INCLUDED THEREIN. YOU EXPRESSLY AGREE THAT YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK."
    },
    {
      heading: "11. Limitation of Liability",
      content: "IN NO EVENT SHALL PINK DREAMS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (i) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE."
    },
    {
      heading: "12. Governing Law",
      content: "These Terms of Service shall be governed by and construed in accordance with the laws of Pakistan. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Karachi, Pakistan."
    },
    {
      heading: "13. Contact Information",
      content: "For questions about these Terms of Service, please contact us at legal@pinkdreams.com or call our customer service team."
    }
  ]
};

const COOKIES_POLICY_CONTENT = {
  title: "Cookie Policy",
  lastUpdated: "January 15, 2025",
  sections: [
    {
      heading: "1. What Are Cookies?",
      content: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners. Cookies allow websites to recognize your device and remember information about your visit, such as your preferred language, login information, and other settings. This can make your next visit easier and the site more useful to you."
    },
    {
      heading: "2. How We Use Cookies",
      content: "Pink Dreams uses cookies for various purposes to enhance your shopping experience: Essential cookies required for basic website functionality (shopping cart, checkout process), Performance and analytics cookies to understand how visitors use our website, Functional cookies to remember your preferences and settings, Marketing cookies to deliver relevant advertisements and track campaign performance, Third-party cookies from our partners for social media features and analytics."
    },
    {
      heading: "3. Types of Cookies We Use",
      content: "Session Cookies: Temporary cookies that exist only during your browsing session. They are deleted when you close your browser. Persistent Cookies: Remain on your device for a specified period even after you close the browser. First-Party Cookies: Set by Pink Dreams directly. Third-Party Cookies: Set by trusted third-party services we use (Google Analytics, Facebook Pixel, payment processors)."
    },
    {
      heading: "4. Cookie Categories",
      content: "Strictly Necessary Cookies: These are essential for the website to function. They enable you to navigate the site and use features like secure areas and shopping carts. Without these cookies, services you have asked for cannot be provided. Performance Cookies: Collect information about how visitors use our website, such as which pages are visited most often. This helps us improve how our website works. Functionality Cookies: Allow our website to remember choices you make (like language, currency, or region) and provide enhanced, personalized features."
    },
    {
      heading: "5. Managing Cookies",
      content: "You have the right to decide whether to accept or reject cookies. You can manage your cookie preferences through: Browser Settings: Most web browsers allow you to control cookies through their settings. You can set your browser to reject all or some cookies, or to alert you when cookies are being set. Cookie Consent Manager: When you first visit our website, you can use our cookie consent tool to manage your preferences. Third-Party Opt-Outs: You can opt-out of specific third-party cookies through their respective opt-out pages (e.g., Google Analytics, Facebook)."
    },
    {
      heading: "6. Specific Cookies We Use",
      content: "Cart Cookies: remember_items_in_cart, cart_total - Essential for shopping cart functionality. Session Cookies: session_id, user_token - Maintain your logged-in state. Analytics: _ga, _gid, _gat - Help us understand website traffic and user behavior. Marketing: fb_pixel, ad_id - Track advertising effectiveness and deliver personalized ads. Preferences: currency, language, region - Remember your display preferences."
    },
    {
      heading: "7. Impact of Disabling Cookies",
      content: "If you choose to disable cookies, please note that some parts of our website may not function properly. You may not be able to: Add items to your shopping cart and complete checkout, Access your account and view order history, Receive personalized recommendations, Take advantage of certain features designed to improve your shopping experience."
    },
    {
      heading: "8. Cookies & Personal Information",
      content: "Cookies themselves do not contain personal information that directly identifies you. However, when you provide personal information to Pink Dreams (such as creating an account or making a purchase), this information may be linked to the data stored in cookies. We handle all personal information collected through cookies in accordance with our Privacy Policy."
    },
    {
      heading: "9. Updates to This Policy",
      content: "We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. We will post any changes on this page and update the 'Last Updated' date. We encourage you to review this policy periodically to stay informed about how we use cookies."
    },
    {
      heading: "10. Contact Us",
      content: "If you have any questions about our use of cookies or this Cookie Policy, please contact our Privacy Team at privacy@pinkdreams.com or call our customer service hotline."
    }
  ]
};

// =============================================
// POPUP COMPONENT
// =============================================

const PolicyPopup = ({ isOpen, onClose, content }) => {
  if (!isOpen || !content) return null;

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
              {content === PRIVACY_POLICY_CONTENT ? (
                <Shield className="w-5 h-5 text-white" />
              ) : content === TERMS_OF_SERVICE_CONTENT ? (
                <FileText className="w-5 h-5 text-white" />
              ) : (
                <Cookie className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{content.title}</h2>
              <p className="text-xs text-gray-500">Last Updated: {content.lastUpdated}</p>
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
          <div className="space-y-6">
            {content.sections.map((section, index) => (
              <div key={index} className="group">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">
                  {section.heading}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
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
  
  // Popup state management
  const [activePopup, setActivePopup] = useState(null);

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

  const storeAddress = settings?.contact.address;

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
      href: `${settings?.contact.social.facebook}`,
      color: "hover:text-blue-600",
      count: "125K",
    },
    {
      icon: Instagram,
      href: `${settings?.contact.social.instagram}`,
      color: "hover:text-pink-600",
      count: "89K",
    },
    {
      icon: Twitter,
      href: `${settings?.contact.social.twitter}`,
      color: "hover:text-blue-400",
      count: "45K",
    },
    {
      icon: Youtube,
      href: `${settings?.contact.social.youtube}`,
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
  const supportEmail = settings?.contact.emails.find((e) =>
    e.label?.toLowerCase().includes("support"),
  )?.email;

  const supportNumber = settings?.contact.phones.find((e) =>
    e.label.toLowerCase().includes("support"),
  );

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
      try {
        const response = await fetch(`${API_BASE}/categories?active=true`);
        const data = await response.json();

        if (!mounted) return;

        if (data?.success && Array.isArray(data.categories)) {
          const names = extractCategoryNames(data.categories);
          setFooterCategories(
            names.length ? names : FALLBACK_FOOTER_CATEGORIES,
          );
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

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <footer className="bg-gradient-to-br from-pink-50 via-white to-purple-50 border-t border-pink-100">
      {/* Featured Slider Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="relative bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl overflow-hidden">
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
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
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
                  />
                </Link>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
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
                      className={`w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white ${social.color} transition-all duration-300 hover:shadow-lg`}
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
              <h4 className="font-semibold text-gray-800">Stay Updated</h4>
              <div className="space-y-2">
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 text-sm border border-pink-200 rounded-l-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleNewsletterSubmit}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-r-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300 flex items-center"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Get exclusive deals and style tips!
                </p>
              </div>
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
                    {storeAddress?.line1}, {storeAddress?.line2},{" "}
                    {storeAddress?.city}, {storeAddress?.country}
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
                    {supportNumber?.number}
                  </p>
                  <p className="text-gray-500 text-xs capitalize">
                    {settings?.contact.hours.weekdays.day}{" "}
                    {settings?.contact.hours.weekdays.open}-
                    {settings?.contact.hours.weekdays.close} PKT
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
                  <p className="text-gray-600 text-sm">{supportEmail}</p>
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
                  onClick={() => setActivePopup('privacy')}
                  className="text-gray-600 hover:text-pink-600 text-sm transition-colors duration-300"
                >
                  Privacy
                </button>
                <button
                  onClick={() => setActivePopup('terms')}
                  className="text-gray-600 hover:text-pink-600 text-sm transition-colors duration-300"
                >
                  Terms
                </button>
                <button
                  onClick={() => setActivePopup('cookies')}
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
        isOpen={activePopup === 'privacy'}
        onClose={() => setActivePopup(null)}
        content={PRIVACY_POLICY_CONTENT}
      />
      <PolicyPopup 
        isOpen={activePopup === 'terms'}
        onClose={() => setActivePopup(null)}
        content={TERMS_OF_SERVICE_CONTENT}
      />
      <PolicyPopup 
        isOpen={activePopup === 'cookies'}
        onClose={() => setActivePopup(null)}
        content={COOKIES_POLICY_CONTENT}
      />
    </footer>
  );
}
