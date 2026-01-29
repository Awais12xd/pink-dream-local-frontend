'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { toast } from 'react-toastify'
import { 
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
  Zap
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Enhanced Product Image Zoom Component
const ProductImageZoom = ({ 
  src, 
  alt = "Product image", 
  className = "",
  highResSrc = null,
  onImageLoad = () => {},
  onImageError = () => {}
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  
  const containerRef = useRef(null)
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const calculateZoomPosition = (clientX, clientY) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    setCursorPosition({ x, y })
  }

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false)
    }
  }

  const handleMouseMove = (e) => {
    if (!isMobile) {
      calculateZoomPosition(e.clientX, e.clientY)
    }
  }

  const handleImageLoad = (e) => {
    setIsImageLoaded(true)
    onImageLoad(e)
  }

  const handleImageError = (e) => {
    setIsImageLoaded(false)
    onImageError(e)
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        touchAction: isMobile ? 'none' : 'auto',
        cursor: isHovered && !isMobile ? 'none' : 'default'
      }}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover select-none"
        animate={{
          scale: isHovered && !isMobile ? 2 : 1,
          transformOrigin: `${cursorPosition.x}px ${cursorPosition.y}px`
        }}
        transition={{
          type: "tween",
          ease: "easeOut",
          duration: 0.3
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        draggable={false}
        style={{
          transformOrigin: isHovered && !isMobile ? `${cursorPosition.x}px ${cursorPosition.y}px` : 'center center'
        }}
      />

      {!isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      <AnimatePresence>
        {isHovered && !isMobile && (
          <motion.div
            className="absolute pointer-events-none z-10"
            style={{
              left: cursorPosition.x - 12,
              top: cursorPosition.y - 12
            }}
            initial={{ 
              opacity: 0, 
              scale: 0.5 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.5 
            }}
            transition={{
              type: "tween",
              ease: "easeOut",
              duration: 0.15
            }}
          >
            <div>
              <Plus className="w-7 h-7 text-black" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && (
        <div 
          className="absolute inset-0 z-20"
          style={{ touchAction: 'none' }}
        />
      )}
    </div>
  )
}

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id

  const { addToCart: addToCartContext } = useCart()
  const { toggleWishlist, isInWishlist: checkIsInWishlist } = useWishlist()

  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [activeTab, setActiveTab] = useState('description')
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)

  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (productId) {
      fetchProductDetails()
    }
  }, [productId])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE}/product/${productId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setProduct(data.product)
        
        if (data.product.colors && data.product.colors.length > 0) {
          setSelectedColor(data.product.colors[0])
        }
        if (data.product.sizes && data.product.sizes.length > 0) {
          setSelectedSize(data.product.sizes[0])
        }

        fetchRelatedProducts(data.product.id)
      } else {
        throw new Error(data.message || 'Product not found')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async (productId) => {
    try {
      const response = await fetch(`${API_BASE}/product/${productId}/recommendations`)
      const data = await response.json()
      
      if (data.success) {
        setRelatedProducts(data.recommendations)
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsAddingToCart(true)

    try {
      const success = await addToCartContext(product, quantity)
      
      if (success) {
        toast.success(`${product.name} added to cart!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      } else {
        toast.error('Failed to add product to cart. Please try again.', {
          position: "top-right",
          autoClose: 3000,
        })
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add product to cart. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsAddingToWishlist(true)

    try {
      await toggleWishlist(product)
      
      const isNowInWishlist = checkIsInWishlist(product.id)
      
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
        }
      )
      
      window.dispatchEvent(new CustomEvent('wishlistUpdated', {
        detail: { productId: product.id, isInWishlist: isNowInWishlist }
      }))
    } catch (error) {
      console.error('Error updating wishlist:', error)
      toast.error('Failed to update wishlist. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      })
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description || product.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product URL copied to clipboard!', {
        position: "top-right",
        autoClose: 2000,
      })
    }
  }

  const incrementQuantity = () => {
    if (product.stock_quantity && quantity >= product.stock_quantity) return
    setQuantity(prev => prev + 1)
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

const getImageSrc = (imageSrc) => {
  if (!imageSrc) return 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams'
  
  const baseURL = API_URL || 'http://localhost:4000'
  
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
  
  return imageSrc
}

  const getHighResSrc = (imageSrc) => {
    const normalSrc = getImageSrc(imageSrc)
    
    if (normalSrc.includes('unsplash.com')) {
      return normalSrc.replace(/w=\d+/, 'w=1200').replace(/h=\d+/, 'h=1200')
    }
    
    return normalSrc
  }

  const getProductImages = () => {
    const images = []
    
    if (product.image) {
      images.push(product.image)
    }
    
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img && img !== product.image) {
          images.push(img)
        }
      })
    }
    
    return images.length > 0 ? images : ['/placeholder-product.jpg']
  }

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
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">{error || 'The product you are looking for does not exist.'}</p>
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
    )
  }

  const productImages = getProductImages()
  const discountPercentage = product.old_price > product.new_price 
    ? Math.round(((product.old_price - product.new_price) / product.old_price) * 100)
    : 0

  const isInWishlist = checkIsInWishlist(product.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <nav className="flex space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            <Link href="/" className="hover:text-pink-600 whitespace-nowrap">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/shop" className="hover:text-pink-600 whitespace-nowrap">Shop</Link>
            <span className="text-gray-400">/</span>
            <Link href={`/shop?category=${product.category}`} className="hover:text-pink-600 whitespace-nowrap">
              {product.category}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
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
              {/* Mobile Image Layout */}
              <div className="block lg:hidden">
                <div className="relative h-[300px] sm:h-[400px] rounded-lg overflow-hidden bg-gray-50 mb-4">
                  <ProductImageZoom
                    src={getImageSrc(productImages[selectedImageIndex])}
                    highResSrc={getHighResSrc(productImages[selectedImageIndex])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onImageError={(e) => {
                      e.target.src = '/placeholder-product.jpg'
                    }}
                  />
                  
                  {discountPercentage > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-20">
                      -{discountPercentage}%
                    </div>
                  )}
                  {product.featured && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-20">
                      Featured
                    </div>
                  )}
                </div>

                {productImages.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {productImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === index 
                            ? 'border-pink-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={getImageSrc(image)}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover select-none"
                         onError={(e) => {
  e.target.onerror = null; // Prevent infinite loop
  e.target.src = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image'
}}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Image Layout */}
              <div className="hidden lg:flex gap-4">
                {productImages.length > 1 && (
                  <div className="flex flex-col gap-3 w-28">
                    {productImages.slice(0, 3).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative h-[150px] rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                          selectedImageIndex === index 
                            ? 'border-pink-500 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={getImageSrc(image)}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover select-none"
                          onError={(e) => {
                            e.target.src = '/placeholder-product.jpg'
                          }}
                        />
                        
                        {selectedImageIndex === index && (
                          <div className="absolute inset-0 bg-pink-500/10 border-2 border-pink-500 rounded-lg"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1">
                  <div className="relative h-[450px] shadow-xl rounded-xl overflow-hidden bg-gray-50">
                    <ProductImageZoom
                      src={getImageSrc(productImages[selectedImageIndex])}
                      highResSrc={getHighResSrc(productImages[selectedImageIndex])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onImageError={(e) => {
                        e.target.src = '/placeholder-product.jpg'
                      }}
                    />
                    
                    {discountPercentage > 0 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-20">
                        -{discountPercentage}%
                      </div>
                    )}
                    {product.featured && (
                      <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-20">
                        Featured
                      </div>
                    )}
                  </div>
                </div>
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{product.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" 
                      />
                    ))}
                  </div>
                  <span className="text-sm sm:text-base text-gray-600">(4.8) • 24 reviews</span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl font-bold text-pink-600">
                    ${product.new_price}
                  </span>
                  {product.old_price > product.new_price && (
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      ${product.old_price}
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
                  <h3 className="text-sm font-semibold mb-2 sm:mb-3">Color: {selectedColor}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-2 sm:px-4 border rounded-lg transition-colors text-sm ${
                          selectedColor === color
                            ? 'border-pink-500 bg-pink-50 text-pink-700'
                            : 'border-gray-300 hover:border-gray-400'
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
                  <h3 className="text-sm font-semibold mb-2 sm:mb-3">Size: {selectedSize}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-2 sm:px-4 border rounded-lg transition-colors text-sm ${
                          selectedSize === size
                            ? 'border-pink-500 bg-pink-50 text-pink-700'
                            : 'border-gray-300 hover:border-gray-400'
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
                    <span className="px-3 sm:px-4 py-2 font-semibold min-w-[3rem] text-center">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      disabled={product.stock_quantity && quantity >= product.stock_quantity}
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
                    <span className="text-green-600 font-medium text-sm sm:text-base">In Stock</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    <span className="text-red-600 font-medium text-sm sm:text-base">Out of Stock</span>
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
                          ? 'border-pink-500 bg-pink-50 text-pink-600'
                          : 'border-gray-300 hover:border-pink-500 hover:text-pink-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWishlist ? 'fill-current' : ''} mx-auto`} />
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
                  <p className="text-xs sm:text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-gray-600 hidden sm:block">On orders over $50</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm font-medium">Easy Returns</p>
                  <p className="text-xs text-gray-600 hidden sm:block">30-day returns</p>
                </div>
                <div className="text-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm font-medium">Secure Payment</p>
                  <p className="text-xs text-gray-600 hidden sm:block">SSL protected</p>
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
                  { id: 'description', label: 'Description' },
                  { id: 'specifications', label: 'Specs' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'shipping', label: 'Shipping' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-pink-500 text-pink-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-4 sm:space-y-6">
              {activeTab === 'description' && (
                <div>
                  {product.description ? (
                    <div className="prose max-w-none">
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {product.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-gray-600">No description available for this product.</p>
                  )}
                  
                  {product.features && product.features.length > 0 && (
                    <div className="mt-4 sm:mt-6">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Key Features</h3>
                      <ul className="grid grid-cols-1 gap-2 sm:gap-3">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specifications' && (
                <div>
                  {product.specifications && product.specifications.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {product.specifications.map((spec, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700 text-sm sm:text-base">{spec.key}</span>
                          <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700 text-sm sm:text-base">Brand</span>
                        <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">{product.brand || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700 text-sm sm:text-base">Category</span>
                        <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">{product.category}</span>
                      </div>
                      {product.weight > 0 && (
                        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700 text-sm sm:text-base">Weight</span>
                          <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">{product.weight} kg</span>
                        </div>
                      )}
                      {product.materials && (
                        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700 text-sm sm:text-base">Materials</span>
                          <span className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-0">{product.materials}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-gray-600">Customer reviews coming soon...</p>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Shipping Information</h3>
                    <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700">
                      <li>• Free standard shipping on orders over $50</li>
                      <li>• Express shipping available for $9.99</li>
                      <li>• Orders typically ship within 1-2 business days</li>
                      <li>• Delivery time: 3-7 business days</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Returns & Exchanges</h3>
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
                    <ProductCard product={relatedProduct} />
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
                      <span className="text-yellow-600 font-medium">Featured</span>
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
  )
}