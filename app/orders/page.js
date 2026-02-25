"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Search,
  Filter,
  CreditCard,
  Loader,
  AlertCircle,
  X,
  Calendar,
} from "lucide-react";
import { getImageSrc, handleImageError } from "../utils/imageUtils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const orderStatusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const getToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
};

const paymentMethodLabel = (method) => {
  const m = String(method || "").toLowerCase();
  if (m === "stripe" || m === "credit card") return "Credit Card";
  if (m === "paypal") return "PayPal";
  if (m === "cod" || m === "cash on delivery") return "Cash on Delivery";
  if (m === "bank_transfer" || m === "bank transfer") return "Bank Transfer";
  return method || "N/A";
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const requestWithAuth = async (path, options = {}) => {
  const token = getToken();
  if (!token) {
    const err = new Error("Please login to continue.");
    err.status = 401;
    throw err;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await safeJson(response);

  if (!response.ok) {
    const err = new Error(payload?.message || `Request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }

  return payload;
};

const ordersApi = {
  getOrders: (page = 1, limit = 10, status = "", search = "") => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    });
    return requestWithAuth(`/orders?${params.toString()}`);
  },
  getOrderById: (orderId) => requestWithAuth(`/orders/${orderId}`),
  cancelOrder: (orderId) =>
    requestWithAuth(`/orders/${orderId}/cancel`, { method: "POST" }),
  getOrderStats: () => requestWithAuth("/orders/stats/summary"),
};

const Notification = ({ message, type, onClose }) => (
  <AnimatePresence>
    {message ? (
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        className={`fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg flex items-center gap-2 text-white ${
          type === "success" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-white/20">
          <X size={14} />
        </button>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

const OrderStatusBadge = ({ status }) => {
  const cfg = orderStatusConfig[status] || orderStatusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={13} className="mr-1" />
      {cfg.label}
    </span>
  );
};

const OrderDetailsModal = ({ orderId, isOpen, onClose, onCancelSuccess }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState("");

  const canCancel =
    order && ["pending", "confirmed", "processing"].includes(order.status);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError("");
      const res = await ordersApi.getOrderById(orderId);
      setOrder(res?.order || null);
    } catch (e) {
      setError(e.message || "Failed to load order details");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      load();
    }
  }, [isOpen, orderId, load]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      setCancelLoading(true);
      await ordersApi.cancelOrder(order.id || order.orderId);
      setOrder((prev) => ({ ...prev, status: "cancelled" }));
      onCancelSuccess?.();
    } catch (e) {
      setError(e.message || "Failed to cancel order");
    } finally {
      setCancelLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader className="w-7 h-7 animate-spin text-pink-500" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          ) : order ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Order</p>
                  <p className="text-lg font-bold text-gray-900">#{order.orderId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                <div className="space-y-3">
                  {(order.items || []).map((item, idx) => {
                    const selected = Object.entries(item.selectedOptions || {}).filter(
                      ([k, v]) => k && v,
                    );
                    return (
                      <div key={`${item.name}-${idx}`} className="border rounded-xl p-3 flex gap-3">
                        <img
                          src={getImageSrc(item.image)}
                          onError={handleImageError}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} • {money(item.price)} each
                          </p>
                          {selected.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {selected.map(([k, v]) => (
                                <span
                                  key={k}
                                  className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200"
                                >
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <p className="font-semibold text-gray-900">
                          {money(item.price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Shipping</h5>
                  <p className="text-sm text-gray-700">{order.shippingAddress?.name || "-"}</p>
                  <p className="text-sm text-gray-600">{order.shippingAddress?.address || "-"}</p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress?.city || "-"}, {order.shippingAddress?.state || "-"}{" "}
                    {order.shippingAddress?.zipCode || ""}
                  </p>
                  <p className="text-sm text-gray-600">{order.shippingAddress?.country || "-"}</p>
                  <p className="text-sm text-gray-600 mt-1">{order.shippingAddress?.phone || "-"}</p>
                </div>

                <div className="border rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Payment</h5>
                  <p className="text-sm text-gray-700">
                    Method: {paymentMethodLabel(order.paymentMethod)}
                  </p>
                  <p className="text-sm text-gray-700">
                    Status: {String(order.paymentStatus || "pending")}
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{money(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{money(order.shipping)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{money(order.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                      <span>Total</span>
                      <span>{money(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {canCancel ? (
                <div className="pt-2">
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelLoading}
                    className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {cancelLoading ? "Cancelling..." : "Cancel Order"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-gray-500">Order not found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    statusCounts: {},
  });

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "success" });
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type }), 3500);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setSearchTerm(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [ordersRes, statsRes] = await Promise.all([
        ordersApi.getOrders(currentPage, itemsPerPage, statusFilter, searchTerm),
        ordersApi.getOrderStats().catch(() => null),
      ]);

      if (ordersRes?.success) {
        setOrders(Array.isArray(ordersRes.orders) ? ordersRes.orders : []);
        setCurrentPage(ordersRes.pagination?.currentPage || 1);
        setTotalPages(ordersRes.pagination?.totalPages || 1);
        setTotalOrders(ordersRes.pagination?.totalOrders || 0);
      } else {
        setOrders([]);
      }

      if (statsRes?.success && statsRes.stats) {
        setOrderStats({
          totalOrders: statsRes.stats.totalOrders || 0,
          totalSpent: statsRes.stats.totalSpent || 0,
          statusCounts: statsRes.stats.statusCounts || {},
        });
      }
    } catch (e) {
      setOrders([]);
      setError(e.message || "Failed to load orders");
      showNotification(e.message || "Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, currentPage, itemsPerPage, statusFilter, searchTerm, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelOrder = useCallback(
    async (orderId) => {
      if (!window.confirm("Are you sure you want to cancel this order?")) return;

      try {
        await ordersApi.cancelOrder(orderId);
        showNotification("Order cancelled successfully", "success");
        await fetchData();
      } catch (e) {
        showNotification(e.message || "Failed to cancel order", "error");
      }
    },
    [fetchData, showNotification],
  );

  const summaryCards = useMemo(() => {
    const counts = orderStats.statusCounts || {};
    return [
      { label: "Total Orders", value: orderStats.totalOrders || totalOrders },
      { label: "Delivered", value: counts.delivered || 0 },
      { label: "Pending", value: (counts.pending || 0) + (counts.confirmed || 0) + (counts.processing || 0) },
      { label: "Total Spent", value: money(orderStats.totalSpent || 0), isMoney: true },
    ];
  }, [orderStats, totalOrders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "success" })}
      />

      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">Track, review and manage your purchases.</p>
        </motion.div>

        {!authLoading && !user ? (
          <div className="mt-8 bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-700 mb-4">Please login to view your orders.</p>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {summaryCards.map((card) => (
                <div key={card.label} className="bg-white rounded-xl shadow p-4">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5 mt-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by order number or item name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setStatusFilter(e.target.value);
                    }}
                    className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent min-w-[170px]"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-pink-500 mr-2" />
                <span className="text-gray-600">Loading your orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-10 text-center mt-6">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-800">No orders found</h3>
                <p className="text-gray-500 mt-1">
                  {error || (searchTerm || statusFilter
                    ? "No orders match your filters."
                    : "You have not placed any orders yet.")}
                </p>
                <Link
                  href="/shop"
                  className="inline-flex mt-5 px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                  {orders.map((order) => {
                    const canCancel = ["pending", "confirmed", "processing"].includes(order.status);
                    const key = order.id || order.orderId;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow p-5 border border-pink-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Order</p>
                            <p className="font-bold text-gray-900">#{order.orderId}</p>
                          </div>
                          <OrderStatusBadge status={order.status} />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-500">Total</p>
                            <p className="font-semibold text-gray-900">{money(order.totalAmount)}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-500">Payment</p>
                            <p className="font-semibold text-gray-900">{paymentMethodLabel(order.paymentMethod)}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center text-xs text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          {new Date(order.createdAt).toLocaleString()}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id || order.orderId);
                              setShowOrderDetails(true);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                          >
                            <Eye size={15} />
                            View Details
                          </button>

                          {canCancel ? (
                            <button
                              onClick={() => handleCancelOrder(order.id || order.orderId)}
                              className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalOrders}
                    itemsPerPage={itemsPerPage}
                    onPageChange={(page) => setCurrentPage(page)}
                    onItemsPerPageChange={(limit) => {
                      setCurrentPage(1);
                      setItemsPerPage(limit);
                    }}
                    itemsPerPageOptions={[10, 20, 50, 100]}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Footer />

      <OrderDetailsModal
        orderId={selectedOrderId}
        isOpen={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        onCancelSuccess={fetchData}
      />
    </div>
  );
}
