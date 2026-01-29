// Create this file: components/profile/OAuthSettings.js
'use client'

import React, { useState, useEffect } from 'react'
import { Link, Unlink, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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

const OAuthSettings = () => {
  const { getOAuthStatus, linkOAuthAccount, unlinkOAuthAccount, user } = useAuth()
  
  const [oauthStatus, setOauthStatus] = useState({
    hasGoogle: false,
    hasFacebook: false,
    authProvider: 'local',
    canUnlink: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success', 'error', 'warning'

  useEffect(() => {
    loadOAuthStatus()
  }, [])

  const loadOAuthStatus = async () => {
    try {
      setIsLoading(true)
      const result = await getOAuthStatus()
      
      if (result.success) {
        setOauthStatus(result.oauth)
      } else {
        setMessage('Failed to load OAuth status')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error loading OAuth status:', error)
      setMessage('Error loading OAuth settings')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkAccount = async (provider) => {
    try {
      setActionLoading(provider)
      setMessage('')
      
      const result = await linkOAuthAccount(provider)
      
      if (result.success) {
        // The function will redirect to OAuth provider
        setMessage(`Redirecting to ${provider}...`)
        setMessageType('success')
      } else {
        setMessage(result.error || `Failed to link ${provider} account`)
        setMessageType('error')
      }
    } catch (error) {
      console.error(`Error linking ${provider}:`, error)
      setMessage(`Error linking ${provider} account`)
      setMessageType('error')
    } finally {
      setActionLoading('')
    }
  }

  const handleUnlinkAccount = async (provider) => {
    // Confirmation dialog
    const confirmMessage = `Are you sure you want to unlink your ${provider} account? You will need to use email/password or another linked account to sign in.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setActionLoading(provider)
      setMessage('')
      
      const result = await unlinkOAuthAccount(provider)
      
      if (result.success) {
        setMessage(`${provider} account unlinked successfully`)
        setMessageType('success')
        // Reload OAuth status
        await loadOAuthStatus()
      } else {
        setMessage(result.error || `Failed to unlink ${provider} account`)
        setMessageType('error')
      }
    } catch (error) {
      console.error(`Error unlinking ${provider}:`, error)
      setMessage(`Error unlinking ${provider} account`)
      setMessageType('error')
    } finally {
      setActionLoading('')
    }
  }

  const getProviderInfo = (provider) => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google',
          icon: GoogleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        }
      case 'facebook':
        return {
          name: 'Facebook',
          icon: FacebookIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-3 text-gray-600">Loading OAuth settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-pink-100 rounded-lg">
          <Shield className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Connected Accounts</h3>
          <p className="text-gray-600 text-sm">Manage your social login connections</p>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center space-x-2 ${
          messageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          messageType === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          {messageType === 'success' && <CheckCircle className="w-5 h-5" />}
          {messageType === 'error' && <XCircle className="w-5 h-5" />}
          {messageType === 'warning' && <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* Current Auth Provider Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-800">Primary Authentication</h4>
            <p className="text-sm text-gray-600">
              You signed up using: <span className="font-medium capitalize">{oauthStatus.authProvider}</span>
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              oauthStatus.authProvider === 'local' ? 'bg-gray-100 text-gray-700' :
              oauthStatus.authProvider === 'google' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {oauthStatus.authProvider === 'local' ? 'Email/Password' : 
               oauthStatus.authProvider === 'google' ? 'Google Account' : 'Facebook Account'}
            </span>
          </div>
        </div>
      </div>

      {/* OAuth Providers */}
      <div className="space-y-4">
        {['google', 'facebook'].map((provider) => {
          const providerInfo = getProviderInfo(provider)
          const isConnected = provider === 'google' ? oauthStatus.hasGoogle : oauthStatus.hasFacebook
          const isLoading = actionLoading === provider

          return (
            <div
              key={provider}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                isConnected 
                  ? `${providerInfo.bgColor} ${providerInfo.borderColor}` 
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <providerInfo.icon className="w-6 h-6" />
                  <div>
                    <h4 className="font-medium text-gray-800">{providerInfo.name}</h4>
                    <p className="text-sm text-gray-600">
                      {isConnected 
                        ? `Connected to your ${providerInfo.name} account`
                        : `Connect your ${providerInfo.name} account for easy sign-in`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Connection Status */}
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <CheckCircle className={`w-5 h-5 ${providerInfo.color}`} />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${isConnected ? providerInfo.color : 'text-gray-500'}`}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>

                  {/* Action Button */}
                  {isConnected ? (
                    <button
                      onClick={() => handleUnlinkAccount(provider)}
                      disabled={!oauthStatus.canUnlink || isLoading}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 flex items-center space-x-2 ${
                        !oauthStatus.canUnlink 
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : isLoading
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                      title={!oauthStatus.canUnlink ? 'Cannot unlink the only authentication method' : ''}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                          <span>Unlinking...</span>
                        </>
                      ) : (
                        <>
                          <Unlink className="w-4 h-4" />
                          <span>Unlink</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLinkAccount(provider)}
                      disabled={isLoading}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                        isLoading 
                          ? 'bg-gray-400 cursor-wait' 
                          : `${providerInfo.buttonColor} hover:shadow-md`
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Security Notice</h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              Connecting multiple accounts allows you to sign in using any of the linked methods. 
              You can always unlink accounts except your primary authentication method. 
              For security, we recommend keeping at least one secure authentication method active.
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={loadOAuthStatus}
          disabled={isLoading}
          className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Connection Status'}
        </button>
      </div>
    </div>
  )
}

export default OAuthSettings