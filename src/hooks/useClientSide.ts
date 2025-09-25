import { useEffect, useState } from 'react'

/**
 * Hook to safely check if we're on the client side
 * Prevents hydration mismatches and SSR errors
 */
export function useClientSide() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook to safely access window object
 * Returns null during SSR and window object on client
 */
export function useWindow() {
  const [windowObj, setWindowObj] = useState<Window | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowObj(window)
    }
  }, [])

  return windowObj
}

/**
 * Safe redirect function that works in both SSR and client environments
 */
export function safeRedirect(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}
