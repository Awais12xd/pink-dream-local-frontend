// utils/imageUtils.js
import { useState, useEffect } from 'react'

const FALLBACK_IMAGE = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams'
const ERROR_IMAGE = 'https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image'

export const getImageSrc = (imageSrc, fallback = FALLBACK_IMAGE) => {
  // Return fallback if no image source
  if (!imageSrc) return fallback
  
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  
  // Handle old Railway URLs - replace with new Render URL
  if (imageSrc.includes('railway.app')) {
    const filename = imageSrc.split('/images/')[1]
    if (filename) {
      return `${baseURL}/images/${filename}`
    }
  }
  
  // If it's already a full URL (http or https), return as is
  if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
    return imageSrc
  }
  
  // If it's a relative path starting with /images/, construct the full URL
  if (imageSrc.startsWith('/images/')) {
    return `${baseURL}${imageSrc}`
  }
  
  // If it's just a filename (like "product_1752850601329.png"), construct the full URL
  if (!imageSrc.includes('/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(imageSrc)) {
    return `${baseURL}/images/${imageSrc}`
  }
  
  // If it starts with 'images/' (without leading slash), add the base URL
  if (imageSrc.startsWith('images/')) {
    return `${baseURL}/${imageSrc}`
  }
  
  // Default case - assume it's a relative path and prepend base URL
  return `${baseURL}/${imageSrc}`
}

// Image error handler
export const handleImageError = (e, fallbackImage = ERROR_IMAGE) => {
  if (e.target.src !== fallbackImage) {
    e.target.onerror = null // Prevent infinite loop
    e.target.src = fallbackImage
  }
}

// React hook for image loading with error handling
export const useImageWithFallback = (src, fallback = FALLBACK_IMAGE) => {
  const [imageSrc, setImageSrc] = useState(getImageSrc(src, fallback))
  const [isError, setIsError] = useState(false)
  
  useEffect(() => {
    setImageSrc(getImageSrc(src, fallback))
    setIsError(false)
  }, [src, fallback])
  
  const handleError = () => {
    if (!isError) {
      setIsError(true)
      setImageSrc(ERROR_IMAGE)
    }
  }
  
  return { imageSrc, handleError, isError }
}


export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  if (!baseUrl) {
    throw new Error("BASE_URL is not defined in env");
  }

  try {
    // If it's already a valid URL, parse it
    const parsed = new URL(url);
    return `${baseUrl}${parsed.pathname}`;
  } catch {
    // If it's NOT a full URL, assume it's already a path
    if (url.startsWith("/images")) {
      return `${baseUrl}${url}`;
    }
    return null;
  }
}

// Export constants
export { FALLBACK_IMAGE, ERROR_IMAGE }