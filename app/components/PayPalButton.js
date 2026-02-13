"use client";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useState } from "react";
import { toast } from "react-toastify";
import { usePayPal } from "../context/PayPalContext";

function PayPalButtonInner({
  amount,
  orderId,
  userId,
  cartItems,
  shippingAddress,
  onSuccess,
  onError,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [{ isPending }] = usePayPalScriptReducer();

  const mapPayPalError = (res, data, fallback) => {
    const msg = data?.message || data?.error || fallback;
    if (res?.status === 403 || /disabled/i.test(msg)) {
      return "PayPal is currently disabled by admin. Please select another payment method.";
    }
    toast.error(msg);
    return msg;
  };

  const createOrder = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/paypal/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, orderId, userId, items: cartItems }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (result.success) {
        return result.orderID;
      }

      throw new Error(
        mapPayPalError(response, result, "Failed to create PayPal order"),
      );
    } catch (error) {
      toast.error("Failed to initialize PayPal payment");
      setIsProcessing(false);
      throw error;
    }
  };

  const onApprove = async (data) => {
    try {
      toast.info("Processing your PayPal payment...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/paypal/capture-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderID: data.orderID,
            orderId,
            userId,
            items: cartItems,
            shippingAddress,
            amount: {
              subtotal: cartItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
              ),
              shipping:
                cartItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                ) > 75
                  ? 0
                  : 9.99,
              tax:
                cartItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                ) * 0.08,
              discount: 0,
              total: amount,
            },
          }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (result.success) {
        toast.success("PayPal payment successful.");
        onSuccess?.(result.order, result.paypalDetails);
        return;
      }

      throw new Error(mapPayPalError(response, result, "Payment capture failed"));
    } catch (error) {
      toast.error("PayPal payment failed: " + error.message);
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const onCancel = () => {
    toast.info("PayPal payment was cancelled");
    setIsProcessing(false);
  };

  const onErrorHandler = (err) => {
    toast.error("PayPal payment error occurred");
    onError?.(err);
    setIsProcessing(false);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-blue-600 font-medium">Loading PayPal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-blue-600 font-medium">Processing PayPal payment...</p>
          </div>
        </div>
      )}

      <PayPalButtons
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal",
          height: 50,
          tagline: false,
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        onError={onErrorHandler}
        disabled={isProcessing}
      />

      <div className="text-center">
        <p className="text-sm text-gray-600">Secure payment. Stay on this page.</p>
      </div>
    </div>
  );
}

export default function PayPalButton(props) {
  const { ready } = usePayPal();

  if (!ready) {
    return (
      <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
        PayPal is not configured right now.
      </div>
    );
  }

  return <PayPalButtonInner {...props} />;
}
