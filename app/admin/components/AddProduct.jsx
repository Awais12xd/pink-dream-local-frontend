import React, { useCallback, useState, useEffect } from 'react'
import { Package, DollarSign, ImageIcon, Upload, Star, X, Globe, Settings, Save,
  AlertCircle, Check, Loader, RefreshCw } from 'lucide-react';


 // Add Product Page Component with Dynamic + Static Categories
  const AddProductPage = () => { 
      const token = localStorage.getItem("staffUserToken");

    // Static categories (fallback/default)
    const staticCategories = ['Dresses', 'Tops', 'Bottoms', 'Accessories', 'Shoes', 'Outerwear', 'Activewear', 'Swimwear'];
    
    // Dynamic categories from backend
    const [dynamicCategories, setDynamicCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    
    // Combined categories (dynamic + static)
    const [allCategories, setAllCategories] = useState([]);
  
  // Enhanced Add Product States
  const [uploadProgress, setUploadProgress] = useState({});
  const [saving, setSaving] = useState(false);  
  const [activeTab, setActiveTab] = useState('dashboard'); 
    
  // Enhanced Product Data Structure
  const [newProduct, setNewProduct] = useState({
    // Basic Information
    name: '',
    category: '',
    new_price: '',
    old_price: '',
    brand: '',
    sku: '',
    description: '',
    short_description: '',
    available: true,
    featured: false,
    
    // Product Images
    images: [],
    image: '', // Main image for backward compatibility
    
    // Features & Details
    features: [''],
    specifications: [{ key: '', value: '' }],
    materials: '',
    care_instructions: '',
    size_chart: '',
    colors: [''],
    sizes: [''],
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    
    // Inventory
    stock_quantity: '',
    low_stock_threshold: '',
    
    // SEO & Meta Data
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    slug: '',
    
    // Pricing & Promotions
    discount_type: 'percentage', // percentage or fixed
    discount_value: '',
    sale_start_date: '',
    sale_end_date: '',
    
    // Additional
    tags: [''],
    related_products: [],
    shipping_class: 'standard',
    status: 'draft' // draft, published, archived
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch active categories from backend and merge with static
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`${API_BASE}/categories?active=true` , {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.categories && data.categories.length > 0) {
          // Sort dynamic categories by order and name
          const sortedDynamicCategories = data.categories.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.name.localeCompare(b.name);
          });
          
          setDynamicCategories(sortedDynamicCategories);
          
          // Extract category names from dynamic categories
          const dynamicCategoryNames = sortedDynamicCategories.map(cat => cat.name);
          
          // Filter static categories to avoid duplicates
          const uniqueStaticCategories = staticCategories.filter(
            staticCat => !dynamicCategoryNames.includes(staticCat)
          );
          
          // Combine: Dynamic categories first, then unique static categories
          const combined = [
            ...dynamicCategoryNames,
            ...uniqueStaticCategories
          ];
          
          setAllCategories(combined);
          
          // Set first category as default if product category is empty
          if (!newProduct.category && combined.length > 0) {
            setNewProduct(prev => ({
              ...prev,
              category: combined[0]
            }));
          }
        } else {
          // If no dynamic categories, use only static categories
          console.warn('No active categories found from backend, using static categories');
          setAllCategories(staticCategories);
          setDynamicCategories([]);
          
          if (!newProduct.category) {
            setNewProduct(prev => ({
              ...prev,
              category: staticCategories[0]
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // On error, fallback to static categories
        console.log('Using static categories as fallback');
        setAllCategories(staticCategories);
        setDynamicCategories([]);
        
        if (!newProduct.category) {
          setNewProduct(prev => ({
            ...prev,
            category: staticCategories[0]
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
      const response = await fetch(`${API_BASE}/categories?active=true` , {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      const data = await response.json();
      
      if (data.success && data.categories) {
        const sortedDynamicCategories = data.categories.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.name.localeCompare(b.name);
        });
        
        setDynamicCategories(sortedDynamicCategories);
        
        const dynamicCategoryNames = sortedDynamicCategories.map(cat => cat.name);
        const uniqueStaticCategories = staticCategories.filter(
          staticCat => !dynamicCategoryNames.includes(staticCat)
        );
        
        const combined = [...dynamicCategoryNames, ...uniqueStaticCategories];
        setAllCategories(combined);
        
      }
    } catch (error) {
      console.error('Error refreshing categories:', error);
      alert('Failed to refresh categories. Using cached categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Image Upload Handler (unchanged - already works well)
  const handleImageChange = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert('Please upload only image files (JPEG, PNG, WEBP, GIF)');
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Some files are too large. Maximum size is 5MB per image.');
      return;
    }

    const uploadedUrls = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('product', file);

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          uploadedUrls.push(data.image_url);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } else {
          alert(`Failed to upload ${file.name}: ${data.message}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Error uploading ${file.name}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
        image: prev.image || uploadedUrls[0] // Set first uploaded image as main image if not set
      }));
    }

    // Clear progress after 2 seconds
    setTimeout(() => setUploadProgress({}), 2000);
  }, [API_BASE]);

  // Remove Image Handler
  const removeImage = useCallback((indexToRemove) => {
    setNewProduct(prev => {
      const newImages = prev.images.filter((_, index) => index !== indexToRemove);
      return {
        ...prev,
        images: newImages,
        image: newImages[0] || '' // Update main image if needed
      };
    });
  }, []);

  // Update Product Field
  const updateProductField = useCallback((field, value) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Array Item Handlers
  const addArrayItem = useCallback((field) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  }, []);

  const updateArrayItem = useCallback((field, index, value) => {
    setNewProduct(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  }, []);

  const removeArrayItem = useCallback((field, index) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  }, []);

  // Specifications Handlers
  const addSpecification = useCallback(() => {
    setNewProduct(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  }, []);

  const updateSpecification = useCallback((index, field, value) => {
    setNewProduct(prev => {
      const newSpecs = [...prev.specifications];
      newSpecs[index][field] = value;
      return { ...prev, specifications: newSpecs };
    });
  }, []);

  const removeSpecification = useCallback((index) => {
    setNewProduct(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  }, []);

  // Form Submit Handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newProduct.name || !newProduct.new_price || !newProduct.category) {
      alert('Please fill in all required fields (Name, Price, Category)');
      return;
    }

    setSaving(true);

    try {
      // Clean up empty arrays
      const cleanedProduct = {
        ...newProduct,
        features: newProduct.features.filter(f => f.trim()),
        colors: newProduct.colors.filter(c => c.trim()),
        sizes: newProduct.sizes.filter(s => s.trim()),
        tags: newProduct.tags.filter(t => t.trim()),
        specifications: newProduct.specifications.filter(s => s.key.trim() || s.value.trim())
      };

      const response = await fetch(`${API_BASE}/addproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedProduct),
      });

      const data = await response.json();
      
      if (data.success) {
        
        // Reset form
        setNewProduct({
          name: '',
          category: allCategories[0] || '',
          new_price: '',
          old_price: '',
          brand: '',
          sku: '',
          description: '',
          short_description: '',
          available: true,
          featured: false,
          images: [],
          image: '',
          features: [''],
          specifications: [{ key: '', value: '' }],
          materials: '',
          care_instructions: '',
          size_chart: '',
          colors: [''],
          sizes: [''],
          weight: '',
          dimensions: { length: '', width: '', height: '' },
          stock_quantity: '',
          low_stock_threshold: '',
          meta_title: '',
          meta_description: '',
          meta_keywords: '',
          slug: '',
          discount_type: 'percentage',
          discount_value: '',
          sale_start_date: '',
          sale_end_date: '',
          tags: [''],
          related_products: [],
          shipping_class: 'standard',
          status: 'draft'
        });
        
        // Optionally switch to products list
        // setActiveTab('products');
      } else {
        alert(`❌ Failed to add product: ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('❌ Error adding product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Add New Product
          </h1>
          <p className="text-gray-600">Create a new product listing for your store</p>
        </div>

        {/* Main Product Form */}
        <form onSubmit={handleAddProduct} className="space-y-6">
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
                  {/* Product Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => updateProductField('name', e.target.value)}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="e.g., Summer Floral Dress"
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
                        value={newProduct.category}
                        onChange={(e) => updateProductField('category', e.target.value)}
                        className="flex-1 px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                        required
                        disabled={loadingCategories}
                      >
                        {loadingCategories ? (
                          <option>Loading categories...</option>
                        ) : (
                          allCategories.map((cat, index) => (
                            <option key={index} value={cat}>{cat}</option>
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
                        <RefreshCw className={`w-5 h-5 ${loadingCategories ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    {/* {dynamicCategories.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {dynamicCategories.length} categories loaded from backend
                      </p>
                    )} */}
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={newProduct.brand}
                      onChange={(e) => updateProductField('brand', e.target.value)}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="e.g., Pink Dreams"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => updateProductField('sku', e.target.value)}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="e.g., DRESS-001"
                    />
                  </div>

                  {/* New Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price * ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        step="0.01"
                        value={newProduct.new_price}
                        onChange={(e) => updateProductField('new_price', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Old Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compare at Price ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        step="0.01"
                        value={newProduct.old_price}
                        onChange={(e) => updateProductField('old_price', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <textarea
                      value={newProduct.short_description}
                      onChange={(e) => updateProductField('short_description', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="Brief product summary"
                    />
                  </div>

                  {/* Full Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Description
                    </label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => updateProductField('description', e.target.value)}
                      rows="4"
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="Detailed product description"
                    />
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-pink-600" />
                  Product Images
                </h2>
                
                {/* Upload Button */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-pink-300 rounded-lg cursor-pointer hover:border-pink-500 hover:bg-pink-50/50 transition-all mb-4">
                  <Upload className="w-8 h-8 text-pink-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload images</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB each</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="mb-4 space-y-2">
                    {Object.entries(uploadProgress).map(([filename, progress]) => (
                      <div key={filename} className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{progress}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Gallery */}
                {newProduct.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newProduct.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-pink-200"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variants Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
                  Product Variants
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Colors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colors
                    </label>
                    <div className="space-y-2">
                      {newProduct.colors.map((color, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={color}
                            onChange={(e) => updateArrayItem('colors', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                            placeholder="Color name"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('colors', index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('colors')}
                        className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                      >
                        + Add Color
                      </button>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sizes
                    </label>
                    <div className="space-y-2">
                      {newProduct.sizes.map((size, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={size}
                            onChange={(e) => updateArrayItem('sizes', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                            placeholder="Size (S, M, L, XL)"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('sizes', index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('sizes')}
                        className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                      >
                        + Add Size
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
                  Product Details
                </h2>
                
                <div className="space-y-4">
                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Features
                    </label>
                    <div className="space-y-2">
                      {newProduct.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updateArrayItem('features', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                            placeholder="Product feature"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('features', index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('features')}
                        className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                      >
                        + Add Feature
                      </button>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specifications
                    </label>
                    <div className="space-y-2">
                      {newProduct.specifications.map((spec, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={spec.key}
                            onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                            className="flex-1 px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                            placeholder="Spec name"
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                            placeholder="Spec value"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecification(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSpecification}
                        className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                      >
                        + Add Specification
                      </button>
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materials
                    </label>
                    <input
                      type="text"
                      value={newProduct.materials}
                      onChange={(e) => updateProductField('materials', e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="e.g., 100% Cotton, Polyester blend"
                    />
                  </div>

                  {/* Care Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Care Instructions
                    </label>
                    <textarea
                      value={newProduct.care_instructions}
                      onChange={(e) => updateProductField('care_instructions', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="How to care for this product"
                    />
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
                      value={newProduct.slug}
                      onChange={(e) => updateProductField('slug', e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="product-url-slug"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={newProduct.meta_title}
                      onChange={(e) => updateProductField('meta_title', e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="SEO page title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={newProduct.meta_description}
                      onChange={(e) => updateProductField('meta_description', e.target.value)}
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
                      value={newProduct.meta_keywords}
                      onChange={(e) => updateProductField('meta_keywords', e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="space-y-2">
                      {newProduct.tags.map((tag, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                            placeholder="Product tag"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('tags', index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('tags')}
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
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
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
                      onChange={(e) => updateProductField('stock_quantity', e.target.value)}
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
                      onChange={(e) => updateProductField('low_stock_threshold', e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-pink-100">
                <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-pink-600" />
                  Settings
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Class
                    </label>
                    <select
                      value={newProduct.shipping_class}
                      onChange={(e) => updateProductField('shipping_class', e.target.value)}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    >
                      <option value="standard">Standard Shipping</option>
                      <option value="express">Express Shipping</option>
                      <option value="overnight">Overnight Shipping</option>
                      <option value="free">Free Shipping</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newProduct.weight}
                      onChange={(e) => updateProductField('weight', e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="1.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.discount_value}
                      onChange={(e) => updateProductField('discount_value', e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="10"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 py-2">
                    <input
                      type="checkbox"
                      id="available"
                      checked={newProduct.available}
                      onChange={(e) => updateProductField('available', e.target.checked)}
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-pink-300 rounded focus:ring-pink-500"
                    />
                    <label htmlFor="available" className="text-sm font-medium text-gray-700">
                      Available for sale
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3 py-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={newProduct.featured}
                      onChange={(e) => updateProductField('featured', e.target.checked)}
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-pink-300 rounded focus:ring-pink-500"
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                      Featured product
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Status
                    </label>
                    <select
                      value={newProduct.status}
                      onChange={(e) => updateProductField('status', e.target.value)}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="px-6 py-3 border border-pink-300 text-gray-700 rounded-lg hover:bg-pink-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newProduct.name || !newProduct.new_price || !newProduct.category}
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
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  }

export default AddProductPage
