'use client'
import { createContext, useContext, useState, useEffect, useRef } from 'react'

const WishlistContext = createContext()

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  // Add ref to track logout state and prevent race conditions
  const isLoggingOutRef = useRef(false)
  const hasInitializedRef = useRef(false)

  // Listen for auth events from AuthContext
  useEffect(() => {
    const handleUserLoggedIn = (event) => {
      const { userId, userData } = event.detail
      console.log('🔄 Wishlist: User logged in event received', userData?.name)
      
      // Clear logout flag
      isLoggingOutRef.current = false
      
      // Immediately clear temporary wishlist and switch to authenticated user
      setUser(userData)
      setWishlist([]) // Clear wishlist immediately
      setIsLoading(true)
      
      // Clear local storage wishlist
      localStorage.removeItem('wishlist')
      
      // Load authenticated user's wishlist
      setTimeout(() => {
        loadAuthenticatedWishlist(userData)
      }, 100)
    }

    const handleUserLoggedOut = (event) => {
      console.log('🔄 Wishlist: User logged out event received')
      
      // Set logout flag to prevent race conditions
      isLoggingOutRef.current = true
      
      // Force clear everything immediately
      setWishlist([])
      setIsLoading(false)
      
      // Clear local storage wishlist first
      localStorage.removeItem('wishlist')
      
      // Create new temporary user
      const tempUserId = 'temp_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('tempUserId', tempUserId)
      
      const tempUser = { id: tempUserId, isTemp: true }
      
      // Initialize empty wishlist in localStorage BEFORE setting user
      localStorage.setItem('wishlist', JSON.stringify([]))
      
      // Set user AFTER clearing everything
      setUser(tempUser)
      
      console.log('✅ Wishlist: Switched to temporary user with empty wishlist')
      
      // Clear logout flag after a delay to allow things to settle
      setTimeout(() => {
        isLoggingOutRef.current = false
      }, 500)
    }

    console.log('🎧 WishlistContext: Setting up event listeners')
    
    // Add event listeners
    window.addEventListener('userLoggedIn', handleUserLoggedIn)
    window.addEventListener('userLoggedOut', handleUserLoggedOut)

    return () => {
      console.log('🎧 WishlistContext: Cleaning up event listeners')
      window.removeEventListener('userLoggedIn', handleUserLoggedIn)
      window.removeEventListener('userLoggedOut', handleUserLoggedOut)
    }
  }, [])

  // Get user from localStorage or token on initial load ONLY
  useEffect(() => {
    // Only run this on initial mount
    if (hasInitializedRef.current) return
    
    const initializeUser = () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          console.log('🔄 Wishlist: Found authenticated user on startup:', parsedUser.name)
        } else {
          // If no user, try to get temporary userId or create one
          let tempUserId = localStorage.getItem('tempUserId')
          if (!tempUserId) {
            tempUserId = 'temp_' + Math.random().toString(36).substr(2, 9)
            localStorage.setItem('tempUserId', tempUserId)
          }
          setUser({ id: tempUserId, isTemp: true })
          console.log('🔄 Wishlist: Created temporary user for guest:', tempUserId)
        }
        
        hasInitializedRef.current = true
      } catch (error) {
        console.error('Error loading user:', error)
        // Create temporary user for guest
        const tempUserId = 'temp_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('tempUserId', tempUserId)
        setUser({ id: tempUserId, isTemp: true })
        hasInitializedRef.current = true
      }
    }

    initializeUser()
  }, [])

  // Load wishlist when user changes - BUT NOT during logout process
  useEffect(() => {
    // Don't load if we're in the middle of a logout process
    if (isLoggingOutRef.current) {
      console.log('🛑 Wishlist: Skipping load due to logout in progress')
      return
    }
    
    if (user?.id && hasInitializedRef.current) {
      console.log('🔄 Wishlist: User changed, loading wishlist for:', user.isTemp ? 'temp user' : user.name)
      
      if (user.isTemp) {
        loadTemporaryWishlist()
      } else {
        loadAuthenticatedWishlist(user)
      }
    }
  }, [user])

  // Load authenticated user's wishlist from backend
  const loadAuthenticatedWishlist = async (userData) => {
    if (!userData?.id || userData.isTemp || isLoggingOutRef.current) return

    try {
      setIsLoading(true)
      console.log('📥 Loading authenticated wishlist for user:', userData.id)

      const response = await fetch(`${API_BASE}/wishlist/${userData.id}`)
      const data = await response.json()

      // Double-check we're not logging out
      if (isLoggingOutRef.current) {
        console.log('🛑 Wishlist: Aborting load due to logout')
        return
      }

      if (data.success) {
        setWishlist(data.wishlist || [])
        console.log(`✅ Loaded ${data.wishlist?.length || 0} items from authenticated wishlist`)
      } else {
        console.error('Failed to load authenticated wishlist:', data.message)
        setWishlist([])
      }
    } catch (error) {
      console.error('Error loading authenticated wishlist:', error)
      if (!isLoggingOutRef.current) {
        setWishlist([])
      }
    } finally {
      if (!isLoggingOutRef.current) {
        setIsLoading(false)
      }
    }
  }

  // Load temporary user's wishlist from localStorage
  const loadTemporaryWishlist = () => {
    // Don't load if we're logging out
    if (isLoggingOutRef.current) {
      console.log('🛑 Wishlist: Skipping temp load due to logout')
      return
    }
    
    try {
      setIsLoading(true)
      console.log('📥 Loading temporary wishlist from localStorage')
      
      const localWishlist = localStorage.getItem('wishlist')
      if (localWishlist) {
        const parsedWishlist = JSON.parse(localWishlist)
        
        // Double-check we're not logging out
        if (isLoggingOutRef.current) {
          console.log('🛑 Wishlist: Aborting temp load due to logout')
          return
        }
        
        setWishlist(Array.isArray(parsedWishlist) ? parsedWishlist : [])
        console.log(`✅ Loaded ${parsedWishlist?.length || 0} items from temporary wishlist`)
      } else {
        setWishlist([])
        console.log('✅ No temporary wishlist found, starting empty')
      }
    } catch (error) {
      console.error('Error loading temporary wishlist:', error)
      if (!isLoggingOutRef.current) {
        setWishlist([])
      }
    } finally {
      if (!isLoggingOutRef.current) {
        setIsLoading(false)
      }
    }
  }

  // Generic load wishlist method (kept for backward compatibility)
  const loadWishlist = async () => {
    if (!user?.id || isLoggingOutRef.current) return

    if (user.isTemp) {
      loadTemporaryWishlist()
    } else {
      await loadAuthenticatedWishlist(user)
    }
  }

  const addToWishlist = async (product) => {
    if (!user?.id || isLoggingOutRef.current) return

    try {
      // Check if item already exists
      const existingItem = wishlist.find(item => item.id === product.id)
      if (existingItem) {
        console.log('Product already in wishlist:', product.name)
        return
      }

      // Create new item
      const newItem = {
        id: product.id,
        name: product.name,
        new_price: product.new_price,
        old_price: product.old_price,
        image: product.image,
        category: product.category,
        brand: product.brand,
        available: product.available,
        stock_quantity: product.stock_quantity,
        addedAt: new Date().toISOString()
      }

      // Optimistic update
      setWishlist(prevWishlist => [...prevWishlist, newItem])

      // If temporary user, save to localStorage
      if (user.isTemp) {
        const updatedWishlist = [...wishlist, newItem]
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
        console.log('💾 Saved to temporary wishlist:', product.name)
        return
      }

      // Save to backend for authenticated users
      const response = await fetch(`${API_BASE}/wishlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id
        })
      })

      const data = await response.json()

      if (!data.success) {
        console.error('Failed to add to wishlist:', data.message)
        // Revert optimistic update
        setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== product.id))
        
        if (data.alreadyExists) {
          return
        }
        throw new Error(data.message)
      }
      
      console.log('💾 Saved to authenticated wishlist:', product.name)
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      // Revert optimistic update
      setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== product.id))
    }
  }

  const removeFromWishlist = async (productId) => {
    if (!user?.id || isLoggingOutRef.current) return

    try {
      // Optimistic update
      const removedItem = wishlist.find(item => item.id === productId)
      setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId))

      // If temporary user, update localStorage
      if (user.isTemp) {
        const updatedWishlist = wishlist.filter(item => item.id !== productId)
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
        console.log('🗑️ Removed from temporary wishlist:', productId)
        return
      }

      // Remove from backend for authenticated users
      const response = await fetch(`${API_BASE}/wishlist/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          productId: productId
        })
      })

      const data = await response.json()

      if (!data.success) {
        console.error('Failed to remove from wishlist:', data.message)
        // Revert optimistic update
        if (removedItem) {
          setWishlist(prevWishlist => [...prevWishlist, removedItem])
        }
        throw new Error(data.message)
      }
      
      console.log('🗑️ Removed from authenticated wishlist:', productId)
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      // Revert optimistic update
      const removedItem = wishlist.find(item => item.id === productId)
      if (removedItem) {
        setWishlist(prevWishlist => [...prevWishlist, removedItem])
      }
    }
  }

  const toggleWishlist = async (product) => {
    const isInWishlistNow = wishlist.some(item => item.id === product.id)
    if (isInWishlistNow) {
      await removeFromWishlist(product.id)
    } else {
      await addToWishlist(product)
    }
  }

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId)
  }

  const getTotalItems = () => {
    return Array.isArray(wishlist) ? wishlist.length : 0
  }

  const clearWishlist = async () => {
    if (!user?.id || isLoggingOutRef.current) return

    try {
      // Optimistic update
      const originalWishlist = [...wishlist]
      setWishlist([])

      // If temporary user, clear localStorage
      if (user.isTemp) {
        localStorage.setItem('wishlist', JSON.stringify([]))
        console.log('🧹 Cleared temporary wishlist')
        return
      }

      // Clear from backend for authenticated users
      const response = await fetch(`${API_BASE}/wishlist/clear/${user.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        console.error('Failed to clear wishlist:', data.message)
        // Revert optimistic update
        setWishlist(originalWishlist)
        throw new Error(data.message)
      }
      
      console.log('🧹 Cleared authenticated wishlist')
    } catch (error) {
      console.error('Error clearing wishlist:', error)
      // Revert optimistic update
      loadWishlist()
    }
  }

  const moveToCart = async (productIds) => {
    if (!user?.id || !Array.isArray(productIds) || isLoggingOutRef.current) return

    try {
      // For temporary users, handle locally
      if (user.isTemp) {
        // Get existing cart
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
        let updatedCart = [...existingCart]
        let movedCount = 0

        productIds.forEach(productId => {
          const wishlistItem = wishlist.find(item => item.id === productId)
          if (wishlistItem) {
            const existingCartItemIndex = updatedCart.findIndex(item => item.id === productId)
            
            if (existingCartItemIndex > -1) {
              updatedCart[existingCartItemIndex].quantity += 1
            } else {
              updatedCart.push({
                id: wishlistItem.id,
                name: wishlistItem.name,
                price: wishlistItem.new_price,
                image: wishlistItem.image,
                quantity: 1,
                addedAt: new Date().toISOString()
              })
            }
            movedCount++
          }
        })

        // Update cart and remove from wishlist
        localStorage.setItem('cart', JSON.stringify(updatedCart))
        const updatedWishlist = wishlist.filter(item => !productIds.includes(item.id))
        setWishlist(updatedWishlist)
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
        
        // Dispatch events
        window.dispatchEvent(new Event('cartUpdated'))
        
        return { success: true, movedCount }
      }

      // For authenticated users, use backend
      const response = await fetch(`${API_BASE}/wishlist/move-to-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          productIds: productIds,
          quantity: 1
        })
      })

      const data = await response.json()

      if (data.success) {
        // Reload wishlist to reflect changes
        await loadWishlist()
        // Dispatch cart update event
        window.dispatchEvent(new Event('cartUpdated'))
        return data
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Error moving items to cart:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    wishlist: wishlist || [],
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getTotalItems,
    clearWishlist,
    moveToCart,
    isLoading,
    user
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}