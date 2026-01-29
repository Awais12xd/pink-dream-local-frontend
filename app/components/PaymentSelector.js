'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle } from 'lucide-react'
import CheckoutForm from './CheckoutForm'
import PayPalButton from './PayPalButton'

export default function PaymentSelector({
    amount,
    orderId,
    userId,
    cartItems,
    shippingAddress,
    onSuccess,
    onError,
    isLoading
}) {
    const [selectedMethod, setSelectedMethod] = useState('stripe')

    return (
        <div className="space-y-6">
            {/* Payment Method Selection */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method</h2>
                
                <div className="grid grid-cols-1 gap-4">
                    {/* Stripe Option */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedMethod('stripe')}
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedMethod === 'stripe'
                                ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500 ring-opacity-20'
                                : 'border-gray-300 hover:border-pink-300 bg-white'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-full ${
                                    selectedMethod === 'stripe' ? 'bg-pink-500 text-white' : 'bg-gray-100'
                                }`}>
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">Credit or Debit Card</h3>
                                    <p className="text-gray-600 text-sm">Visa, Mastercard, American Express</p>
                                    <p className="text-gray-500 text-xs mt-1">Secure payment with SSL encryption</p>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                selectedMethod === 'stripe' 
                                    ? 'border-pink-500 bg-pink-500' 
                                    : 'border-gray-300'
                            }`}>
                                {selectedMethod === 'stripe' && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* PayPal Option */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedMethod('paypal')}
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedMethod === 'paypal'
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                                : 'border-gray-300 hover:border-blue-300 bg-white'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-full ${
                                    selectedMethod === 'paypal' ? 'bg-blue-600' : 'bg-gray-100'
                                }`}>
                                    <div className="w-6 h-4 flex items-center justify-center">
                                        <span className={`font-bold text-xs ${
                                            selectedMethod === 'paypal' ? 'text-white' : 'text-blue-600'
                                        }`}>
                                            PayPal
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">PayPal</h3>
                                    <p className="text-gray-600 text-sm">Pay with your PayPal account</p>
                                    <p className="text-gray-500 text-xs mt-1">Quick checkout • Stay on this page</p>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                selectedMethod === 'paypal' 
                                    ? 'border-blue-500 bg-blue-500' 
                                    : 'border-gray-300'
                            }`}>
                                {selectedMethod === 'paypal' && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Selected Payment Method Form */}
            <motion.div
                key={selectedMethod}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
            >
                {selectedMethod === 'stripe' ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-pink-200">
                        <div className="flex items-center space-x-2 mb-6">
                            <CreditCard className="w-5 h-5 text-pink-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Credit Card Payment</h3>
                        </div>
                        <CheckoutForm
                            amount={amount}
                            orderId={orderId}
                            userId={userId}
                            cartItems={cartItems}
                            shippingAddress={shippingAddress}
                            onSuccess={onSuccess}
                            onError={onError}
                            isLoading={isLoading}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">P</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">PayPal Payment</h3>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <div className="text-blue-600 mt-0.5">ℹ️</div>
                                <div>
                                    <p className="text-blue-800 font-medium text-sm">
                                        Secure PayPal Checkout
                                    </p>
                                    <p className="text-blue-700 text-sm mt-1">
                                        Click the PayPal button below to pay securely. You'll stay on our website throughout the entire process.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <PayPalButton
                            amount={amount}
                            orderId={orderId}
                            userId={userId}
                            cartItems={cartItems}
                            shippingAddress={shippingAddress}
                            onSuccess={onSuccess}
                            onError={onError}
                        />
                    </div>
                )}
            </motion.div>
        </div>
    )
}