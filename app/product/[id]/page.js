"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { adminFetch } from "../../utils/adminApi";
import {
  getStoredStaffUser,
  hasStaffPermission,
} from "../../utils/staffAuth";
import {
  AVATAR_FALLBACK_IMAGE,
  FALLBACK_IMAGE,
  getOptimizedImageSrc,
  handleImageError as sharedHandleImageError,
} from "../../utils/imageUtils";
import { formatCurrency } from "../../utils/formatters";
import { toast } from "react-toastify";
import Image from "next/image";
import {
  Trash2,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Package,
  Zap,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const IMAGE_FALLBACK_URL = FALLBACK_IMAGE;

// Enhanced Product Image Zoom Component
const ProductImageZoom = ({
  src,
  alt = "Product image",
  className = "",
  highResSrc = null,
  onImageLoad = () => {},
  onImageError = () => {},
}) => {
  const ZOOM_SCALE = 1.8;

  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(
    highResSrc || src || IMAGE_FALLBACK_URL,
  );

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const cursorRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const nextSrc = highResSrc || src || IMAGE_FALLBACK_URL;
    setResolvedSrc((prev) => (prev === nextSrc ? prev : nextSrc));
  }, [src, highResSrc]);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [resolvedSrc]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      const coarsePointer = window.matchMedia(
        "(hover: none), (pointer: coarse)",
      ).matches;
      setIsMobile(coarsePointer || window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const updateZoomPosition = (clientX, clientY) => {
    if (!containerRef.current || !imageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (imageRef.current) {
        imageRef.current.style.transformOrigin = `${x}% ${y}%`;
      }
      if (cursorRef.current) {
        cursorRef.current.style.left = `${x}%`;
        cursorRef.current.style.top = `${y}%`;
      }
    });
  };

  const handleMouseEnter = (e) => {
    if (!isMobile) {
      setIsHovered(true);
      updateZoomPosition(e.clientX, e.clientY);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      if (imageRef.current) {
        imageRef.current.style.transformOrigin = "50% 50%";
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isMobile) {
      updateZoomPosition(e.clientX, e.clientY);
    }
  };

  const handleImageLoad = (e) => {
    setIsImageLoaded(true);
    onImageLoad(e);
  };

  const handleImageError = (e) => {
    if (resolvedSrc !== IMAGE_FALLBACK_URL) {
      setResolvedSrc(IMAGE_FALLBACK_URL);
      setIsImageLoaded(false);
      return;
    }

    setIsImageLoaded(true);
    onImageError(e);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        cursor: !isMobile ? "zoom-in" : "default",
      }}
    >
      <Image
        key={resolvedSrc}
        ref={imageRef}
        src={resolvedSrc}
        alt={alt}
        className="w-full h-full object-cover select-none"
        width={1200}
        height={1200}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        draggable={false}
        style={{
          transform: isHovered && !isMobile ? `scale(${ZOOM_SCALE})` : "scale(1)",
          transformOrigin: "50% 50%",
          transition: "transform 180ms ease-out",
          willChange: "transform",
        }}
       sizes="100vw"/>

      {!isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      <AnimatePresence>
        {isHovered && !isMobile && (
          <motion.div
            ref={cursorRef}
            className="absolute pointer-events-none z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: "50%", top: "50%" }}
            initial={{
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
            }}
            transition={{
              type: "tween",
              ease: "easeOut",
              duration: 0.15,
            }}
          >
            <div className="w-7 h-7 rounded-full border border-white/90 bg-black/20 backdrop-blur-[1px] flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const { addToCart: addToCartContext } = useCart();
  const { toggleWishlist, isInWishlist: checkIsInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  const [showAllThumbnails, setShowAllThumbnails] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsSubmitting, setReviewsSubmitting] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");
  const [reviewPagination, setReviewPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    hasNext: false,
  });
  const [reviewsSummary, setReviewsSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: "",
    comment: "",
  });

  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [canDeleteReviews, setCanDeleteReviews] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState("");

  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncAuthState = () => {
      try {
        const userData = localStorage.getItem("user");
        setUser(userData ? JSON.parse(userData) : null);
      } catch {
        setUser(null);
      }

      try {
        const staffUser = getStoredStaffUser();
        setCanDeleteReviews(hasStaffPermission(staffUser, "products:update"));
      } catch {
        setCanDeleteReviews(false);
      }
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("staff-auth-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("staff-auth-changed", syncAuthState);
    };
  }, []);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/product/${productId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProduct(data.product);

        if (data.product.colors && data.product.colors.length > 0) {
          setSelectedColor(data.product.colors[0]);
        }
        if (data.product.sizes && data.product.sizes.length > 0) {
          setSelectedSize(data.product.sizes[0]);
        }

        fetchRelatedProducts(data.product.id);
        setReviewsEnabled(data.product.allowReviews !== false);
        if (data.product.allowReviews === false) {
          setReviews([]);
          setReviewsSummary({
            averageRating: 0,
            totalReviews: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          });
          setReviewPagination({
            page: 1,
            limit: 10,
            total: 0,
            pages: 1,
            hasNext: false,
          });
        }
      } else {
        throw new Error(data.message || "Product not found");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (productId) => {
    try {
      const response = await fetch(
        `${API_BASE}/product/${productId}/recommendations`,
      );
      const data = await response.json();

      if (data.success) {
        setRelatedProducts(data.recommendations);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const normalizeReviewSummary = (summary = {}) => ({
    averageRating: Number(summary.averageRating || 0),
    totalReviews: Number(summary.totalReviews || 0),
    distribution: {
      1: Number(summary?.distribution?.[1] || 0),
      2: Number(summary?.distribution?.[2] || 0),
      3: Number(summary?.distribution?.[3] || 0),
      4: Number(summary?.distribution?.[4] || 0),
      5: Number(summary?.distribution?.[5] || 0),
    },
  });

  const fetchProductReviews = async (
    page = 1,
    append = false,
    sort = reviewSort,
  ) => {
    try {
      if (page === 1) setReviewsLoading(true);

      const response = await fetch(
        `${API_BASE}/product/${productId}/reviews?page=${page}&limit=10&sort=${sort}`,
      );
      const data = await response.json();

      if (data.success) {
        const enabled = data.reviewsEnabled !== false;
        setReviewsEnabled(enabled);

        if (!enabled) {
          setReviews([]);
          setReviewsSummary({
            averageRating: 0,
            totalReviews: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          });
          setReviewPagination({
            page: 1,
            limit: 10,
            total: 0,
            pages: 1,
            hasNext: false,
          });
          return;
        }

        setReviews((prev) =>
          append ? [...prev, ...(data.reviews || [])] : data.reviews || [],
        );
        setReviewPagination(
          data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            pages: 1,
            hasNext: false,
          },
        );
        setReviewsSummary(normalizeReviewSummary(data.summary));
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!productId || !product) return;
    if (product.allowReviews === false) return;
    fetchProductReviews(1, false, reviewSort);
  }, [productId, product, reviewSort]);

  useEffect(() => {
    if (
      (product?.allowReviews === false || reviewsEnabled === false) &&
      activeTab === "reviews"
    ) {
      setActiveTab("description");
    }
  }, [product?.allowReviews, reviewsEnabled, activeTab]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setShowAllThumbnails(false);
  }, [product?.id]);

  const normalizeImageValue = (value) => {
    if (typeof value !== "string") return "";
    return value.trim();
  };

  const getProductImages = () => {
    const uniqueImages = new Set();

    const addImage = (value) => {
      const normalized = normalizeImageValue(value);
      if (!normalized) return;
      uniqueImages.add(normalized);
    };

    addImage(product?.image);

    if (Array.isArray(product?.images)) {
      product.images.forEach(addImage);
    }

    const images = Array.from(uniqueImages);
    return images.length > 0 ? images : [IMAGE_FALLBACK_URL];
  };

  const productImages = getProductImages();
  const activeImage = productImages?.[selectedImageIndex] || productImages?.[0];

  useEffect(() => {
    if (selectedImageIndex >= productImages.length) {
      setSelectedImageIndex(0);
    }
  }, [selectedImageIndex, productImages.length]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?redirect=/product/${productId}`);
      return;
    }

    if (!reviewForm.rating) {
      toast.error("Please select a rating");
      return;
    }

    if (reviewForm.comment.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push(`/login?redirect=/product/${productId}`);
      return;
    }

    setReviewsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/product/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit review");
      }

      toast.success("Review submitted successfully");
      setReviewForm({ rating: 0, title: "", comment: "" });
      await fetchProductReviews(1, false, reviewSort);
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error(err.message || "Failed to submit review");
    } finally {
      setReviewsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!canDeleteReviews) return;

    setDeletingReviewId(reviewId);
    try {
      const response = await adminFetch(
        `${API_BASE}/product/${productId}/reviews/${reviewId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete review");
      }

      toast.success("Review deleted");
      await fetchProductReviews(1, false, reviewSort);
    } catch (err) {
      console.error("Error deleting review:", err);
      toast.error(err.message || "Failed to delete review");
    } finally {
      setDeletingReviewId("");
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    try {
      const selectedOptions = {};
      if (selectedColor) selectedOptions.color = selectedColor;
      if (selectedSize) selectedOptions.size = selectedSize;

      const success = await addToCartContext(product, quantity, {
        selectedOptions,
      });

      if (success) {
        toast.success(`${product.name} added to cart!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error("Failed to add product to cart. Please try again.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add product to cart. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsAddingToWishlist(true);

    try {
      await toggleWishlist(product);

      const isNowInWishlist = checkIsInWishlist(product.id);

      toast.success(
        isNowInWishlist
          ? `${product.name} added to wishlist!`
          : `${product.name} removed from wishlist!`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        },
      );

      window.dispatchEvent(
        new CustomEvent("wishlistUpdated", {
          detail: { productId: product.id, isInWishlist: isNowInWishlist },
        }),
      );
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description || product.description,
          url: window.location.href,
        });
      } catch (error) {
        undefined;
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product URL copied to clipboard!", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const incrementQuantity = () => {
    if (product.stock_quantity && quantity >= product.stock_quantity) return;
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {error || "The product you are looking for does not exist."}
            </p>
            <Link
              href="/shop"
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm sm:text-base"
            >
              Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const THUMBNAIL_INITIAL_COUNT = 5;
  const visibleThumbnails = showAllThumbnails
    ? productImages
    : productImages.slice(0, THUMBNAIL_INITIAL_COUNT);
  const hiddenThumbCount = Math.max(
    productImages.length - THUMBNAIL_INITIAL_COUNT,
    0,
  );

  const averageRating = Number(reviewsSummary.averageRating || 0);
  const roundedRating = Math.round(averageRating);

  const discountPercentage =
    product.old_price > product.new_price
      ? Math.round(
          ((product.old_price - product.new_price) / product.old_price) * 100,
        )
      : 0;

  const isInWishlist = checkIsInWishlist(product.id);

  const canShowReviews =
    product.allowReviews !== false && reviewsEnabled !== false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <nav className="flex space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            <Link href="/" className="hover:text-pink-600 whitespace-nowrap">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href="/shop"
              className="hover:text-pink-600 whitespace-nowrap"
            >
              Shop
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href={`/shop?category=${product.category}`}
              className="hover:text-pink-600 whitespace-nowrap"
            >
              {product.category}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-6 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-1"
            >
              {/* Mobile */}
              <div className="sm:hidden">
                <div className="relative h-[320px] rounded-xl overflow-hidden bg-gray-50 mb-4">
                  <Image
                    src={getOptimizedImageSrc(activeImage, "detail")}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    width={1200}
                    height={1200}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={sharedHandleImageError}
                   sizes="100vw"/>
                </div>

                {productImages.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {visibleThumbnails.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index
                            ? "border-pink-500"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={getOptimizedImageSrc(image, "thumb")}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          width={160}
                          height={160}
                          loading="lazy"
                          decoding="async"
                          onError={sharedHandleImageError}
                         sizes="100vw"/>
                      </button>
                    ))}

                    {!showAllThumbnails && hiddenThumbCount > 0 && (
                      <button
                        onClick={() => {
                          setShowAllThumbnails(true);
                          setSelectedImageIndex(THUMBNAIL_INITIAL_COUNT);
                        }}
                        className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-pink-300 bg-pink-50 text-pink-700 font-semibold"
                      >
                        +{hiddenThumbCount}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop */}
              <div className="hidden sm:flex gap-4 ">
                {productImages.length > 1 && (
                  <div
                    className={`flex flex-col gap-3 w-28 ${
                      showAllThumbnails
                        ? "max-h-[600px] overflow-y-auto pr-1"
                        : ""
                    }`}
                  >
                    {visibleThumbnails.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative flex-shrink-0 h-[90px] rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index
                            ? "border-pink-500 shadow-lg"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={getOptimizedImageSrc(image, "thumb")}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          width={180}
                          height={180}
                          loading="lazy"
                          decoding="async"
                          onError={sharedHandleImageError}
                         sizes="100vw"/>
                      </button>
                    ))}

                    {!showAllThumbnails && hiddenThumbCount > 0 && (
                      <button
                        onClick={() => {
                          setShowAllThumbnails(true);
                          setSelectedImageIndex(THUMBNAIL_INITIAL_COUNT);
                        }}
                        className="h-[90px] rounded-lg border-2 border-dashed border-pink-300 bg-pink-50 text-pink-700 font-bold"
                      >
                        +{hiddenThumbCount}
                      </button>
                    )}
                  </div>
                )}

                <ProductImageZoom
                  src={getOptimizedImageSrc(activeImage, "detail")}
                  highResSrc={getOptimizedImageSrc(activeImage, "zoom")}
                  alt={product.name}
                  className="flex-1 h-[450px]"
                />
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-2 space-y-4 sm:space-y-6"
            >
              {/* Header */}
              <div>
                <div className="flex items-center space-x-2 mb-2 text-xs sm:text-sm">
                  <span className="text-gray-500">{product.brand}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">SKU: {product.sku}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          star <= roundedRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {canShowReviews && (
                    <span className="text-sm sm:text-base text-gray-600">
                      {reviewsSummary.totalReviews > 0
                        ? averageRating.toFixed(1)
                        : "0.0"}{" "}
                      • {reviewsSummary.totalReviews} reviews
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl font-bold text-pink-600">
                    {formatCurrency(product.new_price)}
                  </span>
                  {product.old_price > product.new_price && (
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      {formatCurrency(product.old_price)}
                    </span>
                  )}
                  {discountPercentage > 0 && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs sm:text-sm font-semibold">
                      Save {discountPercentage}%
                    </span>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 sm:mb-3">
                    Color: {selectedColor}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-2 sm:px-4 border rounded-lg transition-colors text-sm ${
                          selectedColor === color
                            ? "border-pink-500 bg-pink-50 text-pink-700"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 sm:mb-3">
                    Size: {selectedSize}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-2 sm:px-4 border rounded-lg transition-colors text-sm ${
                          selectedSize === size
                            ? "border-pink-500 bg-pink-50 text-pink-700"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="text-sm font-semibold mb-2 sm:mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-2 sm:p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 sm:px-4 py-2 font-semibold min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      disabled={
                        product.stock_quantity &&
                        quantity >= product.stock_quantity
                      }
                      className="p-2 sm:p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {product.stock_quantity && (
                    <span className="text-xs sm:text-sm text-gray-600">
                      {product.stock_quantity} available
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                {product.stock_quantity > 0 ? (
                  <>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-green-600 font-medium text-sm sm:text-base">
                      In Stock
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    <span className="text-red-600 font-medium text-sm sm:text-base">
                      Out of Stock
                    </span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 sm:space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || product.stock_quantity === 0}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <div className="flex space-x-3 sm:space-x-0">
                    <button
                      onClick={handleWishlistToggle}
                      disabled={isAddingToWishlist}
                      className={`flex-1 sm:flex-none p-3 border rounded-lg transition-colors ${
                        isInWishlist
                          ? "border-pink-500 bg-pink-50 text-pink-600"
                          : "border-gray-300 hover:border-pink-500 hover:text-pink-600"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWishlist ? "fill-current" : ""} mx-auto`}
                      />
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex-1 sm:flex-none p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                    >
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm font-medium">
                    Free Shipping
                  </p>
                  <p className="text-xs text-gray-600 hidden sm:block">
                    On orders over $50
                  </p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm font-medium">Easy Returns</p>
                  <p className="text-xs text-gray-600 hidden sm:block">
                    30-day returns
                  </p>
                </div>
                <div className="text-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm font-medium">
                    Secure Payment
                  </p>
                  <p className="text-xs text-gray-600 hidden sm:block">
                    SSL protected
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Product Details Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-8 mb-8 sm:mb-12"
          >
            {/* Tab Navigation */}
            <div className="border-b mb-6 sm:mb-8">
              <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-2">
                {[
                  { id: "description", label: "Description" },
                  { id: "specifications", label: "Specs" },
                  ...(canShowReviews
                    ? [{ id: "reviews", label: "Reviews" }]
                    : []),
                  { id: "shipping", label: "Shipping" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-pink-500 text-pink-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-4 sm:space-y-6">
              {activeTab === "description" && (
                <div>
                  {product.description ? (
                    <div className="prose max-w-none">
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {product.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-gray-600">
                      No description available for this product.
                    </p>
                  )}

                  {product.features && product.features.length > 0 && (
                    <div className="mt-4 sm:mt-6">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                        Key Features
                      </h3>
                      <ul className="grid grid-cols-1 gap-2 sm:gap-3">
                        {product.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm sm:text-base text-gray-700">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "specifications" && (
                <div>
                  {product.specifications &&
                  product.specifications.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {product.specifications.map((spec, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100"
                        >
                          <span className="font-medium text-gray-700 text-sm sm:text-base">
                            {spec.key}
                          </span>
                          <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700 text-sm sm:text-base">
                          Brand
                        </span>
                        <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">
                          {product.brand || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700 text-sm sm:text-base">
                          Category
                        </span>
                        <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">
                          {product.category}
                        </span>
                      </div>
                      {product.weight > 0 && (
                        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700 text-sm sm:text-base">
                            Weight
                          </span>
                          <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">
                            {product.weight} kg
                          </span>
                        </div>
                      )}
                      {product.materials && (
                        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700 text-sm sm:text-base">
                            Materials
                          </span>
                          <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">
                            {product.materials}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-3xl font-bold text-gray-900">
                        {reviewsSummary.totalReviews > 0
                          ? averageRating.toFixed(1)
                          : "0.0"}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        Based on {reviewsSummary.totalReviews} review(s)
                      </p>

                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count =
                            reviewsSummary.distribution[rating] || 0;
                          const percent = reviewsSummary.totalReviews
                            ? Math.round(
                                (count / reviewsSummary.totalReviews) * 100,
                              )
                            : 0;

                          return (
                            <div
                              key={rating}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="w-8">{rating}★</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="w-8 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Write a Review</h4>
                        <select
                          value={reviewSort}
                          onChange={(e) => setReviewSort(e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="recent">Most Recent</option>
                          <option value="rating_high">Highest Rating</option>
                          <option value="rating_low">Lowest Rating</option>
                        </select>
                      </div>

                      {user ? (
                        <form
                          onSubmit={handleSubmitReview}
                          className="space-y-3"
                        >
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Your Rating
                            </p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() =>
                                    setReviewForm((prev) => ({
                                      ...prev,
                                      rating: star,
                                    }))
                                  }
                                  className="p-1"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      star <= reviewForm.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Review title (optional)"
                            value={reviewForm.title}
                            onChange={(e) =>
                              setReviewForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            maxLength={120}
                          />

                          <textarea
                            placeholder="Write your review..."
                            value={reviewForm.comment}
                            onChange={(e) =>
                              setReviewForm((prev) => ({
                                ...prev,
                                comment: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
                            maxLength={1200}
                            required
                          />

                          <button
                            type="submit"
                            disabled={reviewsSubmitting}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-60 text-sm"
                          >
                            {reviewsSubmitting
                              ? "Submitting..."
                              : "Submit Review"}
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/login?redirect=/product/${productId}`)
                          }
                          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm"
                        >
                          Login to write a review
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {reviewsLoading && reviews.length === 0 ? (
                      <div className="text-center py-8 text-gray-600">
                        Loading reviews...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-8 text-gray-600">
                        No reviews yet.
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div
                          key={review._id}
                          className="border border-gray-200 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              {review.userAvatar ? (
                                <Image
                                  src={getOptimizedImageSrc(
                                    review.userAvatar,
                                    "avatar",
                                    AVATAR_FALLBACK_IMAGE,
                                  )}
                                  alt={review.userName || "Reviewer"}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                  width={40}
                                  height={40}
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  onError={(e) =>
                                    sharedHandleImageError(
                                      e,
                                      AVATAR_FALLBACK_IMAGE,
                                    )
                                  }
                                 sizes="100vw"/>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-sm font-semibold border border-pink-200">
                                  {(review.userName || "U")
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {review.userName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    review.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {canDeleteReviews && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(review._id)}
                                disabled={deletingReviewId === review._id}
                                className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                                title="Delete review"
                              >
                                {deletingReviewId === review._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            {review.isVerifiedPurchase && (
                              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                Verified Purchase
                              </span>
                            )}
                          </div>

                          {review.title ? (
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {review.title}
                            </p>
                          ) : null}
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        </div>
                      ))
                    )}

                    {(reviewPagination.hasNext ||
                      reviewPagination.page > 1) && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {reviewPagination.hasNext && (
                          <button
                            onClick={() =>
                              fetchProductReviews(
                                reviewPagination.page + 1,
                                true,
                                reviewSort,
                              )
                            }
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                          >
                            View More Reviews
                          </button>
                        )}

                        {reviewPagination.page > 1 && (
                          <button
                            onClick={() =>
                              fetchProductReviews(1, false, reviewSort)
                            }
                            className="px-4 py-2 border border-pink-300 text-pink-700 rounded-lg text-sm hover:bg-pink-50"
                          >
                            Close Reviews
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                      Shipping Information
                    </h3>
                    <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700">
                      <li>• Free standard shipping on orders over $50</li>
                      <li>• Express shipping available for $9.99</li>
                      <li>• Orders typically ship within 1-2 business days</li>
                      <li>• Delivery time: 3-7 business days</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                      Returns & Exchanges
                    </h3>
                    <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700">
                      <li>• 30-day return policy</li>
                      <li>• Items must be in original condition</li>
                      <li>• Free return shipping for defective items</li>
                      <li>• Exchanges available for different sizes/colors</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
                You Might Also Like
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {relatedProducts.slice(0, 4).map((relatedProduct, index) => (
                  <motion.div
                    key={relatedProduct.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className="w-full"
                  >
                    <ProductCard product={relatedProduct} priority={index < 1} />
                  </motion.div>
                ))}
              </div>

              {relatedProducts.length > 4 && (
                <div className="text-center mt-6 sm:mt-8">
                  <Link
                    href={`/shop?category=${encodeURIComponent(product.category)}`}
                    className="inline-flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    <span>View More in {product.category}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* Product Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 sm:mt-16"
          >
            {product.views && (
              <div className="bg-gray-100 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
                <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{product.views} views</span>
                  </div>
                  {product.sales_count && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{product.sales_count} sold</span>
                    </div>
                  )}
                  {product.featured && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                      <span className="text-yellow-600 font-medium">
                        Featured
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
