"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import {
  Filter,
  Search,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Static categories as fallback
const STATIC_CATEGORIES = [
  "All",
  "Tops",
  "Bottoms",
  "Accessories",
  "Shoes",
  "Outerwear",
  "Activewear",
  "Swimwear",
];
const INITIAL_PRODUCTS_LIMIT = 10;
const LOAD_MORE_PRODUCTS_LIMIT = 6;
const SEARCH_DEBOUNCE_MS = 450;

// Debounce hook - optimized
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Shop() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Product states
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(1000);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [hasLoadedProductsOnce, setHasLoadedProductsOnce] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState({ All: 0 });
  const latestRequestRef = useRef(0);
  const requestAbortRef = useRef(null);

  // Optimized debounce to reduce API churn while keeping search responsive
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const sortOptions = useMemo(
    () => [
      { value: "date-desc", label: "Newest First" },
      { value: "date-asc", label: "Oldest First" },
      { value: "name-asc", label: "Name A-Z" },
      { value: "name-desc", label: "Name Z-A" },
      { value: "new_price-asc", label: "Price: Low to High" },
      { value: "new_price-desc", label: "Price: High to Low" },
    ],
    [],
  );

  // Initialize from URL params only once
  useEffect(() => {
    if (!initialDataLoaded) return;

    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");
    const brandFromUrl = searchParams.get("brand");
    const stockFromUrl = searchParams.get("stock");
    const featuredFromUrl = searchParams.get("featured");
    const sortFromUrl = searchParams.get("sort");
    const minPriceFromUrl = searchParams.get("minPrice");
    const maxPriceFromUrl = searchParams.get("maxPrice");

    let hasChanges = false;

    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
      hasChanges = true;
    }

    if ((searchFromUrl || "") !== searchTerm) {
      setSearchTerm(searchFromUrl || "");
      setAppliedSearchTerm((searchFromUrl || "").trim());
      hasChanges = true;
    }

    if (brandFromUrl && brandFromUrl !== selectedBrand) {
      setSelectedBrand(brandFromUrl);
      hasChanges = true;
    }

    if (
      stockFromUrl &&
      ["all", "in_stock", "out_of_stock"].includes(stockFromUrl) &&
      stockFromUrl !== stockFilter
    ) {
      setStockFilter(stockFromUrl);
      hasChanges = true;
    }

    const featuredFromUrlBoolean =
      featuredFromUrl === "1" || featuredFromUrl === "true";
    if (featuredFromUrl !== null && featuredFromUrlBoolean !== featuredOnly) {
      setFeaturedOnly(featuredFromUrlBoolean);
      hasChanges = true;
    }

    if (sortFromUrl) {
      const [field, order] = sortFromUrl.split("-");
      if (field && order && (field !== sortBy || order !== sortOrder)) {
        setSortBy(field);
        setSortOrder(order);
        hasChanges = true;
      }
    }

    if (minPriceFromUrl) {
      const minPriceValue = parseInt(minPriceFromUrl);
      if (!isNaN(minPriceValue) && minPriceValue !== minPrice) {
        setMinPrice(minPriceValue);
        setAppliedMinPrice(minPriceValue);
        hasChanges = true;
      }
    }

    if (maxPriceFromUrl) {
      const maxPriceValue = parseInt(maxPriceFromUrl);
      if (!isNaN(maxPriceValue) && maxPriceValue !== maxPrice) {
        setMaxPrice(maxPriceValue);
        setAppliedMaxPrice(maxPriceValue);
        hasChanges = true;
      }
    }

    
    if (!hasChanges) return;
  }, [searchParams, initialDataLoaded]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Abort in-flight product requests on unmount
  useEffect(() => {
    return () => {
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
    };
  }, []);

  // Update URL when filters change - optimized
  const updateURL = useCallback(
    (updates = {}) => {
      if (!initialDataLoaded) return;

      const params = new URLSearchParams();

      const category =
        updates.category !== undefined ? updates.category : selectedCategory;
      const search =
        updates.search !== undefined ? updates.search : appliedSearchTerm;
      const brand = updates.brand !== undefined ? updates.brand : selectedBrand;
      const stock = updates.stock !== undefined ? updates.stock : stockFilter;
      const featured =
        updates.featured !== undefined ? updates.featured : featuredOnly;
      const sort =
        updates.sort !== undefined ? updates.sort : `${sortBy}-${sortOrder}`;
      const minPriceValue =
        updates.minPrice !== undefined ? updates.minPrice : appliedMinPrice;
      const maxPriceValue =
        updates.maxPrice !== undefined ? updates.maxPrice : appliedMaxPrice;

      // Only add non-default parameters
      if (category && category !== "All") {
        params.set("category", category);
      }

      if (search && search.trim()) {
        params.set("search", search.trim());
      }

      if (brand && brand !== "All") {
        params.set("brand", brand);
      }

      if (stock && stock !== "all") {
        params.set("stock", stock);
      }

      if (featured) {
        params.set("featured", "1");
      }

      if (sort && sort !== "date-desc") {
        params.set("sort", sort);
      }

      if (minPriceValue > priceRange.min) {
        params.set("minPrice", minPriceValue.toString());
      }

      if (maxPriceValue < priceRange.max) {
        params.set("maxPrice", maxPriceValue.toString());
      }

      const newUrl = params.toString() ? `/shop?${params.toString()}` : "/shop";

      window.history.replaceState(null, "", newUrl);
    },
    [
      selectedCategory,
      appliedSearchTerm,
      selectedBrand,
      stockFilter,
      featuredOnly,
      sortBy,
      sortOrder,
      appliedMinPrice,
      appliedMaxPrice,
      priceRange,
      initialDataLoaded,
    ],
  );

  // Apply search only after debounce delay
  useEffect(() => {
    if (!initialDataLoaded) return;
    setAppliedSearchTerm(debouncedSearchTerm.trim());
  }, [debouncedSearchTerm, initialDataLoaded]);

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Normalize a category key by trimming and lowercasing it.
 * @param {string} value - The category key to normalize
 * @returns {string} - The normalized category key
 */
/*******  4e08cf44-6dc9-4384-bf2c-e875113bd4a3  *******/
  const normalizeCategoryKey = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const buildCategoryData = (apiCategories = [], backendCounts = {}) => {
    const normalizedCounts = {};
    Object.entries(backendCounts || {}).forEach(([k, v]) => {
      normalizedCounts[normalizeCategoryKey(k)] = Number(v) || 0;
    });

    const normalized = apiCategories
      .map((cat) => {
        if (typeof cat === "string") {
          const key = normalizeCategoryKey(cat);
          return { name: cat, productCount: normalizedCounts[key] || 0 };
        }

        if (cat && typeof cat === "object" && cat.name) {
          const key = normalizeCategoryKey(cat.name);
          const rowCount = Number(cat.productCount);
          return {
            name: cat.name,
            productCount: Number.isFinite(rowCount)
              ? rowCount
              : normalizedCounts[key] || 0,
          };
        }

        return null;
      })
      .filter((c) => c && c.name && c.name.toLowerCase() !== "women")
      .sort((a, b) => a.name.localeCompare(b.name));

    const dynamicCategoryNames = normalized.map((c) => c.name);

    const uniqueStaticCategories = STATIC_CATEGORIES.filter(
      (staticCat) => !dynamicCategoryNames.includes(staticCat),
    );

    const combinedCategories = [
      "All",
      ...dynamicCategoryNames,
      ...uniqueStaticCategories.filter((cat) => cat !== "All"),
    ];

    const counts = { All: 0 };

    combinedCategories.forEach((name) => {
      if (name === "All") return;
      const key = normalizeCategoryKey(name);

      const fromDynamic = normalized.find(
        (item) => normalizeCategoryKey(item.name) === key,
      )?.productCount;

      const value =
        typeof fromDynamic === "number"
          ? fromDynamic
          : normalizedCounts[key] || 0;

      counts[name] = value;
      counts.All += value;
    });

    return { dynamicCategoryNames, combinedCategories, counts };
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel API calls for faster loading
      const [categoriesResponse, filtersResponse] = await Promise.all([
        fetch(`${API_BASE}/categories?active=true&includeCounts=true`),
        fetch(`${API_BASE}/product-filters`),
      ]);

      const [categoriesData, filtersData] = await Promise.all([
        categoriesResponse.json(),
        filtersResponse.json(),
      ]);

      // Process categories - handle both dynamic and static
      if (categoriesData.success && categoriesData.categories) {
        const { dynamicCategoryNames, combinedCategories, counts } =
          buildCategoryData(
            categoriesData.categories,
            categoriesData.countsByCategory,
          );

        setDynamicCategories(dynamicCategoryNames);
        setCategories(combinedCategories);
        setCategoryCounts(counts);

        const categoryFromUrl = searchParams.get("category");
        if (categoryFromUrl) {
          if (combinedCategories.includes(categoryFromUrl)) {
            setSelectedCategory(categoryFromUrl);
          } else {
            router.replace("/shop");
            setSelectedCategory("All");
          }
        }
      } else {
        setCategories(STATIC_CATEGORIES);
        setDynamicCategories([]);
        setCategoryCounts({ All: 0 });
        setAvailableBrands([]);
      }

      // Process filter metadata
      if (filtersData.success && filtersData.filters) {
        const brands = Array.isArray(filtersData.filters.brands)
          ? filtersData.filters.brands
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b))
          : [];
        setAvailableBrands(brands);

        if (filtersData.filters.priceRange) {
          const { minPrice: min, maxPrice: max } = filtersData.filters.priceRange;
          const roundedMin = Math.floor(min);
          const roundedMax = Math.ceil(max);
          setPriceRange({ min: roundedMin, max: roundedMax });

          const minPriceFromUrl = searchParams.get("minPrice");
          const maxPriceFromUrl = searchParams.get("maxPrice");

          if (!minPriceFromUrl) setMinPrice(roundedMin);
          if (!maxPriceFromUrl) setMaxPrice(roundedMax);
          if (!minPriceFromUrl) setAppliedMinPrice(roundedMin);
          if (!maxPriceFromUrl) setAppliedMaxPrice(roundedMax);
        }
      }

      setInitialDataLoaded(true);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      // Fallback to static categories on error
      setCategories(STATIC_CATEGORIES);
      setDynamicCategories([]);
      setError("Failed to load some data, using default categories");
      setInitialDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Refresh categories function
  const refreshCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(
        `${API_BASE}/categories?active=true&includeCounts=true`,
      );
      const data = await response.json();

      if (data.success && data.categories) {
        const { dynamicCategoryNames, combinedCategories, counts } =
          buildCategoryData(data.categories, data.countsByCategory);

        setDynamicCategories(dynamicCategoryNames);
        setCategories(combinedCategories);
        setCategoryCounts(counts);
      }
    } catch (error) {
      console.error("Error refreshing categories:", error);
      alert("Failed to refresh categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async (
    offset = 0,
    limit = INITIAL_PRODUCTS_LIMIT,
    isLoadMore = false,
  ) => {
    const requestId = ++latestRequestRef.current;
    let controller = null;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        if (requestAbortRef.current) {
          requestAbortRef.current.abort();
        }
        controller = new AbortController();
        requestAbortRef.current = controller;
        setProductsLoading(true);
        setError(null);
      }

      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const trimmedSearch = appliedSearchTerm.trim();
      if (trimmedSearch) {
        params.append("search", trimmedSearch);
      }

      if (selectedCategory && selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }

      if (selectedBrand && selectedBrand !== "All") {
        params.append("brand", selectedBrand);
      }

      if (stockFilter === "in_stock") {
        params.append("inStock", "1");
      } else if (stockFilter === "out_of_stock") {
        params.append("inStock", "0");
      }

      if (featuredOnly) {
        params.append("featured", "1");
      }

      if (appliedMinPrice > priceRange.min) {
        params.append("minPrice", appliedMinPrice.toString());
      }

      if (appliedMaxPrice < priceRange.max) {
        params.append("maxPrice", appliedMaxPrice.toString());
      }

      const response = await fetch(`${API_BASE}/allproducts?${params}`, {
        signal: controller?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (requestId !== latestRequestRef.current) return;

      if (data.success) {
        const incomingProducts = Array.isArray(data.products) ? data.products : [];
        const apiTotalProducts = Number(data.pagination?.totalProducts || 0);
        setHasLoadedProductsOnce(true);

        if (isLoadMore) {
          setAllProducts((prev) => {
            const seen = new Set(prev.map((p) => String(p._id || p.id)));
            const dedupedIncoming = incomingProducts.filter(
              (product) => !seen.has(String(product._id || product.id)),
            );
            const merged = [...prev, ...dedupedIncoming];
            setHasMoreProducts(merged.length < apiTotalProducts);
            return merged;
          });
        } else {
          setAllProducts(incomingProducts);
          setHasMoreProducts(incomingProducts.length < apiTotalProducts);
        }

        setTotalProducts(apiTotalProducts);
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      if (requestId !== latestRequestRef.current) return;
      if (error?.name === "AbortError") return;
      console.error("Error fetching products:", error);
      if (!isLoadMore) {
        setError(`Failed to load products: ${error.message}`);
      }
    } finally {
      if (requestId !== latestRequestRef.current) return;
      setLoading(false);
      setLoadingMore(false);
      setProductsLoading(false);
      if (!isLoadMore && requestAbortRef.current === controller) {
        requestAbortRef.current = null;
      }
    }
  };

  // Product fetching (search + filters)
  useEffect(() => {
    if (!initialDataLoaded) return;

    setHasMoreProducts(false);
    fetchProducts(0, INITIAL_PRODUCTS_LIMIT, false);
    updateURL({ search: appliedSearchTerm });
  }, [
    initialDataLoaded,
    selectedCategory,
    selectedBrand,
    stockFilter,
    featuredOnly,
    sortBy,
    sortOrder,
    appliedMinPrice,
    appliedMaxPrice,
    appliedSearchTerm,
    updateURL,
  ]);

  

  const handleCategoryFilter = useCallback(
    (category) => {
      if (category !== selectedCategory) {
        setSelectedCategory(category);
      }
    },
    [selectedCategory],
  );

  const handleSort = useCallback((sortValue) => {
    const [field, order] = sortValue.split("-");
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleMinPriceChange = useCallback(
    (e) => {
      const value = parseInt(e.target.value);
      setMinPrice(value);
      if (value > maxPrice) {
        setMaxPrice(value);
      }
    },
    [maxPrice],
  );

  const handleMaxPriceChange = useCallback(
    (e) => {
      const value = parseInt(e.target.value);
      setMaxPrice(value);
      if (value < minPrice) {
        setMinPrice(value);
      }
    },
    [minPrice],
  );

  const handleApplyPriceFilter = useCallback(() => {
    const safeMin = Math.max(minPrice, priceRange.min);
    const safeMax = Math.min(maxPrice, priceRange.max);

    setAppliedMinPrice(Math.min(safeMin, safeMax));
    setAppliedMaxPrice(Math.max(safeMin, safeMax));
  }, [minPrice, maxPrice, priceRange]);

  const handleLoadMore = useCallback(() => {
    fetchProducts(allProducts.length, LOAD_MORE_PRODUCTS_LIMIT, true);
  }, [allProducts.length]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory("All");
    setSearchTerm("");
    setAppliedSearchTerm("");
    setSelectedBrand("All");
    setStockFilter("all");
    setFeaturedOnly(false);
    setMinPrice(priceRange.min);
    setMaxPrice(priceRange.max);
    setAppliedMinPrice(priceRange.min);
    setAppliedMaxPrice(priceRange.max);
    setSortBy("date");
    setSortOrder("desc");
    setHasMoreProducts(false);

    window.history.replaceState(null, "", "/shop");
  }, [priceRange]);

  const categoryDisplayName = useMemo(() => {
    return selectedCategory === "All" ? "Our Collection" : selectedCategory;
  }, [selectedCategory]);

  const isPriceFilterDirty =
    minPrice !== appliedMinPrice || maxPrice !== appliedMaxPrice;

  // Loading state
  if (loading && !initialDataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error && allProducts.length === 0 && !categories.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchInitialData}
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {categoryDisplayName}
            </h1>
            <p className="text-xl text-pink-100">
              {selectedCategory === "All"
                ? `Discover your perfect style from our curated selection of ${totalProducts} products`
                : `Explore our ${selectedCategory.toLowerCase()} collection - ${totalProducts} products available`}
            </p>
            {selectedCategory !== "All" && (
              <motion.button
                onClick={() => handleCategoryFilter("All")}
                className="mt-4 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                ← View All Products
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Shop Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <motion.div
              className={`lg:w-1/4 space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Clear Filters Button */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <button
                  onClick={clearAllFilters}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Categories</h3>
                  <button
                    onClick={refreshCategories}
                    disabled={loadingCategories}
                    className="text-pink-600 hover:text-pink-800 disabled:opacity-50"
                    title="Refresh categories"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loadingCategories ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>

                {/* Category Stats */}
                {/* {dynamicCategories.length > 0 && (
                  <div className="mb-3 flex gap-2 text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {dynamicCategories.length} Dynamic
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {categories.length - dynamicCategories.length - 1} Static
                    </span>
                  </div>
                )} */}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {categories.map((category) => {
                    return (
                      <button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                          selectedCategory === category
                            ? "bg-pink-100 text-pink-700 font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span>{category}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            selectedCategory === category
                              ? "bg-white/80 text-pink-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {categoryCounts[category] ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Price Range</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Min Price: ${minPrice}
                    </label>
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      step="1"
                      value={minPrice}
                      onChange={handleMinPriceChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Price: ${maxPrice}
                    </label>
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      step="1"
                      value={maxPrice}
                      onChange={handleMaxPriceChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    ${minPrice} - ${maxPrice}
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleApplyPriceFilter}
                      disabled={!isPriceFilterDirty}
                      className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply Price Filter
                    </button>
                    {isPriceFilterDirty && (
                      <p className="text-xs text-center text-gray-500">
                        Price range changed. Apply to refresh products.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              {/* Controls */}
              <motion.div
                className="bg-white rounded-xl p-6 shadow-lg mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden bg-white border border-pink-600 text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors flex items-center space-x-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="All">All Brands</option>
                        {availableBrands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="all">All Stock</option>
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setFeaturedOnly((prev) => !prev)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                        featuredOnly
                          ? "bg-pink-100 text-pink-700 border-pink-200"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Featured Only
                    </button>

                    <div className="relative">
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => handleSort(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="text-sm text-gray-600">
                      {productsLoading
                        ? "Loading..."
                        : `Showing ${allProducts.length} of ${totalProducts} products`}
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mt-4 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  {searchTerm && searchTerm !== debouncedSearchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                    </div>
                  )}
                  {searchTerm &&
                    searchTerm === debouncedSearchTerm &&
                    searchTerm.length > 0 && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setAppliedSearchTerm("");
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                </div>
              </motion.div>

              {/* Products Grid */}
              {productsLoading && !hasLoadedProductsOnce ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
                </div>
              ) : allProducts.length > 0 ? (
                <>
                  {productsLoading && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-sm text-pink-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating results...
                    </div>
                  )}
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {allProducts.map((product, index) => (
                      <motion.div
                        key={`${product.id}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: (index % 12) * 0.05,
                        }}
                      >
                        <ProductCard
                          product={product}
                          priority={index < 2 && currentPage === 1}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMoreProducts && (
                    <motion.div
                      className="text-center mt-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <span>Load 6 More Products</span>
                        )}
                      </button>
                      <p className="text-gray-500 text-sm mt-2">
                        {allProducts.length} of {totalProducts} products shown
                      </p>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-gray-500 text-lg mb-4">
                    {selectedCategory !== "All"
                      ? `No products found in ${selectedCategory} category.`
                      : "No products found matching your criteria."}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
