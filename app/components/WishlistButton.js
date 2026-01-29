// components/WishlistButton.js
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Loader2 } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'

export default function WishlistButton({ 
  product, 
  className = '',
  size = 'medium',
  showText = false 
}) {
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [loading, setLoading] = useState(false)
  
  const isInWishlistNow = isInWishlist(product.id)

  const handleToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoading(true)
    try {
      await toggleWishlist(product)
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  }

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        ${showText ? 'px-4 py-2 w-auto flex items-center space-x-2' : 'p-2'}
        bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white 
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${isInWishlistNow ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}
        ${className}
      `}
      title={isInWishlistNow ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Heart 
          className={`${iconSizes[size]} ${isInWishlistNow ? 'fill-current' : ''}`} 
        />
      )}
      {showText && (
        <span className="font-medium text-sm">
          {isInWishlistNow ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </span>
      )}
    </motion.button>
  )
}