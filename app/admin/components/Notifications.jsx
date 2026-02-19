"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Bell,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingBag,
  FileText,
  Users,
  Tag,
  Settings,
  Mail,
  User,
  Clock,
  Check,
} from "lucide-react";
import { useNotifications } from "@/app/context/NotificationContext";
import { toast } from "react-toastify";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const severityConfig = {
  info: { label: "Info", color: "bg-blue-100 text-blue-800", icon: Info },
  high: {
    label: "High",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    color: "bg-red-100 text-red-800",
    icon: AlertCircle,
  },
};

const getTypeIcon = (type = "") => {
  const category = type.split(".")[0];
  switch (category) {
    case "order":
      return ShoppingBag;
    case "product":
      return Package;
    case "blog":
      return FileText;
    case "user":
      return Users;
    case "promo":
      return Tag;
    case "settings":
      return Settings;
    case "contact":
      return Mail;
    default:
      return Bell;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const formatFullDate = (dateString) =>
  new Date(dateString).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function NotificationsManager() {
  const { setUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("all"); // all | unread | read

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [notification, setNotification] = useState({ message: "", type: "" });
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectScope, setSelectScope] = useState("all"); // all | unread | read
  const selectAllRef = useRef(null);

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    mode: "single", // single | bulk
    id: null,
    count: 0,
  });

  const staffUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("staffUserData") || "null");
    } catch {
      return null;
    }
  }, []);
  const currentStaffId = staffUser?.id;

  const notificationTypes = [
    "blog",
    "blogCategories",
    "product",
    "category",
    "promoCode",
    "payment",
    "order",
    "staff",
    "role",
    "setting",
  ];

  const isRead = (n) =>
    (n.readBy || []).some((id) => String(id) === String(currentStaffId));

  const getIdsByScope = (scope) => {
    if (scope === "read") {
      return notifications.filter((n) => isRead(n)).map((n) => n._id);
    }
    if (scope === "unread") {
      return notifications.filter((n) => !isRead(n)).map((n) => n._id);
    }
    return notifications.map((n) => n._id); // all
  };

  const handleSelectScopeChange = (scope) => {
    setSelectScope(scope);
    setSelectedIds(getIdsByScope(scope)); // immediate select by scope
  };

  const showNotificationToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("staffUserToken");
      const params = new URLSearchParams();
      params.set("page", currentPage);
      params.set("limit", itemsPerPage);
      params.set("read", readFilter);

      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (severityFilter) params.set("severity", severityFilter);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(
        `${API_BASE}/admin/notifications?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();

      if (data.success) {
        setNotifications(data.items || []);
        setTotal(data.total || 0);
        setUnreadTotal(data.unreadTotal || 0);
        setUnreadCount(data.unreadTotal || 0);
      } else {
        setNotifications([]);
        setTotal(0);
        setUnreadTotal(0);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
      setNotifications([]);
      setTotal(0);
      setUnreadTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, itemsPerPage, severityFilter, typeFilter, readFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchNotifications();
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n._id));
    setSelectedIds((prev) => prev.filter((id) => currentIds.has(id)));
  }, [notifications]);

  const selectedOnPageCount = useMemo(
    () => notifications.filter((n) => selectedIds.includes(n._id)).length,
    [notifications, selectedIds],
  );

  const allOnPageSelected =
    notifications.length > 0 && selectedOnPageCount === notifications.length;

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      selectedOnPageCount > 0 && !allOnPageSelected;
  }, [selectedOnPageCount, allOnPageSelected]);

  // useEffect(() => {
  //   if (!selectAllRef.current) return;
  //   selectAllRef.current.indeterminate =
  //     selectedSelectableCount > 0 && !allSelectableSelected;
  // }, [selectedSelectableCount, allSelectableSelected]);

  const toggleSelectAll = (checked) => {
    if (checked) {
      // Direct checkbox click => select all visible notifications
      setSelectScope("all");
      setSelectedIds(notifications.map((n) => n._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, id])));
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("staffUserToken");
      const res = await fetch(`${API_BASE}/admin/notifications/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [id] }),
      });

      const data = await res.json();
      if (!data.success) return;

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id && !isRead(n)
            ? { ...n, readBy: [...(n.readBy || []), currentStaffId] }
            : n,
        ),
      );
      setUnreadTotal((c) => Math.max(0, c - 1));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const markAllFilteredAsRead = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("staffUserToken");
      const res = await fetch(`${API_BASE}/admin/notifications/read-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: searchTerm,
          severity: severityFilter,
          type: typeFilter,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(
          data.message || "Failed to mark all read",
          "error",
        );
        return;
      }

      await fetchNotifications();
      toast.success(
        `Marked ${data.modifiedCount || 0} notification(s) as read`,
      );
    } catch (e) {
      console.error("Failed to mark all read", e);
      toast.error("Failed to mark all read", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const requestDeleteSingle = (id) => {
    setDeleteConfirm({ show: true, mode: "single", id, count: 1 });
  };

  const requestDeleteBulk = () => {
    if (!selectedIds.length) return;
    setDeleteConfirm({
      show: true,
      mode: "bulk",
      id: null,
      count: selectedIds.length,
    });
  };

  const executeDelete = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("staffUserToken");

      if (deleteConfirm.mode === "single") {
        const res = await fetch(
          `${API_BASE}/admin/notifications/${deleteConfirm.id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (!data.success) {
          toast.error(data.message || "Failed to delete", "error");
          return;
        }
        toast.success("Notification deleted");
      } else {
        const res = await fetch(`${API_BASE}/admin/notifications/delete-bulk`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: selectedIds }),
        });
        const data = await res.json();

        if (!data.success) {
          toast.error(data.message || "Failed bulk delete", "error");
          return;
        }

        setSelectedIds([]);
        toast.success(
          `Deleted ${data.deletedCount || 0} notification(s)`,
        );
      }

      setDeleteConfirm({ show: false, mode: "single", id: null, count: 0 });
      await fetchNotifications();
    } catch (e) {
      console.error("Failed delete", e);
      toast.error("Failed to delete notification(s)", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const viewDetails = (n) => {
    setSelectedNotification(n);
    setShowDetailModal(true);
    if (!isRead(n)) markAsRead(n._id);
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      {notification.message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          <CheckCircle size={20} />
          <span>{notification.message}</span>
          <button onClick={() => setNotification({ message: "", type: "" })}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
            <p className="text-gray-600">View and manage recent activities</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={markAllFilteredAsRead}
              disabled={actionLoading || unreadTotal === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
            >
              <Check size={16} />
              <span>Mark Filtered Read</span>
            </button>
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs sm:text-sm text-gray-600">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs sm:text-sm text-gray-600">Unread</p>
          <p className="text-xl sm:text-2xl font-bold text-pink-600">
            {unreadTotal}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs sm:text-sm text-gray-600">Critical (page)</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">
            {notifications.filter((n) => n.severity === "critical").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs sm:text-sm text-gray-600">Today (page)</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {
              notifications.filter((n) => {
                const today = new Date().toDateString();
                return new Date(n.createdAt).toDateString() === today;
              }).length
            }
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white text-sm"
            >
              <option value="">All Severity</option>
              <option value="info">Info</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="relative">
            <Bell
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white text-sm capitalize"
            >
              <option value="">All Types</option>
              {notificationTypes.map((type) => (
                <option key={type} value={type} className="capitalize">
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Eye
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white text-sm"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 border border-pink-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-medium text-gray-700">
              {selectedIds.length} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={requestDeleteBulk}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 text-sm"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <select
                      value={selectScope}
                      onChange={(e) => handleSelectScopeChange(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white normal-case"
                    >
                      <option value="all">All</option>
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                    </select>
                  </div>
                </th>

                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notification
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-pink-500 mx-auto mb-2" />
                    <p className="text-gray-500">Loading notifications...</p>
                  </td>
                </tr>
              ) : notifications.length > 0 ? (
                notifications.map((n) => {
                  const TypeIcon = getTypeIcon(n.type);
                  const severityCfg =
                    severityConfig[n.severity] || severityConfig.info;
                  const SeverityIcon = severityCfg.icon;
                  const read = isRead(n);

                  return (
                    <tr
                      key={n._id}
                      className={`hover:bg-gray-50 transition-colors ${!read ? "bg-pink-50/30" : ""}`}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(n._id)}
                          onChange={(e) =>
                            toggleSelectOne(n._id, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${!read ? "bg-pink-100" : "bg-gray-100"}`}
                          >
                            <TypeIcon
                              size={16}
                              className={
                                !read ? "text-pink-600" : "text-gray-500"
                              }
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-medium truncate ${!read ? "text-gray-900" : "text-gray-600"}`}
                              >
                                {n.title}
                              </p>
                              {!read && (
                                <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate max-w-xs sm:max-w-sm md:max-w-md">
                              {n.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1 sm:hidden">
                              <span className="text-xs text-gray-400 capitalize">
                                {n.type.replace(".", " · ")}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs ${severityCfg.color}`}
                              >
                                {severityCfg.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="hidden md:table-cell px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">
                          {n.type.replace(".", " · ")}
                        </span>
                      </td>

                      <td className="hidden sm:table-cell px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severityCfg.color}`}
                        >
                          <SeverityIcon size={12} />
                          {severityCfg.label}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(n.createdAt)}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => viewDetails(n)}
                            className="p-1.5 sm:p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>

                          {!read && (
                            <button
                              onClick={() => markAsRead(n._id)}
                              className="p-1.5 sm:p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark as Read"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => requestDeleteSingle(n._id)}
                            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Notification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>of {total} entries</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2)
                      page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-pink-500 text-white"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Notification Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                {(() => {
                  const TypeIcon = getTypeIcon(selectedNotification.type);
                  return (
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <TypeIcon size={24} className="text-pink-600" />
                    </div>
                  );
                })()}
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {selectedNotification.title}
                  </h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {selectedNotification.type.replace(".", " · ")}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Severity</p>
                  {(() => {
                    const cfg =
                      severityConfig[selectedNotification.severity] ||
                      severityConfig.info;
                    const Icon = cfg.icon;
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}
                      >
                        <Icon size={12} />
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Time</p>
                  <p className="text-gray-800">
                    {formatFullDate(selectedNotification.createdAt)}
                  </p>
                </div>

                {selectedNotification.actor?.email && (
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">Actor</p>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <span className="text-gray-800">
                        {selectedNotification.actor.email}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        ({selectedNotification.actor.kind})
                      </span>
                    </div>
                  </div>
                )}

                {selectedNotification.target?.label && (
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">Target</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800">
                        {selectedNotification.target.label}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        ({selectedNotification.target.kind})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Delete
              </h3>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-700">
                {deleteConfirm.mode === "single"
                  ? "Are you sure you want to delete this notification?"
                  : `Are you sure you want to delete ${deleteConfirm.count} selected notification(s)?`}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="p-5 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    show: false,
                    mode: "single",
                    id: null,
                    count: 0,
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 text-sm"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
