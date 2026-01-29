'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const TrackOrderPage = () => {
    const params = useParams();
    const orderId = params.orderId;
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const fetchOrderDetails = async () => {
       try {
  setLoading(true);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/order/${orderId}`
  );
  const data = await response.json();

  if (data.success) {
    setOrder(data.order);
  } else {
                setError('Order not found');
            }
        } catch (err) {
            setError('Failed to fetch order details');
            console.error('Error fetching order:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            processing: 'bg-blue-100 text-blue-800 border-blue-200',
            shipped: 'bg-purple-100 text-purple-800 border-purple-200',
            delivered: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            succeeded: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusProgress = (status) => {
        const progress = {
            pending: 25,
            processing: 50,
            shipped: 75,
            delivered: 100,
            cancelled: 0
        };
        return progress[status] || 0;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link href="/" className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors">
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Track Order #{order.orderId}</h1>
                            <p className="text-gray-600 mt-1">
                                Placed on {formatDate(order.createdAt)}
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                Payment {order.paymentStatus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Order Progress */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Progress</h2>
                    
                    {/* Progress Bar */}
                    <div className="relative">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                            <div 
                                style={{ width: `${getStatusProgress(order.status)}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
                            ></div>
                        </div>
                        
                        {/* Progress Steps */}
                        <div className="flex justify-between text-xs text-gray-600">
                            <div className={`flex flex-col items-center ${order.status === 'pending' ? 'text-pink-600 font-semibold' : ''}`}>
                                <div className={`w-3 h-3 rounded-full mb-1 ${getStatusProgress(order.status) >= 25 ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                                <span>Order Placed</span>
                            </div>
                            <div className={`flex flex-col items-center ${order.status === 'processing' ? 'text-pink-600 font-semibold' : ''}`}>
                                <div className={`w-3 h-3 rounded-full mb-1 ${getStatusProgress(order.status) >= 50 ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                                <span>Processing</span>
                            </div>
                            <div className={`flex flex-col items-center ${order.status === 'shipped' ? 'text-pink-600 font-semibold' : ''}`}>
                                <div className={`w-3 h-3 rounded-full mb-1 ${getStatusProgress(order.status) >= 75 ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                                <span>Shipped</span>
                            </div>
                            <div className={`flex flex-col items-center ${order.status === 'delivered' ? 'text-pink-600 font-semibold' : ''}`}>
                                <div className={`w-3 h-3 rounded-full mb-1 ${getStatusProgress(order.status) >= 100 ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                                <span>Delivered</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        {order.status === 'pending' && (
                            <p className="text-gray-700">
                                <span className="font-semibold">Order Confirmed!</span> We're preparing your items for shipment.
                            </p>
                        )}
                        {order.status === 'processing' && (
                            <p className="text-gray-700">
                                <span className="font-semibold">Processing Your Order!</span> Your items are being prepared and will ship soon.
                            </p>
                        )}
                        {order.status === 'shipped' && (
                            <p className="text-gray-700">
                                <span className="font-semibold">Order Shipped!</span> Your package is on its way and should arrive within 5-7 business days.
                            </p>
                        )}
                        {order.status === 'delivered' && (
                            <p className="text-gray-700">
                                <span className="font-semibold">Order Delivered!</span> Your package has been successfully delivered. Enjoy your new items!
                            </p>
                        )}
                        {order.status === 'cancelled' && (
                            <p className="text-gray-700">
                                <span className="font-semibold">Order Cancelled.</span> This order has been cancelled. If you have questions, please contact support.
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                        
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                                    <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                        <p className="text-sm font-medium text-gray-900">${item.price.toFixed(2)} each</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Total */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="text-gray-900">${(order.amount?.subtotal || 0).toFixed(2)}</span>
                                </div>
                                {order.amount?.shipping > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Shipping:</span>
                                        <span className="text-gray-900">${order.amount.shipping.toFixed(2)}</span>
                                    </div>
                                )}
                                {order.amount?.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax:</span>
                                        <span className="text-gray-900">${order.amount.tax.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                                    <span className="text-gray-900">Total:</span>
                                    <span className="text-pink-600">${(order.amount?.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-6">
                        {/* Shipping Address */}
                        {order.shippingAddress && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
                                <div className="text-gray-700 space-y-1">
                                    <p className="font-medium">{order.shippingAddress.name}</p>
                                    <p>{order.shippingAddress.address}</p>
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                                    <p>{order.shippingAddress.country}</p>
                                    {order.shippingAddress.phone && (
                                        <p className="mt-2 text-sm">Phone: {order.shippingAddress.phone}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Information */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Method:</span>
                                    <span className="text-gray-900 capitalize">
                                        {order.paymentMethod === 'paypal' ? 'PayPal' : 'Credit Card'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Status:</span>
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment ID:</span>
                                    <span className="text-gray-900 text-sm font-mono">
                                        {order.stripePaymentIntentId}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Order Actions */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
                            <div className="space-y-3">
                                <Link 
                                    href="/contact" 
                                    className="block w-full text-center bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors"
                                >
                                    Contact Support
                                </Link>
                                <Link 
                                    href="/" 
                                    className="block w-full text-center border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                                <p><strong>Questions about your order?</strong></p>
                                <p>Email us at support@pinkdreams.com or call (555) 123-4567</p>
                                <p className="mt-2">Order ID: <span className="font-mono">{order.orderId}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackOrderPage;