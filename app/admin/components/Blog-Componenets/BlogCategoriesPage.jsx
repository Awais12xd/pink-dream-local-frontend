"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  Check,
  Loader,
  Tag,
  ImageIcon,
  Upload,
  Grid,
  List,
  ChevronUp,
  ChevronDown,
  Package,
} from "lucide-react";
import Authorized from "@/app/components/Authorized";

const BlogCategoriesPage = () => {
      const token = localStorage.getItem("staffUserToken");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    image: "",
    icon: "",
    isActive: true,
    parentCategory: null,
    metaTitle: "",
    metaDescription: "",
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const url = showActiveOnly
        ? `${API_BASE}/blog-categories?active=true`
        : `${API_BASE}/blog-categories`;

      const response = await fetch(url , {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      const data = await response.json();

      if (data.success) {
        // Sort by order and then by name
        const sortedCategories = data.blogCategories?.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.name.localeCompare(b.name);
        });
        setCategories(sortedCategories);

        // Calculate stats
        const activeCount = sortedCategories?.filter(
          (cat) => cat.isActive,
        ).length;
        setStats({
          total: sortedCategories?.length,
          active: activeCount,
          inactive: sortedCategories?.length - activeCount,
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, showActiveOnly]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
      formData.append("blogCategoryImage", file);

      const response = await fetch(`${API_BASE}/upload/blog-category-image`, {
        method: "POST",
        body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
          }
      });

      const data = await response.json();

      if (data.success) {
        setCategoryForm((prev) => ({
          ...prev,
          image: data.imageUrl,
        }));
        setImagePreview(data.imageUrl);
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

  // Handle form input change
  const handleFormChange = (field, value) => {
    setCategoryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setCategoryForm((prev) => ({
      ...prev,
      image: "",
    }));
    setImagePreview(null);
  };

  // Reset form
  const resetForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      image: "",
      icon: "",
      isActive: true,
      parentCategory: null,
      metaTitle: "",
      metaDescription: "",
    });
    setImagePreview(null);
    setIsAddingCategory(false);
    setEditingCategory(null);
  };

  // Handle create category
  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!categoryForm.name.trim()) {
      alert("Category name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/blog-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        fetchCategories();
      } else {
        alert(data.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  // Handle update category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    if (!categoryForm.name.trim()) {
      alert("Blog Category name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE}/blog-categories/${editingCategory._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(categoryForm),
        },
      );

      const data = await response.json();

      if (data.success) {
        resetForm();
        fetchCategories();
      } else {
        alert(data.message || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
      icon: category.icon || "",
      isActive: category.isActive,
      parentCategory: category.parentCategory || null,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
    });
    setImagePreview(category.image || null);
    setEditingCategory(category);
    setIsAddingCategory(true);
  };

  // Handle toggle active status
  const handleToggleActive = async (categoryId) => {
    try {
      const response = await fetch(
        `${API_BASE}/blog-categories/${categoryId}/toggle-active`,
        {
          method: "PATCH",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchCategories();
      } else {
        alert(data.message || "Failed to toggle category status");
      }
    } catch (error) {
      console.error("Error toggling category status:", error);
      alert("Failed to toggle category status");
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/blog-categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchCategories();
      } else {
        alert(data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  // Filter categories
  const filteredCategories = categories?.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = !showActiveOnly || category.isActive;
    return matchesSearch && matchesActive;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
                Blog Category Management
              </h1>
              <p className="text-gray-600">Organize your blog categories</p>
            </div>
            <Authorized permission={"blogCategories:create"}>
              <button
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add Category</span>
              </button>
            </Authorized>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-pink-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Categories</p>
                  <p className="text-3xl font-bold text-pink-600">
                    {stats.total}
                  </p>
                </div>
                <Package className="w-12 h-12 text-pink-400" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <Eye className="w-12 h-12 text-green-400" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-red-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Inactive</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.inactive}
                  </p>
                </div>
                <EyeOff className="w-12 h-12 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Category Form */}
        {isAddingCategory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={
                  editingCategory ? handleUpdateCategory : handleCreateCategory
                }
                className="p-6 space-y-6"
              >
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    placeholder="e.g., Dresses, Tops, Accessories"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    rows="3"
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    placeholder="Category description..."
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-4 relative">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-pink-200"
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
                    Recommended: 400x400px, Max 5MB (JPEG, PNG, WEBP, GIF)
                  </p>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon Class (Optional)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => handleFormChange("icon", e.target.value)}
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    placeholder="e.g., fa-dress, lucide-shirt"
                  />
                </div>

                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={categoryForm.metaTitle}
                    onChange={(e) =>
                      handleFormChange("metaTitle", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    placeholder="SEO friendly title"
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Meta Description
                  </label>
                  <textarea
                    value={categoryForm.metaDescription}
                    onChange={(e) =>
                      handleFormChange("metaDescription", e.target.value)
                    }
                    rows="2"
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    placeholder="SEO friendly description"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={categoryForm.isActive}
                    onChange={(e) =>
                      handleFormChange("isActive", e.target.checked)
                    }
                    className="w-5 h-5 text-pink-600 bg-gray-100 border-pink-300 rounded focus:ring-pink-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-700"
                  >
                    Active (visible to customers)
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>
                          {editingCategory
                            ? "Update Category"
                            : "Create Category"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-pink-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activeOnly"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="w-5 h-5 text-pink-600 bg-gray-100 border-pink-300 rounded focus:ring-pink-500"
              />
              <label
                htmlFor="activeOnly"
                className="text-sm font-medium text-gray-700"
              >
                Show Active Only
              </label>
            </div>
          </div>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-pink-100">
            <Loader className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading categories...</p>
          </div>
        ) : filteredCategories?.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-pink-100">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No categories found</p>
            <Authorized permission={"blogCategories:create"}>
              <button
                onClick={() => setIsAddingCategory(true)}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all"
              >
                Add Your First Category
              </button>
            </Authorized>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Image
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Description
                    </th>
                     <Authorized permission={"blogCategories:update"}>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Status
                    </th>
                    </Authorized>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100">
                  {filteredCategories?.map((category) => (
                    <tr
                      key={category._id}
                      className="hover:bg-pink-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-12 h-12 object-cover rounded-lg border-2 border-pink-200"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center border-2 border-pink-200"
                          style={{ display: category.image ? "none" : "flex" }}
                        >
                          <Tag className="w-6 h-6 text-pink-600" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{category.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {category.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Authorized permission={"blogCategories:update"}>
                          <button
                            onClick={() => handleToggleActive(category._id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              category.isActive
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {category.isActive ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </button>
                        </Authorized>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Authorized permission={"blogCategories:update"}>
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </Authorized>

                          <Authorized permission={"blogCategories:delete"}>
                            <button
                              onClick={() =>
                                handleDeleteCategory(
                                  category._id,
                                  category.name,
                                )
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </Authorized>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCategoriesPage;
