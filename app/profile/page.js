'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Shield,
  Bell,
  Package,
  Heart,
  LogOut,
  Loader,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

// API functions
const api = {
  // Get user profile
  getProfile: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch profile');
    }
    
    return response.json();
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }
    
    return response.json();
  },

  // Change password
  changePassword: async (passwordData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const response =  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
    
    return response.json();
  },

  // Logout
  logout: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
    
    return response.json();
  },

  // Get user stats
  getUserStats: async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) return { cart: 0, wishlist: 0 };
    
    try {
  const [cartResponse, wishlistResponse] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/summary/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlist/summary/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  ]);
      
      const cartData = cartResponse.ok ? await cartResponse.json() : { totalItems: 0 };
      const wishlistData = wishlistResponse.ok ? await wishlistResponse.json() : { totalItems: 0 };
      
      return {
        cart: cartData.totalItems || 0,
        wishlist: wishlistData.totalItems || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { cart: 0, wishlist: 0 };
    }
  }
};

// Notification Component
const Notification = ({ message, type, onClose }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white max-w-md`}
      >
        {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// Profile Header Component - FIXED VERSION
const ProfileHeader = ({ user, stats }) => {
  return (
    <motion.div 
      className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/30">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${user?.avatar ? 'hidden' : ''}`}>
              <User size={40} className="text-white" />
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold mb-2">{user?.name || 'Loading...'}</h1>
          <p className="text-pink-100 mb-1">{user?.email}</p>
          <p className="text-pink-200 text-sm">
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '...'}
          </p>
          {user?.role && (
            <p className="text-pink-200 text-xs mt-1 capitalize">
              Account Type: {user.role}
            </p>
          )}
          {user?.emailVerified && (
            <div className="flex items-center justify-center md:justify-start mt-2">
              <CheckCircle size={16} className="text-green-300 mr-1" />
              <span className="text-green-300 text-xs">Email Verified</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex space-x-6">
          <Link href="/cart" className="text-center hover:bg-white/10 p-3 rounded-lg transition-colors">
            <div className="text-2xl font-bold">{stats.cart}</div>
            <div className="text-pink-200 text-sm">Cart Items</div>
          </Link>
          <Link href="/wishlist" className="text-center hover:bg-white/10 p-3 rounded-lg transition-colors">
            <div className="text-2xl font-bold">{stats.wishlist}</div>
            <div className="text-pink-200 text-sm">Wishlist</div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// Edit Profile Modal
const EditProfileModal = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    avatar: user?.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }
    
    if (formData.avatar && formData.avatar.trim() !== '') {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(formData.avatar)) {
        newErrors.avatar = 'Please provide a valid URL';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar URL (Optional)
            </label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="https://example.com/avatar.jpg"
            />
            {errors.avatar && (
              <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Provide a URL for your profile picture
            </p>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Change Password Modal
const ChangePasswordModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      await onSave({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ current: false, new: false, confirm: false });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter new password (min 6 characters)"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : 'Change Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Account Info Section
const AccountInfoSection = ({ user }) => {
  const infoItems = [
    { 
      icon: Mail, 
      label: 'Email Address', 
      value: user?.email || 'Not provided',
      verified: user?.emailVerified 
    },
    { 
      icon: Calendar, 
      label: 'Member Since', 
      value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Loading...'
    },
    { 
      icon: User, 
      label: 'Account Type', 
      value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'
    },
    { 
      icon: Calendar, 
      label: 'Last Login', 
      value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'N/A'
    }
  ];

  return (
    <motion.div 
      className="bg-white rounded-2xl mt-4 p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-xl font-bold text-gray-800 mb-6">Account Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {infoItems.map((item, index) => (
          <motion.div
            key={item.label}
            className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <item.icon className="text-pink-500 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <div className="flex items-center space-x-2">
                <p className="text-gray-800 font-semibold">{item.value}</p>
                {item.verified && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const actions = [
    { 
      icon: Package, 
      label: 'My Orders', 
      href: '/orders',
      color: 'from-blue-500 to-blue-600',
      description: 'Track your orders'
    },
    { 
      icon: Heart, 
      label: 'Wishlist', 
      href: '/wishlist',
      color: 'from-red-500 to-pink-600',
      description: 'Saved items'
    },
    { 
      icon: MapPin, 
      label: 'Addresses', 
      href: '/addresses',
      color: 'from-green-500 to-green-600',
      description: 'Delivery addresses'
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      href: '/notifications',
      color: 'from-yellow-500 to-orange-600',
      description: 'Updates & alerts'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          <Link
            href={action.href}
            className={`block p-6 bg-gradient-to-br ${action.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
          >
            <action.icon size={24} className="mb-3" />
            <h3 className="font-semibold mb-1">{action.label}</h3>
            <p className="text-sm opacity-90">{action.description}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

// Logout Confirmation Modal
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center">
          <LogOut className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sign Out</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to sign out of your account?
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : 'Sign Out'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Main Profile Page Component
const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ cart: 0, wishlist: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [statsLoaded, setStatsLoaded] = useState(false); // Add this state
  const router = useRouter();

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  // Load user data
  const loadUserData = async () => {
    try {
      setLoading(true);
      const profileResponse = await api.getProfile();
      
      if (profileResponse.success) {
        setUser(profileResponse.user);
        // Store userId for other API calls
        localStorage.setItem('userId', profileResponse.user.id);
      } else {
        throw new Error(profileResponse.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      if (error.message === 'Unauthorized' || error.message.includes('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/');
      } else {
        showNotification('Failed to load profile data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load user stats - FIXED VERSION
  const loadUserStats = async () => {
    if (statsLoaded) return; // Prevent multiple calls
    
    try {
      const userStats = await api.getUserStats();
      setStats(userStats);
      setStatsLoaded(true); // Mark as loaded
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Don't show error for stats, just keep defaults
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (profileData) => {
    try {
      const response = await api.updateProfile(profileData);
      if (response.success) {
        setUser(response.user);
        showNotification('Profile updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Failed to update profile', 'error');
      throw error;
    }
  };

  // Handle password change
  const handlePasswordChange = async (passwordData) => {
    try {
      const response = await api.changePassword(passwordData);
      if (response.success) {
        showNotification('Password changed successfully!');
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API
      await api.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Show success message
      showNotification('Successfully signed out!');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    loadUserData();
  }, [router]);

  // FIXED: Load stats only once when user is loaded
  useEffect(() => {
    if (user && !statsLoaded) {
      loadUserStats();
    }
  }, [user, statsLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile - Pink Dreams</title>
        <meta name="description" content="Manage your Pink Dreams profile and account settings" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ message: '', type: '' })} 
        />

        {/* Header Component */}
        <Header />

        <div className="max-w-6xl mx-auto px-4 py-8">
          
          {/* Profile Header - FIXED: Removed onRefreshStats prop */}
          <ProfileHeader 
            user={user} 
            stats={stats}
          />
          
          {/* Quick Actions */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
            <QuickActions />
          </motion.div>
          
          {/* Profile Actions */}
          <motion.div 
            className="bg-white rounded-2xl p-6 shadow-lg mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">Profile Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all"
              >
                <Edit3 className="text-pink-500" size={20} />
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Edit Profile</div>
                  <div className="text-sm text-gray-600">Update your information</div>
                </div>
              </button>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <Shield className="text-purple-500" size={20} />
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Change Password</div>
                  <div className="text-sm text-gray-600">Update your password</div>
                </div>
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all"
              >
                <LogOut className="text-red-500" size={20} />
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Sign Out</div>
                  <div className="text-sm text-gray-600">Logout from account</div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Account Information */}
          <AccountInfoSection user={user} />
        </div>

        {/* Footer Component */}
        <Footer />

        {/* Modals */}
        <EditProfileModal
          user={user}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileUpdate}
        />

        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSave={handlePasswordChange}
        />

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      </div>
    </>
  );
};

export default ProfilePage;