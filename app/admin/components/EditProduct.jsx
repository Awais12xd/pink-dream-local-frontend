"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Save,
  X,
  Trash2,
  Eye,
  ArrowLeft,
  ImageIcon,
  Star,
  AlertCircle,
  Loader2,
  Camera,
  RotateCcw,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";

const FALLBACK_CATEGORIES = [
  "Dresses",
  "Tops",
  "Bottoms",
  "Accessories",
  "Shoes",
  "Outerwear",
  "Activewear",
  "Swimwear",
];

const defaultForm = {
  id: "",
  name: "",
  category: "",
  brand: "",
  sku: "",
  description: "",
  short_description: "",
  image: "",
  images: [],
  new_price: "",
  old_price: "",
  discount_type: "percentage",
  discount_value: "",
  sale_start_date: "",
  sale_end_date: "",
  features: [""],
  specifications: [{ key: "", value: "" }],
  materials: "",
  care_instructions: "",
  size_chart: "",
  colors: [""],
  sizes: [""],
  weight: "",
  dimensions: { length: "", width: "", height: "" },
  stock_quantity: "",
  low_stock_threshold: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  slug: "",
  tags: [""],
  related_products: "",
  shipping_class: "standard",
  status: "draft",
  available: true,
  featured: false,
};

const cleanArray = (arr) =>
  Array.isArray(arr)
    ? arr.map((x) => String(x || "").trim()).filter(Boolean)
    : [];

const cleanSpecs = (arr) =>
  Array.isArray(arr)
    ? arr
        .map((s) => ({
          key: String(s?.key || "").trim(),
          value: String(s?.value || "").trim(),
        }))
        .filter((s) => s.key || s.value)
    : [];

const normalizeForCompare = (f) => ({
  ...f,
  name: String(f.name || "").trim(),
  category: String(f.category || "").trim(),
  brand: String(f.brand || "").trim(),
  sku: String(f.sku || "").trim(),
  description: String(f.description || "").trim(),
  short_description: String(f.short_description || "").trim(),
  image: String(f.image || "").trim(),
  images: (f.images || []).map((i) => String(i || "").trim()),
  new_price: Number(f.new_price || 0),
  old_price: Number(f.old_price || 0),
  discount_value: Number(f.discount_value || 0),
  sale_start_date: f.sale_start_date || "",
  sale_end_date: f.sale_end_date || "",
  features: cleanArray(f.features),
  specifications: cleanSpecs(f.specifications),
  materials: String(f.materials || "").trim(),
  care_instructions: String(f.care_instructions || "").trim(),
  size_chart: String(f.size_chart || "").trim(),
  colors: cleanArray(f.colors),
  sizes: cleanArray(f.sizes),
  weight: Number(f.weight || 0),
  dimensions: {
    length: Number(f.dimensions?.length || 0),
    width: Number(f.dimensions?.width || 0),
    height: Number(f.dimensions?.height || 0),
  },
  stock_quantity: Number(f.stock_quantity || 0),
  low_stock_threshold: Number(f.low_stock_threshold || 0),
  meta_title: String(f.meta_title || "").trim(),
  meta_description: String(f.meta_description || "").trim(),
  meta_keywords: String(f.meta_keywords || "").trim(),
  slug: String(f.slug || "").trim(),
  tags: cleanArray(f.tags),
  related_products: String(f.related_products || "")
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isInteger(x) && x > 0),
  shipping_class: String(f.shipping_class || "standard"),
  status: String(f.status || "draft"),
  available: !!f.available,
  featured: !!f.featured,
});

const getInitialData = (product) => ({
  id: product?._id || "",
  name: product?.name || "",
  category: product?.category || "",
  brand: product?.brand || "",
  sku: product?.sku || "",
  description: product?.description || "",
  short_description: product?.short_description || "",
  image: product?.image || "",
  images: product?.images?.length
    ? product.images
    : product?.image
      ? [product.image]
      : [],
  new_price: product?.new_price ?? "",
  old_price: product?.old_price ?? "",
  discount_type: product?.discount_type || "percentage",
  discount_value: product?.discount_value ?? "",
  sale_start_date: product?.sale_start_date
    ? new Date(product.sale_start_date).toISOString().slice(0, 10)
    : "",
  sale_end_date: product?.sale_end_date
    ? new Date(product.sale_end_date).toISOString().slice(0, 10)
    : "",
  features: product?.features?.length ? product.features : [""],
  specifications: product?.specifications?.length
    ? product.specifications
    : [{ key: "", value: "" }],
  materials: product?.materials || "",
  care_instructions: product?.care_instructions || "",
  size_chart: product?.size_chart || "",
  colors: product?.colors?.length ? product.colors : [""],
  sizes: product?.sizes?.length ? product.sizes : [""],
  weight: product?.weight ?? "",
  dimensions: {
    length: product?.dimensions?.length ?? "",
    width: product?.dimensions?.width ?? "",
    height: product?.dimensions?.height ?? "",
  },
  stock_quantity: product?.stock_quantity ?? "",
  low_stock_threshold: product?.low_stock_threshold ?? "",
  meta_title: product?.meta_title || "",
  meta_description: product?.meta_description || "",
  meta_keywords: product?.meta_keywords || "",
  slug: product?.slug || "",
  tags: product?.tags?.length ? product.tags : [""],
  related_products: Array.isArray(product?.related_products)
    ? product.related_products.join(", ")
    : "",
  shipping_class: product?.shipping_class || "standard",
  status: product?.status || "draft",
  available: product?.available !== undefined ? product.available : true,
  featured: !!product?.featured,
});

const EditProductPage = ({ product, onSave, onCancel }) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("staffUserToken")
      : null;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const [formData, setFormData] = useState(defaultForm);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);

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
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image";
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${API_BASE}/categories?active=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data?.success && Array.isArray(data.categories) && data.categories.length) {
        const dynamic = data.categories
          .map((c) => c.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        const merged = [...dynamic, ...FALLBACK_CATEGORIES.filter((x) => !dynamic.includes(x))];
        setCategories(merged);
      } else {
        setCategories(FALLBACK_CATEGORIES);
      }
    } catch {
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoadingCategories(false);
    }
  }, [API_BASE, token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!product) return;
    const initial = getInitialData(product);
    if (!initial.category) initial.category = FALLBACK_CATEGORIES[0];
    setFormData(initial);

    const snap = JSON.stringify(normalizeForCompare(initial));
    setInitialSnapshot(snap);
    setHasChanges(false);
    setErrors({});
    console.log(formData , "form")
  }, [product]);

  useEffect(() => {
    if (!initialSnapshot) return;
    const current = JSON.stringify(normalizeForCompare(formData));
    setHasChanges(current !== initialSnapshot);
  }, [formData, initialSnapshot]);

  const updateField = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const updateNestedField = (parent, field, value) => {
    setFormData((p) => ({
      ...p,
      [parent]: { ...p[parent], [field]: value },
    }));
  };

  const addArrayItem = (field, template = "") => {
    setFormData((p) => ({ ...p, [field]: [...p[field], template] }));
  };

  const updateArrayItem = (field, index, value) => {
    setFormData((p) => {
      const arr = [...p[field]];
      arr[index] = value;
      return { ...p, [field]: arr };
    });
  };

  const removeArrayItem = (field, index) => {
    setFormData((p) => {
      const arr = p[field].filter((_, i) => i !== index);
      return { ...p, [field]: arr.length ? arr : [""] };
    });
  };

  const addSpec = () => {
    setFormData((p) => ({
      ...p,
      specifications: [...p.specifications, { key: "", value: "" }],
    }));
  };

  const updateSpec = (index, key, value) => {
    setFormData((p) => {
      const specs = [...p.specifications];
      specs[index] = { ...specs[index], [key]: value };
      return { ...p, specifications: specs };
    });
  };

  const removeSpec = (index) => {
    setFormData((p) => {
      const specs = p.specifications.filter((_, i) => i !== index);
      return {
        ...p,
        specifications: specs.length ? specs : [{ key: "", value: "" }],
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const newPrice = Number(formData.new_price);
    const oldPrice = Number(formData.old_price);

    if (!String(formData.name || "").trim()) newErrors.name = "Product name is required";
    if (!String(formData.category || "").trim()) newErrors.category = "Category is required";

    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      newErrors.new_price = "New price must be greater than 0";
    }

    if (!Number.isFinite(oldPrice) || oldPrice <= 0) {
      newErrors.old_price = "Old price must be greater than 0";
    }

    if (Number.isFinite(newPrice) && Number.isFinite(oldPrice) && newPrice >= oldPrice) {
      newErrors.new_price = "New price must be less than old price";
    }

    if (!Array.isArray(formData.images) || !formData.images.length) {
      newErrors.images = "At least one image is required";
    }

    if (formData.sale_start_date && formData.sale_end_date) {
      const start = new Date(formData.sale_start_date);
      const end = new Date(formData.sale_end_date);
      if (start > end) {
        newErrors.sale_end_date = "Sale end date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const invalidType = files.find((f) => !validTypes.includes(f.type));
    if (invalidType) {
      alert("Please upload only image files (JPG, PNG, WEBP, GIF).");
      return;
    }

    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      alert("Max image size is 5MB.");
      return;
    }

    setUploadingImages(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fd = new FormData();
        fd.append("product", file);

        const res = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!data.success || !data.image_url) {
          throw new Error(data.message || `Failed to upload ${file.name}`);
        }
        return data.image_url;
      });

      const uploaded = await Promise.all(uploadPromises);

      setFormData((p) => {
        const images = [...p.images, ...uploaded];
        const image = p.image || images[0] || "";
        return { ...p, images, image };
      });

      if (errors.images) setErrors((p) => ({ ...p, images: "" }));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error uploading images");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData((p) => {
      const imageToRemove = p.images[indexToRemove];
      const images = p.images.filter((_, i) => i !== indexToRemove);
      const image = p.image === imageToRemove ? images[0] || "" : p.image;
      return { ...p, images, image };
    });
  };

  const setMainImage = (imageUrl) => {
    setFormData((p) => ({ ...p, image: imageUrl }));
  };

  const buildPayload = () => {
    const slug =
      String(formData.slug || "").trim() ||
      String(formData.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

    return {
      id: formData.id,
      name: String(formData.name || "").trim(),
      category: String(formData.category || "").trim(),
      brand: String(formData.brand || "").trim(),
      sku: String(formData.sku || "").trim(),
      description: String(formData.description || "").trim(),
      short_description: String(formData.short_description || "").trim(),
      image: String(formData.image || "").trim() || formData.images[0] || "",
      images: formData.images.map((img) => String(img || "").trim()).filter(Boolean),

      new_price: Number(formData.new_price || 0),
      old_price: Number(formData.old_price || 0),
      discount_type: formData.discount_type || "percentage",
      discount_value: Number(formData.discount_value || 0),
      sale_start_date: formData.sale_start_date || null,
      sale_end_date: formData.sale_end_date || null,

      features: cleanArray(formData.features),
      specifications: cleanSpecs(formData.specifications),
      materials: String(formData.materials || "").trim(),
      care_instructions: String(formData.care_instructions || "").trim(),
      size_chart: String(formData.size_chart || "").trim(),
      colors: cleanArray(formData.colors),
      sizes: cleanArray(formData.sizes),
      weight: Number(formData.weight || 0),
      dimensions: {
        length: Number(formData.dimensions.length || 0),
        width: Number(formData.dimensions.width || 0),
        height: Number(formData.dimensions.height || 0),
      },

      stock_quantity: Number(formData.stock_quantity || 0),
      low_stock_threshold: Number(formData.low_stock_threshold || 10),

      meta_title: String(formData.meta_title || "").trim(),
      meta_description: String(formData.meta_description || "").trim(),
      meta_keywords: String(formData.meta_keywords || "").trim(),
      slug,

      tags: cleanArray(formData.tags),
      related_products: String(formData.related_products || "")
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isInteger(x) && x > 0),

      shipping_class: formData.shipping_class || "standard",
      status: formData.status || "draft",
      available: !!formData.available,
      featured: !!formData.featured,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();

      const res = await fetch(`${API_BASE}/updateproduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to update product");
      toast.success("Product updated successfully!")
      onSave?.(data.product);
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error(err.message || "Error updating product");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!product) return;
    const initial = getInitialData(product);
    setFormData(initial);
    setErrors({});
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    onCancel?.();
  };

  const ImagePreviewModal = () => {
    if (!showPreview || !formData.images.length) return null;

    const next = () =>
      setPreviewImageIndex((p) =>
        p === formData.images.length - 1 ? 0 : p + 1,
      );

    const prev = () =>
      setPreviewImageIndex((p) =>
        p === 0 ? formData.images.length - 1 : p - 1,
      );

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">
              Images ({previewImageIndex + 1}/{formData.images.length})
            </h3>
            <button onClick={() => setShowPreview(false)} className="text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <img
              src={getImageSrc(formData.images[previewImageIndex])}
              alt="Preview"
              className="w-full h-[70vh] object-contain bg-gray-50"
              onError={handleImageError}
            />

            {formData.images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const sectionTitleCls = "text-base font-semibold text-gray-900 mb-4";
  const inputCls =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  if (!product) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-3">No product selected</p>
        <button onClick={onCancel} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-sm text-gray-500">ID: {formData.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1">
              <RotateCcw className="w-4 h-4" />
              Reset
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border p-5">
            <h2 className={sectionTitleCls}>Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Product Name *</label>
                <input
                  className={inputCls}
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Category *</label>
                <select
                  className={inputCls}
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  disabled={loadingCategories}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Brand</label>
                <input className={inputCls} value={formData.brand} onChange={(e) => updateField("brand", e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">SKU</label>
                <input className={inputCls} value={formData.sku} onChange={(e) => updateField("sku", e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select className={inputCls} value={formData.status} onChange={(e) => updateField("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Short Description</label>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={formData.short_description}
                  onChange={(e) => updateField("short_description", e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={4}
                  className={inputCls}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5">
            <h2 className={sectionTitleCls}>Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">New Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={formData.new_price}
                  onChange={(e) => updateField("new_price", e.target.value)}
                />
                {errors.new_price && <p className="text-sm text-red-600 mt-1">{errors.new_price}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Old Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={formData.old_price}
                  onChange={(e) => updateField("old_price", e.target.value)}
                />
                {errors.old_price && <p className="text-sm text-red-600 mt-1">{errors.old_price}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Discount Type</label>
                <select
                  className={inputCls}
                  value={formData.discount_type}
                  onChange={(e) => updateField("discount_type", e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Discount Value</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={formData.discount_value}
                  onChange={(e) => updateField("discount_value", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Sale Start Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={formData.sale_start_date}
                  onChange={(e) => updateField("sale_start_date", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Sale End Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={formData.sale_end_date}
                  onChange={(e) => updateField("sale_end_date", e.target.value)}
                />
                {errors.sale_end_date && <p className="text-sm text-red-600 mt-1">{errors.sale_end_date}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className={sectionTitleCls}>Images</h2>
              <button
                type="button"
                onClick={() => formData.images.length && setShowPreview(true)}
                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400">
              {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              <span className="text-sm">{uploadingImages ? "Uploading..." : "Upload Images"}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>

            {errors.images && <p className="text-sm text-red-600 mt-2">{errors.images}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {formData.images.map((img, idx) => (
                <div key={`${img}-${idx}`} className="relative group border rounded-lg overflow-hidden">
                  <img
                    src={getImageSrc(img)}
                    alt={`product-${idx + 1}`}
                    className="w-full h-32 object-cover"
                    onError={handleImageError}
                  />
                  {formData.image === img && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Main
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {formData.image !== img && (
                      <button
                        type="button"
                        onClick={() => setMainImage(img)}
                        className="p-2 rounded-full bg-blue-600 text-white"
                        title="Set Main Image"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-2 rounded-full bg-red-600 text-white"
                      title="Remove Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5">
            <h2 className={sectionTitleCls}>Product Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Features</label>
                {formData.features.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2">
                    <input
                      className={inputCls}
                      value={v}
                      onChange={(e) => updateArrayItem("features", i, e.target.value)}
                    />
                    <button type="button" onClick={() => removeArrayItem("features", i)} className="p-2 text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("features")} className="mt-2 text-sm text-blue-600 inline-flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Feature
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Specifications</label>
                {formData.specifications.map((s, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      className={inputCls}
                      placeholder="Key"
                      value={s.key}
                      onChange={(e) => updateSpec(i, "key", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input
                        className={inputCls}
                        placeholder="Value"
                        value={s.value}
                        onChange={(e) => updateSpec(i, "value", e.target.value)}
                      />
                      <button type="button" onClick={() => removeSpec(i)} className="p-2 text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addSpec} className="mt-2 text-sm text-blue-600 inline-flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Spec
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Materials</label>
                  <input className={inputCls} value={formData.materials} onChange={(e) => updateField("materials", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Size Chart</label>
                  <input className={inputCls} value={formData.size_chart} onChange={(e) => updateField("size_chart", e.target.value)} />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Care Instructions</label>
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={formData.care_instructions}
                    onChange={(e) => updateField("care_instructions", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5">
            <h2 className={sectionTitleCls}>SEO</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <input className={inputCls} value={formData.slug} onChange={(e) => updateField("slug", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Meta Title</label>
                <input className={inputCls} value={formData.meta_title} onChange={(e) => updateField("meta_title", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Meta Description</label>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={formData.meta_description}
                  onChange={(e) => updateField("meta_description", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Meta Keywords</label>
                <input className={inputCls} value={formData.meta_keywords} onChange={(e) => updateField("meta_keywords", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-5">
            <h2 className={sectionTitleCls}>Inventory</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Stock Quantity</label>
                <input type="number" min="0" className={inputCls} value={formData.stock_quantity} onChange={(e) => updateField("stock_quantity", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Low Stock Threshold</label>
                <input type="number" min="0" className={inputCls} value={formData.low_stock_threshold} onChange={(e) => updateField("low_stock_threshold", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Shipping Class</label>
                <select className={inputCls} value={formData.shipping_class} onChange={(e) => updateField("shipping_class", e.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="overnight">Overnight</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Weight</label>
                <input type="number" step="0.01" min="0" className={inputCls} value={formData.weight} onChange={(e) => updateField("weight", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5">
            <h2 className={sectionTitleCls}>Dimensions</h2>
            <div className="space-y-4">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                placeholder="Length"
                value={formData.dimensions.length}
                onChange={(e) => updateNestedField("dimensions", "length", e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                placeholder="Width"
                value={formData.dimensions.width}
                onChange={(e) => updateNestedField("dimensions", "width", e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                placeholder="Height"
                value={formData.dimensions.height}
                onChange={(e) => updateNestedField("dimensions", "height", e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5">
            <h2 className={sectionTitleCls}>Attributes</h2>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Colors</label>
              {formData.colors.map((v, i) => (
                <div key={i} className="flex items-center gap-2 mt-2">
                  <input className={inputCls} value={v} onChange={(e) => updateArrayItem("colors", i, e.target.value)} />
                  <button type="button" onClick={() => removeArrayItem("colors", i)} className="p-2 text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem("colors")} className="mt-2 text-sm text-blue-600 inline-flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Color
              </button>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Sizes</label>
              {formData.sizes.map((v, i) => (
                <div key={i} className="flex items-center gap-2 mt-2">
                  <input className={inputCls} value={v} onChange={(e) => updateArrayItem("sizes", i, e.target.value)} />
                  <button type="button" onClick={() => removeArrayItem("sizes", i)} className="p-2 text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem("sizes")} className="mt-2 text-sm text-blue-600 inline-flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Size
              </button>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Tags</label>
              {formData.tags.map((v, i) => (
                <div key={i} className="flex items-center gap-2 mt-2">
                  <input className={inputCls} value={v} onChange={(e) => updateArrayItem("tags", i, e.target.value)} />
                  <button type="button" onClick={() => removeArrayItem("tags", i)} className="p-2 text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem("tags")} className="mt-2 text-sm text-blue-600 inline-flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Tag
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Related Product IDs</label>
              <input
                className={inputCls}
                placeholder="e.g. 12, 34, 56"
                value={formData.related_products}
                onChange={(e) => updateField("related_products", e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5">
            <h2 className={sectionTitleCls}>Visibility</h2>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => updateField("available", e.target.checked)}
              />
              <span className="text-sm text-gray-700">Available for sale</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => updateField("featured", e.target.checked)}
              />
              <span className="text-sm text-gray-700">Featured product</span>
            </label>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-lg border p-5 flex items-center justify-between">
          <button type="button" onClick={handleCancel} className="px-5 py-2.5 border rounded-lg text-gray-700">
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Updating..." : "Update Product"}
          </button>
        </div>
      </form>

      <ImagePreviewModal />
    </div>
  );
};

export default EditProductPage;
