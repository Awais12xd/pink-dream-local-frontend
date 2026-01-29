'use client'

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, Check, X, AlertCircle, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

const ResetPasswordPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { verifyResetToken, resetPassword } = useAuth()

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [step, setStep] = useState('verify') // 'verify', 'reset', 'success', 'expired'

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      setStep('expired')
      setIsVerifying(false)
      return
    }

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const result = await verifyResetToken(token)

      if (result.success) {
        setTokenValid(true)
        setUserInfo(result.user)
        setStep('reset')
      } else {
        setTokenValid(false)
        setStep('expired')
        setErrors({ general: result.message || 'Invalid or expired reset token' })
      }
    } catch (error) {
      console.error('Token verification error:', error)
      setTokenValid(false)
      setStep('expired')
      setErrors({ general: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsVerifying(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    } else if (formData.newPassword.length > 100) {
      newErrors.newPassword = 'Password must not exceed 100 characters'
    }

    // Common weak passwords check
    const commonPasswords = ['123456', 'password', '123456789', 'qwerty', 'abc123']
    if (commonPasswords.includes(formData.newPassword.toLowerCase())) {
      newErrors.newPassword = 'Please choose a stronger password'
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
      const result = await resetPassword(token, formData.newPassword)

      if (result.success) {
        setSuccessMessage(result.message)
        setStep('success')
        
        // Redirect to homepage after 3 seconds
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        if (result.expired) {
          setStep('expired')
        }
        setErrors({ general: result.message || 'Failed to reset password. Please try again.' })
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setErrors({ general: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
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

  const passwordStrength = getPasswordStrength(formData.newPassword)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'verify' && 'Verifying Reset Link'}
            {step === 'reset' && 'Reset Your Password'}
            {step === 'success' && 'Password Reset Complete'}
            {step === 'expired' && 'Reset Link Expired'}
          </h2>
          <p className="text-gray-600">
            {step === 'verify' && 'Please wait while we verify your reset link...'}
            {step === 'reset' && 'Enter your new password below'}
            {step === 'success' && 'Your password has been successfully reset'}
            {step === 'expired' && 'This reset link is no longer valid'}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
          <div className="px-8 py-6">
            {/* Loading State */}
            {isVerifying && (
              <div className="text-center py-8">
                <div className="w-8 h-8 mx-auto mb-4 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
                <p className="text-gray-600">Verifying your reset link...</p>
              </div>
            )}

            {/* Expired Token */}
            {step === 'expired' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Reset Link Expired</h3>
                  <p className="text-gray-600 text-sm">
                    This password reset link has expired or is invalid. Reset links are only valid for 1 hour for security reasons.
                  </p>
                </div>
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{errors.general}</p>
                  </div>
                )}
                <div className="space-y-3 pt-4">
                  <Link href="/" className="inline-flex items-center justify-center w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-pink-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105">
                    Request New Reset Link
                  </Link>
                  <Link href="/" className="inline-flex items-center justify-center w-full text-gray-600 hover:text-gray-800 py-2 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Homepage
                  </Link>
                </div>
              </div>
            )}

            {/* Reset Form */}
            {step === 'reset' && (
              <div className="space-y-6">
                {/* User Info */}
                {userInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      <strong>Resetting password for:</strong><br />
                      {userInfo.name} ({userInfo.email})
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                    <X className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 text-sm font-medium">{errors.general}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password field */}
                  <div className="space-y-1.5">
                    <label className="text-gray-700 text-sm font-medium">New Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className={`w-full bg-pink-25 border ${errors.newPassword ? 'border-red-300' : 'border-pink-200'} rounded-lg px-10 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200`}
                        placeholder="Enter your new password"
                        maxLength="100"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator */}
                    {formData.newPassword && (
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
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-1">Password should contain:</p>
                          <ul className="text-xs text-gray-500 space-y-0.5">
                            <li className={`flex items-center space-x-1 ${formData.newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                              {formData.newPassword.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>At least 8 characters</span>
                            </li>
                            <li className={`flex items-center space-x-1 ${/[a-z]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                              {/[a-z]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>Lowercase letter</span>
                            </li>
                            <li className={`flex items-center space-x-1 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                              {/[A-Z]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>Uppercase letter</span>
                            </li>
                            <li className={`flex items-center space-x-1 ${/[0-9]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                              {/[0-9]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>Number</span>
                            </li>
                            <li className={`flex items-center space-x-1 ${/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                              {/[^A-Za-z0-9]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>Special character</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    {errors.newPassword && (
                      <p className="text-red-500 text-xs flex items-center space-x-1">
                        <X className="w-3 h-3" />
                        <span>{errors.newPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div className="space-y-1.5">
                    <label className="text-gray-700 text-sm font-medium">Confirm New Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full bg-pink-25 border ${errors.confirmPassword ? 'border-red-300' : 'border-pink-200'} rounded-lg px-10 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200`}
                        placeholder="Confirm your new password"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
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

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-pink-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transform transition-all duration-200 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Resetting Password...</span>
                      </div>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>

                  {/* Security notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-700 text-xs">
                      <strong>Security Notice:</strong> After resetting your password, you'll be automatically signed out from all devices. You'll need to sign in again with your new password.
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* Success State */}
            {step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Password Reset Successful!</h3>
                  <p className="text-gray-600 text-sm">
                    Your password has been successfully updated. You can now sign in with your new password.
                  </p>
                </div>
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 text-sm">{successMessage}</p>
                  </div>
                )}
                <div className="space-y-3 pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-700 text-xs">
                      You'll be automatically redirected to the homepage in a few seconds, or you can click the button below to continue.
                    </p>
                  </div>
                  <Link href="/" className="inline-flex items-center justify-center w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-pink-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105">
                    Continue to Homepage
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@pinkdreams.com" className="text-pink-500 hover:text-pink-600 transition-colors">
              support@pinkdreams.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage