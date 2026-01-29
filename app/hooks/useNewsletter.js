// hooks/useNewsletter.js
'use client'
import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const useNewsletter = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const subscribe = async (email, name = '', source = 'website') => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          source: source
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        return { success: true, message: data.message, data: data }
      } else {
        setError(data.message || 'Subscription failed')
        return { success: false, message: data.message }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection and try again.'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async (email) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${API_BASE}/newsletter/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        return { success: true, message: data.message }
      } else {
        setError(data.message || 'Unsubscribe failed')
        return { success: false, message: data.message }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (email, preferences) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${API_BASE}/newsletter/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), preferences })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        return { success: true, message: data.message, preferences: data.preferences }
      } else {
        setError(data.message || 'Update failed')
        return { success: false, message: data.message }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = () => {
    setError(null)
    setSuccess(false)
  }

  return {
    isLoading,
    error,
    success,
    subscribe,
    unsubscribe,
    updatePreferences,
    clearMessages
  }
}