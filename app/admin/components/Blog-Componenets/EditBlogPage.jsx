"use client";

import React, { useState, useEffect, useRef } from "react";
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
import Image from "next/image";
import { getImageDimensions, getOptimizedImageSrc } from "@/app/utils/imageUtils";


const EditBlogPage = ({ blog, onSave, onCancel }) => {
  const token = "";


  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    category: "",
    image: "",
    authorName: "",
    authorProfileImage: "",
    bio: "",
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
  const [uploadingAuthorImage, setUploadingAuthorImage] = useState(false);
  const [authorImagePreview, setAuthorImagePreview] = useState(
    blog?.author?.profileImage || "",
  );
  const [blogCategories, setBlogCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const imagePreviewRef = useRef(null);
  const authorPreviewRef = useRef(null);
  const isBlobUrl = (url) => typeof url === "string" && url.startsWith("blob:");
  const revokeObjectUrl = (url) => {
    if (!isBlobUrl(url)) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      // no-op
    }
  };
  const blogHero = getImageDimensions("blogHero");
  const authorAvatar = getImageDimensions("avatar");


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
     
             if (data.success && data.blogCategories && data.blogCategories.length > 0) {
        
               const sortedDynamicCategories = data.blogCategories?.sort((a, b) => {
                 if (a.order !== b.order) return a.order - b.order;
                 return a.name.localeCompare(b.name);
               });
   
               
     
               setBlogCategories(sortedDynamicCategories);
             } else {
               undefined;
             }
           } catch (error) {
             console.error("Error fetching categories:", error);
             undefined;
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
        authorName: blog.author?.name || "",
        authorProfileImage: blog.author?.profileImage || "",
        bio: blog.author?.bio || "",
        status: blog.status,
        category: blog.category ,
        featured: blog.featured,
        trending: blog.trending,
        commentsEnabled: blog.commentsEnabled,
      };
      setFormData(blogData);
      setBlogContent(blog.content || "");
      setImagePreview(blog.image || "");
      setAuthorImagePreview(blog.author?.profileImage || "");
      setHasChanges(false);
    }
  }, [blog]);

  useEffect(() => {
    imagePreviewRef.current = imagePreview;
  }, [imagePreview]);

  useEffect(() => {
    authorPreviewRef.current = authorImagePreview;
  }, [authorImagePreview]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(imagePreviewRef.current);
      revokeObjectUrl(authorPreviewRef.current);
    };
  }, []);

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
        formData.image !== blog.image ||
        formData.authorName !== (blog.author?.name || "") ||
        formData.authorProfileImage !== (blog.author?.profileImage || "") ||
        formData.bio !== (blog.author?.bio || "")

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
    if (!formData.authorName?.trim()) {
      newErrors.authorName = "Author name is required";
    }
    if (!formData.bio?.trim()) {
      newErrors.bio = "Author bio is required";
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

    const previousRemote = formData.image;
    const tempUrl = URL.createObjectURL(file);
    revokeObjectUrl(imagePreview);
    setImagePreview(tempUrl);
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
      } else {
        setImagePreview(previousRemote || null);
        alert(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setImagePreview(previousRemote || null);
      alert("Failed to upload image");
    } finally {
      revokeObjectUrl(tempUrl);
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    revokeObjectUrl(imagePreview);
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));
    setImagePreview(null);
  };

  // Handle author image upload
  const handleAuthorImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    const previousRemote = formData.authorProfileImage;
    const tempUrl = URL.createObjectURL(file);
    revokeObjectUrl(authorImagePreview);
    setAuthorImagePreview(tempUrl);
    setUploadingAuthorImage(true);

    try {
      const formData = new FormData();
      formData.append("authorProfileImage", file);

      const response = await fetch(`${API_BASE}/upload/author-profile-image`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          authorProfileImage: data.imageUrl,
        }));
        setAuthorImagePreview(data.imageUrl);
      } else {
        setAuthorImagePreview(previousRemote || "");
        alert(data.message || "Failed to upload author image");
      }
    } catch (error) {
      console.error("Error uploading author image:", error);
      setAuthorImagePreview(previousRemote || "");
      alert("Failed to upload author image");
    } finally {
      revokeObjectUrl(tempUrl);
      setUploadingAuthorImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveAuthorImage = () => {
    revokeObjectUrl(authorImagePreview);
    setFormData((prev) => ({
      ...prev,
      authorProfileImage: "",
    }));
    setAuthorImagePreview("");
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
        authorName: formData.authorName,
        authorProfileImage: formData.authorProfileImage,
        bio: formData.bio,
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
    if (blog) {
      revokeObjectUrl(imagePreview);
      const productData = {
        title: blog.title || "",
        category: blog.category || "",
        shortDescription: blog.shortDescription || "",
        content: blog.content || "",
        image: blog.image,
        authorName: blog.author?.name || "",
        authorProfileImage: blog.author?.profileImage || "",
        bio: blog.author?.bio || "",
        featured: blog.featured,
        trending: blog.trending,
        status: blog.status,
        commentsEnabled: blog.commentsEnabled,
      };
      setFormData(productData);
      setBlogContent(blog.content || "");
      setImagePreview(blog.image || null);
      setAuthorImagePreview(blog.author?.profileImage || "");
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
              <Image
                src={
                  isBlobUrl(imagePreview)
                    ? imagePreview
                    : getOptimizedImageSrc(imagePreview, "blogHero")
                }
                alt="Blog preview"
                className="w-full h-80 object-cover rounded-lg border-2 border-pink-200"
                width={blogHero.width}
                height={blogHero.height}
                sizes={blogHero.sizes}
                quality={78}
                unoptimized={isBlobUrl(imagePreview)}
              />
              {isBlobUrl(imagePreview) && (
                <div className="absolute inset-0 bg-white/55 rounded-lg flex items-center justify-center">
                  <Loader className="w-6 h-6 text-pink-600 animate-spin" />
                </div>
              )}
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

        {/* Author Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
          <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-pink-600" />
            Author Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
            <div>
              {authorImagePreview ? (
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-pink-200">
                  <Image
                    src={
                      isBlobUrl(authorImagePreview)
                        ? authorImagePreview
                        : getOptimizedImageSrc(authorImagePreview, "avatar")
                    }
                    alt="Author preview"
                    className="w-full h-full object-cover"
                    width={authorAvatar.width}
                    height={authorAvatar.height}
                    sizes={authorAvatar.sizes}
                    quality={75}
                    unoptimized={isBlobUrl(authorImagePreview)}
                  />
                  {isBlobUrl(authorImagePreview) && (
                    <div className="absolute inset-0 bg-white/55 flex items-center justify-center">
                      <Loader className="w-5 h-5 text-pink-600 animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveAuthorImage}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full border-2 border-dashed border-pink-300 bg-pink-50 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-pink-400" />
                </div>
              )}

              <label className="mt-4 inline-block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAuthorImageUpload}
                  className="hidden"
                  disabled={uploadingAuthorImage}
                />
                <div
                  className={`flex items-center justify-center space-x-2 px-3 py-2 border-2 border-dashed border-pink-300 rounded-lg cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all ${
                    uploadingAuthorImage
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {uploadingAuthorImage ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin text-pink-600" />
                      <span className="text-pink-600 text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-pink-600" />
                      <span className="text-pink-600 text-sm">
                        {authorImagePreview ? "Change Image" : "Upload Image"}
                      </span>
                    </>
                  )}
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 400x400 px, Max 5MB
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="authorName"
                  value={formData.authorName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                    errors.authorName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Author name"
                />
                {errors.authorName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.authorName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio *
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                    errors.bio ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Short author bio"
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                )}
              </div>
            </div>
          </div>
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
              disabled={loading || uploadingImage || !hasChanges}
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
