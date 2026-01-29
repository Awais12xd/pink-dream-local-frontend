// components/Newsletter.js
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL;


const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage('Please enter your email address')
      setIsError(true)
      setIsSuccess(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address')
      setIsError(true)
      setIsSuccess(false)
      return
    }

    setIsLoading(true)
    setMessage('')
    setIsError(false)
    setIsSuccess(false)

    try {
      const response = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          source: 'website'
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage(data.message)
        setIsSuccess(true)
        setIsError(false)
        
        // Clear form on success
        setEmail('')
        setName('')
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setMessage('')
          setIsSuccess(false)
        }, 5000)
      } else {
        setMessage(data.message || 'Something went wrong. Please try again.')
        setIsError(true)
        setIsSuccess(false)
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      setMessage('Network error. Please check your connection and try again.')
      setIsError(true)
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessage = () => {
    setMessage('')
    setIsError(false)
    setIsSuccess(false)
  }

  return (
    <section className="py-20 bg-gradient-to-r from-pink-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-full">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Stay in Style
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Subscribe to our newsletter for exclusive offers and the latest fashion trends
          </p>

          {/* Newsletter Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input (Optional) */}
            <div className="max-w-md mx-auto">
              <input 
                type="text" 
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-3 rounded-full border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Email Input */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (message) clearMessage()
                }}
                className="flex-1 px-6 py-3 rounded-full border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                required
                disabled={isLoading}
              />
              <motion.button 
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                )}
              </motion.button>
            </div>
          </form>

          {/* Message Display */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mt-6 p-4 rounded-lg max-w-md mx-auto flex items-center space-x-2 ${
                isSuccess 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {isSuccess ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <p className="text-sm">{message}</p>
            </motion.div>
          )}

          {/* Privacy Notice */}
          <div className="mt-8 text-sm text-gray-500">
            <p>
              By subscribing, you agree to receive marketing emails from Pink Dreams. 
              You can unsubscribe at any time.
            </p>
            <p className="mt-2">
              We respect your privacy and will never share your information with third parties.
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span>Exclusive discounts</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span>New arrivals first</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span>Style inspiration</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Newsletter