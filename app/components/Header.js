// components/Header.js
'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ShoppingBag, User, Menu, X, Heart, ChevronDown, Settings, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext' // Import from CartContext now
import LoginModal from './LoginModal'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()
  const { getTotalItems: getWishlistCount, isLoading: wishlistLoading } = useWishlist()
  const { getTotalItems, isLoading: cartLoading } = useCart() // Use CartContext
  const profileRef = useRef(null)

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ]

  // Get cart count from CartContext (handles both session and backend automatically)
  const cartCount = getTotalItems()

  // Get wishlist count from context (this handles both guest and authenticated users)
  const wishlistCount = getWishlistCount()

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await logout()
    setIsProfileOpen(false)
  }

  const handleLoginSuccess = (user) => {
    setIsLoginModalOpen(false)
    // Optional: You can add any additional logic here after successful login
  }

  const openLoginModal = () => {
    setIsLoginModalOpen(true)
    setIsMenuOpen(false) // Close mobile menu if open
  }

  const UserProfileDropdown = () => {
    if (!user) return null

    return (
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center space-x-1 sm:space-x-2 p-2 rounded-full bg-gradient-to-br from-pink-50 to-rose-50 text-gray-700 hover:from-pink-100 hover:to-rose-100 hover:text-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </div>
          <span className="hidden sm:block text-sm font-medium max-w-16 sm:max-w-20 truncate">
            {user.name}
          </span>
          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        </button>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-pink-100 py-2 z-50">
            <div className="px-4 py-3 border-b border-pink-100">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              {user.isTemp && (
                <p className="text-xs text-yellow-600 mt-1">⚠️ Guest User</p>
              )}
            </div>
            
            <div className="py-2">
              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-200"
              >
                <User className="w-4 h-4 mr-3" />
                My Profile
              </Link>
              
              <Link
                href="/orders"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-200"
              >
                <ShoppingBag className="w-4 h-4 mr-3" />
                My Orders
              </Link>
              
              <Link
                href="/wishlist"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-200"
              >
                <Heart className="w-4 h-4 mr-3" />
                My Wishlist ({wishlistCount})
              </Link>
            </div>
            
            <div className="border-t border-pink-100 pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <header className="bg-white shadow-xl sticky top-0 z-50 border-b border-pink-100">
      {/* Top bar - hide on very small screens */}
      <div className="bg-gradient-to-r from-pink-500 via-pink-600 to-rose-500 text-white text-xs sm:text-sm py-2 sm:py-3">
        <div className="container mx-auto px-2 sm:px-4 text-center">
          <p className="font-medium">
            <span className="hidden sm:inline">✨ Free shipping on orders over $75 | 30-day return policy ✨</span>
            <span className="sm:hidden">✨ Free shipping over $75 ✨</span>
          </p>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between py-3 sm:py-5">
          {/* Logo - responsive sizing */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <span className="text-white font-bold text-lg sm:text-xl">P</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 bg-clip-text text-transparent truncate">
                Pink Dreams
              </h1>
              <p className="text-xs text-gray-500 -mt-1 hidden sm:block">Fashion & Style</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`relative font-medium text-lg group transition-all duration-300 ${
                  isActive(item.href)
                    ? 'text-pink-600'
                    : 'text-gray-700 hover:text-pink-600'
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300 ${
                  isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>
            ))}
          </nav>

          {/* Right side icons - improved mobile spacing */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 flex-shrink-0">
            {/* Wishlist - hide icon on very small screens */}
            <Link href="/wishlist" className="relative group hidden xs:block">
              <div className={`p-2 sm:p-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                isActive('/wishlist')
                  ? 'bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600'
                  : 'bg-gradient-to-br from-pink-50 to-rose-50 text-gray-700 hover:from-pink-100 hover:to-rose-100 hover:text-pink-600'
              }`}>
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlistLoading ? 'animate-pulse' : ''}`} />
              </div>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-lg animate-in slide-in-from-top-2 duration-300">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
              {user?.isTemp && wishlistCount > 0 && (
                <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-800 text-xs rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 flex items-center justify-center font-bold shadow-sm">
                  !
                </span>
              )}
            </Link>

            {/* User Profile or Login */}
            {user ? (
              <UserProfileDropdown />
            ) : (
              <button onClick={openLoginModal} className="relative group">
                <div className={`p-2 sm:p-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                  isActive('/auth') || isActive('/login') || isActive('/profile')
                    ? 'bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600'
                    : 'bg-gradient-to-br from-pink-50 to-rose-50 text-gray-700 hover:from-pink-100 hover:to-rose-100 hover:text-pink-600'
                }`}>
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </button>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative group">
              <div className={`p-2 sm:p-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                isActive('/cart')
                  ? 'bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600'
                  : 'bg-gradient-to-br from-pink-50 to-rose-50 text-gray-700 hover:from-pink-100 hover:to-rose-100 hover:text-pink-600'
              }`}>
                <ShoppingBag className={`w-4 h-4 sm:w-5 sm:h-5 ${cartLoading ? 'animate-pulse' : ''}`} />
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-lg">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              className="lg:hidden relative group"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-pink-50 to-rose-50 text-gray-700 hover:from-pink-100 hover:to-rose-100 hover:text-pink-600 transition-all duration-300 shadow-md hover:shadow-lg">
                {isMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-pink-100 shadow-lg">
          <nav className="container mx-auto px-4 py-6">
            <div className="space-y-4">
              {navItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`block text-lg font-medium py-2 border-b border-gray-100 last:border-b-0 transition-colors duration-300 ${
                    isActive(item.href)
                      ? 'text-pink-600'
                      : 'text-gray-700 hover:text-pink-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Cart Link */}
              <Link
                href="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between py-3 text-gray-700 hover:text-pink-600 transition-colors duration-300 border-b border-gray-100"
              >
                <div className="flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  <span className="text-lg font-medium">Shopping Cart</span>
                </div>
                <div className="flex items-center space-x-1">
                  {cartCount > 0 && (
                    <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                  {!user && cartCount > 0 && (
                    <span className="bg-yellow-400 text-yellow-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" title="Temporary cart - Sign in to save">
                      ⚠
                    </span>
                  )}
                </div>
              </Link>

              {/* Mobile Wishlist Link */}
              <Link
                href="/wishlist"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between py-3 text-gray-700 hover:text-pink-600 transition-colors duration-300 border-b border-gray-100"
              >
                <div className="flex items-center">
                  <Heart className="w-5 h-5 mr-3" />
                  <span className="text-lg font-medium">Wishlist</span>
                </div>
                <div className="flex items-center space-x-1">
                  {wishlistCount > 0 && (
                    <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                  {user?.isTemp && wishlistCount > 0 && (
                    <span className="bg-yellow-400 text-yellow-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" title="Guest wishlist - Sign in to save">
                      ⚠
                    </span>
                  )}
                </div>
              </Link>

              {/* Mobile User Section */}
              {user ? (
                <div className="border-t border-pink-100 pt-4 mt-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-medium text-gray-800 truncate">{user.name}</div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      {user.isTemp && (
                        <div className="text-xs text-yellow-600">⚠️ Guest User - Sign in to save data</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center py-2 text-gray-700 hover:text-pink-600 transition-colors duration-200"
                    >
                      <User className="w-5 h-5 mr-3" />
                      My Profile
                    </Link>
                    
                    <Link
                      href="/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center py-2 text-gray-700 hover:text-pink-600 transition-colors duration-200"
                    >
                      <ShoppingBag className="w-5 h-5 mr-3" />
                      My Orders
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center w-full py-2 text-red-600 hover:text-red-700 transition-colors duration-200"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-pink-100 pt-4 mt-4">
                  <button
                    onClick={openLoginModal}
                    className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-center py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200"
                  >
                    Sign In / Sign Up
                  </button>
                  {cartCount > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700 text-center">
                        ⚠️ Your cart items are temporary. Sign in to save them permanently.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAuthSuccess={handleLoginSuccess}
      />

      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        @keyframes slide-in-from-top-2 {
          from {
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top-2 {
          animation-name: slide-in-from-top-2;
        }
        
        .duration-300 {
          animation-duration: 300ms;
        }

        /* Custom breakpoint for extra small screens */
        @media (min-width: 375px) {
          .xs\:block {
            display: block;
          }
        }
      `}</style>
    </header>
  )
}

export default Header