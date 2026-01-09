# PostMessage Handshake Fixes - Implementation Summary

## Overview
Fixed postMessage handshake between arcade hub (parent) and ape-in-game (child iframe), ensuring Sandy mode can launch without session, and preventing Supabase errors from blocking UI.

---

## ✅ Child (ape-in-game) Changes

### Files Modified:

#### 1. `frontend/src/types/identity.ts`
- **Added**: `ARCADE_SESSION_REQUEST` message type
- **Kept**: `ARCADE_REQUEST_IDENTITY` for backward compatibility

#### 2. `frontend/src/lib/identity-bridge.ts`
**Key Changes:**
- **Parent origin tracking**: Stores parent origin from first received message for secure postMessage
- **Exact origin postMessage**: Uses stored parent origin instead of '*' when available
- **ARCADE_SESSION_REQUEST**: New `requestSession()` function sends `ARCADE_SESSION_REQUEST` (plus legacy `ARCADE_REQUEST_IDENTITY` for compatibility)
- **Session storage**: `storeArcadeSession()` stores received identity in localStorage as `crypto_rabbit_session` for compatibility with `getArcadeSession()`
- **Origin allowlist**: Validates parent origin against allowlist (`arcade.thecryptorabbithole.io` + localhost)

**Code Diff:**
```typescript
// Added parent origin tracking
let parentOrigin: string | null = null

// Get parent origin for secure postMessage
function getParentOrigin(): string {
  if (parentOrigin) return parentOrigin
  // Try document.referrer, fallback to '*' for initial handshake
  // ...
}

// Send with exact origin when known
export function sendToParent(message: ArcadeMessage, targetOrigin?: string): void {
  const origin = targetOrigin || getParentOrigin()
  window.parent.postMessage(message, origin) // Uses exact origin, not '*'
}

// New session request function
export function requestSession(): void {
  sendToParent({ type: 'ARCADE_SESSION_REQUEST' })
  sendToParent({ type: 'ARCADE_REQUEST_IDENTITY' }) // Legacy support
}

// Store session in localStorage after receiving ARCADE_IDENTITY
function storeArcadeSession(identity: ArcadeIdentity, rawMessage: any): void {
  const session: ArcadeSession = {
    sessionId: identity.sessionId || `session-${Date.now()}`,
    userId: identity.userId || `user-${Date.now()}`,
    username: identity.username || identity.displayName || 'Guest',
    address: identity.address,
    thirdwebClientId: rawMessage.thirdwebClientId || rawMessage.session?.thirdwebClientId || '',
    tickets: rawMessage.tickets ?? rawMessage.session?.tickets ?? 0,
    points: rawMessage.points ?? rawMessage.session?.points ?? 0,
    timestamp: Date.now(),
  }
  localStorage.setItem('crypto_rabbit_session', JSON.stringify(session))
  sessionStorage.setItem('crypto_rabbit_session', JSON.stringify(session))
}
```

#### 3. `frontend/src/providers/IdentityProvider.tsx`
**Key Changes:**
- **Retry loop**: Continuous retry every 500ms until session received (up to 60 retries = 30 seconds)
- **Anonymous mode**: After retries exhausted, allows app to continue without identity (enables Sandy mode)
- **Uses `requestSession()`**: Calls new `requestSession()` function

**Code Diff:**
```typescript
// Retry loop with interval
let retryInterval: NodeJS.Timeout | null = null
const requestSessionWithRetry = () => {
  if (identityReceivedRef.current) {
    if (retryInterval) clearInterval(retryInterval)
    return
  }
  requestSession() // Uses ARCADE_SESSION_REQUEST
  retryCount++
  if (retryCount >= maxRetries) {
    // Don't block - allow anonymous mode for Sandy
    setIsLoading(false)
    setIsReady(true) // Allows Sandy to launch
  }
}
requestSessionWithRetry() // Immediate first request
retryInterval = setInterval(requestSessionWithRetry, 500) // Retry every 500ms
```

#### 4. `frontend/src/lib/arcade-session.ts`
**Key Changes:**
- **Reduced logging**: Prevents console spam by logging "No arcade session found" max once per 5 seconds
- **Sandy-friendly**: Returns null gracefully without blocking

**Code Diff:**
```typescript
if (!stored) {
  // Don't log repeatedly - only log once per session check
  const lastLogTime = sessionStorage.getItem('last_session_log_time')
  const now = Date.now()
  if (!lastLogTime || now - parseInt(lastLogTime) > 5000) {
    console.log('🔍 No arcade session found (this is OK for Sandy/anonymous mode)')
    sessionStorage.setItem('last_session_log_time', now.toString())
  }
  return null
}
```

#### 5. `frontend/src/services/supabaseService.ts`
**Key Changes:**
- **No placeholder fallback**: Removed any `placeholder.supabase.co` fallback - env-only configuration
- **Non-blocking**: All Supabase calls wrapped in try/catch, return empty data on error
- **Reduced logging**: Logs warnings max once per 10 seconds to prevent console spam

**Code Diff:**
```typescript
// No fallback - env only
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check for placeholder.supabase.co and reject it
if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder') || SUPABASE_URL.includes('placeholder.supabase.co')) {
  console.warn('⚠️ Supabase URL not configured...')
}

// All queries wrapped in try/catch, return empty data on error
async function supabaseQuery(...): Promise<any> {
  if (!hasSupabaseConfig()) {
    return { data: [], error: null } // Never blocks
  }
  try {
    // ... fetch logic
  } catch (error) {
    console.error('❌ Supabase query error (non-blocking):', error)
    return { data: [], error: ... } // Never throws
  }
}
```

---

## 🔧 Parent (Arcade Hub) Code Required

The parent window (arcade hub) needs to implement the following:

### 1. Listen for `ARCADE_SESSION_REQUEST`

```javascript
// In arcade hub code
window.addEventListener('message', (event) => {
  // Validate origin - only accept from ape-in-game iframe
  const allowedChildOrigins = [
    'https://ape-in-game.yourdomain.com', // Production
    'http://localhost:5173',              // Dev
    'http://127.0.0.1:5173',              // Dev
  ]
  
  if (!allowedChildOrigins.includes(event.origin)) {
    console.warn('⚠️ Rejected message from unauthorized origin:', event.origin)
    return
  }
  
  const message = event.data
  
  // Handle ARCADE_SESSION_REQUEST (new protocol)
  if (message.type === 'ARCADE_SESSION_REQUEST') {
    console.log('🔄 Child requested session, sending ARCADE_IDENTITY...')
    sendArcadeIdentity(event.origin) // ⚠️ CRITICAL: Use exact origin, not '*'
  }
  
  // Also handle legacy ARCADE_REQUEST_IDENTITY for backward compatibility
  if (message.type === 'ARCADE_REQUEST_IDENTITY') {
    console.log('🔄 Child requested identity (legacy), sending ARCADE_IDENTITY...')
    sendArcadeIdentity(event.origin) // ⚠️ CRITICAL: Use exact origin, not '*'
  }
})
```

### 2. Send `ARCADE_IDENTITY` to Exact Origin

```javascript
// In arcade hub code
function sendArcadeIdentity(targetOrigin) {
  // Get iframe reference (or use event.source if available)
  const iframe = document.querySelector('iframe[src*="ape-in-game"]')
  const iframeWindow = iframe?.contentWindow || event.source
  
  // Prepare ARCADE_IDENTITY message
  const identityMessage = {
    type: 'ARCADE_IDENTITY',
    // Include all session data (flattened or in session object)
    sessionId: currentSession.sessionId,
    userId: currentSession.userId,
    username: currentSession.username,
    address: currentSession.address,
    thirdwebClientId: currentSession.thirdwebClientId,
    points: currentSession.points,
    tickets: currentSession.tickets,
    avatar: currentSession.avatar, // base64 image if available
    chainId: currentSession.chainId,
    // OR send as nested session object:
    // session: {
    //   sessionId: currentSession.sessionId,
    //   userId: currentSession.userId,
    //   // ... etc
    // }
    timestamp: Date.now()
  }
  
  // ⚠️ CRITICAL: Send to EXACT origin, not '*'
  iframeWindow.postMessage(identityMessage, targetOrigin)
  
  console.log('📤 Sent ARCADE_IDENTITY to child:', {
    origin: targetOrigin,
    sessionId: identityMessage.sessionId,
    username: identityMessage.username
  })
}
```

### 3. Send Identity on Iframe Load (Optional but Recommended)

```javascript
// In arcade hub code - send identity immediately when iframe loads
const iframe = document.querySelector('iframe[src*="ape-in-game"]')
if (iframe) {
  iframe.addEventListener('load', () => {
    // Get iframe origin from src
    const iframeUrl = new URL(iframe.src)
    const iframeOrigin = iframeUrl.origin
    
    // Send identity immediately (child will also request it)
    setTimeout(() => {
      sendArcadeIdentity(iframeOrigin)
    }, 100) // Small delay to ensure iframe is ready
  })
}
```

---

## 🎯 Key Points for Parent Implementation

1. **Exact Origin Required**: Always use `event.origin` or iframe's exact origin when calling `postMessage()`, never use `'*'`
2. **Handle Both Message Types**: Listen for both `ARCADE_SESSION_REQUEST` (new) and `ARCADE_REQUEST_IDENTITY` (legacy)
3. **Origin Validation**: Validate child origin against allowlist before processing messages
4. **Immediate Send**: Optionally send `ARCADE_IDENTITY` immediately when iframe loads (child will also request it)

---

## ✅ Verification Checklist

- [x] Child sends `ARCADE_SESSION_REQUEST` in retry loop
- [x] Child stores received session in localStorage as `crypto_rabbit_session`
- [x] Child uses exact parent origin for postMessage (not '*')
- [x] Child allowlists parent origins (`arcade.thecryptorabbithole.io` + localhost)
- [x] Sandy mode can launch without session (anonymous mode)
- [x] Supabase errors never block UI (all wrapped in try/catch)
- [x] No `placeholder.supabase.co` fallback (env-only)
- [ ] **Parent sends `ARCADE_IDENTITY` to exact origin (not '*')** ← Parent must implement
- [ ] **Parent listens for `ARCADE_SESSION_REQUEST`** ← Parent must implement

---

## 📝 Testing

1. **Test Handshake**:
   - Open arcade hub with ape-in-game iframe
   - Check console for `ARCADE_SESSION_REQUEST` messages from child
   - Verify parent responds with `ARCADE_IDENTITY` to exact origin
   - Verify child logs "✅ Identity received and mapped"
   - Verify session stored in localStorage as `crypto_rabbit_session`

2. **Test Sandy Mode**:
   - Navigate to `/game/sandy` in iframe
   - Verify Sandy launches even without session
   - Verify no blocking errors

3. **Test Supabase**:
   - Remove `VITE_SUPABASE_URL` from env
   - Verify app still loads (no blocking errors)
   - Verify leaderboard/stats return empty data gracefully

---

## 🔍 Debugging

**If child never receives ARCADE_IDENTITY:**
1. Check parent console for `ARCADE_SESSION_REQUEST` messages
2. Verify parent is sending to exact origin (not '*')
3. Check child console for origin validation warnings
4. Verify parent origin is in child's `ALLOWED_ORIGINS` list

**If "No arcade session found" keeps logging:**
- This is now throttled to max once per 5 seconds
- Check if session is being stored after receiving `ARCADE_IDENTITY`
- Verify localStorage has `crypto_rabbit_session` key

**If Supabase errors block UI:**
- All Supabase calls are now wrapped in try/catch
- Errors return empty data, never throw
- Check console for "(non-blocking)" error messages

