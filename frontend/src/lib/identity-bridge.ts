/**
 * Identity Bridge for walletless embedded game
 * Handles postMessage communication with parent window (Arcade Hub)
 */

import type { ArcadeIdentity, ArcadeMessage, ArcadeMessageType } from '../types/identity'

// Allowed origins for postMessage security
const ALLOWED_ORIGINS = [
  'https://arcade.thecryptorabbithole.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]

/**
 * Check if current window is embedded in an iframe
 */
export function isEmbedded(): boolean {
  try {
    return window.self !== window.top
  } catch (e) {
    // Cross-origin iframe will throw error
    return true
  }
}

/**
 * Validate origin against allowlist
 */
function isValidOrigin(origin: string): boolean {
  // Allow localhost during development
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true
  }
  
  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Send message to parent window
 */
export function sendToParent(message: ArcadeMessage): void {
  if (!isEmbedded()) {
    console.log('⚠️ Not embedded, skipping postMessage to parent')
    return
  }

  try {
    if (window.parent && window.parent !== window.self) {
      window.parent.postMessage(message, '*') // '*' allows any origin - parent validates
      console.log('📤 Sent message to parent:', message.type)
    }
  } catch (error) {
    console.error('❌ Failed to send message to parent:', error)
  }
}

/**
 * Request identity from parent window
 */
export function requestIdentity(): void {
  if (!isEmbedded()) {
    console.log('⚠️ Not embedded, skipping identity request')
    return
  }

  // Send both ping and request
  sendToParent({ type: 'ARCADE_PING' })
  sendToParent({ type: 'ARCADE_REQUEST_IDENTITY' })
}

/**
 * Setup message listener for identity from parent
 */
export function setupIdentityListener(
  onIdentity: (identity: ArcadeIdentity) => void,
  onError?: (error: string) => void
): () => void {
  const messageHandler = (event: MessageEvent<ArcadeMessage>) => {
    // Validate origin
    if (!isValidOrigin(event.origin)) {
      console.warn('⚠️ Rejected message from unauthorized origin:', event.origin)
      return
    }

    const message = event.data

    // Validate message structure
    if (!message || typeof message !== 'object' || !message.type) {
      return
    }

    console.log('📥 Received message from parent:', message.type)

    // Handle identity response
    if (message.type === 'ARCADE_IDENTITY' && message.data) {
      const identity = message.data

      // Validate identity data
      if (!identity.address) {
        const error = 'Invalid identity: missing address'
        console.error('❌', error)
        onError?.(error)
        return
      }

      console.log('✅ Identity received:', {
        address: identity.address,
        displayName: identity.displayName || identity.username,
        origin: event.origin
      })

      onIdentity(identity)
    } else if (message.type === 'ARCADE_PONG') {
      console.log('✅ Received PONG from parent')
    }
  }

  window.addEventListener('message', messageHandler)
  console.log('👂 Listening for identity messages from parent')

  // Return cleanup function
  return () => {
    window.removeEventListener('message', messageHandler)
    console.log('🔇 Stopped listening for identity messages')
  }
}

/**
 * Get dev fallback identity for standalone mode
 */
export function getDevFallbackIdentity(): ArcadeIdentity {
  return {
    address: '0xDev0000000000000000000000000000000000000',
    displayName: 'Dev Player',
    username: 'Dev Player',
    userId: 'dev-user-001',
    sessionId: 'dev-session-' + Date.now(),
    chainId: import.meta.env.VITE_CHAIN_ID || '33111',
  }
}

