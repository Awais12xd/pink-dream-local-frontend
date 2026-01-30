"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  DollarSign,
  Calendar,
  BarChart3,
  Globe,
  Tag,
  Palette,
  Ruler,
  Weight,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Heart,
  ShoppingCart,
  TrendingUp,
  Users,
  Camera,
  ExternalLink,
  Copy,
  Share2,
  Download,
  RefreshCw,
  ImageIcon,
  Plus,
  Minus,
  ArchiveIcon,
  HeartIcon,
  EyeIcon,
  Timer,
} from "lucide-react";
import "./Blog.css";

const BlogDetailsPage = ({ blogId, onEdit, onBack, onDelete }) => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Image utility functions
  const getImageSrc = (
    imageSrc,
    fallback = "https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams",
  ) => {
    if (!imageSrc) return fallback;

    const baseURL = API_BASE || "http://localhost:4000";

    // Handle old Railway URLs
    if (imageSrc.includes("railway.app")) {
      const filename = imageSrc.split("/images/")[1];
      if (filename) {
        return `${baseURL}/images/${filename}`;
      }
    }

    if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
      return imageSrc;
    }

    if (imageSrc.startsWith("/images/")) {
      return `${baseURL}${imageSrc}`;
    }

    if (
      !imageSrc.includes("/") &&
      /\.(jpg|jpeg|png|gif|webp)$/i.test(imageSrc)
    ) {
      return `${baseURL}/images/${imageSrc}`;
    }

    if (imageSrc.startsWith("images/")) {
      return `${baseURL}/${imageSrc}`;
    }

    return `${baseURL}/${imageSrc}`;
  };

  const handleImageError = (e) => {
    if (
      e.target.src !==
      "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image"
    ) {
      e.target.onerror = null;
      e.target.src = "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image";
    }
  };

  useEffect(() => {
    if (blogId) {
      fetchBlogDetails();
    }
  }, [blogId]);

  const fetchBlogDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/blog/${blogId}`);
      const data = await response.json();

      if (data.success) {
        setBlog(data.blog);
      } else {
        setError(data.message || "Blog not found");
      }
    } catch (error) {
      setError("Error fetching blog details");
      console.error("Error fetching blog details:", error);
    } finally {
      setLoading(false);
    }
  };
    

  const handleStatusToggle = async () => {
    try {
      const response = await fetch(`${API_BASE}/updateproduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: product.id,
          available: !product.available,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProduct((prev) => ({ ...prev, available: !prev.available }));
        showNotification("Product status updated successfully", "success");
      } else {
        showNotification("Failed to update product status", "error");
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      showNotification("Error updating product status", "error");
    }
  };

  const handleDeleteBlog = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    ) {
      try {
        const response = await fetch(`${API_BASE}/delete-blog/${blogId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: blog?.title,
          }),
        });

        const data = await response.json();
        if (data.success) {
          showNotification("Blog deleted successfully", "success");
          setTimeout(() => {
            onBack();
          }, 1500);
        } else {
          showNotification("Failed to delete blog", "error");
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
        showNotification("Error deleting blog", "error");
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Copied to clipboard", "success");
    });
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  //   const getDiscountPercentage = () => {
  //     if (product && product.old_price > product.new_price) {
  //       return Math.round(
  //         ((product.old_price - product.new_price) / product.old_price) * 100,
  //       );
  //     }
  //     return 0;
  //   };

  //   const getStockStatus = () => {
  //     if (!product)
  //       return { text: "Unknown", color: "text-gray-600", icon: AlertTriangle };

  //     if (product.stock_quantity === 0) {
  //       return { text: "Out of Stock", color: "text-red-600", icon: XCircle };
  //     } else if (product.stock_quantity <= product.low_stock_threshold) {
  //       return {
  //         text: "Low Stock",
  //         color: "text-yellow-600",
  //         icon: AlertTriangle,
  //       };
  //     } else {
  //       return { text: "In Stock", color: "text-green-600", icon: CheckCircle };
  //     }
  //   };

  // Notification Component
  const Notification = ({ message, type, onClose }) => {
    const bgColor =
      {
        success: "bg-green-100 border-green-500 text-green-700",
        error: "bg-red-100 border-red-500 text-red-700",
        info: "bg-blue-100 border-blue-500 text-blue-700",
      }[type] || "bg-gray-100 border-gray-500 text-gray-700";

    return (
      <div
        className={`fixed top-4 right-4 z-50 border-l-4 p-4 rounded shadow-lg ${bgColor}`}
      >
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button onClick={onClose} className="ml-4 text-lg">
            &times;
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading blog details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Blog
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={fetchBlogDetails}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blogs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  //   const stockStatus = getStockStatus();
  //   const discountPercentage = getDiscountPercentage();
  //   const images =
  //     product.images && product.images.length > 0
  //       ? product.images
  //       : [product.image];
  //   const validImages = images.filter((img) => img && img.trim() !== "");

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-2 sm:p-6 border ">
        <div className="flex sm:items-center justify-between sm:flex-row flex-col mb-4 gap-y-2">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Blogs
          </button>
          <div className="flex gap-1">
            <button
              onClick={fetchBlogDetails}
              className="flex items-center gap-2 px-3 py-2 text-xs sm:text-base text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => onEdit(blog)}
              className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base"
            >
              <Edit className="w-4 h-4" />
              Edit Blog
            </button>
            <button
              onClick={handleDeleteBlog}
              className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-base"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Blog Image */}

          <div className="">
            <div className="w-full aspect-video relative bg-gray-100 rounded-lg overflow-hidden h-[300px] sm:h-[500px]">
              <img
                src={getImageSrc(blog?.image)}
                alt="blog"
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
              <div className="absolute right-4 top-4 flex space-x-2">
                <span
                  className={` px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(blog?.status)}`}
                >
                  {blog?.status}
                </span>
              </div>
              <div className="absolute left-4 top-4 flex space-x-2">
                {blog?.featured && (
                  <span
                    className={` bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium}`}
                  >
                    Featured
                  </span>
                )}
                {blog?.trending && (
                  <span
                    className={`bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium`}
                  >
                    Trending
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h2
                className={`font-bold text-gray-900 mt-5 mb-3 line-clamp-2 text-2xl md:text-3xl`}
              >
                {blog.title}
              </h2>
              <p className={`text-gray-600 mb-4 line-clamp-3 text-base`}>
                {blog.shortDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow py-2 sm:p-3">
        <h3 className="text-lg font-semibold mb-4">Content</h3>
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: blog?.content }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Author Details */}
        <div className="bg-white rounded-lg shadow p-6 w-full">
          <h3 className="text-lg font-semibold mb-4">Author Details</h3>
          <div className="space-y-4 w-full mt-4">
            <div className="flex sm:flex-row flex-col gap-2 sm:gap-4 w-full">
              <div className=" ">
                <div className="flex items-center justify-center">
                  <img
                    src={blog?.author?.profileImage}
                    alt="author"
                    className="h-32 w-32 rounded-full object-cover"
                    onError={handleImageError}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4  ">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Name</label>
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {blog.author.name}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600">Bio</label>
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize text-justify">
                      {blog.author.bio}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Blog Information</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <ArchiveIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {blog?.status}
                  </span>
                  {/* <button
                  onClick={() => copyToClipboard(`/blog/${blog?.slug}`)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button> */}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Read Time</label>
                <div className="flex items-center gap-2 mt-1">
                  <Timer className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {blog?.readTime} min
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Likes</label>
                <div className="flex items-center gap-2 mt-1">
                  <HeartIcon className="w-4 h-4 text-pink-400" />
                  <span className="font-medium text-gray-900">
                    {blog?.likes.count || "0"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Views</label>
                <div className="flex items-center gap-2 mt-1">
                  <EyeIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {blog?.views || "0"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Created At</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-medium text-gray-900">
                    {" "}
                    {new Date(blog?.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">SEO Information</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">URL Slug</label>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{blog?.slug}</span>
                <button
                  onClick={() => copyToClipboard(`/blog/${blog?.slug}`)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Meta Title</label>
              <p className="text-gray-900 mt-1">
                {blog?.metaTitle || "Not set"}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Meta Description</label>
              <p className="text-gray-900 mt-1">
                {blog?.metaDescription || "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Meta Keywords</label>
              <p className="text-gray-900 mt-1">
                {blog?.metaKeywords.length !== 0
                  ? blog?.metaKeywords.map((key, index) => (
                      <span key={index}>{key}, </span>
                    ))
                  : "Not set"}
              </p>
            </div>
            {/* Tags */}
          </div>
          <div className="space-y-4">
            {blog.tags && blog.tags.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Tags</label>
                <div className="flex gap-2 flex-wrap">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailsPage;
