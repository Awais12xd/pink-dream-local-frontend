'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Trash2, ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useWishlist } from '../context/WishlistContext'
import { toast } from 'react-toastify'
import { getImageSrc, handleImageError } from '../utils/imageUtils'

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function WishlistPage() {
  const { 
    wishlist, 
    removeFromWishlist, 
    clearWishlist, 
    getTotalItems, 
    isLoading: wishlistLoading,
    moveToCart,
    user
  } = useWishlist()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // In your wishlist page.js, replace the addToCart function with this fixed version:

const addToCart = async (product) => {
  if (!user?.id) {
    alert('Please log in to add items to cart')
    return
  }

  try {
    // For temporary users, handle locally
    if (user.isTemp) {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const existingItemIndex = existingCart.findIndex(item => item.id === product.id)
      
      if (existingItemIndex > -1) {
        existingCart[existingItemIndex].quantity += 1
      } else {
        existingCart.push({
          id: product.id,
          name: product.name,
          price: product.new_price,
          image: product.image,
          quantity: 1,
          addedAt: new Date().toISOString()
        })
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart))
      
      // Remove from wishlist after successful cart addition
      await removeFromWishlist(product.id)
      
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'))
      toast.success(`${product.name} added to cart and removed from wishlist!`)
      return
    }

    // For authenticated users, use backend
    const response = await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        productId: product.id,
        quantity: 1
      })
    })

    const data = await response.json()

    if (data.success) {
      // Remove from wishlist after successful cart addition
      await removeFromWishlist(product.id)
      
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'))
      toast.success(`${product.name} added to cart and removed from wishlist!`)
    } else {
      toast.error(data.message || 'Failed to add item to cart')
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    toast.error('Failed to add item to cart. Please try again.')
  }
}

 // Replace the addAllToCart function in your wishlist page.js with this:

const addAllToCart = async () => {
  if (wishlist.length === 0) return

  try {
    setLoading(true)
    
    // If using temporary user (localStorage)
    if (user?.isTemp) {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      let addedCount = 0
      
      wishlist.forEach(product => {
        const existingItemIndex = existingCart.findIndex(item => item.id === product.id)
        
        if (existingItemIndex > -1) {
          existingCart[existingItemIndex].quantity += 1
        } else {
          existingCart.push({
            id: product.id,
            name: product.name,
            price: product.new_price,
            image: product.image,
            quantity: 1,
            addedAt: new Date().toISOString()
          })
        }
        addedCount++
      })
      
      localStorage.setItem('cart', JSON.stringify(existingCart))
      
      // Clear wishlist after successful addition
      await clearWishlist()
      
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'))
      
      toast.success(`${addedCount} items moved to cart!`)
      return
    }

    // For authenticated users, use the existing moveToCart function
    const productIds = wishlist.map(item => item.id)
    const result = await moveToCart(productIds)
    
    if (result.success) {
      const movedCount = result.movedCount || result.movedItems?.length || productIds.length
      
      // Dispatch cart update event to refresh cart state
      window.dispatchEvent(new Event('cartUpdated'))
      
      toast.success(`${movedCount} items moved to cart!`)
    } else {
      toast.error(result.error || 'Failed to move items to cart')
    }
  } catch (error) {
    console.error('Error adding all to cart:', error)
    toast.error('Failed to move items to cart. Please try again.')
  } finally {
    setLoading(false)
  }
}

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        setLoading(true)
        await clearWishlist()
      } catch (error) {
        console.error('Error clearing wishlist:', error)
        toast.error('Failed to clear wishlist. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromWishlist(productId)
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item. Please try again.')
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Loading state
  if (wishlistLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your wishlist...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Empty wishlist state
  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16"
            >
              <Heart className="w-24 h-24 mx-auto text-gray-300 mb-8" />
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Wishlist is Empty</h1>
              <p className="text-gray-600 mb-8">
                Save your favorite items to your wishlist and shop them later.
              </p>
              <Link href="/shop">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg"
                >
                  Start Shopping
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link href="/shop" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">My Wishlist</h1>
                <p className="text-gray-600 mt-2">
                  {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} saved
                </p>
                {user?.isTemp && (
                  <p className="text-yellow-600 text-sm mt-1">
                    ⚠️ Sign in to save your wishlist permanently
                  </p>
                )}
              </div>
              {wishlist.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearWishlist}
                  disabled={loading}
                  className="text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                >
                  {loading ? 'Clearing...' : 'Clear All'}
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Wishlist Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {wishlist.map((product, index) => {
              if (!product || !product.id) {
                return null
              }

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-pink-100 to-pink-200 overflow-hidden">
                    {product.image ? (
                      <img
                        src={getImageSrc(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-pink-400" />
                      </div>
                    )}
                    
                    {/* Remove from Wishlist Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveItem(product.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors duration-200 group-hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </motion.button>

                    {/* Wishlist Badge */}
                    <div className="absolute top-3 left-3 bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      <Heart className="w-3 h-3 inline mr-1 fill-current" />
                      Saved
                    </div>

                    {/* Discount Badge */}
                    {product.old_price && product.old_price > product.new_price && (
                      <div className="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {Math.round(((product.old_price - product.new_price) / product.old_price) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    <div className="mb-2">
                      <span className="text-xs text-pink-600 font-medium">{product.category}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-pink-600">
                          {formatPrice(product.new_price)}
                        </span>
                        {product.old_price && product.old_price > product.new_price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.old_price)}
                          </span>
                        )}
                      </div>
                      {product.addedAt && (
                        <span className="text-xs text-gray-500">
                          {formatDate(product.addedAt)}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    {product.stock_quantity !== undefined && (
                      <div className="mb-3">
                        {product.stock_quantity > 0 ? (
                          <span className="text-xs text-green-600 font-medium">
                            {product.stock_quantity <= (product.low_stock_threshold || 10) 
                              ? `Only ${product.stock_quantity} left!` 
                              : 'In Stock'
                            }
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => addToCart(product)}
                        disabled={!product.available || (product.stock_quantity !== undefined && product.stock_quantity <= 0)}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 shadow-md flex items-center justify-center space-x-2 ${
                          product.available && (product.stock_quantity === undefined || product.stock_quantity > 0)
                            ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>
                          {!product.available 
                            ? 'Unavailable' 
                            : (product.stock_quantity !== undefined && product.stock_quantity <= 0)
                            ? 'Out of Stock'
                            : 'Add to Cart'
                          }
                        </span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveItem(product.id)}
                        className="p-2 border border-gray-300 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Quick Actions */}
          {wishlist.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 text-center"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 inline-block">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Quick Actions
                </h3>
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addAllToCart}
                    disabled={loading}
                    className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Moving to Cart...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add All to Cart</span>
                      </>
                    )}
                  </motion.button>
                  
                  <Link href="/shop">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="border border-pink-300 text-pink-600 px-6 py-2 rounded-lg font-semibold hover:bg-pink-50 transition-all duration-300"
                    >
                      Continue Shopping
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}