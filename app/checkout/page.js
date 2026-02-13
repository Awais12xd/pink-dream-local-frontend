"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  Shield,
  Gift,
  Percent,
  Tag,
  Check,
} from "lucide-react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PaymentSelector from "../components/PaymentSelector";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { StripeProvider } from "../context/StripeContext";
import { PayPalProvider } from "../context/PayPalContext";
import { toast } from "react-toastify";
import { getImageSrc, handleImageError } from "../utils/imageUtils";

const DEFAULT_PAYMENT_METHODS = {
  stripe: { enabled: false },
  paypal: { enabled: false },
  cod: { enabled: true },
  bankTransfer: { enabled: false, instructions: "" },
};


function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, getTotalPrice, getTotalItems, clearCart } = useCart();
  const { user } = useAuth();

  const [orderId, setOrderId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Promo code state from cart
  const [appliedPromo, setAppliedPromo] = useState(null);

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });

  const [publicSettings, setPublicSettings] = useState(null);
  const [allowGuestCheckout, setAllowGuestCheckout] = useState(true);

  const paymentMethods = useMemo(() => {
    return publicSettings?.paymentSettings?.methods || DEFAULT_PAYMENT_METHODS;
  }, [publicSettings]);

  useEffect(() => {
    let mounted = true;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public`)
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        const s = d?.settings || null;
        setPublicSettings(s);
        setAllowGuestCheckout(s?.allowGuestCheckout ?? true);
      })
      .catch(() => {
        if (!mounted) return;
        setPublicSettings(null);
        setAllowGuestCheckout(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user && allowGuestCheckout === false) {
      router.push(`/login?redirect=/checkout`);
    }
  }, [user, allowGuestCheckout, router]);

  useEffect(() => {
    const newOrderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    setOrderId(newOrderId);

    // FIXED: Check multiple sources for promo code data
    let promoData = null;

    // 1. First check URL params (if passed from cart)
    const urlPromo = searchParams.get("promo");
    if (urlPromo) {
      try {
        promoData = JSON.parse(decodeURIComponent(urlPromo));
      } catch (error) {
        console.error("Error parsing promo data from URL:", error);
      }
    }

    // 2. If not in URL, check localStorage (fallback)
    if (!promoData) {
      try {
        const storedPromo = localStorage.getItem("appliedPromoCode");
        if (storedPromo) {
          promoData = JSON.parse(storedPromo);
        }
      } catch (error) {
        console.error("Error reading promo from localStorage:", error);
      }
    }

    // 3. Set the promo data if found
    if (promoData) {
      setAppliedPromo(promoData);
    }

    // Redirect if cart is empty
    if (cart.length === 0) {
      router.push("/cart");
    }
  }, [cart, router, searchParams]);

  const handlePaymentSuccess = async (order, paymentData) => {
    setIsProcessing(true);

    try {
      // If promo code was applied, track its usage
      if (appliedPromo && appliedPromo.code) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/promo-codes/apply/${appliedPromo.code}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id || null,
                orderAmount: total,
              }),
            },
          );

          // Clear the promo code from localStorage after successful use
          localStorage.removeItem("appliedPromoCode");
        } catch (error) {
          console.error("Error tracking promo code usage:", error);
        }
      }

      await clearCart();
      if(paymentData.method !== "cod" && paymentData.method !== "bankTransfer"){
      toast.success("🎉 Payment successful! Order confirmed.");
      }

      const successOrderId = order?.orderId || order?._id;
      let paymentId = "completed";

      if (paymentData?.id) {
        paymentId = paymentData.id;
      } else if (paymentData?.orderID) {
        paymentId = paymentData.orderID;
      } else if (paymentData?.captureId) {
        paymentId = paymentData.captureId;
      }

      if (!successOrderId) {
        throw new Error("Order ID is missing. Please contact support.");
      }

      router.push(
        `/order/success?payment_intent=${paymentId}&order_id=${successOrderId}`,
      );
    } catch (error) {
      console.error("❌ Error processing successful payment:", error);
      toast.error(
        "Payment succeeded but there was an error. Please contact support.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error("❌ Payment error:", error);
    toast.error(error.message || "Payment failed. Please try again.");
    setIsProcessing(false);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-4">Redirecting to cart...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Calculate amounts with proper discount handling
  const subtotal = getTotalPrice();
  const shipping = subtotal > 75 ? 0 : 9.99;
  const taxRate = 0.08; // 8% tax

  // Calculate discount BEFORE tax
  let discount = 0;
  if (appliedPromo && appliedPromo.discount) {
    // Use the discount amount from the promo validation
    discount = appliedPromo.discount.amount || 0;
  }

  // Calculate tax on (subtotal - discount)
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * taxRate;

  // Calculate final total
  const total = subtotal + shipping + tax - discount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center text-pink-600 hover:text-pink-700 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cart
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Secure Checkout
              </h1>
              <p className="text-gray-600 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Complete your order with confidence • SSL encrypted
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                <Check className="w-5 h-5" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Cart
              </span>
            </div>
            <div className="w-16 h-0.5 bg-pink-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                Checkout
              </span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">
                Complete
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Order Summary */}
          <div className="lg:col-span-3 space-y-6">
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Package className="w-6 h-6 mr-3 text-pink-500" />
                  Order Summary
                </h2>
                <span className="text-gray-600">
                  {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex items-center space-x-4 pb-4 border-b border-gray-100"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getImageSrc(item.image)}
                        alt={item.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">Size: {item.size}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Display */}
              {appliedPromo && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-800 text-lg">
                          Code Applied!
                        </p>
                        <p className="text-green-700 font-semibold uppercase tracking-wide">
                          {appliedPromo.code}
                        </p>
                        <p className="text-green-600 text-sm">
                          You saved ${discount.toFixed(2)}!
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">
                        -${discount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
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
                <div className="flex justify-between text-gray-700">
                  <span>Tax (8%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-lg">
                    <span className="flex items-center">
                      <Percent className="w-4 h-4 mr-2" />
                      Discount
                    </span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-300">
                  <span>Total</span>
                  <span className="text-pink-600">${total.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <p className="text-center text-green-600 font-semibold text-sm flex items-center justify-center">
                    <Gift className="w-4 h-4 mr-2" />
                    You're saving ${discount.toFixed(2)} with this code!
                  </p>
                )}
              </div>
            </motion.div>

            {/* Shipping Address Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Truck className="w-6 h-6 mr-3 text-pink-500" />
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.name}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
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
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
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
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
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
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
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
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
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
                    value={shippingAddress.zipCode}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        zipCode: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                    placeholder="10001"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Secure Checkout</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Your information is protected with 256-bit SSL encryption
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Payment Selection */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-8"
            >
              <PaymentSelector
                amount={total}
                amountBreakdown={{
                  subtotal,
                  shipping,
                  tax,
                  discount,
                  total,
                }}
                orderId={orderId}
                userId={user?.id || "guest"}
                cartItems={cart}
                shippingAddress={shippingAddress}
                promoCode={appliedPromo}
                discount={discount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isLoading={isProcessing}
                paymentMethods={paymentMethods}
              />

              {/* Trust Signals */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Why shop with us?
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Secure payments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span>Free shipping over $75</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-purple-500" />
                    <span>30-day return policy</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <StripeProvider>
      <PayPalProvider>
        <CheckoutContent />
      </PayPalProvider>
    </StripeProvider>
  );
}
