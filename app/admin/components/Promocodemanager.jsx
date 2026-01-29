import React, { useState, useEffect } from 'react';
import { 
  Percent, Plus, Edit2, Trash2, Eye, EyeOff, Calendar, 
  TrendingUp, Users, DollarSign, Tag, Search, Filter,
  Check, X, AlertCircle, Copy, BarChart3, RefreshCw,
  Gift, Clock, Target, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PromoCodeManager = () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  
  // States
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState(null);

  // Form state for new/edit promo code
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchaseAmount: '0',
    maxDiscountAmount: '',
    usageLimit: '',
    usagePerUser: '1',
    validFrom: '',
    validUntil: '',
    isActive: true
  });

  // Fetch promo codes
  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/api/promo-codes/all?status=${filterStatus}&search=${searchTerm}`
      );
      const data = await response.json();
      
      if (data.success) {
        setPromoCodes(data.promoCodes);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/promo-codes/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
    fetchStats();
  }, [filterStatus, searchTerm]);

  // Create promo code
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    
    try {
      // Validate dates
      if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
        alert('End date must be after start date');
        return;
      }

      const response = await fetch(`${API_BASE}/api/promo-codes/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
          minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          usagePerUser: parseInt(formData.usagePerUser) || 1
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Promo code created successfully!');
        setShowAddModal(false);
        resetForm();
        fetchPromoCodes();
        fetchStats();
      } else {
        alert(data.message || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      alert('Failed to create promo code');
    }
  };

  // Update promo code
  const handleUpdatePromo = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/api/promo-codes/update/${selectedPromo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
          minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          usagePerUser: parseInt(formData.usagePerUser) || 1
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Promo code updated successfully!');
        setShowEditModal(false);
        setSelectedPromo(null);
        resetForm();
        fetchPromoCodes();
      } else {
        alert(data.message || 'Failed to update promo code');
      }
    } catch (error) {
      console.error('Error updating promo code:', error);
      alert('Failed to update promo code');
    }
  };

  // Delete promo code
  const handleDeletePromo = async (id) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/promo-codes/delete/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Promo code deleted successfully!');
        fetchPromoCodes();
        fetchStats();
      } else {
        alert(data.message || 'Failed to delete promo code');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('Failed to delete promo code');
    }
  };

  // Toggle active status
  const handleToggleStatus = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/promo-codes/toggle-status/${id}`, {
        method: 'PATCH'
      });

      const data = await response.json();
      
      if (data.success) {
        fetchPromoCodes();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Copy promo code to clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Copied: ${code}`);
  };

  // Edit promo code
  const handleEditClick = (promo) => {
    setSelectedPromo(promo);
    setFormData({
      code: promo.code,
      title: promo.title,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      minPurchaseAmount: promo.minPurchaseAmount.toString(),
      maxDiscountAmount: promo.maxDiscountAmount?.toString() || '',
      usageLimit: promo.usageLimit?.toString() || '',
      usagePerUser: promo.usagePerUser.toString(),
      validFrom: promo.validFrom.split('T')[0],
      validUntil: promo.validUntil.split('T')[0],
      isActive: promo.isActive
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minPurchaseAmount: '0',
      maxDiscountAmount: '',
      usageLimit: '',
      usagePerUser: '1',
      validFrom: '',
      validUntil: '',
      isActive: true
    });
  };

  // Get status badge
  const getStatusBadge = (promo) => {
    if (!promo.isActive) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">Inactive</span>;
    }
    if (promo.isExpired) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Expired</span>;
    }
    if (promo.isValidNow) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Active</span>;
    }
    return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Scheduled</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Gift className="w-8 h-8 text-pink-500" />
            Promo Code Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage promotional discount codes</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Promo Code
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Codes</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <Tag className="w-12 h-12 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-400 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Codes</p>
                <p className="text-3xl font-bold mt-2">{stats.active}</p>
              </div>
              <Check className="w-12 h-12 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Usage</p>
                <p className="text-3xl font-bold mt-2">{stats.totalUsage}</p>
              </div>
              <Users className="w-12 h-12 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-red-400 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Expired</p>
                <p className="text-3xl font-bold mt-2">{stats.expired}</p>
              </div>
              <Clock className="w-12 h-12 opacity-20" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search promo codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="expired">Expired Only</option>
            </select>

            <button
              onClick={() => {
                fetchPromoCodes();
                fetchStats();
              }}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No promo codes found</p>
            <p className="text-gray-400 mt-2">Create your first promo code to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Code & Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Valid Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promoCodes.map((promo) => (
                  <motion.tr
                    key={promo._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 text-lg">
                            {promo.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(promo.code)}
                            className="text-gray-400 hover:text-pink-500 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{promo.title}</p>
                        {promo.description && (
                          <p className="text-gray-400 text-xs mt-1">{promo.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-pink-100 p-2 rounded-lg">
                          <Percent className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {promo.discountType === 'percentage' 
                              ? `${promo.discountValue}%` 
                              : `$${promo.discountValue}`}
                          </p>
                          {promo.minPurchaseAmount > 0 && (
                            <p className="text-xs text-gray-500">
                              Min: ${promo.minPurchaseAmount}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(promo.validFrom).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(promo.validUntil).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-800 font-semibold">
                          {promo.usageCount} 
                          {promo.usageLimit && ` / ${promo.usageLimit}`}
                        </p>
                        {promo.usageLimit && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-pink-500 h-2 rounded-full transition-all"
                              style={{ width: `${promo.usagePercentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(promo)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(promo._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            promo.isActive
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={promo.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {promo.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        
                        <button
                          onClick={() => handleEditClick(promo)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => handleDeletePromo(promo._id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setSelectedPromo(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Gift className="w-7 h-7 text-pink-500" />
                  {showEditModal ? 'Edit Promo Code' : 'Create New Promo Code'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedPromo(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={showEditModal ? handleUpdatePromo : handleCreatePromo} className="p-8 space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Promo Code * <span className="text-xs text-gray-500">(e.g., BLACKFRIDAY)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase"
                      placeholder="SUMMER2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title * <span className="text-xs text-gray-500">(Display name)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Summer Sale 2025"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Special discount for summer season"
                  />
                </div>

                {/* Discount Settings */}
                <div className="bg-pink-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-pink-500" />
                    Discount Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Discount Type *
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max={formData.discountType === 'percentage' ? '100' : undefined}
                        step="0.01"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder={formData.discountType === 'percentage' ? '20' : '50.00'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Min Purchase Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.minPurchaseAmount}
                        onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Max Discount Amount <span className="text-xs text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maxDiscountAmount}
                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Unlimited"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Usage Per User
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.usagePerUser}
                        onChange={(e) => setFormData({ ...formData, usagePerUser: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Usage & Validity */}
                <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Usage & Validity
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Total Usage Limit <span className="text-xs text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.usageLimit}
                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Unlimited"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valid From *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valid Until *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                    Activate promo code immediately
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedPromo(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg font-semibold"
                  >
                    {showEditModal ? 'Update Promo Code' : 'Create Promo Code'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromoCodeManager;