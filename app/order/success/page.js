"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  Download,
  Mail,
} from "lucide-react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext"; // Add this import

function SuccessContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth(); // Add this line to get user data
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const paymentIntentId = searchParams.get("payment_intent");
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID not found");
        setLoading(false);
        return;
      }

      try {
        const cached = sessionStorage.getItem("lastSuccessfulOrder");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const cachedId = parsed?._id || parsed?.id || parsed?.orderId;
            if (String(cachedId) === String(orderId)) {
              setOrder(parsed);
              setLoading(false);
              return;
            }
          } catch {}
        }

        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login to load this order details page.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.message || "Order not found");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Package className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Error Loading Order
              </h1>
              <p className="text-gray-600 mb-8">{error}</p>
              <Link href="/shop">
                <button className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Success Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Payment Successful!
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Thank you for your order
              </p>
              <p className="text-gray-500">Order #{order?.orderId}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Order Details
                </h2>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {order?.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-pink-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {item.name}
                        </h3>
                        <p className="text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${order?.amount?.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>
                      {order?.amount?.shipping === 0
                        ? "FREE"
                        : `$${order?.amount?.shipping?.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${order?.amount?.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${order?.amount?.total?.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Status & Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                {/* Order Status */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Order Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 rounded-full p-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-600">
                          Payment Confirmed
                        </p>
                        <p className="text-sm text-gray-500">
                          Your payment has been processed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-600">
                          Processing Order
                        </p>
                        <p className="text-sm text-gray-500">
                          We're preparing your items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 rounded-full p-2">
                        <Truck className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-400">Shipping</p>
                        <p className="text-sm text-gray-500">
                          Expected in 3-5 business days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Info */}
                {order?.shippingAddress && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Shipping Address
                    </h3>
                    <div className="text-gray-600">
                      <p className="font-semibold">
                        {order.shippingAddress.name}
                      </p>
                      <p>{order.shippingAddress.address}</p>
                      <p>
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.phone}</p>
                      <p>{order.shippingAddress.email}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    What's Next?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Mail className="w-5 h-5" />
                      <span>
                        Order confirmation sent to{" "}
                        {order?.shippingAddress?.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Package className="w-5 h-5" />
                      <span>
                        You'll receive tracking info when your order ships
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Link href="/shop">
                      <button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300">
                        Continue Shopping
                      </button>
                    </Link>
                    {user ? (
                      <Link href={`/orders`}>
                        <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                          View All Orders
                        </button>
                      </Link>
                    ) : (
                      <Link href="/shop">
                        <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                          Continue Shopping
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
