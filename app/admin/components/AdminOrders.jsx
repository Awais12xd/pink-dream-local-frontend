'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
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
  Trash2
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import Authorized from '@/app/components/Authorized';

const AdminOrders = () => {
      const token = localStorage.getItem("staffUserToken");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [orderStats, setOrderStats] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, orderId: null });
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Image utility functions
  const getImageSrc = (imageSrc, fallback = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams') => {
    if (!imageSrc) return fallback
    
    const baseURL = API_BASE || 'http://localhost:4000'
    
    // Handle old Railway URLs
    if (imageSrc.includes('railway.app')) {
      const filename = imageSrc.split('/images/')[1]
      if (filename) {
        return `${baseURL}/images/${filename}`
      }
    }
    
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc
    }
    
    if (imageSrc.startsWith('/images/')) {
      return `${baseURL}${imageSrc}`
    }
    
    if (!imageSrc.includes('/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(imageSrc)) {
      return `${baseURL}/images/${imageSrc}`
    }
    
    if (imageSrc.startsWith('images/')) {
      return `${baseURL}/${imageSrc}`
    }
    
    return `${baseURL}/${imageSrc}`
  }

  const handleImageError = (e) => {
    if (e.target.src !== 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image') {
      e.target.onerror = null
      e.target.src = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image'
    }
  }

  // Order status configuration
  const orderStatusConfig = {
    pending: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      description: 'Order is being processed'
    },
    confirmed: {
      label: 'Confirmed',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CheckCircle,
      description: 'Order has been confirmed'
    },
    processing: {
      label: 'Processing',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Package,
      description: 'Order is being prepared'
    },
    shipped: {
      label: 'Shipped',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: Truck,
      description: 'Order is on the way'
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      description: 'Order has been delivered'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      description: 'Order has been cancelled'
    }
  };

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  }, []);

  // Format date and time for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  // Fetch all orders (admin endpoint)
  const fetchOrders = useCallback(async (page = 1, search = '', status = '', date = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(date && { date })
      });

      console.log('Fetching orders with params:', params.toString());

      const response = await fetch(`${API_BASE}/admin/orders?${params}` , {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      const data = await response.json();

      console.log('Orders response:', data);

      if (data.success) {
        setOrders(data.orders);
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalOrders(data.pagination.totalOrders);
      } else {
        showNotification('Failed to fetch orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification('Error fetching orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, showNotification]);

  // Fetch order statistics
  const fetchOrderStats = useCallback(async () => {
    try {
      console.log('Fetching order stats...');
      const response = await fetch(`${API_BASE}/admin/orders/stats` , {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      const data = await response.json();

      console.log('Stats response:', data);

      if (data.success) {
        setOrderStats(data.stats);
        console.log('Order stats updated:', data.stats);
      } else {
        console.error('Failed to fetch stats:', data);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      console.log(`Updating order ${orderId} to status ${newStatus}`);
      
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      console.log('Status update response:', data);

      if (data.success) {
        showNotification(`Order status updated to ${newStatus}`, 'success');
        // Update the order in the list
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        // Update selected order if it's the same
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
        // Refresh stats
        fetchOrderStats();
      } else {
        showNotification(data.message || 'Failed to update order status', 'error');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification('Error updating order status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete order function
  const deleteOrder = async (orderId) => {
    try {
      setDeletingOrder(true);
      console.log(`Deleting order ${orderId}`);
      
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Delete response:', data);

      if (data.success) {
        showNotification('Order deleted successfully', 'success');
        // Remove order from the list
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
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
        showNotification(data.message || 'Failed to delete order', 'error');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showNotification('Error deleting order', 'error');
    } finally {
      setDeletingOrder(false);
    }
  };

  // Delete all orders function
  const deleteAllOrders = async () => {
    try {
      setDeletingAll(true);
      console.log('Deleting ALL orders');
      
      const response = await fetch(`${API_BASE}/admin/orders/delete-all/confirm`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Delete all response:', data);

      if (data.success) {
        showNotification(`Successfully deleted ${data.deletedCount} orders`, 'success');
        // Clear all orders from the list
        setOrders([]);
        // Close modal if open
        setShowOrderModal(false);
        setSelectedOrder(null);
        // Refresh stats
        fetchOrderStats();
        // Refresh orders list
        fetchOrders(1, searchTerm, statusFilter, dateFilter);
        // Close delete all confirmation
        setDeleteAllConfirm(false);
      } else {
        showNotification(data.message || 'Failed to delete all orders', 'error');
      }
    } catch (error) {
      console.error('Error deleting all orders:', error);
      showNotification('Error deleting all orders', 'error');
    } finally {
      setDeletingAll(false);
    }
  };

  // Load initial data
  useEffect(() => {
    console.log('Loading initial data...');
    fetchOrders();
    fetchOrderStats();
  }, [fetchOrders, fetchOrderStats]);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchOrders(1, term, statusFilter, dateFilter);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchOrders(1, searchTerm, status, dateFilter);
  };

  // Handle date filter
  const handleDateFilter = (date) => {
    setDateFilter(date);
    setCurrentPage(1);
    fetchOrders(1, searchTerm, statusFilter, date);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchOrders(page, searchTerm, statusFilter, dateFilter);
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
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}` , {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      const data = await response.json();

      if (data.success) {
        setSelectedOrder(data.order);
        setShowOrderModal(true);
      } else {
        showNotification('Failed to fetch order details', 'error');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      showNotification('Error fetching order details', 'error');
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
          onClick && !disabled ? 'hover:opacity-80 cursor-pointer' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Icon size={14} className="mr-1" />
        {config.label}
      </button>
    );
  };

  // FIXED: Status Update Dropdown with all options
  const StatusUpdateDropdown = ({ currentStatus, orderId, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (isOpen && !event.target.closest('.status-dropdown')) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
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
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px]">
            {statusOptions.map(status => {
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
                    status === currentStatus ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  <Icon size={14} className="mr-2" />
                  <span>{config.label}</span>
                  {status === currentStatus && (
                    <span className="ml-auto text-xs text-gray-500">(Current)</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white max-w-md`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="flex-1">{notification.message}</span>
          <button onClick={() => setNotification({ message: '', type: '' })} className="ml-2 hover:bg-white/20 p-1 rounded">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Orders Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
            <p className="text-gray-600">Manage and track all customer orders</p>
          </div>
          <div className="flex gap-2">
         <Authorized permission={"orders:delete"}>
            
            <button
              onClick={() => setDeleteAllConfirm(true)}
              disabled={loading || orders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={orders.length === 0 ? 'No orders to delete' : 'Delete all orders'}
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
            </Authorized>
            <button
              onClick={() => {
                fetchOrders(currentPage, searchTerm, statusFilter, dateFilter);
                fetchOrderStats();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
              <p className="text-2xl font-bold text-gray-800">{orderStats.totalOrders || 0}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600">{orderStats.pendingOrders || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Orders</p>
              <p className="text-2xl font-bold text-green-600">{orderStats.completedOrders || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">${orderStats.totalRevenue || 0}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Status</option>
              {Object.entries(orderStatusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Loader className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-500">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const dateTime = formatDateTime(order.createdAt);
                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {order.shippingAddress?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.shippingAddress?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                        <div className="text-sm text-gray-500">
                          {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)} qty
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${order.amount?.total || order.totalAmount || '0.00'}
                        </div>
                        <div className="text-sm text-gray-500">{order.paymentMethod || 'N/A'}</div>
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
                        <div className="text-sm text-gray-900">{dateTime.date}</div>
                        <div className="text-sm text-gray-500">{dateTime.time}</div>
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
                            onClick={() => setDeleteConfirm({ show: true, orderId: order._id })}
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
                  <td colSpan="7" className="px-6 py-12 text-center">
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
                  {formatDateTime(selectedOrder.createdAt).date} at {formatDateTime(selectedOrder.createdAt).time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteConfirm({ show: true, orderId: selectedOrder._id })}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Order
                </button>
                <button 
                  onClick={() => setShowOrderModal(false)} 
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
                    {formatDateTime(selectedOrder.updatedAt || selectedOrder.createdAt).date} at {formatDateTime(selectedOrder.updatedAt || selectedOrder.createdAt).time}
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="text-gray-400" size={16} />
                      <span className="font-medium">{selectedOrder.shippingAddress?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">{selectedOrder.shippingAddress?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">{selectedOrder.shippingAddress?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MapPin className="text-gray-400 mt-1" size={16} />
                      <div>
                        <p className="font-medium">{selectedOrder.shippingAddress?.name}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.address}</p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.country}
                        </p>
                        <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.zipCode}</p>
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
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
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
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-600">Price: ${item.price}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CreditCard className="text-gray-400 mt-1" size={16} />
                      <div>
                        <p className="font-medium">{selectedOrder.paymentMethod || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Status: {selectedOrder.paymentStatus || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">${selectedOrder.amount?.subtotal || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping:</span>
                      <span className="text-sm font-medium">${selectedOrder.amount?.shipping || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax:</span>
                      <span className="text-sm font-medium">${selectedOrder.amount?.tax || '0.00'}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">${selectedOrder.amount?.total || selectedOrder.totalAmount || '0.00'}</span>
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
              Are you sure you want to delete this order? This action cannot be undone.
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
                This will permanently delete <span className="font-bold">{totalOrders} order{totalOrders !== 1 ? 's' : ''}</span> from the database.
              </p>
            </div>
            
            <p className="text-gray-600 text-center mb-6">
              This action is <span className="font-bold text-red-600">IRREVERSIBLE</span> and will remove all order data permanently. Are you absolutely sure?
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