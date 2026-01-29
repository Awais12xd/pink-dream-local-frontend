'use client'
import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { motion } from 'framer-motion'
import { CreditCard, Lock, AlertCircle, User, Mail, MapPin } from 'lucide-react'
import { toast } from 'react-toastify'

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
        complete: {
            color: '#059669',
        },
    },
    hidePostalCode: false,
}

export default function CheckoutForm({ 
    amount, 
    orderId, 
    userId, 
    cartItems,
    shippingAddress,
    onSuccess, 
    onError,
    isLoading: externalLoading = false 
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    
    // Separate billing address state (editable)
    const [billingAddress, setBillingAddress] = useState({
        name: shippingAddress.name || '',
        email: shippingAddress.email || '',
        phone: shippingAddress.phone || '',
        address: shippingAddress.address || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zipCode: shippingAddress.zipCode || '',
        country: 'US'
    })
    
    const [sameAsShipping, setSameAsShipping] = useState(true)

    // Update billing when shipping changes or when toggle changes
    const handleSameAsShippingChange = (checked) => {
        setSameAsShipping(checked)
        if (checked) {
            setBillingAddress({
                name: shippingAddress.name || '',
                email: shippingAddress.email || '',
                phone: shippingAddress.phone || '',
                address: shippingAddress.address || '',
                city: shippingAddress.city || '',
                state: shippingAddress.state || '',
                zipCode: shippingAddress.zipCode || '',
                country: 'US'
            })
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!stripe || !elements) {
            setError('Stripe is not loaded yet. Please try again.')
            return
        }

        // Get current billing address (either same as shipping or separate)
        const currentBilling = sameAsShipping ? shippingAddress : billingAddress

        // Validate required fields
        if (!currentBilling.name || !currentBilling.email || !currentBilling.address) {
            setError('Please fill in all required billing information.')
            return
        }

        if (!shippingAddress.name || !shippingAddress.email || !shippingAddress.address) {
            setError('Please fill in all shipping address fields.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            console.log('🔵 Creating Stripe payment intent...', { amount, orderId, userId })
            
            // Step 1: Create payment intent
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    orderId,
                    userId,
                }),
            })

            const data = await response.json()
            console.log('💳 Payment intent response:', data)

            if (!data.success) {
                throw new Error(data.message || 'Failed to create payment intent')
            }

            console.log('🔵 Creating order in database...')
            
            // Step 2: Create order in database
            const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    items: cartItems,
                    shippingAddress,
                    billingAddress: currentBilling,
                    amount: {
                        subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                        shipping: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 75 ? 0 : 9.99,
                        tax: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.08,
                        discount: 0,
                        total: amount
                    },
                    paymentIntentId: data.paymentIntentId,
                    paymentMethod: 'stripe'
                }),
            })

            const orderData = await orderResponse.json()
            console.log('📦 Order creation response:', orderData)

            if (!orderData.success) {
                throw new Error(orderData.message || 'Failed to create order')
            }

            console.log('🔵 Confirming payment with Stripe...')
            
            // Step 3: Confirm payment with Stripe
            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: currentBilling.name,
                        email: currentBilling.email,
                        phone: currentBilling.phone,
                        address: {
                            line1: currentBilling.address,
                            city: currentBilling.city,
                            state: currentBilling.state,
                            postal_code: currentBilling.zipCode,
                            country: currentBilling.country,
                        },
                    },
                },
            })

            if (result.error) {
                console.error('❌ Stripe payment error:', result.error)
                setError(result.error.message)
                onError?.(result.error)
            } else {
                console.log('✅ Stripe payment successful!')
                
                // Step 4: Confirm payment on backend
                const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentIntentId: result.paymentIntent.id,
                        orderId: orderData.orderId
                    }),
                })

                const confirmData = await confirmResponse.json()
                console.log('✅ Payment confirmation response:', confirmData)

                if (confirmData.success) {
                    toast.success('💳 Credit card payment successful!')
                    onSuccess?.(confirmData.order, result.paymentIntent)
                } else {
                    throw new Error('Payment succeeded but order confirmation failed')
                }
            }
        } catch (err) {
            console.error('❌ Stripe checkout error:', err)
            setError(err.message)
            onError?.(err)
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const loading = isLoading || externalLoading

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Billing Address Toggle */}
                <div className="border-b pb-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={sameAsShipping}
                            onChange={(e) => handleSameAsShippingChange(e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Billing address is the same as shipping address
                        </span>
                    </label>
                </div>

                {/* Billing Details Section */}
                {!sameAsShipping && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Billing Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={billingAddress.name}
                                    onChange={(e) => setBillingAddress(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={billingAddress.email}
                                    onChange={(e) => setBillingAddress(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={billingAddress.phone}
                                    onChange={(e) => setBillingAddress(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Street Address *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={billingAddress.address}
                                    onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                    placeholder="123 Main Street"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={billingAddress.city}
                                    onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                    placeholder="New York"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={billingAddress.state}
                                    onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                    placeholder="NY"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ZIP Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={billingAddress.zipCode}
                                    onChange={(e) => setBillingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                    placeholder="10001"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Show current billing address if same as shipping */}
                {sameAsShipping && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Billing Address (Same as Shipping)
                        </h4>
                        <div className="text-sm text-gray-600">
                            <p>{shippingAddress.name}</p>
                            <p>{shippingAddress.email}</p>
                            <p>{shippingAddress.address}</p>
                            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                        </div>
                    </div>
                )}

                {/* Card Element Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Card Information
                    </h3>
                    
                    <div className="p-4 border-2 border-gray-300 rounded-lg bg-white focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-opacity-20 transition-all">
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                    </div>
                    
                    {/* Test Card Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <div className="text-blue-600 mt-0.5">💳</div>
                            <div>
                                <p className="text-blue-800 font-medium text-sm mb-2">
                                    Test Card Information
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-700 text-sm">
                                    <div>
                                        <p><strong>Card Number:</strong> 4242 4242 4242 4242</p>
                                        <p><strong>Expiry:</strong> Any future date</p>
                                    </div>
                                    <div>
                                        <p><strong>CVC:</strong> Any 3 digits</p>
                                        <p><strong>ZIP:</strong> Any 5 digits</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={!stripe || loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Processing Payment...</span>
                        </>
                    ) : (
                        <>
                            <Lock className="w-5 h-5" />
                            <span>Pay ${amount.toFixed(2)} Securely</span>
                        </>
                    )}
                </motion.button>

                {/* Security Notice */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 flex items-center justify-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Your payment information is encrypted and secure</span>
                    </p>
                </div>
            </form>
        </div>
    )
}