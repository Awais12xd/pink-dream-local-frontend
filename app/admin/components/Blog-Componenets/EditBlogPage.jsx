"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  Upload,
  Trash2,
  Eye,
  ArrowLeft,
  ImageIcon,
  Star,
  AlertCircle,
  Check,
  Loader2,
  Camera,
  RotateCcw,
  Loader,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import CKEditorInput from "./CkEditorInput";


const EditBlogPage = ({ blog, onSave, onCancel }) => {
  const token = localStorage.getItem("staffUserToken");


  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    category: "",
    image: "",
    content: "",
    status: "draft",
    featured: false,
    trending: false,
    commentsEnabled: true,
  });
  const [blogContent , setBlogContent] = useState(blog?.content)

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(blog?.image);
  const [blogCategories, setBlogCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);


  const categories = ["Fashion", "Beauty"];

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

   useEffect(() => {
    setFormData((prev) => ({
        ...prev,
        content : blogContent
    }))
   } , [blogContent])

   // fetch categories
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
     
             console.log(data)
             if (data.success && data.blogCategories && data.blogCategories.length > 0) {
               // Sort dynamic categories by order and name
               const sortedDynamicCategories = data.blogCategories?.sort((a, b) => {
                 if (a.order !== b.order) return a.order - b.order;
                 return a.name.localeCompare(b.name);
               });
   
               
     
               setBlogCategories(sortedDynamicCategories);
             } else {
               // If no dynamic categories, use only static categories
               console.warn(
                 "No active categories found from backend, in view blogs",
               );
             }
           } catch (error) {
             console.error("Error fetching categories:", error);
             // On error, fallback to static categories
             console.log("Using static categories as fallback");
           } finally {
             setLoadingCategories(false);
           }
         };
       
         fetchCategories();
       }, [API_BASE]);
     

  // Initialize form data when blog prop changes
  useEffect(() => {
    if (blog) {
      const blogData = {
        title: blog.title,
        shortDescription: blog.shortDescription || "",
        content: blog.content || "",
        image: blog.image || "",
        status: blog.status,
        category: blog.category ,
        featured: blog.featured,
        trending: blog.trending,
        commentsEnabled: blog.commentsEnabled,
      };
      setFormData(blogData);
      setHasChanges(false);
    }
  }, [blog]);

  // Track changes
  useEffect(() => {
    if (blog) {
      const hasDataChanged =
        formData.title !== (blog.title || "") ||
        formData.category !== (blog.category || "Dresses") ||
        formData.shortDescription !== (blog.shortDescription || "") ||
        formData.content !== (blog.content || "") ||
        formData.featured !== blog.featured ||
        formData.trending !== blog.trending ||
        formData.commentsEnabled !== blog.commentsEnabled ||
        formData.status !== blog.status || 
        formData.image !== blog.image

      setHasChanges(hasDataChanged);
    }
  }, [formData, blog]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Blog title is required";
    }

    if (!formData.image) {
      newErrors.image = "At least one blog image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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
        setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        id: blog?._id ,
        title: formData.title,
        category: formData.category,
        oldCategory: blog?.category,
        shortDescription: formData.shortDescription,
        content: formData.content,
        image: formData.image,
        featured: formData.featured,
        trending: formData.trending,
        commentsEnabled: formData.commentsEnabled,
        status: formData.status,
        oldStatus: blog?.status,
      };

      const response = await fetch(`${API_BASE}/update-blog/${blog?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Blog updated successfully!");
        onSave();
      } else {
        throw new Error(data.message || "Failed to update blog");
      }
    } catch (error) {
      console.error("Error updating blog:", error);
      alert("Error updating blog:" + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (product) {
      const productData = {
        title: blog.title || "",
        category: blog.category || "",
        shortDescription: blog.shortDescription || "",
        content: blog.content || "",
        image: blog.image,
        featured: blog.featured,
        trending: blog.trending,
        status: blog.status,
      };
      setFormData(productData);
      setErrors({});
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to cancel?",
        )
      ) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Blog Selected
          </h3>
          <p className="text-gray-500 mb-4">
            Please select a blog from the blog list to edit.
          </p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border-b mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex sm:items-center sm:flex-row flex-col gap-4">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Blogs
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Edit Blog</h1>
                <p className="text-gray-600 text-xs sm:text-base">
                  Update blog content and settings
                </p>
              </div>
            </div>
            <br/>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="flex items-center gap-2 text-orange-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-2 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Blog Information
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter blog title"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                
                {blogCategories && blogCategories?.map((cat , index) => (
                  <option key={index} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.shortDescription ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter Short Description of our blog..."
              />
              {errors.shortDescription && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.shortDescription}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Featured
                </span>
              </label>
            </div>
            <div className="">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="trending"
                  checked={formData.trending}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Trending
                </span>
              </label>
            </div>
            <div className="">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="commentsEnabled"
                  checked={formData.commentsEnabled}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Comments Enabled
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-1 py-3 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Blog Information
          </h2>

          <div className=" h-[730px] gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Content *
              </label>
              {/* <ReactQuill
                theme="snow"
                value={blogContent}
                onChange={setBlogContent}
                style={{ height: "600px", width: "100%" }}
              /> */}
              <CKEditorInput value={blogContent} onChange={setBlogContent}  />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>
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
          <div className="flex items-center space-x-4">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
              <div
                className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-pink-300 rounded-lg cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
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

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-6">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-3 sm:px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 sm:block hidden">
              Blog ID: {blog?._id}
            </span>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex items-center gap-2 px-3 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? "Updating..." : "Update Blog"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditBlogPage;
