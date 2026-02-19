// components/ProductCard.js
'use client'
import { useState, useEffect } from 'react'
import { Heart, ShoppingBag, Loader2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { toast } from 'react-toastify'
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from '../context/AuthContext'

// Fallback image URL
const FALLBACK_IMAGE = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams'
const ERROR_IMAGE = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image'

// Image utility function
const getImageSrc = (imageSrc, fallback = FALLBACK_IMAGE) => {
  if (!imageSrc) return fallback
  
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  
  // If URL contains old Railway domain, replace it
  if (imageSrc.includes('railway.app')) {
    const filename = imageSrc.split('/images/')[1]
    if (filename) {
      return `${baseURL}/images/${filename}`
    }
  }
  
  // If already a full URL with correct domain, return as is
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

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(FALLBACK_IMAGE)
  
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addToCart, isInCart, getItemQuantity } = useCart()

  if (!product) return null

  // Set up image source
  useEffect(() => {
    // Priority 1: Check images array first (handles bulk upload + edit scenario)
    let mainImage = null;
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      // Filter out empty strings and whitespace
      const validImages = product.images.filter(img => img && img.trim() !== '');
      if (validImages.length > 0) {
        mainImage = validImages[0];
      }
    }
    
    // Priority 2: Fallback to single image field
    if (!mainImage && product.image && product.image.trim() !== '') {
      mainImage = product.image;
    }
    
    // Set image source or use fallback
    if (mainImage) {
      setImageSrc(getImageSrc(mainImage))
      setImageError(false)
    } else {
      setImageSrc(FALLBACK_IMAGE)
      setImageError(true)
    }
  }, [product])

  // Calculate discount percentage
  const discountPercentage = product.old_price && product.new_price 
    ? Math.round(((product.old_price - product.new_price) / product.old_price) * 100)
    : 0

  // Generate product URL
  const productUrl = `/product/${product.id}`
  const isLiked = isInWishlist(product.id)

  const handleWishlistClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoading(true)
    try {
      await toggleWishlist(product)
    } catch (error) {
      console.error('Error updating wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!product.available || (product.stock_quantity !== undefined && product.stock_quantity <= 0)) {
      return
    }

    setAddingToCart(true)
    try {
      const success = await addToCart(product)
      if (success) {
        console.log(`Added ${product.name} to cart`)
        setTimeout(() => {
          setAddingToCart(false)
        }, 500)
      } else {
        setAddingToCart(false)
        console.error('Failed to add item to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      setAddingToCart(false)
    }
  }

  const handleQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(productUrl, '_blank')
  }

  const handleImageError = () => {
    if (!imageError) {
      console.error('Image failed to load:', imageSrc)
      setImageError(true)
      setImageSrc(ERROR_IMAGE)
    }
  }

  const itemQuantity = getItemQuantity ? getItemQuantity(product.id) : 0
  const inCart = isInCart ? isInCart(product.id) : false

  const handleDetailClick = () => {
    if (!user ) {
      toast.info("Login to see the product details!")
      return;
    }
    router.push(`/product/${product.id}`);
    return;
  }

  return (
    <div 
      className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-pink-200 hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-t-3xl">
        <div onClick={handleDetailClick}>
          <div className="aspect-[4/5] relative cursor-pointer">
            {!imageError ? (
              <img
                src={imageSrc}
                alt={product.name || 'Product'}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingBag className="w-12 h-12 text-pink-300 mx-auto mb-2" />
                  <span className="text-pink-400 text-sm font-medium">No Image Available</span>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          {discountPercentage > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              <span className="drop-shadow-sm">-{discountPercentage}%</span>
            </div>
          )}
          {product.featured && (
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              <span className="drop-shadow-sm">Featured</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`absolute top-4 right-4 z-10 space-y-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        }`}>
          <button
            onClick={handleWishlistClick}
            disabled={loading}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${
              isLiked 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg ring-2 ring-white/50' 
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-pink-600 shadow-md hover:shadow-lg'
            } ${loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-110 active:scale-95'}`}
            title={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Heart className={`w-5 h-5 transition-all duration-200 ${isLiked ? 'fill-current scale-110' : 'hover:scale-110'}`} />
            )}
          </button>

          <button
            onClick={handleQuickView}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm bg-white/90 text-gray-600 hover:bg-white hover:text-pink-600 shadow-md hover:shadow-lg hover:scale-110 active:scale-95"
            title="Quick view"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>

        {/* Stock Status Badge */}
        {product.stock_quantity !== undefined && product.stock_quantity <= (product.low_stock_threshold || 10) && product.stock_quantity > 0 && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Only {product.stock_quantity} left!
              </span>
            </div>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.stock_quantity !== undefined && product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className="bg-white px-4 py-2 rounded-lg font-semibold text-gray-800 shadow-lg">
              Out of Stock
            </div>
          </div>
        )}

        {/* Cart Indicator */}
        {inCart && itemQuantity > 0 && (
          <div className="absolute bottom-4 right-4 z-10">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg ring-2 ring-white/50">
              <ShoppingBag className="w-3.5 h-3.5 fill-current" />
              <span>{itemQuantity}</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {product.category && (
          <div className="mb-2">
            <Link 
              href={`/shop?category=${encodeURIComponent(product.category)}`}
              className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent text-xs font-bold uppercase tracking-wider hover:from-pink-600 hover:to-rose-600 transition-all duration-200"
            >
              {product.category}
            </Link>
          </div>
        )}

        <button onClick={handleDetailClick}>
          <h3 className="font-bold text-gray-800 hover:text-pink-600 transition-colors duration-200 line-clamp-2 mb-2 min-h-[2.5rem] text-base leading-snug cursor-pointer">
            {product.name}
          </h3>
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            ${typeof product.new_price === 'number' ? product.new_price.toFixed(2) : product.new_price}
          </span>
          {product.old_price && product.old_price !== product.new_price && (
            <span className="text-sm text-gray-500 line-through">
              ${typeof product.old_price === 'number' ? product.old_price.toFixed(2) : product.old_price}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!product.available || (product.stock_quantity !== undefined && product.stock_quantity <= 0) || addingToCart}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md text-sm ${
            product.available && (product.stock_quantity === undefined || product.stock_quantity > 0) && !addingToCart
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 hover:shadow-lg hover:transform hover:scale-[1.02]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          }`}
        >
          {addingToCart ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Adding...</span>
            </>
          ) : !product.available ? (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Unavailable</span>
            </>
          ) : (product.stock_quantity !== undefined && product.stock_quantity <= 0) ? (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Sold Out</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        <button 
          // href={productUrl}
          onClick={handleDetailClick}
          className="block w-full text-center mt-2 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200"
        >
          View Details →
        </button>
      </div>
    </div>
  )
}

export default ProductCard