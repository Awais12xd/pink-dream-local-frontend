'use client'

import React, { useState, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';

const EditProductPage = ({ product, onSave, onCancel }) => {
      const token = localStorage.getItem("staffUserToken");

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    image: '',
    images: [],
    category: 'Dresses',
    new_price: '',
    old_price: '',
    available: true
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  const categories = [
    'Dresses', 'Tops', 'Bottoms', 'Accessories', 
    'Shoes', 'Outerwear', 'Activewear', 'Swimwear'
  ];

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Image utility functions
  const getImageSrc = (imageSrc, fallback = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams') => {
    if (!imageSrc) return fallback
    
    const baseURL = API_BASE || 'http://localhost:4000'
    
    // Handle old Railway URLs
    if (imageSrc.includes('railway.app')) {
      const filename = imageSrc.split('/images/')[1]
      if (filename) {
        return `${baseURL}/images/${filename}`
      }
    }
    
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc
    }
    
    if (imageSrc.startsWith('/images/')) {
      return `${baseURL}${imageSrc}`
    }
    
    if (!imageSrc.includes('/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(imageSrc)) {
      return `${baseURL}/images/${imageSrc}`
    }
    
    if (imageSrc.startsWith('images/')) {
      return `${baseURL}/${imageSrc}`
    }
    
    return `${baseURL}/${imageSrc}`
  }

  const handleImageError = (e) => {
    if (e.target.src !== 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image') {
      e.target.onerror = null
      e.target.src = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image'
    }
  }

  // Initialize form data when product prop changes
  useEffect(() => {
    if (product) {
      const productData = {
        id: product.id,
        name: product.name || '',
        image: product.image || '',
        images: product.images || (product.image ? [product.image] : []),
        category: product.category || 'Dresses',
        new_price: product.new_price || '',
        old_price: product.old_price || '',
        available: product.available !== undefined ? product.available : true
      };
      setFormData(productData);
      setHasChanges(false);
    }
  }, [product]);

  // Track changes
  useEffect(() => {
    if (product) {
      const hasDataChanged = 
        formData.name !== (product.name || '') ||
        formData.category !== (product.category || 'Dresses') ||
        formData.new_price !== (product.new_price || '') ||
        formData.old_price !== (product.old_price || '') ||
        formData.available !== (product.available !== undefined ? product.available : true) ||
        JSON.stringify(formData.images) !== JSON.stringify(product.images || (product.image ? [product.image] : []));
      
      setHasChanges(hasDataChanged);
    }
  }, [formData, product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.new_price || formData.new_price <= 0) {
      newErrors.new_price = 'New price must be greater than 0';
    }

    if (!formData.old_price || formData.old_price <= 0) {
      newErrors.old_price = 'Old price must be greater than 0';
    }

    if (parseFloat(formData.new_price) >= parseFloat(formData.old_price)) {
      newErrors.new_price = 'New price should be less than old price';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('product', file);
        
        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData,
        });
        const data = await response.json();
        
        if (data.success && data.image_url) {
          return data.image_url;
        }
        throw new Error(data.message || 'Upload failed');
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url);

      if (validUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...validUrls],
          image: prev.image || validUrls[0] // Set first uploaded image as main if no main image
        }));
        
        // Clear images error if it exists
        if (errors.images) {
          setErrors(prev => ({ ...prev, images: '' }));
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images:' + error.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (indexToRemove) => {
    const imageToRemove = formData.images[indexToRemove];
    const newImages = formData.images.filter((_, index) => index !== indexToRemove);
    
    setFormData(prev => ({
      ...prev,
      images: newImages,
      image: prev.image === imageToRemove ? (newImages[0] || '') : prev.image
    }));
  };

  const setMainImage = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        id: formData.id,
        name: formData.name.trim(),
        image: formData.image,
        images: formData.images,
        category: formData.category,
        new_price: parseFloat(formData.new_price),
        old_price: parseFloat(formData.old_price),
        available: formData.available
      };

      const response = await fetch(`${API_BASE}/updateproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (data.success) {
        onSave();
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product:' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (product) {
      const productData = {
        id: product.id,
        name: product.name || '',
        image: product.image || '',
        images: product.images || (product.image ? [product.image] : []),
        category: product.category || 'Dresses',
        new_price: product.new_price || '',
        old_price: product.old_price || '',
        available: product.available !== undefined ? product.available : true
      };
      setFormData(productData);
      setErrors({});
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Image Preview Modal
  const ImagePreviewModal = () => {
    if (!showPreview || formData.images.length === 0) return null;

    const nextImage = () => {
      setPreviewImageIndex((prev) => 
        prev === formData.images.length - 1 ? 0 : prev + 1
      );
    };

    const prevImage = () => {
      setPreviewImageIndex((prev) => 
        prev === 0 ? formData.images.length - 1 : prev - 1
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">
              Product Images ({previewImageIndex + 1} of {formData.images.length})
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative">
            <img
              src={getImageSrc(formData.images[previewImageIndex])}
              alt={`Product image ${previewImageIndex + 1}`}
              className="w-full h-96 object-contain bg-gray-50"
              onError={handleImageError}
            />
            
            {formData.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ArrowLeft className="w-6 h-6 rotate-180" />
                </button>
              </>
            )}
          </div>

          {formData.images.length > 1 && (
            <div className="p-4 border-t">
              <div className="flex gap-2 justify-center overflow-x-auto">
                {formData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setPreviewImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === previewImageIndex 
                        ? 'border-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getImageSrc(image)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Selected</h3>
          <p className="text-gray-500 mb-4">Please select a product from the products list to edit.</p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
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
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Products
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                <p className="text-gray-600">Update product information and settings</p>
              </div>
            </div>
            
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
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
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
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Price ($) *
              </label>
              <input
                type="number"
                name="new_price"
                value={formData.new_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.new_price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.new_price && (
                <p className="mt-1 text-sm text-red-600">{errors.new_price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Old Price ($) *
              </label>
              <input
                type="number"
                name="old_price"
                value={formData.old_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.old_price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.old_price && (
                <p className="mt-1 text-sm text-red-600">{errors.old_price}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="available"
                checked={formData.available}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Product is available for sale
              </span>
            </label>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
            <button
              type="button"
              onClick={() => formData.images.length > 0 && setShowPreview(true)}
              disabled={formData.images.length === 0}
              className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview All
            </button>
          </div>

          {/* Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images *
            </label>
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                uploadingImages 
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}>
                {uploadingImages ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <Camera className="w-5 h-5 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {uploadingImages ? 'Uploading...' : 'Add Images'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">
                You can select multiple images
              </span>
            </div>
            {errors.images && (
              <p className="mt-1 text-sm text-red-600">{errors.images}</p>
            )}
          </div>

          {/* Current Images */}
          {formData.images.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Current Images ({formData.images.length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:border-blue-300">
                      <img 
                        src={getImageSrc(image)}
                        alt={`Product ${index + 1}`} 
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        onClick={() => {
                          setPreviewImageIndex(index);
                          setShowPreview(true);
                        }}
                      />
                      
                      {/* Main Image Badge */}
                      {formData.image === image && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Main
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          {formData.image !== image && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMainImage(image);
                              }}
                              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                              title="Set as main image"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click on an image to preview • Hover to see actions • Star icon indicates main image
              </p>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No images uploaded</p>
              <p className="text-sm text-gray-400">Upload at least one image to continue</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-6">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Product ID: {formData.id}
            </span>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </div>
      </form>

      {/* Image Preview Modal */}
      <ImagePreviewModal />
    </div>
  );
};

export default EditProductPage;