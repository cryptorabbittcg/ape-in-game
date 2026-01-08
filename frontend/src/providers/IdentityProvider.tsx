/**
 * IdentityProvider
 * React Context Provider for identity management
 * Replaces ThirdwebProvider
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  isEmbedded,
  requestIdentity,
  setupIdentityListener,
  getDevFallbackIdentity,
} from '../lib/identity-bridge'
import type { ArcadeIdentity, IdentityState } from '../types/identity'

interface IdentityContextType extends IdentityState {}

const IdentityContext = createContext<IdentityContextType | null>(null)

export function useIdentityContext(): IdentityContextType | null {
  return useContext(IdentityContext)
}

interface IdentityProviderProps {
  children: React.ReactNode
}

export function IdentityProvider({ children }: IdentityProviderProps) {
  const [identity, setIdentity] = useState<ArcadeIdentity | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [embedded] = useState(() => isEmbedded())
  
  // Use ref to track if identity has been received (avoids stale closures)
  const identityReceivedRef = useRef(false)

  const handleIdentity = useCallback((receivedIdentity: ArcadeIdentity) => {
    // Prevent duplicate identity handling
    if (identityReceivedRef.current) {
      console.log('⚠️ Identity already received, ignoring duplicate')
      return
    }
    
    console.log('✅ Setting identity:', receivedIdentity)
    identityReceivedRef.current = true
    setIdentity(receivedIdentity)
    setIsReady(true)
    setIsLoading(false)
    setError(null)
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    console.error('❌ Identity error:', errorMessage)
    setError(errorMessage)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (embedded) {
      // Embedded mode: wait for identity from parent
      console.log('🔍 Embedded mode detected, requesting identity...')
      
      // Reset identity received flag
      identityReceivedRef.current = false
      
      // Setup listener first
      const cleanup = setupIdentityListener(handleIdentity, handleError)
      
      // Request identity from parent with retry mechanism
      let retryCount = 0
      const maxRetries = 20 // Retry for up to 10 seconds (20 * 500ms)
      
      const requestIdentityWithRetry = () => {
        if (identityReceivedRef.current) {
          // Identity already received, stop retrying
          return
        }
        
        requestIdentity()
        retryCount++
        
        if (retryCount < maxRetries) {
          // Retry every 500ms
          setTimeout(requestIdentityWithRetry, 500)
        } else {
          console.warn('⏰ Identity request retries exhausted - still waiting for parent')
        }
      }
      
      // Start requesting after a short delay
      const initialTimer = setTimeout(() => {
        requestIdentityWithRetry()
      }, 100)

      return () => {
        clearTimeout(initialTimer)
        cleanup()
      }
    } else {
      // Standalone mode: check for dev fallback
      const allowStandalone = import.meta.env.VITE_ALLOW_STANDALONE === 'true'
      
      if (allowStandalone) {
        console.log('🔧 Standalone mode with dev fallback enabled')
        const devIdentity = getDevFallbackIdentity()
        identityReceivedRef.current = true
        setIdentity(devIdentity)
        setIsReady(true)
        setIsLoading(false)
      } else {
        console.warn('⚠️ Standalone mode but VITE_ALLOW_STANDALONE not set')
        setError('Standalone mode requires VITE_ALLOW_STANDALONE=true')
        setIsLoading(false)
      }
    }
  }, [embedded, handleIdentity, handleError]) // Removed isReady and identity from deps

  const contextValue: IdentityContextType = {
    identity,
    isReady,
    isEmbedded: embedded,
    isLoading,
    error,
  }

  // Show loading state while waiting for identity (embedded mode)
  if (embedded && !isReady && isLoading) {
    return (
      <IdentityContext.Provider value={contextValue}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">Waiting for Arcade Identity...</p>
            <p className="text-slate-500 text-sm mt-2">
              Connecting to parent window
            </p>
          </div>
        </div>
      </IdentityContext.Provider>
    )
  }

  // Show error state
  if (error && !embedded) {
    return (
      <IdentityContext.Provider value={contextValue}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center max-w-md mx-auto p-6 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-300 text-lg mb-2">⚠️ Configuration Error</p>
            <p className="text-slate-300 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-4">
              Set VITE_ALLOW_STANDALONE=true in your .env file for standalone mode
            </p>
          </div>
        </div>
      </IdentityContext.Provider>
    )
  }

  return (
    <IdentityContext.Provider value={contextValue}>
      {children}
    </IdentityContext.Provider>
  )
}

