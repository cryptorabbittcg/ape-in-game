/**
 * Identity Bridge for walletless embedded game
 * Handles postMessage communication with parent window (Arcade Hub)
 */

import type { ArcadeIdentity, ArcadeMessage } from '../types/identity'
import type { ArcadeSession } from './arcade-session'

// Allowed origins for postMessage security
// Only accept messages from the arcade hub (parent window)
const ALLOWED_ORIGINS = [
  'https://arcade.thecryptorabbithole.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]

// Store parent origin when we receive first message from it
let parentOrigin: string | null = null

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
 * Get parent origin for secure postMessage
 * Falls back to '*' if parent origin is unknown (for initial handshake)
 */
function getParentOrigin(): string {
  // Use stored parent origin if available
  if (parentOrigin) {
    return parentOrigin
  }
  
  // Try to get from document.referrer (may not work in cross-origin)
  try {
    if (document.referrer) {
      const referrerUrl = new URL(document.referrer)
      const origin = referrerUrl.origin
      if (isValidOrigin(origin)) {
        parentOrigin = origin
        return origin
      }
    }
  } catch (e) {
    // Cross-origin referrer may not be accessible
  }
  
  // Fallback to '*' for initial handshake (parent will validate)
  return '*'
}

/**
 * Send message to parent window
 * Uses exact parent origin when known, otherwise '*' for initial handshake
 */
export function sendToParent(message: ArcadeMessage, targetOrigin?: string): void {
  if (!isEmbedded()) {
    console.log('⚠️ Not embedded, skipping postMessage to parent')
    return
  }

  try {
    if (window.parent && window.parent !== window.self) {
      const origin = targetOrigin || getParentOrigin()
      window.parent.postMessage(message, origin)
      console.log('📤 Sent message to parent:', message.type, 'Origin:', origin)
    }
  } catch (error) {
    console.error('❌ Failed to send message to parent:', error)
  }
}

/**
 * Request session from parent window
 * Uses ARCADE_SESSION_REQUEST message type
 */
export function requestSession(): void {
  if (!isEmbedded()) {
    console.log('⚠️ Not embedded, skipping session request')
    return
  }

  // Send session request (new protocol)
  sendToParent({ type: 'ARCADE_SESSION_REQUEST' })
  
  // Also send legacy request for backward compatibility
  sendToParent({ type: 'ARCADE_REQUEST_IDENTITY' })
}

/**
 * Store arcade session in localStorage for compatibility with getArcadeSession()
 */
function storeArcadeSession(identity: ArcadeIdentity, rawMessage: any): void {
  try {
    // Extract thirdwebClientId from message if available
    const thirdwebClientId = rawMessage.thirdwebClientId || rawMessage.session?.thirdwebClientId || import.meta.env.VITE_THIRDWEB_CLIENT_ID || ''
    
    // Extract points and tickets if available
    const points = rawMessage.points ?? rawMessage.session?.points ?? 0
    const tickets = rawMessage.tickets ?? rawMessage.session?.tickets ?? 0
    
    // Create session object compatible with ArcadeSession interface
    const session: ArcadeSession = {
      sessionId: identity.sessionId || `session-${Date.now()}`,
      userId: identity.userId || `user-${Date.now()}`,
      username: identity.username || identity.displayName || 'Guest',
      address: identity.address,
      thirdwebClientId: thirdwebClientId,
      tickets: tickets,
      points: points,
      timestamp: Date.now(),
    }
    
    // Store in both localStorage and sessionStorage for cross-tab compatibility
    const sessionJson = JSON.stringify(session)
    localStorage.setItem('crypto_rabbit_session', sessionJson)
    sessionStorage.setItem('crypto_rabbit_session', sessionJson)
    
    console.log('💾 Stored arcade session in localStorage:', {
      sessionId: session.sessionId,
      userId: session.userId,
      username: session.username,
    })
  } catch (error) {
    console.error('❌ Failed to store arcade session:', error)
  }
}

/**
 * Setup message listener for identity from parent
 * Implements robust handshake with retry mechanism
 */
export function setupIdentityListener(
  onIdentity: (identity: ArcadeIdentity) => void,
  onError?: (error: string) => void
): () => void {
  const messageHandler = (event: MessageEvent<ArcadeMessage>) => {
    // Log ALL messages for comprehensive debugging
    console.log('📨 Message event received:', {
      origin: event.origin,
      ownOrigin: window.location.origin,
      type: event.data?.type,
      isValidOrigin: isValidOrigin(event.origin),
      isFromSelf: event.origin === window.location.origin,
      isEmbedded: isEmbedded(),
      hasParent: window.parent !== window.self,
    })

    // ⚠️ CRITICAL: Ignore messages from self (iframe sending to itself)
    if (event.origin === window.location.origin) {
      console.log('⏭️ Ignoring message from self (own origin)')
      return
    }

    // ✅ Accept messages from PARENT (arcade hub)
    // Enhanced validation: check if message is from parent window
    const isFromParent = isEmbedded() && window.parent !== window.self
    
    if (!isValidOrigin(event.origin)) {
      // If we're embedded and this might be from parent, log more details
      if (isFromParent) {
        console.warn('⚠️ Message from parent but origin not in allowlist:', {
          origin: event.origin,
          allowedOrigins: ALLOWED_ORIGINS,
          isEmbedded,
          parentOrigin: 'unknown (cross-origin)',
        })
      } else {
        console.warn('⚠️ Rejected message from unauthorized origin:', event.origin, 'Allowed origins:', ALLOWED_ORIGINS)
      }
      return
    }

    // Store parent origin for future secure postMessage
    if (isFromParent && !parentOrigin) {
      parentOrigin = event.origin
      console.log('✅ Stored parent origin:', parentOrigin)
    }

    const message = event.data

    // Validate message structure
    if (!message || typeof message !== 'object' || !message.type) {
      console.warn('⚠️ Invalid message structure:', message)
      return
    }

    console.log('✅ Received valid message from parent:', message.type, 'Origin:', event.origin)
    console.log('📦 Full message data:', JSON.stringify(message, null, 2))

    // Handle identity response
    if (message.type === 'ARCADE_IDENTITY') {
      console.log('🎯 Processing ARCADE_IDENTITY message...')
      // Arcade sends identity in message.session OR as flattened properties on message
      // Structure: { type: "ARCADE_IDENTITY", session: {...}, sessionId, userId, username, address, ... }
      const sessionData = (message as any).session || message
      const flattenedData = message as any

      // Extract identity - prefer flattened properties, fallback to session object
      const rawAddress = flattenedData.address ?? sessionData.address
      const rawUsername = flattenedData.username ?? sessionData.username
      const rawUserId = flattenedData.userId ?? sessionData.userId
      const rawSessionId = flattenedData.sessionId ?? sessionData.sessionId
      // Arcade sends avatar as base64 image in "avatar" field (not "avatarUrl")
      const rawAvatar = flattenedData.avatar ?? sessionData.avatar

      // Log the received structure for debugging
      console.log('📦 Parsing identity from arcade message:', {
        hasSession: !!(message as any).session,
        hasFlattened: !!(flattenedData.address || flattenedData.username),
        rawAddress,
        rawUsername,
        rawUserId,
        hasAvatar: !!rawAvatar
      })

      // Handle guest users (address can be null from arcade)
      // Generate a guest address if needed (Ape In requires address)
      let address = rawAddress
      if (!address || address === null) {
        // Generate a deterministic guest address from userId/sessionId
        const guestId = rawUserId || rawSessionId || `guest-${Date.now()}`
        // Create a pseudo-address for guests (not a real wallet, but consistent)
        address = `0xGuest${guestId.slice(0, 40).padEnd(40, '0')}`
        console.log('👤 Guest user detected, generated guest address:', address)
      }

      // Validate required fields
      if (!address) {
        const error = 'Invalid identity: missing address'
        console.error('❌', error)
        onError?.(error)
        return
      }

      // Map arcade session structure to Ape In's ArcadeIdentity format
      const identity: ArcadeIdentity = {
        address: address,
        username: rawUsername || 'Guest',
        displayName: rawUsername || 'Guest',
        userId: rawUserId,
        sessionId: rawSessionId,
        // Optional fields from arcade (if available)
        chainId: flattenedData.chainId ?? sessionData.chainId,
        // Arcade sends avatar as base64 image in "avatar" field
        avatarUrl: rawAvatar || flattenedData.avatarUrl || sessionData.avatarUrl,
      }

      console.log('✅ Identity received and mapped:', {
        address: identity.address,
        username: identity.username,
        displayName: identity.displayName,
        userId: identity.userId,
        sessionId: identity.sessionId,
        hasAvatar: !!identity.avatarUrl,
        origin: event.origin
      })

      // Store session in localStorage for getArcadeSession() compatibility
      storeArcadeSession(identity, message as any)

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
 * Request identity from parent window (legacy function name)
 * Now uses ARCADE_SESSION_REQUEST
 */
export function requestIdentity(): void {
  requestSession()
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

