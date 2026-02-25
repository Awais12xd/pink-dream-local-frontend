// Create this file: pages/auth/callback.js
'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

const AuthCallback = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleOAuthCallback } = useAuth()
  
  const [status, setStatus] = useState('processing') // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing authentication...')
  const [provider, setProvider] = useState('')

  const hasProcessedRef = useRef(false)
const redirectTimerRef = useRef(null)


useEffect(() => {
  if (hasProcessedRef.current) return
  hasProcessedRef.current = true

  const processCallback = async () => {
    try {
      const token = searchParams.get('token')
      const error = searchParams.get('error')
      const success = searchParams.get('success')
      const authProvider = searchParams.get('provider')

      setProvider(authProvider || '')

      if (error) {
        const errorMessages = {
          google_auth_failed: 'Google authentication failed. Please try again.',
          facebook_auth_failed: 'Facebook authentication failed. Please try again.',
          google_callback_failed: 'Google authentication callback failed.',
          facebook_callback_failed: 'Facebook authentication callback failed.',
          access_denied: 'Access was denied. Please try again.',
          invalid_request: 'Invalid authentication request.'
        }

        setStatus('error')
        setMessage(errorMessages[error] || 'Authentication failed. Please try again.')
        redirectTimerRef.current = setTimeout(() => router.push('/'), 3000)
        return
      }

      if (token && success === 'true') {
        const result = await handleOAuthCallback(token, authProvider)

        if (result.success) {
          setStatus('success')
          setMessage(`Successfully signed in with ${authProvider}!`)
          redirectTimerRef.current = setTimeout(() => router.push('/'), 1200)
        } else {
          setStatus('error')
          setMessage(result.error || 'Authentication failed')
          redirectTimerRef.current = setTimeout(() => router.push('/'), 3000)
        }
      } else {
        setStatus('error')
        setMessage('Invalid authentication response')
        redirectTimerRef.current = setTimeout(() => router.push('/'), 3000)
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      setStatus('error')
      setMessage('An unexpected error occurred')
      redirectTimerRef.current = setTimeout(() => router.push('/'), 3000)
    }
  }

  processCallback()

  return () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
  }
}, [searchParams, router, handleOAuthCallback])


  const getProviderName = (provider) => {
    switch (provider) {
      case 'google': return 'Google'
      case 'facebook': return 'Facebook'
      default: return 'OAuth'
    }
  }

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'google': return 'text-red-600'
      case 'facebook': return 'text-blue-600'
      default: return 'text-pink-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">
          {status === 'processing' && (
            <div className="w-16 h-16 mx-auto bg-pink-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {status === 'processing' && 'Signing you in...'}
          {status === 'success' && 'Welcome to Pink Dreams!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Provider info */}
        {provider && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-600">Authentication via</span>
              <span className={`font-semibold ${getProviderColor(provider)}`}>
                {getProviderName(provider)}
              </span>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {status === 'processing' && (
          <div className="space-y-3">
            <div className="bg-pink-100 rounded-full h-2">
              <div className="bg-pink-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-gray-500">
              Please wait while we complete your authentication...
            </p>
          </div>
        )}

        {/* Success actions */}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">
                You will be redirected to the homepage shortly.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-pink-500 hover:to-pink-600 transition-all duration-200"
            >
              Continue to Pink Dreams
            </button>
          </div>
        )}

        {/* Error actions */}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">
                You will be redirected to the homepage shortly.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200"
            >
              Return to Homepage
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Having trouble? <a href="/contact" className="text-pink-600 hover:text-pink-700">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback