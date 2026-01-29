'use client'

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Check, X, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// OAuth Icons
const GoogleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const FacebookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="#1877F2" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

// OAuth Login Buttons Component
const OAuthButtons = ({ isLoading, onGoogleLogin, onFacebookLogin, isLogin }) => (
  <div className="space-y-3">
    {/* Google Login */}
    <button
      type="button"
      onClick={onGoogleLogin}
      disabled={isLoading}
      className={`w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 flex items-center justify-center space-x-3 transition-all duration-200 ${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
      }`}
    >
      <GoogleIcon />
      <span>{isLogin ? 'Sign in' : 'Sign up'} with Google</span>
    </button>

    {/* Facebook Login */}
    <button
      type="button"
      onClick={onFacebookLogin}
      disabled={isLoading}
      className={`w-full bg-[#1877F2] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 flex items-center justify-center space-x-3 transition-all duration-200 ${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
      }`}
    >
      <FacebookIcon className="w-5 h-5 text-white" />
      <span>{isLogin ? 'Sign in' : 'Sign up'} with Facebook</span>
    </button>
  </div>
)

// Divider Component
const AuthDivider = () => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-4 bg-white text-gray-500 font-medium">or continue with email</span>
    </div>
  </div>
)

const LoginModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const { 
    login, 
    register, 
    checkEmail, 
    isLoading: authLoading,
    loginWithGoogle,
    loginWithFacebook
  } = useAuth()
  
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [emailExists, setEmailExists] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  // Forgot password specific states
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordStep, setForgotPasswordStep] = useState('email') // 'email' or 'success'
  const [isSendingReset, setIsSendingReset] = useState(false)

  // OAuth loading states
  const [oauthLoading, setOauthLoading] = useState(false)

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        rememberMe: false
      })
      setErrors({})
      setSuccessMessage('')
      setEmailExists(false)
      setIsLogin(true)
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
      setForgotPasswordStep('email')
      setOauthLoading(false)
    }
  }, [isOpen])

  // Real-time email validation with debounce
  useEffect(() => {
    if (formData.email && !isLogin && formData.email.includes('@')) {
      const timeoutId = setTimeout(async () => {
        setIsCheckingEmail(true)
        try {
          const exists = await checkEmail(formData.email)
          setEmailExists(exists)
          
          if (exists) {
            setErrors(prev => ({
              ...prev,
              email: 'An account with this email already exists'
            }))
          } else {
            setErrors(prev => {
              const newErrors = { ...prev }
              if (newErrors.email === 'An account with this email already exists') {
                delete newErrors.email
              }
              return newErrors
            })
          }
        } catch (error) {
          console.error('Error checking email:', error)
        } finally {
          setIsCheckingEmail(false)
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [formData.email, isLogin, checkEmail])

  // OAuth handlers
  const handleGoogleLogin = () => {
    try {
      setOauthLoading(true)
      setErrors({})
      console.log('🔍 Starting Google OAuth...')
      loginWithGoogle()
    } catch (error) {
      console.error('Google login error:', error)
      setErrors({ general: 'Failed to initiate Google login. Please try again.' })
      setOauthLoading(false)
    }
  }

  const handleFacebookLogin = () => {
    try {
      setOauthLoading(true)
      setErrors({})
      console.log('🔍 Starting Facebook OAuth...')
      loginWithFacebook()
    } catch (error) {
      console.error('Facebook login error:', error)
      setErrors({ general: 'Failed to initiate Facebook login. Please try again.' })
      setOauthLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    } else if (!isLogin && emailExists) {
      newErrors.email = 'An account with this email already exists'
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (formData.password.length > 100) {
      newErrors.password = 'Password must not exceed 100 characters'
    }

    // Common weak passwords check
    const commonPasswords = ['123456', 'password', '123456789', 'qwerty', 'abc123']
    if (!isLogin && commonPasswords.includes(formData.password.toLowerCase())) {
      newErrors.password = 'Please choose a stronger password'
    }
    
    if (!isLogin) {
      // Name validation
      if (!formData.name) {
        newErrors.name = 'Name is required'
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters'
      } else if (formData.name.trim().length > 50) {
        newErrors.name = 'Name must not exceed 50 characters'
      }
      
      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      let result
      if (isLogin) {
        result = await login(formData.email, formData.password, formData.rememberMe)
      } else {
        const userData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password
        }
        result = await register(userData)
      }
      
      if (result.success) {
        setSuccessMessage(result.message || (isLogin ? 'Login successful!' : 'Account created successfully!'))
        
        // Call success callback if provided
        if (onAuthSuccess) {
          onAuthSuccess(result.user)
        }
        
        // Close modal after success
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        if (result.errors) {
          setErrors(result.errors)
        } else {
          setErrors({ general: result.error })
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData(prev => ({
      ...prev,
      name: '',
      password: '',
      confirmPassword: ''
    }))
    setErrors({})
    setSuccessMessage('')
    setEmailExists(false)
    setShowForgotPassword(false)
    setOauthLoading(false)
  }

  // Handle forgot password
  const handleForgotPassword = () => {
    setShowForgotPassword(true)
    setForgotPasswordStep('email')
    setForgotPasswordEmail('')
    setErrors({})
    setSuccessMessage('')
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setForgotPasswordStep('email')
    setForgotPasswordEmail('')
    setErrors({})
    setSuccessMessage('')
  }

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (!forgotPasswordEmail) {
      setErrors({ email: 'Email is required' })
      return
    }

    if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    setIsSendingReset(true)
    setErrors({})

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail })
      })

      const data = await response.json()

      if (data.success) {
        setForgotPasswordStep('success')
        setSuccessMessage(data.message)
      } else {
        setErrors({ general: data.message || 'Failed to send reset email. Please try again.' })
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setErrors({ general: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsSendingReset(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    
    const levels = [
      { text: 'Very Weak', color: 'bg-red-400' },
      { text: 'Weak', color: 'bg-orange-400' },
      { text: 'Fair', color: 'bg-yellow-400' },
      { text: 'Good', color: 'bg-blue-400' },
      { text: 'Strong', color: 'bg-green-400' }
    ]
    
    return { score, ...levels[score] }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  // Check if any loading state is active
  const isAnyLoading = isSubmitting || authLoading || isSendingReset || oauthLoading

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-sm ${!isLogin && !showForgotPassword ? 'max-h-[90vh]' : ''}`}>
        {/* Custom scrollbar styles for signup */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(219, 39, 119, 0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(219, 39, 119, 0.6);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(219, 39, 119, 0.8);
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(219, 39, 119, 0.6) rgba(219, 39, 119, 0.1);
          }
        `}</style>

        <div className={`relative bg-white rounded-2xl shadow-2xl border border-pink-100 ${!isLogin && !showForgotPassword ? 'overflow-y-auto custom-scrollbar max-h-[90vh]' : 'overflow-hidden'}`}>
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-pink-50"></div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-pink-50 rounded-full transition-all duration-200"
            disabled={isAnyLoading}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <h1 className="text-xl font-bold text-gray-800 mb-1">
                  {showForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Join Pink Dreams'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {showForgotPassword 
                    ? 'Enter your email to receive reset instructions' 
                    : isLogin 
                    ? 'Sign in to your account' 
                    : 'Create your fashion account'}
                </p>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-700 text-sm font-medium">{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {errors.general && (
              <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-red-700 text-sm font-medium">{errors.general}</span>
              </div>
            )}

            {/* OAuth Loading Message */}
            {oauthLoading && (
              <div className="mx-6 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-blue-700 text-sm font-medium">Redirecting to social login...</span>
              </div>
            )}

            {/* Forgot Password Form */}
            {showForgotPassword ? (
              <div className="px-6 pb-6">
                {/* Back button */}
                <button
                  onClick={handleBackToLogin}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                  disabled={isSendingReset}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back to Sign In</span>
                </button>

                {forgotPasswordStep === 'email' ? (
                  <form onSubmit={handleForgotPasswordSubmit}>
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-700 text-sm">
                          <strong>Forgot your Password?</strong><br />
                          Provide your account email address to receive an email to reset your password.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-700 text-sm font-medium">Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) => {
                              setForgotPasswordEmail(e.target.value)
                              if (errors.email) {
                                setErrors(prev => ({ ...prev, email: '' }))
                              }
                            }}
                            className={`w-full bg-pink-25 border ${errors.email ? 'border-red-300' : 'border-pink-200'} rounded-lg px-10 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200`}
                            placeholder="Enter your email address"
                            disabled={isSendingReset}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-xs flex items-center space-x-1">
                            <X className="w-3 h-3" />
                            <span>{errors.email}</span>
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingReset}
                        className={`w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-2.5 rounded-lg font-semibold hover:from-pink-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transform transition-all duration-200 ${
                          isSendingReset ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isSendingReset ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Sending Reset Link...</span>
                          </div>
                        ) : (
                          <span>Send Reset Link</span>
                        )}
                      </button>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-gray-600 text-xs text-center">
                          We'll send you an email with instructions to reset your password. 
                          Please check your spam folder if you don't see it within a few minutes.
                        </p>
                      </div>
                    </div>
                  </form>
                ) : (
                  // Success step
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-800">Check Your Email</h3>
                      <p className="text-gray-600 text-sm">
                        We've sent password reset instructions to:
                      </p>
                      <p className="text-pink-600 font-medium">{forgotPasswordEmail}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-700 text-xs">
                        <strong>Next steps:</strong><br />
                        1. Check your email inbox (and spam folder)<br />
                        2. Click the "Reset My Password" button in the email<br />
                        3. Follow the instructions to create a new password
                      </p>
                    </div>
                    <button
                      onClick={() => setForgotPasswordStep('email')}
                      className="text-pink-500 hover:text-pink-600 text-sm font-medium transition-colors"
                      disabled={isSendingReset}
                    >
                      Didn't receive the email? Try again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Regular Login/Register Form
              <div className="px-6 pb-6">
                {/* OAuth Buttons */}
                <OAuthButtons 
                  isLoading={isAnyLoading}
                  onGoogleLogin={handleGoogleLogin}
                  onFacebookLogin={handleFacebookLogin}
                  isLogin={isLogin}
                />
                
                {/* Divider */}
                <AuthDivider />
                
                {/* Email/Password Form */}
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Name field (only for register) */}
                    {!isLogin && (
                      <div className="space-y-1.5">
                        <label className="text-gray-700 text-sm font-medium">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full bg-pink-25 border ${errors.name ? 'border-red-300' : 'border-pink-200'} rounded-lg px-10 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200`}
                            placeholder="Enter your full name"
                            maxLength="50"
                            disabled={isAnyLoading}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-red-500 text-xs flex items-center space-x-1">
                            <X className="w-3 h-3" />
                            <span>{errors.name}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Email field */}
                    <div className="space-y-1.5">
                      <label className="text-gray-700 text-sm font-medium">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full bg-pink-25 border ${errors.email ? 'border-red-300' : 'border-pink-200'} rounded-lg px-10 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200 ${!isLogin ? 'pr-10' : ''}`}
                          placeholder="Enter your email"
                          disabled={isAnyLoading}
                        />
                        {!isLogin && isCheckingEmail && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
                          </div>
                        )}
                        {!isLogin && !isCheckingEmail && formData.email && formData.email.includes('@') && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {emailExists ? (
                              <X className="w-4 h-4 text-red-500" />
                            ) : (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-xs flex items-center space-x-1">
                          <X className="w-3 h-3" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Password field */}
                    <div className="space-y-1.5">
                      <label className="text-gray-700 text-sm font-medium">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full bg-pink-25 border ${errors.password ? 'border-red-300' : 'border-pink-200'} rounded-lg px-10 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200`}
                          placeholder="Enter your password"
                          maxLength="100"
                          disabled={isAnyLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          disabled={isAnyLoading}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Password strength indicator (only for register) */}
                      {!isLogin && formData.password && (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-pink-100 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{passwordStrength.text}</span>
                          </div>
                        </div>
                      )}
                      
                      {errors.password && (
                        <p className="text-red-500 text-xs flex items-center space-x-1">
                          <X className="w-3 h-3" />
                          <span>{errors.password}</span>
                        </p>
                      )}
                    </div>

                    {/* Confirm Password field (only for register) */}
                    {!isLogin && (
                      <div className="space-y-1.5">
                        <label className="text-gray-700 text-sm font-medium">Confirm Password *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`w-full bg-pink-25 border ${errors.confirmPassword ? 'border-red-300' : 'border-pink-200'} rounded-lg px-10 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200`}
                            placeholder="Confirm your password"
                            disabled={isAnyLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isAnyLoading}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formData.confirmPassword && formData.password === formData.confirmPassword && (
                          <p className="text-green-500 text-xs flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Passwords match</span>
                          </p>
                        )}
                        {errors.confirmPassword && (
                          <p className="text-red-500 text-xs flex items-center space-x-1">
                            <X className="w-3 h-3" />
                            <span>{errors.confirmPassword}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Remember me checkbox (only for login) */}
                    {isLogin && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-pink-400 bg-white border-pink-300 rounded focus:ring-pink-300 focus:ring-2"
                          disabled={isAnyLoading}
                        />
                        <label className="ml-2 text-gray-600 text-sm">Remember me for 30 days</label>
                      </div>
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isAnyLoading || (!isLogin && emailExists)}
                      className={`w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-2.5 rounded-lg font-semibold hover:from-pink-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transform transition-all duration-200 ${
                        isAnyLoading || (!isLogin && emailExists) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isSubmitting || authLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                        </div>
                      ) : (
                        <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      )}
                    </button>

                    {/* Additional info for registration */}
                    {!isLogin && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                        <p className="text-blue-700 text-xs text-center">
                          By creating an account, you agree to our Terms of Service and Privacy Policy.
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Footer */}
            {!showForgotPassword && (
              <div className="px-6 pb-6 text-center space-y-3">
                <p className="text-gray-600 text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={toggleMode}
                    className="ml-1 text-pink-500 hover:text-pink-600 font-medium transition-colors"
                    disabled={isAnyLoading}
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>

                {/* Forgot password link (only for login) */}
                {isLogin && (
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    onClick={handleForgotPassword}
                    disabled={isAnyLoading}
                  >
                    Forgot your password?
                  </button>
                )}

                {/* OAuth Additional Info */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Secure authentication powered by Google & Facebook
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal