'use client'

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Check, X, AlertCircle, Phone, Calendar, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'

const EnhancedLoginPage = ({ onAuthSuccess }) => {
  const { login, register, checkEmail, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [emailExists, setEmailExists] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

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

      // Phone validation (optional)
      if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }

      // Date of birth validation (optional)
      if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        
        if (age < 13) {
          newErrors.dateOfBirth = 'You must be at least 13 years old'
        } else if (age > 120) {
          newErrors.dateOfBirth = 'Please enter a valid date of birth'
        }
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
          password: formData.password,
          phone: formData.phone.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender
        }
        result = await register(userData)
      }
      
      if (result.success) {
        setSuccessMessage(result.message || (isLogin ? 'Login successful! Redirecting...' : 'Account created successfully! Redirecting...'))
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          rememberMe: false
        })
        
        // Call success callback if provided
        if (onAuthSuccess) {
          onAuthSuccess(result.user)
        }
        
        // Redirect after success
        setTimeout(() => {
          const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/'
          router.push(redirectTo)
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
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      rememberMe: false
    })
    setErrors({})
    setSuccessMessage('')
    setEmailExists(false)
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
      { text: 'Very Weak', color: 'bg-red-500' },
      { text: 'Weak', color: 'bg-orange-500' },
      { text: 'Fair', color: 'bg-yellow-500' },
      { text: 'Good', color: 'bg-blue-500' },
      { text: 'Strong', color: 'bg-green-500' }
    ]
    
    return { score, ...levels[score] }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-pink-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Join Pink Dreams'}
              </h1>
              <p className="text-white/60">
                {isLogin ? 'Sign in to your account' : 'Create your fashion account'}
              </p>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mx-8 mb-6 bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mx-8 mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center space-x-3">
              <X className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">{errors.general}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8">
            <div className="space-y-6">
              {/* Name field (only for register) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full bg-white/10 border ${errors.name ? 'border-red-500' : 'border-white/20'} rounded-xl px-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
                      placeholder="Enter your full name"
                      maxLength="50"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-400 text-sm flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-white/10 border ${errors.email ? 'border-red-500' : 'border-white/20'} rounded-xl px-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
                    placeholder="Enter your email"
                  />
                  {!isLogin && isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!isLogin && !isCheckingEmail && formData.email && formData.email.includes('@') && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailExists ? (
                        <X className="w-5 h-5 text-red-400" />
                      ) : (
                        <Check className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm flex items-center space-x-1">
                    <X className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Phone field (only for register) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full bg-white/10 border ${errors.phone ? 'border-red-500' : 'border-white/20'} rounded-xl px-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-sm flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Date of Birth and Gender (only for register) */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className={`w-full bg-white/10 border ${errors.dateOfBirth ? 'border-red-500' : 'border-white/20'} rounded-xl px-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-red-400 text-xs flex items-center space-x-1">
                        <X className="w-3 h-3" />
                        <span>{errors.dateOfBirth}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium">Gender</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                      >
                        <option value="" className="bg-gray-800">Select</option>
                        <option value="male" className="bg-gray-800">Male</option>
                        <option value="female" className="bg-gray-800">Female</option>
                        <option value="other" className="bg-gray-800">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Password field */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full bg-white/10 border ${errors.password ? 'border-red-500' : 'border-white/20'} rounded-xl px-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
                    placeholder="Enter your password"
                    maxLength="100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password strength indicator (only for register) */}
                {!isLogin && formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white/20 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-white/60">{passwordStrength.text}</span>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-red-400 text-sm flex items-center space-x-1">
                    <X className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password field (only for register) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full bg-white/10 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/20'} rounded-xl px-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-green-400 text-sm flex items-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Passwords match</span>
                    </p>
                  )}
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm flex items-center space-x-1">
                      <X className="w-4 h-4" />
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
                    className="w-4 h-4 text-pink-500 bg-white/10 border-white/20 rounded focus:ring-pink-500 focus:ring-2"
                  />
                  <label className="ml-2 text-white/80 text-sm">Remember me for 30 days</label>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || authLoading || (!isLogin && emailExists)}
                className={`w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-transparent transform transition-all duration-200 ${
                  isSubmitting || authLoading || (!isLogin && emailExists) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              >
                {isSubmitting || authLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>

              {/* Additional info for registration */}
              {!isLogin && (
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-300 text-xs text-center">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                    Fields marked with * are required.
                  </p>
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center space-y-4">
            <p className="text-white/60 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-2 text-pink-400 hover:text-pink-300 font-medium transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>

            {/* Forgot password link (only for login) */}
            {isLogin && (
              <button
                type="button"
                className="text-white/60 hover:text-white/80 text-sm transition-colors"
                onClick={() => {
                  // Handle forgot password
                  // console.log('Forgot password clicked')
                }}
              >
                Forgot your password?
              </button>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-pink-400 rounded-full blur-sm opacity-60"></div>
        <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-rose-400 rounded-full blur-sm opacity-60"></div>
      </div>
    </div>
  )
}

export default EnhancedLoginPage