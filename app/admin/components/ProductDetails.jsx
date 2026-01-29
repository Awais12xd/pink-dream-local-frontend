import React, { useState, useEffect } from 'react';
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
  RulerIcon
} from 'lucide-react';

const ProductDetails = ({ productId, onEdit, onBack, onDelete }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [notification, setNotification] = useState(null);

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

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/product/${productId}`);
      const data = await response.json();
      
      if (data.success) {
        setProduct(data.product);
      } else {
        setError(data.message || 'Product not found');
      }
    } catch (error) {
      setError('Error fetching product details');
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      const response = await fetch(`${API_BASE}/updateproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: product.id,
          available: !product.available
        })
      });

      const data = await response.json();
      if (data.success) {
        setProduct(prev => ({ ...prev, available: !prev.available }));
        showNotification('Product status updated successfully', 'success');
      } else {
        showNotification('Failed to update product status', 'error');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      showNotification('Error updating product status', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE}/removeproduct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: product.id,
            name: product.name
          })
        });

        const data = await response.json();
        if (data.success) {
          showNotification('Product deleted successfully', 'success');
          setTimeout(() => {
            onBack();
          }, 1500);
        } else {
          showNotification('Failed to delete product', 'error');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Copied to clipboard', 'success');
    });
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiscountPercentage = () => {
    if (product && product.old_price > product.new_price) {
      return Math.round(((product.old_price - product.new_price) / product.old_price) * 100);
    }
    return 0;
  };

  const getStockStatus = () => {
    if (!product) return { text: 'Unknown', color: 'text-gray-600', icon: AlertTriangle };
    
    if (product.stock_quantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', icon: XCircle };
    } else if (product.stock_quantity <= product.low_stock_threshold) {
      return { text: 'Low Stock', color: 'text-yellow-600', icon: AlertTriangle };
    } else {
      return { text: 'In Stock', color: 'text-green-600', icon: CheckCircle };
    }
  };

  // Notification Component
  const Notification = ({ message, type, onClose }) => {
    const bgColor = {
      success: 'bg-green-100 border-green-500 text-green-700',
      error: 'bg-red-100 border-red-500 text-red-700',
      info: 'bg-blue-100 border-blue-500 text-blue-700'
    }[type] || 'bg-gray-100 border-gray-500 text-gray-700';

    return (
      <div className={`fixed top-4 right-4 z-50 border-l-4 p-4 rounded shadow-lg ${bgColor}`}>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button onClick={onClose} className="ml-4 text-lg">&times;</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading product details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Product</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={fetchProductDetails}
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
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const stockStatus = getStockStatus();
  const discountPercentage = getDiscountPercentage();
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const validImages = images.filter(img => img && img.trim() !== '');

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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </button>
          <div className="flex gap-2">
            <button
              onClick={fetchProductDetails}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => onEdit(product)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </button>
            <button
              onClick={handleDeleteProduct}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Product Images */}
          <div className="lg:w-1/3">
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {validImages.length > 0 ? (
                  <img
                    src={getImageSrc(validImages[activeImageIndex] || validImages[0])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Image Thumbnails */}
              {validImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {validImages.slice(0, showAllImages ? validImages.length : 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                        activeImageIndex === index ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={getImageSrc(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                  {validImages.length > 4 && !showAllImages && (
                    <button
                      onClick={() => setShowAllImages(true)}
                      className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-xs ml-1">{validImages.length - 4}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Product Info - continues as before */}
          <div className="lg:w-2/3 space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(product.status)}`}>
                    {product.status}
                  </span>
                  <button
                    onClick={handleStatusToggle}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      product.available 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {product.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {product.available ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-600">SKU: {product.sku || 'N/A'}</span>
                <button
                  onClick={() => copyToClipboard(product.sku || '')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {product.brand && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm">{product.brand}</span>
                )}
                {product.featured && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    <Star className="w-4 h-4" />
                    Featured
                  </span>
                )}
              </div>

              {/* Pricing */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-green-600">${product.new_price}</span>
                {product.old_price > product.new_price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">${product.old_price}</span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                      {discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4">
                <stockStatus.icon className={`w-5 h-5 ${stockStatus.color}`} />
                <span className={`font-medium ${stockStatus.color}`}>{stockStatus.text}</span>
                <span className="text-gray-600">({product.stock_quantity} units available)</span>
                {product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    Low Stock Alert
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Short Description */}
              {product.short_description && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Short Description</h3>
                  <p className="text-gray-600">{product.short_description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Attributes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Product Attributes</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{product.category}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Shipping Class</label>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className="font-medium capitalize">{product.shipping_class}</span>
                </div>
              </div>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Available Colors</label>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color, index) => (
                    <span key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      <Palette className="w-3 h-3" />
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Available Sizes</label>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size, index) => (
                    <span key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      <Ruler className="w-3 h-3" />
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Tags</label>
                <div className="flex gap-2 flex-wrap">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Physical Attributes */}
            <div className="grid grid-cols-2 gap-4">
              {product.weight > 0 && (
                <div>
                  <label className="text-sm text-gray-600">Weight</label>
                  <div className="flex items-center gap-2">
                    <RulerIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{product.weight} kg</span>
                  </div>
                </div>
              )}
              {product.dimensions && (product.dimensions.length > 0 || product.dimensions.width > 0 || product.dimensions.height > 0) && (
                <div>
                  <label className="text-sm text-gray-600">Dimensions</label>
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory & Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Inventory & Analytics</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Stock Quantity</label>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-lg">{product.stock_quantity}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Low Stock Alert</label>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="font-medium">{product.low_stock_threshold}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Total Views</label>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-lg">{product.views || 0}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Sales Count</label>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="font-medium text-lg">{product.sales_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Conversion Rate */}
            {product.views > 0 && (
              <div>
                <label className="text-sm text-gray-600">Conversion Rate</label>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span className="font-medium">
                    {((product.sales_count || 0) / product.views * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features and Specifications */}
      {(product.features?.length > 0 || product.specifications?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Specifications</h3>
              <dl className="space-y-3">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <dt className="text-gray-600 font-medium">{spec.key}:</dt>
                    <dd className="font-medium text-gray-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Care Instructions and Materials */}
      {(product.materials || product.care_instructions) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {product.materials && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Materials</h3>
              <p className="text-gray-700 leading-relaxed">{product.materials}</p>
            </div>
          )}

          {product.care_instructions && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Care Instructions</h3>
              <p className="text-gray-700 leading-relaxed">{product.care_instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* SEO Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">SEO Information</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">URL Slug</label>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{product.slug}</span>
                <button
                  onClick={() => copyToClipboard(`/products/${product.slug}`)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Meta Title</label>
              <p className="text-gray-900 mt-1">{product.meta_title || 'Not set'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Meta Description</label>
              <p className="text-gray-900 mt-1">{product.meta_description || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Meta Keywords</label>
              <p className="text-gray-900 mt-1">{product.meta_keywords || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamps and IDs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Product Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-600">Created Date</label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="font-medium">
                {new Date(product.date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">Product ID</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-medium">#{product.id}</span>
              <button
                onClick={() => copyToClipboard(product.id.toString())}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">Database ID</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-medium text-xs font-mono">{product._id}</span>
              <button
                onClick={() => copyToClipboard(product._id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;