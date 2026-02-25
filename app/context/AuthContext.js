'use client'
import { createContext, useContext, useState, useEffect, useRef } from 'react'


const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState(null)
  // NEW: Rate limit state
  const [rateLimitInfo, setRateLimitInfo] = useState({
    isLimited: false,
    retryAfter: 0,
    type: null,
    message: ''
  })

  const lastOAuthDispatchRef = useRef({ token: null, userId: null })


  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  // NEW: Rate limit helper functions
  const clearRateLimit = () => {
    setRateLimitInfo({
      isLimited: false,
      retryAfter: 0,
      type: null,
      message: ''
    })
  }

  const handleRateLimitError = (data, response) => {
    const retryAfter = data.retryAfter || 900 // Default 15 minutes
    setRateLimitInfo({
      isLimited: true,
      retryAfter,
      type: data.type || 'rate_limit',
      message: data.error || 'Too many attempts. Please try again later.'
    })

    // Auto-clear rate limit after retry period
    setTimeout(() => {
      clearRateLimit()
    }, retryAfter * 1000)

    console.log(`🚨 Rate limit hit: ${data.type} - retry after ${retryAfter}s`)
  }

  const formatRetryTime = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
    return `${minutes}m ${remainingSeconds}s`
  }

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        // Verify token is still valid
        verifyToken(savedToken)
        
        // Dispatch event for wishlist context (in case it initializes after auth)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { userId: parsedUser.id, userData: parsedUser, isFromStorage: true }
          }))
        }, 100)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        // Clear corrupted data
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsLoading(false)
      }
    } else if (savedToken) {
      setToken(savedToken)
      fetchUserProfile(savedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Verify token validity
  const verifyToken = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update user data if token is valid
          const updatedUser = data.user
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
          
          // Don't dispatch login event here as it's just verification
          console.log('Token verified successfully for user:', updatedUser.id)
        }
      } else if (response.status === 429) {
        // Handle rate limit on token verification
        const data = await response.json()
        handleRateLimitError(data, response)
      } else {
        // Token is invalid, clear auth state
        console.log('Token verification failed, clearing auth state')
        handleInvalidToken()
      }
    } catch (error) {
      console.error('Error verifying token:', error)
      handleInvalidToken()
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch user profile with token
  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const userData = data.user
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
          
          // Dispatch login event for wishlist context
          window.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { userId: userData.id, userData: userData, isFromToken: true }
          }))
        }
      } else if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
      } else {
        handleInvalidToken()
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      handleInvalidToken()
    } finally {
      setIsLoading(false)
    }
  }

  // Handle invalid or expired token
  const handleInvalidToken = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    
    // Trigger logout event for wishlist
    window.dispatchEvent(new CustomEvent('userLoggedOut', {
      detail: { reason: 'invalid_token' }
    }))
  }

  // Enhanced login with rate limit handling
  const login = async (email, password, rememberMe = false) => {
    // Clear any existing rate limit before attempting login
    clearRateLimit()
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe })
      })

      const data = await response.json()
      console.log('Login response:', data)

      // Handle rate limiting
      if (response.status === 429) {
        handleRateLimitError(data, response)
        setIsLoading(false)
        return { 
          success: false, 
          error: data.error,
          retryAfter: data.retryAfter,
          type: data.type,
          isRateLimit: true
        }
      }

      if (data.success) {
        const userData = data.user
        setUser(userData)
        setToken(data.token)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Clear any rate limit on successful login
        clearRateLimit()
        
        // Trigger login event for wishlist sync
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { 
            userId: userData.id, 
            userData: userData, 
            isLogin: true,
            token: data.token
          }
        }))
        
        setIsLoading(false)
        console.log('User logged in successfully:', userData.email)
        return { success: true, user: userData, message: data.message }
      } else {
        setIsLoading(false)
        return { 
          success: false, 
          error: data.message || 'Login failed',
          errors: data.errors 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Enhanced register with rate limit handling
  const register = async (userData) => {
    clearRateLimit()
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()
      console.log('Register response:', data)

      // Handle rate limiting
      if (response.status === 429) {
        handleRateLimitError(data, response)
        setIsLoading(false)
        return { 
          success: false, 
          error: data.error,
          retryAfter: data.retryAfter,
          type: data.type,
          isRateLimit: true
        }
      }

      if (data.success) {
        const newUserData = data.user
        setUser(newUserData)
        setToken(data.token)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(newUserData))
        
        // Clear any rate limit on successful registration
        clearRateLimit()
        
        // Trigger login event for wishlist sync (new user might have session wishlist)
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { 
            userId: newUserData.id, 
            userData: newUserData, 
            isNewUser: true,
            isRegistration: true,
            token: data.token
          }
        }))
        
        setIsLoading(false)
        console.log('User registered successfully:', newUserData.email)
        return { success: true, user: newUserData, message: data.message }
      } else {
        setIsLoading(false)
        return { 
          success: false, 
          error: data.message || 'Registration failed',
          errors: data.errors 
        }
      }
    } catch (error) {
      console.error('Register error:', error)
      setIsLoading(false)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Enhanced forgot password with rate limit handling
  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      // Handle rate limiting
      if (response.status === 429) {
        handleRateLimitError(data, response)
        return {
          success: false,
          error: data.error,
          retryAfter: data.retryAfter,
          type: data.type,
          isRateLimit: true
        }
      }

      return {
        success: data.success,
        message: data.message
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      }
    }
  }

  // ===== OAUTH FUNCTIONS WITH RATE LIMIT HANDLING =====

  // OAuth Login Functions
  const loginWithGoogle = () => {
    try {
      // Check if rate limited
      if (rateLimitInfo.isLimited && rateLimitInfo.type === 'oauth_rate_limit') {
        return { 
          success: false, 
          error: `OAuth rate limited. Try again in ${formatRetryTime(rateLimitInfo.retryAfter)}`,
          isRateLimit: true 
        }
      }

      console.log('🔍 Initiating Google OAuth login...')
      window.location.href = `${API_URL}/auth/google`
    } catch (error) {
      console.error('Google login error:', error)
      return { success: false, error: 'Failed to initiate Google login' }
    }
  }

  const loginWithFacebook = () => {
    try {
      // Check if rate limited
      if (rateLimitInfo.isLimited && rateLimitInfo.type === 'oauth_rate_limit') {
        return { 
          success: false, 
          error: `OAuth rate limited. Try again in ${formatRetryTime(rateLimitInfo.retryAfter)}`,
          isRateLimit: true 
        }
      }

      console.log('🔍 Initiating Facebook OAuth login...')
      window.location.href = `${API_URL}/auth/facebook`
    } catch (error) {
      console.error('Facebook login error:', error)
      return { success: false, error: 'Failed to initiate Facebook login' }
    }
  }

  // Handle OAuth callback (called from callback page)
  const handleOAuthCallback = async (authToken, provider) => {
    try {
      setIsLoading(true)
      console.log(`🔄 Processing ${provider} OAuth callback...`)

      if (!authToken) {
        return { success: false, error: 'No authentication token received' }
      }

      // Store the token
      localStorage.setItem('token', authToken)
      setToken(authToken)

      // Get user profile with the token
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        localStorage.removeItem('token')
        setToken(null)
        return { 
          success: false, 
          error: data.error,
          isRateLimit: true
        }
      }

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const userData = data.user
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
          
          // Clear any rate limit on successful OAuth
          clearRateLimit()
          
          // Trigger login event for wishlist sync
          const shouldDispatchLoginEvent =
  lastOAuthDispatchRef.current.token !== authToken ||
  lastOAuthDispatchRef.current.userId !== userData.id

if (shouldDispatchLoginEvent) {
  window.dispatchEvent(new CustomEvent('userLoggedIn', {
    detail: {
      userId: userData.id,
      userData,
      isOAuth: true,
      provider,
      token: authToken
    }
  }))

  lastOAuthDispatchRef.current = { token: authToken, userId: userData.id }
}

          
          console.log(`✅ ${provider} OAuth login successful:`, userData.name)
          
          return { 
            success: true, 
            message: `Successfully signed in with ${provider}!`,
            user: userData 
          }
        } else {
          localStorage.removeItem('token')
          setToken(null)
          return { success: false, error: data.message || 'Failed to get user profile' }
        }
      } else {
        localStorage.removeItem('token')
        setToken(null)
        return { success: false, error: 'Failed to authenticate with server' }
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      localStorage.removeItem('token')
      setToken(null)
      return { success: false, error: 'Authentication failed. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  // Get OAuth status for current user
  const getOAuthStatus = async () => {
    try {
      if (!token) return { success: false, error: 'Not authenticated' }

      const response = await fetch(`${API_URL}/auth/oauth/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        return { 
          success: false, 
          error: data.error,
          isRateLimit: true
        }
      }

      const data = await response.json()
      
      if (response.status === 401) {
        handleInvalidToken()
        return { success: false, error: 'Session expired. Please login again.' }
      }

      return data
    } catch (error) {
      console.error('OAuth status error:', error)
      return { success: false, error: 'Failed to check OAuth status' }
    }
  }

  // Link OAuth account to existing user
  const linkOAuthAccount = async (provider) => {
    try {
      if (!token) return { success: false, error: 'Not authenticated' }

      const response = await fetch(`${API_URL}/auth/oauth/link/${provider}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        return { 
          success: false, 
          error: data.error,
          isRateLimit: true
        }
      }

      const data = await response.json()
      
      if (response.status === 401) {
        handleInvalidToken()
        return { success: false, error: 'Session expired. Please login again.' }
      }
      
      if (data.success && data.redirectUrl) {
        console.log(`🔗 Redirecting to link ${provider} account...`)
        window.location.href = `${API_URL}${data.redirectUrl}`
      }
      
      return data
    } catch (error) {
      console.error('OAuth link error:', error)
      return { success: false, error: 'Failed to link OAuth account' }
    }
  }

  // Unlink OAuth account
  const unlinkOAuthAccount = async (provider) => {
    try {
      if (!token) return { success: false, error: 'Not authenticated' }

      const response = await fetch(`${API_URL}/auth/oauth/unlink/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        return { 
          success: false, 
          error: data.error,
          isRateLimit: true
        }
      }

      const data = await response.json()
      
      if (response.status === 401) {
        handleInvalidToken()
        return { success: false, error: 'Session expired. Please login again.' }
      }
      
      if (data.success) {
        // Refresh user profile to get updated OAuth status
        await verifyToken(token)
        console.log(`🔓 ${provider} account unlinked successfully`)
      }
      
      return data
    } catch (error) {
      console.error('OAuth unlink error:', error)
      return { success: false, error: 'Failed to unlink OAuth account' }
    }
  }

  // ===== END OAUTH FUNCTIONS =====

  // Enhanced logout with wishlist clearing
// Enhanced logout with wishlist clearing
  const logout = async () => {
    const currentUser = user // Store reference before clearing
    console.log('🔄 AuthContext: Starting logout process for user:', currentUser?.name)
    
    try {
      if (token) {
        // Try both regular logout and OAuth logout
        await Promise.allSettled([
          fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_URL}/auth/oauth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ])
      }
    } catch (error) {
      console.error('Logout API error:', error)
    }

    // Clear local storage and rate limit state FIRST
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    clearRateLimit()
    
    // Clear state BEFORE dispatching event
    setUser(null)
    setToken(null)
    
    console.log('🔄 AuthContext: User state cleared, dispatching logout event')
    
    // Dispatch the logout event immediately
    const logoutEvent = new CustomEvent('userLoggedOut', {
      detail: { 
        reason: 'user_logout',
        previousUser: currentUser
      }
    })
    
    window.dispatchEvent(logoutEvent)
    console.log('✅ AuthContext: userLoggedOut event dispatched')
    
    console.log('✅ AuthContext: Logout process completed')
  }

  // Enhanced profile update
  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        return { 
          success: false, 
          error: data.error,
          isRateLimit: true
        }
      }

      const data = await response.json()

      if (response.status === 401) {
        // Token expired or invalid
        handleInvalidToken()
        return { success: false, error: 'Session expired. Please login again.' }
      }

      if (data.success) {
        const updatedUser = data.user
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Dispatch user update event (optional - for components that need to know about profile changes)
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: { userData: updatedUser }
        }))
        
        return { success: true, user: updatedUser, message: data.message }
      } else {
        return { 
          success: false, 
          error: data.message || 'Update failed',
          errors: data.errors 
        }
      }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Enhanced password change
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        return { 
          success: false, 
          error: data.error,
          isRateLimit: true
        }
      }

      const data = await response.json()

      if (response.status === 401) {
        // Token expired or invalid
        handleInvalidToken()
        return { success: false, error: 'Session expired. Please login again.' }
      }

      if (data.success) {
        return { success: true, message: data.message }
      } else {
        return { 
          success: false, 
          error: data.message || 'Password change failed',
          errors: data.errors 
        }
      }
    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Verify reset token function
  const verifyResetToken = async (resetToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-token/${resetToken}`)
      
      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        return {
          success: false,
          error: data.error,
          isRateLimit: true
        }
      }

      const data = await response.json()
      
      return {
        success: data.success,
        message: data.message,
        user: data.user || null,
        expired: data.expired || false
      }
    } catch (error) {
      console.error('Verify reset token error:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        expired: false
      }
    }
  }

  // Reset password function
  const resetPassword = async (resetToken, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: resetToken, newPassword })
      })

      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        return {
          success: false,
          error: data.error,
          isRateLimit: true
        }
      }

      const data = await response.json()
      return {
        success: data.success,
        message: data.message,
        expired: data.expired || false
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        expired: false
      }
    }
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!(user && token)
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role
  }

  // Check email availability (for registration form)
  const checkEmail = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      if (response.status === 429) {
        // Don't handle rate limit here as it's not critical
        return false
      }

      const data = await response.json()
      return data.exists || false
    } catch (error) {
      console.error('Check email error:', error)
      return false
    }
  }

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Enhanced API call helper with rate limit handling
  const authenticatedFetch = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers
        }
      })

      // Handle rate limiting
      if (response.status === 429) {
        const data = await response.json()
        handleRateLimitError(data, response)
        throw new Error(`Rate limited: ${data.error}`)
      }

      // Handle authentication errors
      if (response.status === 401) {
        const data = await response.json()
        if (data.code === 'TOKEN_EXPIRED' || data.code === 'INVALID_TOKEN') {
          handleInvalidToken()
          throw new Error('Session expired. Please login again.')
        }
      }

      return response
    } catch (error) {
      throw error
    }
  }

  // Helper method to get current user ID (useful for API calls)
  const getCurrentUserId = () => {
    return user?.id || null
  }

  // Helper method to check if current session is temporary
  const isTemporarySession = () => {
    return !isAuthenticated()
  }

  // Helper to check if user is OAuth user
  const isOAuthUser = () => {
    return user?.authProvider && user.authProvider !== 'local'
  }

  // Helper to get user's auth provider
  const getAuthProvider = () => {
    return user?.authProvider || 'local'
  }

  // NEW: Helper to check if currently rate limited
  const isRateLimited = () => {
    return rateLimitInfo.isLimited
  }

  // NEW: Get rate limit info
  const getRateLimitInfo = () => {
    return rateLimitInfo
  }

  const contextValue = {
    user,
    isLoading,
    token,
    isAuthenticated: isAuthenticated(),
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkEmail,
    forgotPassword,
    verifyResetToken,
    resetPassword,
    getAuthHeaders,
    authenticatedFetch,
    hasRole,
    getCurrentUserId,
    isTemporarySession,
    // OAuth functions
    loginWithGoogle,
    loginWithFacebook,
    handleOAuthCallback,
    getOAuthStatus,
    linkOAuthAccount,
    unlinkOAuthAccount,
    isOAuthUser,
    getAuthProvider,
    // NEW: Rate limit functions
    isRateLimited,
    getRateLimitInfo,
    clearRateLimit,
    formatRetryTime
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protecting routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      // You can customize this redirect behavior
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return null
    }

    return <Component {...props} />
  }
}

// Custom hook for API calls with authentication
export const useAuthenticatedFetch = () => {
  const { authenticatedFetch, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    throw new Error('useAuthenticatedFetch requires user to be authenticated')
  }

  return authenticatedFetch
}

export default AuthContext