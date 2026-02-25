"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Landmark,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Search,
  Filter,
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Loader,
  AlertCircle,
  X,
  User,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  ChevronDown,
  Mail,
  Phone,
  Trash2,
  Copy,
  FileSpreadsheet, // add this
} from "lucide-react";

import Pagination from "../../components/Pagination";
import Authorized from "@/app/components/Authorized";
import { toast } from "react-toastify";

const AdminOrders = () => {
  const token = localStorage.getItem("staffUserToken");
  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("staffUserToken")
        : null;

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [orderStats, setOrderStats] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    orderId: null,
  });
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const [selectedOrdersIds, setSelectedOrdersIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const selectAllRef = useRef(null);

  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationNote, setVerificationNote] = useState("");

  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [exportingExcel, setExportingExcel] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const currentPageIds = useMemo(() => orders.map((b) => b._id), [orders]);

  const selectedOnPageCount = useMemo(
    () => orders.filter((b) => selectedOrdersIds.includes(b._id)).length,
    [orders, selectedOrdersIds],
  );

  const allOnPageSelected =
    orders.length > 0 && selectedOnPageCount === orders.length;

  // Image utility functions
  const getImageSrc = (
    imageSrc,
    fallback = "https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams",
  ) => {
    if (!imageSrc) return fallback;

    const baseURL = API_BASE || "http://localhost:4000";

    // Handle old Railway URLs
    if (imageSrc.includes("railway.app")) {
      const filename = imageSrc.split("/images/")[1];
      if (filename) {
        return `${baseURL}/images/${filename}`;
      }
    }

    if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
      return imageSrc;
    }

    if (imageSrc.startsWith("/images/")) {
      return `${baseURL}${imageSrc}`;
    }

    if (
      !imageSrc.includes("/") &&
      /\.(jpg|jpeg|png|gif|webp)$/i.test(imageSrc)
    ) {
      return `${baseURL}/images/${imageSrc}`;
    }

    if (imageSrc.startsWith("images/")) {
      return `${baseURL}/${imageSrc}`;
    }

    return `${baseURL}/${imageSrc}`;
  };

  const handleImageError = (e) => {
    if (
      e.target.src !==
      "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image"
    ) {
      e.target.onerror = null;
      e.target.src = "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image";
    }
  };

  // Order status configuration
  const orderStatusConfig = {
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
      description: "Order is being processed",
    },
    confirmed: {
      label: "Confirmed",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: CheckCircle,
      description: "Order has been confirmed",
    },
    processing: {
      label: "Processing",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: Package,
      description: "Order is being prepared",
    },
    shipped: {
      label: "Shipped",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: Truck,
      description: "Order is on the way",
    },
    delivered: {
      label: "Delivered",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
      description: "Order has been delivered",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
      description: "Order has been cancelled",
    },
  };

  const paymentMethodConfig = {
    stripe: {
      label: "Card (Stripe)",
      icon: CreditCard,
      className: "bg-violet-50 text-violet-700 border-violet-200",
    },
    paypal: {
      label: "PayPal",
      icon: DollarSign,
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    cod: {
      label: "Cash on Delivery",
      icon: Truck,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    bank_transfer: {
      label: "Bank Transfer",
      icon: Landmark,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
  };

  const paymentStatusConfig = {
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    succeeded: {
      label: "Succeeded",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    },
  };

  const PaymentStatusBadge = ({ status }) => {
    const key = String(status || "").toLowerCase();
    const config = paymentStatusConfig[key] || {
      label: status || "N/A",
      className: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const PaymentMethodBadge = ({ method }) => {
    const key = String(method || "").toLowerCase();
    const config = paymentMethodConfig[key] || {
      label: method || "N/A",
      icon: CreditCard,
      className: "bg-gray-50 text-gray-700 border-gray-200",
    };

    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  // Show notification
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 4000);
  }, []);

  // Format date and time for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  // Fetch all orders (admin endpoint)
  const fetchOrders = useCallback(
    async (
      page = 1,
      search = "",
      status = "",
      date = "",
      paymentMethod = "",
    ) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
          ...(search && { search }),
          ...(status && { status }),
          ...(date && { date }),
          ...(paymentMethod && { paymentMethod }),
        });

        const response = await fetch(`${API_BASE}/admin/orders?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.success) {
          setOrders(data.orders);
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
          setTotalOrders(data.pagination.totalOrders);
        } else {
          showNotification("Failed to fetch orders", "error");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        showNotification("Error fetching orders", "error");
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, showNotification],
  );

  const handlePaymentMethodFilter = (method) => {
    setPaymentMethodFilter(method);
    setCurrentPage(1);
    fetchOrders(1, searchTerm, statusFilter, dateFilter, method);
  };

  // Fetch order statistics
  const fetchOrderStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setOrderStats(data.stats);
      } else {
        console.error("Failed to fetch stats:", data);
      }
    } catch (error) {
      console.error("Error fetching order stats:", error);
    }
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      console.log(`Updating order ${orderId} to status ${newStatus}`);

      const response = await fetch(
        `${API_BASE}/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();

      if (data.success) {
        showNotification(`Order status updated to ${newStatus}`, "success");
        // Update the order in the list
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                }
              : order,
          ),
        );
        // Update selected order if it's the same
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
        // Refresh stats
        fetchOrderStats();
      } else {
        showNotification(
          data.message || "Failed to update order status",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showNotification("Error updating order status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const verifyBankTransferPayment = async () => {
    if (!selectedOrder?._id) return;

    try {
      setVerifyingPayment(true);

      const response = await fetch(
        `${API_BASE}/admin/orders/${selectedOrder._id}/verify-bank-transfer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            note: verificationNote,
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to verify payment");
        return;
      }

      setSelectedOrder(data.order);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === data.order._id
            ? {
                ...order,
                status: data.order.status,
                paymentStatus: data.order.paymentStatus,
                paymentMeta: data.order.paymentMeta,
                updatedAt: data.order.updatedAt,
              }
            : order,
        ),
      );
      showNotification("Bank transfer payment verified", "success");
      fetchOrderStats();
      setShowOrderModal(false);
    } catch (error) {
      console.error("Error verifying bank transfer payment:", error);
      showNotification("Error verifying bank transfer payment", "error");
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Delete order function
  const deleteOrder = async (orderId) => {
    try {
      setDeletingOrder(true);

      const response = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Order deleted successfully", "success");
        // Remove order from the list
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== orderId),
        );
        // Close modal if the deleted order was open
        if (selectedOrder && selectedOrder._id === orderId) {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }
        // Refresh stats
        fetchOrderStats();
        // Close delete confirmation
        setDeleteConfirm({ show: false, orderId: null });
      } else {
        showNotification(data.message || "Failed to delete order", "error");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      showNotification("Error deleting order", "error");
    } finally {
      setDeletingOrder(false);
    }
  };

  // Delete all orders function
  const deleteAllOrders = async () => {
    try {
      setDeletingAll(true);

      const response = await fetch(
        `${API_BASE}/admin/orders/delete-all/confirm`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        showNotification(
          `Successfully deleted ${data.deletedCount} orders`,
          "success",
        );
        // Clear all orders from the list
        setOrders([]);
        // Close modal if open
        setShowOrderModal(false);
        setSelectedOrder(null);
        // Refresh stats
        fetchOrderStats();
        // Refresh orders list
        fetchOrders(
          1,
          searchTerm,
          statusFilter,
          dateFilter,
          paymentMethodFilter,
        );
        // Close delete all confirmation
        setDeleteAllConfirm(false);
      } else {
        showNotification(
          data.message || "Failed to delete all orders",
          "error",
        );
      }
    } catch (error) {
      console.error("Error deleting all orders:", error);
      showNotification("Error deleting all orders", "error");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleSelectOne = (orderId, checked) => {
    if (checked) {
      setSelectedOrdersIds((prev) => Array.from(new Set([...prev, orderId])));
    } else {
      setSelectedOrdersIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleSelectAllCurrentPage = (checked) => {
    if (checked) {
      setSelectedOrdersIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds])),
      );
    } else {
      setSelectedOrdersIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrdersIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedOrdersIds.length} selected Order(s)? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/admin/orders/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ids: selectedOrdersIds }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to bulk delete Order");
        return;
      }

      setSelectedOrdersIds([]);
      await fetchOrders(
        currentPage,
        searchTerm,
        statusFilter,
        dateFilter,
        paymentMethodFilter,
      );
      toast.success(data.message || "Bulk delete completed");
    } catch (error) {
      console.error("Error bulk deleting Order:", error);
      toast.error("Failed to bulk delete Order");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const getOrderStatusLabel = (status) => {
    const key = String(status || "").toLowerCase();
    return orderStatusConfig[key]?.label || status || "N/A";
  };

  const getPaymentMethodLabel = (method) => {
    const key = String(method || "").toLowerCase();
    return paymentMethodConfig[key]?.label || method || "N/A";
  };

  const getPaymentStatusLabel = (status) => {
    const key = String(status || "").toLowerCase();
    return paymentStatusConfig[key]?.label || status || "N/A";
  };

  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatItemOptions = (selectedOptions = {}) => {
    return Object.entries(selectedOptions || {})
      .filter(([k, v]) => k && v)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");
  };

  const buildItemsSummary = (items = []) => {
    return (items || [])
      .map((item) => {
        const name = item?.name || "Item";
        const qty = toNumber(item?.quantity);
        const optionsText = formatItemOptions(item?.selectedOptions);
        return `${name} x${qty}${optionsText ? ` (${optionsText})` : ""}`;
      })
      .join(" | ");
  };

  const exportVisibleOrdersToExcel = async () => {
    if (!orders.length) {
      toast.info("No orders to export on this page.");
      return;
    }

    setExportingExcel(true);
    try {
      const XLSXModule = await import("xlsx");
      const XLSX = XLSXModule.default ?? XLSXModule;

      const rows = orders.map((order) => {
        const dt = formatDateTime(order?.createdAt);
        const subtotal = toNumber(order?.amount?.subtotal);
        const shipping = toNumber(order?.amount?.shipping);
        const tax = toNumber(order?.amount?.tax);
        const total = toNumber(order?.amount?.total ?? order?.totalAmount);

        const itemsCount = order?.items?.length || 0;
        const totalQty = (order?.items || []).reduce(
          (sum, item) => sum + toNumber(item?.quantity),
          0,
        );

        return {
          "Order ID": order?.orderId || "",
          "Order Date": dt?.date || "",
          "Order Time": dt?.time || "",
          "Customer Name": order?.shippingAddress?.name || "",
          "Customer Email": order?.shippingAddress?.email || "",
          "Customer Phone": order?.shippingAddress?.phone || "",
          City: order?.shippingAddress?.city || "",
          Country: order?.shippingAddress?.country || "",
          "Zip Code": order?.shippingAddress?.zipCode || "",
          "Order Status": getOrderStatusLabel(order?.status),
          "Payment Method": getPaymentMethodLabel(order?.paymentMethod),
          "Payment Status": getPaymentStatusLabel(order?.paymentStatus),
          "Items Count": itemsCount,
          "Total Quantity": totalQty,
          "Items Summary": buildItemsSummary(order?.items),
          "Subtotal (USD)": subtotal,
          "Shipping (USD)": shipping,
          "Tax (USD)": tax,
          "Total (USD)": total,
          "Receipt Uploaded": order?.paymentMeta?.receiptImageUrl
            ? "Yes"
            : "No",
          "Receipt URL": order?.paymentMeta?.receiptImageUrl || "",
          "Created At (ISO)": order?.createdAt
            ? new Date(order.createdAt).toISOString()
            : "",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      const headers = Object.keys(rows[0] || {});
      worksheet["!cols"] = headers.map((header) => {
        const maxLen = Math.max(
          header.length,
          ...rows.map((r) => String(r[header] ?? "").length),
        );
        return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
      });

      if (worksheet["!ref"]) {
        worksheet["!autofilter"] = { ref: worksheet["!ref"] };
      }

      const infoSheet = XLSX.utils.aoa_to_sheet([
        ["Export Name", "Orders - Current Visible View"],
        ["Generated At", new Date().toLocaleString()],
        ["Search Filter", searchTerm || "All"],
        ["Status Filter", statusFilter || "All"],
        ["Date Filter", dateFilter || "All"],
        ["Payment Method Filter", paymentMethodFilter || "All"],
        ["Current Page", `${currentPage} of ${totalPages}`],
        ["Rows Exported", String(orders.length)],
        ["Items Per Page", String(itemsPerPage)],
      ]);
      infoSheet["!cols"] = [{ wch: 24 }, { wch: 55 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      XLSX.utils.book_append_sheet(workbook, infoSheet, "Export_Info");

      const stamp = new Date().toISOString().replace(/:/g, "-").slice(0, 19);
      const fileName = `orders-current-view-page-${currentPage}-${stamp}.xlsx`;

      XLSX.writeFile(workbook, fileName, { compression: true });
      toast.success(`Exported ${rows.length} order(s) to Excel.`);
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel file.");
    } finally {
      setExportingExcel(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [fetchOrders, fetchOrderStats]);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchOrders(1, term, statusFilter, dateFilter, paymentMethodFilter);
  };

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      selectedOnPageCount > 0 && !allOnPageSelected;
  }, [selectedOnPageCount, allOnPageSelected]);

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchOrders(1, searchTerm, status, dateFilter, paymentMethodFilter);
  };

  // Handle date filter
  const handleDateFilter = (date) => {
    setDateFilter(date);
    setCurrentPage(1);
    fetchOrders(1, searchTerm, statusFilter, date, paymentMethodFilter);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchOrders(
      page,
      searchTerm,
      statusFilter,
      dateFilter,
      paymentMethodFilter,
    );
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    // fetchOrders will be called automatically due to useEffect dependency on itemsPerPage
  };

  // View order details
  const viewOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setSelectedOrder(data.order);
        setVerificationNote(
          data.order?.paymentMeta?.receiptVerificationNote || "",
        );

        setShowOrderModal(true);
      } else {
        showNotification("Failed to fetch order details", "error");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      showNotification("Error fetching order details", "error");
    }
  };

  // Order Status Badge Component
  const OrderStatusBadge = ({ status, onClick = null, disabled = false }) => {
    const config = orderStatusConfig[status] || orderStatusConfig.pending;
    const Icon = config.icon;

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color} ${
          onClick && !disabled ? "hover:opacity-80 cursor-pointer" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <Icon size={14} className="mr-1" />
        {config.label}
      </button>
    );
  };

  // FIXED: Status Update Dropdown with all options
  const StatusUpdateDropdown = ({ currentStatus, orderId, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const statusOptions = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (isOpen && !event.target.closest(".status-dropdown")) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div className="relative status-dropdown">
        <OrderStatusBadge
          status={currentStatus}
          onClick={() => setIsOpen(!isOpen)}
          disabled={updatingStatus}
        />

        {isOpen && !updatingStatus && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
            {statusOptions.map((status) => {
              const config = orderStatusConfig[status];
              const Icon = config.icon;

              return (
                <button
                  key={status}
                  onClick={() => {
                    if (status !== currentStatus) {
                      onUpdate(orderId, status);
                    }
                    setIsOpen(false);
                  }}
                  disabled={status === currentStatus}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center ${
                    status === currentStatus
                      ? "bg-gray-100 cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  }`}
                >
                  <Icon size={14} className="mr-2" />
                  <span>{config.label}</span>
                  {status === currentStatus && (
                    <span className="ml-auto text-xs text-gray-500">
                      (Current)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderOrderItemOptions = (selectedOptions = {}) => {
    const entries = Object.entries(selectedOptions || {}).filter(
      ([key, value]) => key && value,
    );

    if (entries.length === 0) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {entries.map(([key, value]) => (
          <span
            key={key}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
          >
            {key}: {value}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white max-w-md`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={() => setNotification({ message: "", type: "" })}
            className="ml-2 hover:bg-white/20 p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Orders Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Orders Management
            </h2>
            <p className="text-gray-600">
              Manage and track all customer orders
            </p>
          </div>
          <div className="flex gap-2">
            <Authorized permission={"orders:delete"}>
              <button
                onClick={() => setDeleteAllConfirm(true)}
                disabled={loading || orders.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  orders.length === 0
                    ? "No orders to delete"
                    : "Delete all orders"
                }
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
            </Authorized>
            <button
              onClick={exportVisibleOrdersToExcel}
              disabled={loading || exportingExcel || orders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title={
                orders.length === 0
                  ? "No orders on current page to export"
                  : "Export current table view to Excel (.xlsx)"
              }
            >
              {exportingExcel ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {exportingExcel ? "Exporting..." : "Export Excel"}
            </button>

            <button
              onClick={() => {
                fetchOrders(
                  currentPage,
                  searchTerm,
                  statusFilter,
                  dateFilter,
                  paymentMethodFilter,
                );
                fetchOrderStats();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">
                {orderStats.totalOrders || 0}
              </p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orderStats.pendingOrders || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Orders</p>
              <p className="text-2xl font-bold text-green-600">
                {orderStats.completedOrders || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                ${orderStats.totalRevenue || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by order ID, customer, item or payment..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Status</option>
              {Object.entries(orderStatusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <CreditCard
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={paymentMethodFilter}
              onChange={(e) => handlePaymentMethodFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Payment Methods</option>
              <option value="stripe">Card (Stripe)</option>
              <option value="paypal">PayPal</option>
              <option value="cod">Cash on Delivery</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {selectedOrdersIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-rose-900">
            {selectedOrdersIds.length} order(s) selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedOrdersIds([])}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-white"
            >
              <X className="w-4 h-4" />
              Clear
            </button>

            <Authorized permission="orders:delete">
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {bulkDeleting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Selected
              </button>
            </Authorized>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="pl-3 py-3 text-left">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={(e) =>
                      handleSelectAllCurrentPage(e.target.checked)
                    }
                    disabled={loading || orders.length === 0}
                    className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                  Payment Method
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <Loader className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-500">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const dateTime = formatDateTime(order.createdAt);
                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="pl-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrdersIds.includes(order._id)}
                          onChange={(e) =>
                            handleSelectOne(order._id, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <div
                            className="text-sm font-medium text-gray-900 max-w-[95px] truncate"
                            title={`#${order.orderId}`}
                          >
                            {(() => {
                              const id = String(order.orderId ?? "");
                              return `#${id.length > 8 ? `${id.slice(0, 8)}...` : id}`;
                            })()}
                          </div>
                          <button
                            onClick={() => handleCopyCode(order?.orderId)}
                            className="text-gray-400 hover:text-pink-500 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {order.shippingAddress?.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.shippingAddress?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.items?.length || 0} items
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items?.reduce(
                            (sum, item) => sum + (item.quantity || 0),
                            0,
                          )}{" "}
                          qty
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${order.amount?.total || order.totalAmount || "0.00"}
                        </div>
                        {/* <div className="text-sm text-gray-500">
                          {order.paymentMethod || "N/A"}
                        </div> */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Authorized permission={"orders:update"}>
                          <StatusUpdateDropdown
                            currentStatus={order.status}
                            orderId={order._id}
                            onUpdate={updateOrderStatus}
                          />
                        </Authorized>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentMethodBadge method={order.paymentMethod} />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {dateTime.date}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dateTime.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewOrderDetails(order._id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <Authorized permission={"orders:delete"}>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  show: true,
                                  orderId: order._id,
                                })
                              }
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </Authorized>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalOrders}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Order Details #{selectedOrder.orderId}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateTime(selectedOrder.createdAt).date} at{" "}
                  {formatDateTime(selectedOrder.createdAt).time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setDeleteConfirm({ show: true, orderId: selectedOrder._id })
                  }
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Order
                </button>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setVerificationNote("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Status & Info */}
              <div className="flex items-center justify-between">
                <StatusUpdateDropdown
                  currentStatus={selectedOrder.status}
                  orderId={selectedOrder._id}
                  onUpdate={updateOrderStatus}
                />
                <div className="text-right">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-700">
                    {
                      formatDateTime(
                        selectedOrder.updatedAt || selectedOrder.createdAt,
                      ).date
                    }{" "}
                    at{" "}
                    {
                      formatDateTime(
                        selectedOrder.updatedAt || selectedOrder.createdAt,
                      ).time
                    }
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Customer Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="text-gray-400" size={16} />
                      <span className="font-medium">
                        {selectedOrder.shippingAddress?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">
                        {selectedOrder.shippingAddress?.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">
                        {selectedOrder.shippingAddress?.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Shipping Address
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MapPin className="text-gray-400 mt-1" size={16} />
                      <div>
                        <p className="font-medium">
                          {selectedOrder.shippingAddress?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.shippingAddress?.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.shippingAddress?.city},{" "}
                          {selectedOrder.shippingAddress?.country}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.shippingAddress?.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {item.image ? (
                          <img
                            src={getImageSrc(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                            <Package size={20} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          Price: ${item.price}
                        </p>
                        {renderOrderItemOptions(item.selectedOptions)}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">
                      Payment Information
                    </h3>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <PaymentMethodBadge
                          method={selectedOrder.paymentMethod}
                        />
                        <p className="text-xs text-gray-500">
                          Reference:{" "}
                          {selectedOrder.paymentMeta?.bankTransferReference ||
                            selectedOrder.orderId ||
                            "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">
                          Payment Status
                        </p>
                        <PaymentStatusBadge
                          status={selectedOrder.paymentStatus}
                        />
                      </div>
                    </div>
                  </div>

                  {selectedOrder.paymentMethod === "bank_transfer" && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-800">
                          Bank Transfer Receipt
                        </h4>
                        {selectedOrder.paymentMeta?.receiptUploadedAt && (
                          <span className="text-xs text-gray-500">
                            Uploaded{" "}
                            {
                              formatDateTime(
                                selectedOrder.paymentMeta.receiptUploadedAt,
                              ).date
                            }{" "}
                            {
                              formatDateTime(
                                selectedOrder.paymentMeta.receiptUploadedAt,
                              ).time
                            }
                          </span>
                        )}
                      </div>

                      {selectedOrder.paymentMeta?.receiptImageUrl ? (
                        <div className="space-y-3">
                          <a
                            href={selectedOrder.paymentMeta.receiptImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={selectedOrder.paymentMeta.receiptImageUrl}
                              alt={`Receipt for order ${selectedOrder.orderId}`}
                              className="w-full max-h-[420px] object-contain rounded-lg border border-gray-200 bg-white"
                            />
                          </a>
                          <a
                            href={selectedOrder.paymentMeta.receiptImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Open full image
                          </a>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                          Customer has not uploaded a receipt yet.
                        </div>
                      )}

                      {selectedOrder.paymentStatus === "pending" && (
                        <Authorized permission={"orders:update"}>
                          <div className="border-t border-gray-200 pt-4 space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Verification Note (Optional)
                            </label>
                            <textarea
                              value={verificationNote}
                              onChange={(e) =>
                                setVerificationNote(e.target.value)
                              }
                              rows={3}
                              maxLength={500}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                              placeholder="Optional internal note while verifying this payment..."
                            />
                            <button
                              onClick={verifyBankTransferPayment}
                              disabled={
                                verifyingPayment ||
                                !selectedOrder.paymentMeta?.receiptImageUrl
                              }
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {verifyingPayment ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : null}
                              {verifyingPayment
                                ? "Verifying..."
                                : "Verify Payment as Succeeded"}
                            </button>
                          </div>
                        </Authorized>
                      )}

                      {selectedOrder.paymentStatus === "succeeded" &&
                        selectedOrder.paymentMeta?.receiptVerifiedAt && (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                            <p className="font-semibold">Payment verified</p>
                            <p className="mt-1">
                              Verified at{" "}
                              {
                                formatDateTime(
                                  selectedOrder.paymentMeta.receiptVerifiedAt,
                                ).date
                              }{" "}
                              {
                                formatDateTime(
                                  selectedOrder.paymentMeta.receiptVerifiedAt,
                                ).time
                              }
                            </p>
                            {selectedOrder.paymentMeta?.receiptVerifiedBy
                              ?.email && (
                              <p>
                                Verified by:{" "}
                                {
                                  selectedOrder.paymentMeta.receiptVerifiedBy
                                    .email
                                }
                              </p>
                            )}
                            {selectedOrder.paymentMeta
                              ?.receiptVerificationNote && (
                              <p>
                                Note:{" "}
                                {
                                  selectedOrder.paymentMeta
                                    .receiptVerificationNote
                                }
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">
                        ${selectedOrder.amount?.subtotal || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping:</span>
                      <span className="text-sm font-medium">
                        ${selectedOrder.amount?.shipping || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax:</span>
                      <span className="text-sm font-medium">
                        ${selectedOrder.amount?.tax || "0.00"}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">
                        $
                        {selectedOrder.amount?.total ||
                          selectedOrder.totalAmount ||
                          "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete Order?
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this order? This action cannot be
              undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, orderId: null })}
                disabled={deletingOrder}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOrder(deleteConfirm.orderId)}
                disabled={deletingOrder}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingOrder ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete ALL Orders Confirmation Modal */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              ⚠️ Delete ALL Orders?
            </h3>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm font-semibold text-center mb-2">
                EXTREME CAUTION REQUIRED
              </p>
              <p className="text-red-700 text-sm text-center">
                This will permanently delete{" "}
                <span className="font-bold">
                  {totalOrders} order{totalOrders !== 1 ? "s" : ""}
                </span>{" "}
                from the database.
              </p>
            </div>

            <p className="text-gray-600 text-center mb-6">
              This action is{" "}
              <span className="font-bold text-red-600">IRREVERSIBLE</span> and
              will remove all order data permanently. Are you absolutely sure?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAllConfirm(false)}
                disabled={deletingAll}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllOrders}
                disabled={deletingAll}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingAll ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete All Orders
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
