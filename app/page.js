"use client";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import {
  ShoppingBag,
  Star,
  Users,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Newsletter from "./components/Newsletter";
import { useAuth } from "./context/AuthContext";
import Image from "next/image";

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Static categories as fallback
const STATIC_CATEGORIES = [
  "Dresses",
  "Tops",
  "Bottoms",
  "Accessories",
  "Shoes",
];

// Counter component for animated numbers
function Counter({ value, duration = 3.5, format = "number" }) {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0.25,
    stiffness: 80,
    damping: 15,
  });
  const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        let displayValue = latest;

        switch (format) {
          case "k":
            displayValue = `${(latest / 1000).toFixed(0)}K`;
            break;
          case "rating":
            displayValue = (latest / 10).toFixed(1);
            break;
          case "number":
          default:
            displayValue = latest.toFixed(0);
            break;
        }

        ref.current.textContent = displayValue;
      }
    });
  }, [springValue, format]);

  return <span ref={ref} />;
}

export default function Home() {
  // State for dynamic data
      const { user } = useAuth()
  
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    featuredProducts: 0,
    categoryStats: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

 
  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const fetchJson = async (url) => {
        const res = await fetch(url);
        return res.json();
      };

      const [featuredData, categoriesData, statsData] = await Promise.all([
        fetchJson(`${API_BASE}/featured-products?limit=4`).catch(() => null),
        fetchJson(`${API_BASE}/categories?active=true`).catch(() => null),
        fetchJson(`${API_BASE}/dashboard/stats`).catch(() => null),
      ]);

      let productsToShow = [];
      if (featuredData?.success && featuredData?.products?.length > 0) {
        productsToShow = featuredData.products;
      } else {
        const allProductsData = await fetchJson(
          `${API_BASE}/allproducts?limit=4&sortBy=date&sortOrder=desc`,
        ).catch(() => null);
        if (allProductsData?.success) {
          productsToShow = allProductsData.products;
        }
      }

      setFeaturedProducts(productsToShow);

      if (categoriesData?.success && categoriesData?.categories) {
        // Extract category names from dynamic categories
        const dynamicCategoryNames = categoriesData.categories
          .map((cat) => {
            // Handle both object and string formats
            if (typeof cat === "string") return cat;
            if (cat && typeof cat === "object" && cat.name) return cat.name;
            return null;
          })
          .filter(
            (name) =>
              name &&
              name.toLowerCase() !== "women" &&
              name.toLowerCase() !== "all",
          )
          .sort((a, b) => a.localeCompare(b));

        setDynamicCategories(dynamicCategoryNames);

        // Combine dynamic and static categories (avoiding duplicates)
        const uniqueStaticCategories = STATIC_CATEGORIES.filter(
          (staticCat) => !dynamicCategoryNames.includes(staticCat),
        );

        // Create combined list for homepage (take first 3)
        const combinedCategories = [
          ...dynamicCategoryNames,
          ...uniqueStaticCategories,
        ];

        // Take first 6 categories for homepage display
        setCategories(combinedCategories.slice(0, 6));
      } else {
        // Fallback to static categories
        console.warn("No dynamic categories found, using static categories");
        setCategories(STATIC_CATEGORIES.slice(0, 6));
        setDynamicCategories([]);
      }

      if (statsData?.success) {
        setStats(statsData.stats);
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Fallback to static categories on error
      setCategories(STATIC_CATEGORIES.slice(0, 6));
      setDynamicCategories([]);
      setError("Failed to load some data");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic stats based on real data
  const dynamicStats = [
    {
      icon: Users,
      label: "Products Available",
      value: `${stats.totalProducts || 0}+`,
      numericValue: stats.totalProducts || 0,
      format: "number",
    },
    {
      icon: ShoppingBag,
      label: "Active Products",
      value: `${stats.activeProducts || 0}+`,
      numericValue: stats.activeProducts || 0,
      format: "number",
    },
    {
      icon: Star,
      label: "Featured Items",
      value: `${stats.featuredProducts || 0}+`,
      numericValue: stats.featuredProducts || 0,
      format: "number",
    },
    {
      icon: Award,
      label: "Categories",
      value: `${stats.categoryStats?.length || 0}+`,
      numericValue: stats.categoryStats?.length || 0,
      format: "number",
    },
  ];

  // Category images mapping (you can replace these with actual images from your backend)
  const categoryImages = {
    Dresses: "/assets/shop1.avif",
    Tops: "/assets/product_4.png",
    Accessories: "/assets/shop2.jpeg",
    Bottoms: "/assets/prod-5.jpeg",
    Shoes: "/assets/shop3.jpeg",
    Outerwear: "/assets/shop3.jpeg",
    Activewear: "/assets/shop1.avif",
    Swimwear: "/assets/shop2.jpeg",
  };

  const testimonials = [
    {
      name: "Sarah Johnson",
      rating: 5,
      comment: "Amazing quality and fast shipping! I love my new dress.",
      avatar: "/assets/test1.avif",
    },
    {
      name: "Emma Davis",
      rating: 5,
      comment: "The customer service is outstanding. Highly recommend!",
      avatar: "/assets/test2.jpeg",
    },
    {
      name: "Lisa Chen",
      rating: 5,
      comment: "Beautiful designs and perfect fit. Will shop again!",
      avatar: "/assets/test3.jpeg",
    },
  ];

  return (
    <div className="min-h-screen">
      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
          color: white;
          font-weight: 600;
          border-radius: 9999px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(236, 72, 153, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #ec4899;
          font-weight: 600;
          border-radius: 9999px;
          border: 2px solid #ec4899;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-secondary:hover {
          background: #ec4899;
          color: white;
          transform: translateY(-2px);
        }

        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-pink-100">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-4">
                <motion.div
                  className="inline-flex items-center space-x-2 bg-pink-100 px-4 py-2 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <span className="text-pink-600 font-semibold text-sm">
                    New Collection
                  </span>
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Discover Your
                  <span className="gradient-text block">Perfect Style</span>
                </h1>

                <p className="text-xl text-gray-600 leading-relaxed">
                  Elevate your wardrobe with our curated collection of premium
                  fashion pieces. From elegant dresses to casual essentials,
                  find everything you need to express your unique style.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/shop">
                  <motion.button
                    className="btn-primary text-lg px-8 py-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Shop Collection
                  </motion.button>
                </Link>

                <motion.button
                  className="btn-secondary text-lg px-8 py-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Lookbook
                </motion.button>
              </div>

              <div className="flex items-center space-x-8 pt-8">
                {dynamicStats.slice(0, 2).map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="text-2xl font-bold text-pink-600">
                      <Counter value={stat.numericValue} format={stat.format} />
                      {stat.value.includes("+") ? "+" : ""}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative z-10">
                <div className="relative rounded-2xl shadow-2xl overflow-hidden aspect-[4/5]">
                  <Image
                    src="/assets/hero-img.jpeg"
                    alt="Fashion Model"
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, (max-width: 1280px) 50vw, 42vw"
                    className="object-cover"
                  />
                </div>
                <motion.div
                  className="absolute -top-4 -left-4 w-32 h-32 bg-pink-200 rounded-full opacity-70"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute -bottom-4 -right-4 w-24 h-24 bg-pink-300 rounded-full opacity-60"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-xl text-gray-600">
              Discover our most popular items
            </p>
          </motion.div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                No featured products available at the moment.
              </p>
              <Link href="/shop">
                <button className="btn-primary px-6 py-3">
                  Browse All Products
                </button>
              </Link>
            </div>
          )}

          <Link href="/shop">
            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <button className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2">
                <span>View All Products</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Stats Section with Counter Animation */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-pink-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {dynamicStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center text-white"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <motion.div
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <stat.icon className="w-12 h-12" />
                </motion.div>
                <div className="text-3xl font-bold mb-2">
                  <Counter
                    value={stat.numericValue}
                    duration={4}
                    format={stat.format}
                  />
                  {stat.value.includes("+") ? "+" : ""}
                </div>
                <div className="text-pink-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section - Modern Circular Design */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-600">
              Find exactly what you're looking for
            </p>

            {/* Category type indicators */}
            {/* {dynamicCategories.length > 0 && (
              <div className="flex justify-center gap-3 mt-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  {dynamicCategories.length} Dynamic
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  {categories.length - dynamicCategories.filter(cat => categories.includes(cat)).length} Static
                </span>
              </div>
            )} */}
          </motion.div>

          {categories.length > 0 ? (
            <>
              {/* Circular Category Grid */}
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 max-w-5xl mx-auto">
                {categories.map((category, index) => {
                  const categoryStats = stats.categoryStats?.find(
                    (cat) => cat._id === category,
                  );
                  const itemCount = categoryStats ? categoryStats.count : 0;
                  const isDynamic = dynamicCategories.includes(category);

                  return (
                    <motion.div
                      key={category}
                      className="relative flex flex-col items-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                    >
                      <Link
                        href={`/shop?category=${encodeURIComponent(category)}`}
                      >
                        <motion.div
                          className="relative group cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Circle Container */}
                          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden shadow-xl ring-4 ring-white group-hover:ring-pink-200 transition-all duration-300">
                            <Image
                              src={
                                categoryImages[category] || "/assets/shop1.avif"
                              }
                              alt={category}
                              fill
                              sizes="(max-width: 768px) 96px, 112px"
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 group-hover:from-pink-500/40 group-hover:to-purple-500/40 transition-all duration-300" />

                            {/* Dynamic Badge */}
                            {isDynamic && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                <Sparkles className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Decorative Ring on Hover */}
                          <div className="absolute inset-0 w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-pink-400 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300" />
                        </motion.div>

                        {/* Category Name and Count */}
                        <div className="mt-3 text-center">
                          <h3 className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">
                            {category}
                          </h3>
                          {itemCount > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {itemCount} items
                            </p>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* View All Button */}
              <motion.div
                className="text-center mt-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link href="/shop">
                  <button className="btn-primary text-base px-8 py-3 inline-flex items-center space-x-2 shadow-lg">
                    <span>Explore All Categories</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </motion.div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                Categories will be displayed here once products are added.
              </p>
              <Link href="/shop">
                <button className="btn-primary px-6 py-3">
                  Browse All Products
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600">
              Real reviews from real customers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="card p-6 text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                />
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                <h4 className="font-semibold text-gray-800">
                  {testimonial.name}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter />

      <Footer />
    </div>
  );
}
