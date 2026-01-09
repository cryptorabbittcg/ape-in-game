# Supabase Integration - Code Diffs

## Summary

This document shows exact code changes for Supabase integration. All changes ensure:
- ✅ Single client module (no duplicate config)
- ✅ No placeholder URLs anywhere
- ✅ Safe fallbacks (app works without Supabase)
- ✅ No polling/infinite loops
- ✅ Sandy mode never blocked

---

## File: `frontend/src/lib/supabase/client.ts` (NEW FILE)

**Purpose**: Single source of truth for Supabase client configuration

```typescript
/**
 * Supabase Client Module
 * Single source of truth for Supabase client initialization
 * 
 * Returns null if Supabase is not configured (env vars missing)
 * Never throws - app must work without Supabase
 * 
 * Uses fetch API directly (no @supabase/supabase-js dependency required)
 */

// Get environment variables (Vite uses import.meta.env, not process.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Validate Supabase URL format
 */
function isValidSupabaseUrl(url: string): boolean {
  if (!url || url.length === 0) return false
  if (url.includes('placeholder')) return false
  if (url.includes('placeholder.supabase.co')) return false
  if (url.includes('supabase-not-configured')) return false
  if (!url.startsWith('https://')) return false
  // Must be a valid Supabase project URL format
  if (!url.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) return false
  return true
}

/**
 * Validate Supabase anon key format
 */
function isValidSupabaseKey(key: string): boolean {
  if (!key || key.length === 0) return false
  if (key.includes('placeholder')) return false
  // Supabase anon keys are JWT tokens, typically start with 'eyJ'
  if (key.length < 100) return false
  return true
}

/**
 * Check if Supabase is properly configured
 */
export function hasSupabaseConfig(): boolean {
  return isValidSupabaseUrl(SUPABASE_URL) && isValidSupabaseKey(SUPABASE_ANON_KEY)
}

/**
 * Supabase client configuration
 * 
 * - If env vars are missing or invalid: null (app continues without Supabase)
 * - If env vars are valid: returns config object with URL and key
 * 
 * Never throws - always returns null or a valid config
 */
export interface SupabaseConfig {
  url: string
  key: string
  headers: {
    'apikey': string
    'Authorization': string
    'Content-Type': string
  }
}

export const supabase: SupabaseConfig | null = (() => {
  // Early return if not configured
  if (!hasSupabaseConfig()) {
    // Only log once to avoid spam
    const lastWarnTime = sessionStorage.getItem('last_supabase_client_warn_time')
    const now = Date.now()
    if (!lastWarnTime || now - parseInt(lastWarnTime) > 60000) {
      console.warn('⚠️ Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
      sessionStorage.setItem('last_supabase_client_warn_time', now.toString())
    }
    return null
  }

  try {
    // Return configuration object
    const config: SupabaseConfig = {
      url: SUPABASE_URL,
      key: SUPABASE_ANON_KEY,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
    
    console.log('✅ Supabase client initialized')
    return config
  } catch (error) {
    console.error('❌ Failed to create Supabase config:', error)
    return null
  }
})()

// Database schema types exported for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: { ... }
      game_sessions: { ... }
    }
    Functions: {
      get_top_game_scores?: { ... }
    }
  }
}
```

---

## File: `frontend/src/services/supabaseService.ts` (MODIFIED)

### Changes:

1. **Import from client module**:
```typescript
// BEFORE:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// AFTER:
import { supabase, hasSupabaseConfig } from '../lib/supabase/client'
```

2. **fetchLeaderboard() - Use client config**:
```typescript
// BEFORE:
const url = `${SUPABASE_URL}/rest/v1/game_sessions?${queryString}`
const response = await fetch(url, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
})

// AFTER:
if (!supabase || !hasSupabaseConfig()) {
  return []
}
const url = `${supabase.url}/rest/v1/game_sessions?${queryString}`
const response = await fetch(url, {
  headers: supabase.headers,
})
```

3. **fetchPlayerStats() - Use client config**:
```typescript
// BEFORE:
const url = `${SUPABASE_URL}/rest/v1/game_sessions?${params}`

// AFTER:
if (!supabase || !hasSupabaseConfig()) {
  return null
}
const url = `${supabase.url}/rest/v1/game_sessions?${params}`
const response = await fetch(url, {
  headers: supabase.headers,
})
```

4. **Removed all validation/warning code** (moved to client.ts)

---

## File: `frontend/src/lib/arcade-session.ts` (MODIFIED)

### Change: Throttle "✅ Arcade session found" log

```typescript
// BEFORE:
console.log('✅ Arcade session found:', {
  userId: session.userId,
  username: session.username,
  sessionAge: Math.floor(sessionAge / 1000 / 60) + ' minutes old'
})

// AFTER:
// Throttle logging to prevent infinite loop spam - only log once per 10 seconds
const lastFoundLogTime = sessionStorage.getItem('last_session_found_log_time')
const now = Date.now()
if (!lastFoundLogTime || now - parseInt(lastFoundLogTime) > 10000) {
  console.log('✅ Arcade session found:', {
    userId: session.userId,
    username: session.username,
    sessionAge: Math.floor(sessionAge / 1000 / 60) + ' minutes old'
  })
  sessionStorage.setItem('last_session_found_log_time', now.toString())
}
```

---

## File: `frontend/src/components/NewHeader.tsx` (MODIFIED)

### Change: Memoize getArcadeSession() call

```typescript
// BEFORE:
const arcadeSession = getArcadeSession()

// AFTER:
// Get arcade session for stats display - memoize to prevent infinite loop
const [arcadeSession, setArcadeSession] = useState<ReturnType<typeof getArcadeSession>>(null)

useEffect(() => {
  // Only check once on mount and when identity changes
  const session = getArcadeSession()
  setArcadeSession(session)
}, [identity.sessionId]) // Only re-check if session ID changes
```

---

## Files Unchanged (Already Safe)

These files already have proper error handling and no polling:

- ✅ `frontend/src/components/LeaderboardModal.tsx` - No polling, safe fallbacks
- ✅ `frontend/src/components/StatsModal.tsx` - No polling, safe fallbacks  
- ✅ `frontend/src/pages/LeaderboardPage.tsx` - No polling, safe fallbacks
- ✅ `frontend/src/pages/GamePage.tsx` - Sandy mode never calls Supabase

---

## Verification Checklist

- [x] Single client module created
- [x] No placeholder URLs in code
- [x] All Supabase calls check `if (!supabase)` first
- [x] All functions return safe fallbacks
- [x] No polling/retry loops for Supabase
- [x] Session check log throttled
- [x] NewHeader memoized to prevent infinite loop
- [x] Sandy route never awaits Supabase

---

## Environment Variables Required

### Local Development (`frontend/.env`):
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel Deployment:
Add in Vercel Dashboard → Project Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Important**: Redeploy after adding env vars!

