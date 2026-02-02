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
  Shield,
  Truck,
  RefreshCw,
  CreditCard,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gift,
  Award,
  Users,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SettingContext } from "../context/SettingContext";
import Image from "next/image";
import Link from "next/link";

export default function ModernFooter() {
  const { settings } = useContext(SettingContext);
  console.log(settings);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");

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
    {
      title: "Categories",
      links: [
        { name: "Dresses", href: "/shop?category=dresses" },
        { name: "Tops & Blouses", href: "/shop?category=tops" },
        { name: "Bottoms", href: "/shop?category=bottoms" },
        { name: "Accessories", href: "/shop?category=accessories" },
        { name: "Shoes", href: "/shop?category=shoes" },
        { name: "Bags", href: "/shop?category=bags" },
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

  const socialLinks = [
    {
      icon: Facebook,
      href: `${settings.contact.social.facebook}`,
      color: "hover:text-blue-600",
      count: "125K",
    },
    {
      icon: Instagram,
      href: `${settings.contact.social.instagram}`,
      color: "hover:text-pink-600",
      count: "89K",
    },
    {
      icon: Twitter,
      href: `${settings.contact.social.twitter}`,
      color: "hover:text-blue-400",
      count: "45K",
    },
    {
      icon: Youtube,
      href: `${settings.contact.social.youtube}`,
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
  const supportEmail = settings.contact.emails.find((e) =>
    e.label?.toLowerCase().includes("support"),
  )?.email;

  const supportNumber = settings.contact.phones.find((e) =>
    e.label.toLowerCase().includes("support"),
  );

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderContent.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
              {settings.branding.siteLogo.url ? (
                <Link
                  href="/"
                  className="relative flex items-center justify-start w-32 h-12 sm:w-48 sm:h-14 flex-shrink-0 "
                >
                  <Image
                    src={settings?.branding?.siteLogo?.url}
                    alt={settings.branding.siteLogo.alt}
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
              {settings.siteDescription ||
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
            {footerSections.map((section, index) => (
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
                    {storeAddress.line1}, {storeAddress.line2},{" "}
                    {storeAddress.city}, {storeAddress.country}
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
                    {supportNumber.number}
                  </p>
                  <p className="text-gray-500 text-xs capitalize">
                    {settings.contact.hours.weekdays.day}{" "}
                    {settings.contact.hours.weekdays.open}-
                    {settings.contact.hours.weekdays.close} PKT
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
                <a
                  href="/privacy"
                  className="text-gray-600 hover:text-pink-600 text-sm transition-colors duration-300"
                >
                  Privacy
                </a>
                <a
                  href="/terms"
                  className="text-gray-600 hover:text-pink-600 text-sm transition-colors duration-300"
                >
                  Terms
                </a>
                <a
                  href="/cookies"
                  className="text-gray-600 hover:text-pink-600 text-sm transition-colors duration-300"
                >
                  Cookies
                </a>
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
    </footer>
  );
}
