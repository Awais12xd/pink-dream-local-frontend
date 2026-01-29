// Profile Header Component - FIXED VERSION
const ProfileHeader = ({ user, stats }) => {
  // Removed the useEffect that was calling onRefreshStats
  // This was causing continuous re-renders
  
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

// Updated ProfilePage component with fixed stats loading
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