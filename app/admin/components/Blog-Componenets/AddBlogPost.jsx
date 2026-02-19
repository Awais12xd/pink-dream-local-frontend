"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  Package,
  DollarSign,
  ImageIcon,
  Upload,
  Star,
  X,
  Globe,
  Settings,
  Save,
  AlertCircle,
  Check,
  Loader,
  RefreshCw,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./Blog.css";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

const CKEditorInput = dynamic(() => import("./CkEditorInput.jsx"), {
  ssr: false,
});



// Add Product Page Component with Dynamic + Static Categories
const AddBlogPage = () => {
      const token = localStorage.getItem("staffUserToken");

  // Static categories (fallback/default)
  const staticCategories = [
    "Psychology",
  ];

  //content using quill
  const [value, setValue] = useState(null);

  // Dynamic categories from backend
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Combined categories (dynamic + static)
  const [allCategories, setAllCategories] = useState([]);

  // Enhanced Add Product States
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingAuthorImage, setUploadingAuthorImage] = useState(false);
  const [imageAuthorPreview, setImageAuthorPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Enhanced Product Data Structure
  const [newBlog, setNewBlog] = useState({
    // Basic Information
    title: "",
    category: "",
    shortDescription: "",
    content: "",

    // Blog Images
    image: "", // Main image for backward compatibility

    //Author Details
    authorName: "",
    authorProfileImage: "",
    bio: "",

    // SEO & Meta Data
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    slug: "",
    tags: [""],

    // Additional
    trending: false,
    featured: false,
    commentsEnabled: true,
    publishedAt: null,
    readTime: 0,
    status: "draft", // draft, published, archived
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch active categories from backend and merge with static
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`${API_BASE}/blog-categories?active=true` , {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (
          data.success &&
          data.blogCategories &&
          data.blogCategories.length > 0
        ) {
          // Sort dynamic categories by order and name
          const sortedDynamicCategories = data.blogCategories.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.name.localeCompare(b.name);
          });

          setDynamicCategories(sortedDynamicCategories);

          // Extract category names from dynamic categories
          const dynamicCategoryNames = sortedDynamicCategories.map(
            (cat) => cat.name,
          );

          // Filter static categories to avoid duplicates
          const uniqueStaticCategories = staticCategories.filter(
            (staticCat) => !dynamicCategoryNames.includes(staticCat),
          );

          // Combine: Dynamic categories first, then unique static categories
          const combined = [...dynamicCategoryNames, ...uniqueStaticCategories];

          setAllCategories(combined);

          // Set first category as default if product category is empty
          if (!newBlog.category && combined.length > 0) {
            setNewBlog((prev) => ({
              ...prev,
              category: combined[0],
            }));
          }
        } else {
          // If no dynamic categories, use only static categories
          console.warn(
            "No active categories found from backend, using static categories",
          );
          setAllCategories(staticCategories);
          setDynamicCategories([]);

          if (!newBlog.category) {
            setNewBlog((prev) => ({
              ...prev,
              category: staticCategories[0],
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // On error, fallback to static categories
        console.log("Using static categories as fallback");
        setAllCategories(staticCategories);
        setDynamicCategories([]);

        if (!newBlog.category) {
          setNewBlog((prev) => ({
            ...prev,
            category: staticCategories[0],
          }));
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [API_BASE]);

  // Refresh categories function
  const refreshCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(`${API_BASE}/blog-categories?active=true` ,  {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      const data = await response.json();

      if (data.success && data.blogCategories) {
        const sortedDynamicCategories = data.blogCategories.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.name.localeCompare(b.name);
        });

        setDynamicCategories(sortedDynamicCategories);

        const dynamicCategoryNames = sortedDynamicCategories.map(
          (cat) => cat.name,
        );
        const uniqueStaticCategories = staticCategories.filter(
          (staticCat) => !dynamicCategoryNames.includes(staticCat),
        );

        const combined = [...dynamicCategoryNames, ...uniqueStaticCategories];
        setAllCategories(combined);

      }
    } catch (error) {
      console.error("Error refreshing categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Image Upload Handler (unchanged - already works well)
  // Handle image upload
  const handleAuthorImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, WEBP, or GIF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingAuthorImage(true);

    try {
      const formData = new FormData();
      formData.append("authorProfileImage", file);

      const response = await fetch(`${API_BASE}/upload/author-profile-image`, {
        method: "POST",
        body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
          }
      });

      const data = await response.json();

      if (data.success) {
        setNewBlog((prev) => ({
          ...prev,
          authorProfileImage: data.imageUrl,
        }));
        setImageAuthorPreview(data.imageUrl);
        console.log("✅Author Image uploaded:", data.imageUrl);
      } else {
        alert(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingAuthorImage(false);
    }
  };

  // Remove uploaded image
  const handleRemoveAuthorImage = () => {
    setNewBlog((prev) => ({
      ...prev,
      authorProfileImage: "",
    }));
    setImageAuthorPreview(null);
  };
  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, WEBP, or GIF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("blogImage", file);

      const response = await fetch(`${API_BASE}/upload/blog-image`, {
        method: "POST",
        body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
          }
      });

      const data = await response.json();

      if (data.success) {
        setNewBlog((prev) => ({
          ...prev,
          image: data.imageUrl,
        }));
        setImagePreview(data.imageUrl);
        console.log("✅ Image uploaded:", data.imageUrl);
      } else {
        alert(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setNewBlog((prev) => ({
      ...prev,
      image: "",
    }));
    setImagePreview(null);
  };

  // Update Product Field
  const updateBlogField = useCallback((field, value) => {
    setNewBlog((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Array Item Handlers
  const addArrayItem = useCallback((field) => {
    setNewBlog((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  }, []);

  const updateArrayItem = useCallback((field, index, value) => {
    setNewBlog((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  }, []);

  const removeArrayItem = useCallback((field, index) => {
    setNewBlog((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }, []);

  // Specifications Handlers
  //   const addSpecification = useCallback(() => {
  //     setNewProduct(prev => ({
  //       ...prev,
  //       specifications: [...prev.specifications, { key: '', value: '' }]
  //     }));
  //   }, []);

  //   const updateSpecification = useCallback((index, field, value) => {
  //     setNewProduct(prev => {
  //       const newSpecs = [...prev.specifications];
  //       newSpecs[index][field] = value;
  //       return { ...prev, specifications: newSpecs };
  //     });
  //   }, []);

  //   const removeSpecification = useCallback((index) => {
  //     setNewProduct(prev => ({
  //       ...prev,
  //       specifications: prev.specifications.filter((_, i) => i !== index)
  //     }));
  //   }, []);

  // Form Submit Handler
  const handleAddBlog = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !newBlog.title ||
      !newBlog.shortDescription ||
      !newBlog.authorName ||
      !newBlog.bio
    ) {
      alert(
        "Please fill in all required fields (title, short description, Author Details)",
      );
      return;
    }

    setSaving(true);

    try {
      // Clean up empty arrays
      const cleanedBlog = {
        ...newBlog,
        content: value,
        tags: newBlog.tags.filter((t) => t.trim()),
      };

      const response = await fetch(`${API_BASE}/add-blog`, {
        method: "POST",
        
        headers: {
          "Content-Type": "application/json",
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedBlog),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Blog created successfully!")

        // Reset form
        setNewBlog({
          title: "",
          category: "",
          shortDescription: "",
          content: "",
          image: "",
          authorName: "",
          authorProfileImage: "",
          bio: "",
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
          slug: "",
          tags: [""],
          trending: false,
          featured: false,
          publishedAt: null,
          readTime: 0,
          status: "draft", // draft, published, archived
        });
        setImagePreview(null);
        setValue(null);

        // Optionally switch to products list
        // setActiveTab('products');
      } else {
        console.log(data);
        alert(`❌ Failed to add blog: ${data}`);
      }
    } catch (error) {
      console.error("Error adding blog:", error);
      alert("❌ Error adding blog. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 py-8 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Add New Blog
          </h1>
          <p className="text-gray-600">Create a new blog for your store</p>
        </div>

        {/* Main Product Form */}
        <form onSubmit={handleAddBlog} className="space-y-6">
          {/* Grid Layout: 2 columns on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content (2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-pink-600" />
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Blog Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blog Title *
                    </label>
                    <input
                      type="text"
                      value={newBlog.title}
                      onChange={(e) => updateBlogField("title", e.target.value)}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="Your Blog Title here..."
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={newBlog.category}
                        onChange={(e) =>
                          updateBlogField("category", e.target.value)
                        }
                        className="flex-1 px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                        required
                        disabled={loadingCategories}
                      >
                        {loadingCategories ? (
                          <option>Loading categories...</option>
                        ) : (
                          allCategories.map((cat, index) => (
                            <option key={index} value={cat}>
                              {cat}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={refreshCategories}
                        disabled={loadingCategories}
                        className="p-3 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-all disabled:opacity-50"
                        title="Refresh Categories"
                      >
                        <RefreshCw
                          className={`w-5 h-5 ${loadingCategories ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>
                    {/* {dynamicCategories.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {dynamicCategories.length} categories loaded from backend
                      </p>
                    )} */}
                  </div>

                  {/* shortDescription */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={newBlog.shortDescription}
                      onChange={(e) =>
                        updateBlogField("shortDescription", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="Write short description of your blog..."
                    />
                  </div>
                </div>
              </div>

              {/* Actual Content */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-2 sm:p-6 border border-pink-100 min-h-[650px] ">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-pink-600" />
                  Content
                </h2>
                <div className="editor-wrapper">
                  {/* <ReactQuill
                      theme="snow"
                      value={value}
                      onChange={setValue}
                      style={{ height: "500px", width: "100%" }}
                      /> */}
                  {/* <BlogEditor onChange={setValue} /> */}
                  {/* <BlogEditor onChange={setValue} /> */}
                  <CKEditorInput value={value} onChange={setValue} />
                </div>
              </div>

              {/* Image Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-pink-600" />
                  Blog Image
                </h2>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4 relative">
                    <img
                      src={imagePreview}
                      alt="Blog preview"
                      className="w-full h-80 object-cover rounded-lg border-2 border-pink-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex items-center space-x-4 ">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <div
                      className={` flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-pink-300 rounded-lg cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin text-pink-600" />
                          <span className="text-pink-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-pink-600" />
                          <span className="text-pink-600">
                            {imagePreview ? "Change Image" : "Upload Image"}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 1200×800 px, Max 5MB (JPEG, PNG, WEBP, GIF)
                </p>
              </div>

              {/* Blog Details */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
                  Author Details
                </h2>

                <div className="w-full flex gap-3 sm:flex-row flex-col items-center">
                  {/* Image Section */}
                  <div className="bg-white/80  rounded-xl w-full flex justify-center items-center flex-col">
                    <h2 className="text-sm mb-2 flex items-center">
                      {/* <ImageIcon className="w-3 h-3 mr-2" /> */}
                      Profile Image
                    </h2>

                    {/* Image Preview */}
                    {imageAuthorPreview && (
                      <div className="mb-4 relative">
                        <img
                          src={imageAuthorPreview}
                          alt="Author image preview"
                          className=" h-32 w-32 object-cover rounded-full  border-pink-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveAuthorImage}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex items-center space-x-4">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAuthorImageUpload}
                          className="hidden"
                          disabled={uploadingAuthorImage}
                        />
                        <div
                          className={`w-48 flex items-center justify-center space-x-2 py-2 pl-2 rounded-lg  border-2 border-dashed border-pink-300 cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all ${uploadingAuthorImage ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {uploadingAuthorImage ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin text-pink-600" />
                              <span className="text-pink-600">
                                Uploading...
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-pink-600" />
                              <span className="text-pink-600">
                                {imageAuthorPreview
                                  ? "Change Image"
                                  : "Upload Image"}
                              </span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: 1200×800 px, Max 5MB (JPEG, PNG, WEBP, GIF)
                    </p>
                  </div>
                  <div className="space-y-4 w-full">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newBlog.authorName}
                        onChange={(e) =>
                          updateBlogField("authorName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                        placeholder="Write Author Name..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={newBlog.bio}
                        onChange={(e) => updateBlogField("bio", e.target.value)}
                        rows="2"
                        className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                        placeholder="Write about the author..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-pink-600" />
                  SEO & Meta Data
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={newBlog.slug}
                      onChange={(e) => updateBlogField("slug", e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="blog-url-slug"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={newBlog.metaTitle}
                      onChange={(e) =>
                        updateBlogField("metaTitle", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="SEO page title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={newBlog.metaDescription}
                      onChange={(e) =>
                        updateBlogField("metaDescription", e.target.value)
                      }
                      rows="2"
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="SEO description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={newBlog.metaKeywords}
                      onChange={(e) =>
                        updateBlogField("metaKeywords", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="space-y-2">
                      {newBlog.tags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) =>
                              updateArrayItem("tags", index, e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                            placeholder="Blog tag"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem("tags", index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem("tags")}
                        className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                      >
                        + Add Tag
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - 1 column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Inventory */}
              {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
                  Inventory
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) =>
                        updateProductField("stock_quantity", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      value={newProduct.low_stock_threshold}
                      onChange={(e) =>
                        updateProductField(
                          "low_stock_threshold",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div> */}

              {/* Advanced Settings */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-pink-600" />
                  Additional Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blog Read Time{" "}
                      <span className="text-xs text-pink-400">
                        ( in minutes )
                      </span>
                    </label>
                    <input
                      type="number"
                      value={newBlog.readTime}
                      onChange={(e) =>
                        updateBlogField("readTime", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blog Status
                    </label>
                    <select
                      value={newBlog.status}
                      onChange={(e) =>
                        updateBlogField("status", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 py-2">
                    <input
                      type="checkbox"
                      id="trending"
                      checked={newBlog.trending}
                      onChange={(e) =>
                        updateBlogField("trending", e.target.checked)
                      }
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-pink-300 rounded focus:ring-pink-500"
                    />
                    <label
                      htmlFor="trending"
                      className="text-sm font-medium text-gray-700"
                    >
                      Trending
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 py-2">
                    <input
                      type="checkbox"
                      id="commentsEnabled"
                      checked={newBlog.commentsEnabled}
                      onChange={(e) =>
                        updateBlogField("commentsEnabled", e.target.checked)
                      }
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-pink-300 rounded focus:ring-pink-500"
                    />
                    <label
                      htmlFor="commentsEnabled"
                      className="text-sm font-medium text-gray-700"
                    >
                      Comments Enabled
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 py-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={newBlog.featured}
                      onChange={(e) =>
                        updateBlogField("featured", e.target.checked)
                      }
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-pink-300 rounded focus:ring-pink-500"
                    />
                    <label
                      htmlFor="featured"
                      className="text-sm font-medium text-gray-700"
                    >
                      Featured Blog
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className="px-6 py-3 border border-pink-300 text-gray-700 rounded-lg hover:bg-pink-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving || !newBlog.title || !newBlog.image || !newBlog.category
              }
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Create Blog</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBlogPage;
