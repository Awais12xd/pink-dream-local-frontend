'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trash2, Plus, Minus, ShoppingCart, ArrowRight, 
  Tag, Percent, X, Gift, Truck, Shield, Heart,
  AlertCircle, Check
} from 'lucide-react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { getImageSrc, handleImageError } from '../utils/imageUtils'

export default function CartPage() {
    const router = useRouter()
    const { 
        cart, 
        removeFromCart, 
        updateQuantity, 
        getTotalPrice, 
        getTotalItems, 
        clearCart 
    } = useCart()
    const { user } = useAuth()
    
    // Promo code states
    const [promoCode, setPromoCode] = useState('')
    const [appliedPromo, setAppliedPromo] = useState(null)
    const [isApplyingPromo, setIsApplyingPromo] = useState(false)
    const [promoError, setPromoError] = useState('')

    // ✅ Load applied promo code from localStorage on mount
    useEffect(() => {
        try {
            const storedPromo = localStorage.getItem('appliedPromoCode')
            if (storedPromo) {
                const promoData = JSON.parse(storedPromo)
                setAppliedPromo(promoData)
              
            }
        } catch (error) {
            console.error('Error loading promo from localStorage:', error)
            localStorage.removeItem('appliedPromoCode')
        }
    }, [])

    // ✅ Re-validate promo when cart changes
    useEffect(() => {
        if (appliedPromo && cart.length > 0) {
            // Re-validate promo with new cart total
            revalidatePromo()
        }
    }, [cart])

    // ✅ Apply promo code function
    const handleApplyPromoCode = async () => {
        if (!promoCode.trim()) {
            setPromoError('Please enter a promo code')
            toast.error('Please enter a promo code')
            return
        }

        setIsApplyingPromo(true)
        setPromoError('')
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/promo-codes/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: promoCode.toUpperCase(),
                    userId: user?.id || null,
                    cartTotal: getTotalPrice(),
                    cartItems: cart
                })
            })

            const data = await response.json()
            
            if (data.success) {
                // ✅ CRITICAL: Store complete promo data with discount amount
                const promoData = {
                    code: data.promoCode.code,
                    title: data.promoCode.title,
                    description: data.promoCode.description,
                    discountType: data.promoCode.discountType,
                    discountValue: data.promoCode.discountValue,
                    discount: {
                        amount: data.discount.amount,      // ← CRITICAL FIELD
                        type: data.discount.type,
                        value: data.discount.value
                    },
                    originalAmount: data.originalAmount,
                    finalAmount: data.finalAmount,
                    savings: data.savings
                }
                
                // Store in localStorage
                localStorage.setItem('appliedPromoCode', JSON.stringify(promoData))
                
                // Update state
                setAppliedPromo(promoData)
                setPromoCode('')
                
                toast.success(`🎉 Promo code "${data.promoCode.code}" applied! You saved $${data.savings.toFixed(2)}`)
                
            
            } else {
                setPromoError(data.message || 'Invalid promo code')
                toast.error(data.message || 'Invalid promo code')
            }
        } catch (error) {
            console.error('❌ Error applying promo code:', error)
            setPromoError('Failed to apply promo code. Please try again.')
            toast.error('Failed to apply promo code')
        } finally {
            setIsApplyingPromo(false)
        }
    }

    // ✅ Re-validate promo code (when cart changes)
    const revalidatePromo = async () => {
        if (!appliedPromo) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/promo-codes/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: appliedPromo.code,
                    userId: user?.id || null,
                    cartTotal: getTotalPrice(),
                    cartItems: cart
                })
            })

            const data = await response.json()
            
            if (data.success) {
                // Update promo data with new discount amount
                const updatedPromoData = {
                    ...appliedPromo,
                    discount: {
                        amount: data.discount.amount,
                        type: data.discount.type,
                        value: data.discount.value
                    },
                    originalAmount: data.originalAmount,
                    finalAmount: data.finalAmount,
                    savings: data.savings
                }
                
                localStorage.setItem('appliedPromoCode', JSON.stringify(updatedPromoData))
                setAppliedPromo(updatedPromoData)
                
                
            } else {
                // Promo no longer valid
                handleRemovePromo()
                toast.warning(data.message || 'Promo code is no longer valid')
            }
        } catch (error) {
            console.error('Error re-validating promo:', error)
        }
    }

    // ✅ Remove promo code
    const handleRemovePromo = () => {
        localStorage.removeItem('appliedPromoCode')
        setAppliedPromo(null)
        setPromoCode('')
        setPromoError('')
        toast.info('Promo code removed')
        
    }

    // ✅ Handle key press in promo input
    const handlePromoKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleApplyPromoCode()
        }
    }

    // ✅ Calculate totals with discount
    const subtotal = getTotalPrice()
    const shipping = subtotal > 75 ? 0 : 9.99
    const discount = appliedPromo?.discount?.amount || 0
    const taxableAmount = Math.max(0, subtotal - discount)
    const tax = taxableAmount * 0.08 // 8% tax
    const total = subtotal + shipping + tax - discount



    // ✅ Navigate to checkout with promo data
    const handleProceedToCheckout = () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty')
            return
        }

        // Ensure promo data is stored in localStorage
        if (appliedPromo) {
            localStorage.setItem('appliedPromoCode', JSON.stringify(appliedPromo))
            
            // Pass via URL as backup
            const encodedPromo = encodeURIComponent(JSON.stringify(appliedPromo))
            
        
            router.push(`/checkout?promo=${encodedPromo}`)
        } else {
           
            router.push('/checkout')
        }
    }

    // Empty cart state
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <ShoppingCart className="w-32 h-32 mx-auto text-gray-300 mb-6" />
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
                        <p className="text-gray-600 mb-8">Add some amazing products to get started!</p>
                        <Link 
                            href="/shop"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg font-semibold"
                        >
                            Continue Shopping
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
            <Header />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                        Shopping Cart
                    </h1>
                    <p className="text-gray-600">
                        {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side - Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence>
                            {cart.map((item) => (
                                <motion.div
                                    key={`${item.id}-${item.size}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                                >
                                    <div className="flex items-center space-x-6">
                                        {/* Product Image */}
                                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img
                                                src={getImageSrc(item.image)}
                                                alt={item.name}
                                                onError={handleImageError}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                                                {item.name}
                                            </h3>
                                            <p className="text-gray-600 mb-2">Size: {item.size}</p>
                                            <p className="text-2xl font-bold text-pink-600">
                                                ${item.price.toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex flex-col items-end space-y-4">
                                            <button
                                                onClick={() => removeFromCart(item.id, item.size)}
                                                className="text-red-500 hover:text-red-700 transition-colors p-2"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>

                                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-12 text-center font-semibold">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <p className="text-lg font-bold text-gray-900">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Continue Shopping Button */}
                        <Link
                            href="/shop"
                            className="inline-flex items-center text-pink-600 hover:text-pink-700 font-semibold"
                        >
                            ← Continue Shopping
                        </Link>
                    </div>

                    {/* Right Side - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Promo Code Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-lg p-6"
                            >
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <Gift className="w-5 h-5 mr-2 text-pink-500" />
                                    Have a Promo Code?
                                </h3>

                                {!appliedPromo ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={promoCode}
                                                onChange={(e) => {
                                                    setPromoCode(e.target.value.toUpperCase())
                                                    setPromoError('')
                                                }}
                                                onKeyPress={handlePromoKeyPress}
                                                placeholder="Enter promo code"
                                                disabled={isApplyingPromo}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all uppercase"
                                            />
                                            <Tag className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                                        </div>
                                        
                                        {promoError && (
                                            <div className="flex items-start space-x-2 text-red-600 text-sm">
                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>{promoError}</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleApplyPromoCode}
                                            disabled={isApplyingPromo || !promoCode.trim()}
                                            className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isApplyingPromo ? 'Applying...' : 'Apply Code'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-green-800">Code Applied!</p>
                                                    <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">
                                                        {appliedPromo.code}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRemovePromo}
                                                className="text-green-700 hover:text-green-900 transition-colors"
                                                title="Remove promo code"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {appliedPromo.description && (
                                            <p className="text-xs text-green-600 mb-2">
                                                {appliedPromo.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between pt-2 border-t border-green-200">
                                            <span className="text-green-700 font-medium">You saved:</span>
                                            <span className="text-xl font-bold text-green-700">
                                                ${discount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Order Summary */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl shadow-lg p-6"
                            >
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal ({getTotalItems()} items)</span>
                                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                    </div>

                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-lg -mx-1">
                                            <span className="flex items-center">
                                                <Percent className="w-4 h-4 mr-2" />
                                                Discount ({appliedPromo.code})
                                            </span>
                                            <span>-${discount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-gray-700">
                                        <span className="flex items-center">
                                            <Truck className="w-4 h-4 mr-2" />
                                            Shipping
                                        </span>
                                        <span className="font-semibold">
                                            {shipping === 0 ? (
                                                <span className="text-green-600 font-bold">FREE</span>
                                            ) : (
                                                `$${shipping.toFixed(2)}`
                                            )}
                                        </span>
                                    </div>

                                    {shipping === 0 && (
                                        <p className="text-xs text-green-600 flex items-center">
                                            <Check className="w-3 h-3 mr-1" />
                                            Free shipping unlocked!
                                        </p>
                                    )}

                                    {shipping > 0 && subtotal < 75 && (
                                        <p className="text-xs text-gray-600">
                                            Add ${(75 - subtotal).toFixed(2)} more for free shipping
                                        </p>
                                    )}

                                    <div className="flex justify-between text-gray-700">
                                        <span>Tax (8%)</span>
                                        <span className="font-semibold">${tax.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-4 border-t-2 border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-bold text-gray-900">Total</span>
                                            <span className="text-2xl font-bold text-pink-600">
                                                ${total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {discount > 0 && (
                                        <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                                            <p className="text-center text-pink-700 font-semibold text-sm flex items-center justify-center">
                                                <Gift className="w-4 h-4 mr-2" />
                                                You're saving ${discount.toFixed(2)} with this code!
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Checkout Button */}
                                <button
                                    onClick={handleProceedToCheckout}
                                    className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg font-bold text-lg flex items-center justify-center"
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </button>

                                {/* Trust Badges */}
                                <div className="mt-6 space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <Shield className="w-4 h-4 text-green-500" />
                                        <span>Secure checkout</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Truck className="w-4 h-4 text-blue-500" />
                                        <span>Free shipping over $75</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Heart className="w-4 h-4 text-pink-500" />
                                        <span>30-day return policy</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}