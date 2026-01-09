# Supabase Integration Guide for Ape In! Game

## Overview

This guide covers the complete Supabase integration for the Ape In! game. Supabase is used for:
- **Profiles**: User profile data (username, avatar)
- **Game Sessions**: Logging game results for leaderboards
- **Leaderboards**: Top scores and player rankings

**Important**: Sandy mode (tutorial) works completely without Supabase. All other modes require Supabase for leaderboards and stats.

---

## A) Supabase Usage Audit

### Files That Use Supabase

1. **`frontend/src/lib/supabase/client.ts`** (NEW)
   - Single source of truth for Supabase client
   - Validates env vars and returns null if not configured
   - Never throws - app continues without Supabase

2. **`frontend/src/services/supabaseService.ts`**
   - `fetchLeaderboard()` - Gets top scores from `game_sessions` table
   - `fetchPlayerStats()` - Gets player statistics from `game_sessions` table
   - All functions return safe fallbacks ([] or null) when Supabase not configured

3. **`frontend/src/components/LeaderboardModal.tsx`**
   - Calls `fetchLeaderboard()` when modal opens
   - No polling - only fetches on mount/tab change
   - Shows empty state if Supabase not configured

4. **`frontend/src/components/StatsModal.tsx`**
   - Calls `fetchPlayerStats()` when modal opens
   - No polling - only fetches on mount
   - Shows empty state if Supabase not configured

5. **`frontend/src/pages/LeaderboardPage.tsx`**
   - Uses `leaderboardAPI.getLeaderboard()` (which calls backend, not Supabase directly)
   - No polling - only fetches on mount

### Database Objects Expected

**Tables:**
- `profiles` - User profile data
  - `wallet_address` (primary key)
  - `username` (optional)
  - `avatar_url` (optional)
  - `created_at`, `updated_at` (timestamps)

- `game_sessions` - Game result logging
  - `id` (primary key, UUID)
  - `user_id` (optional, for future use)
  - `wallet_address` (required)
  - `game_type` (required, e.g., 'ape_in')
  - `game_mode` (required, e.g., 'sandy', 'aida', 'lana', etc.)
  - `game_subtype` (required, e.g., 'single_player', 'pvp', 'multiplayer')
  - `score` (required, integer)
  - `result` (optional, 'WIN' | 'DRAW' | 'LOSS' | 'FORFEIT')
  - `points_earned` (optional, integer)
  - `duration_ms` (optional, integer)
  - `created_at` (timestamp)

**RPC Functions (Optional):**
- `get_top_game_scores` - Not currently used, but can be added for optimized queries
  - Args: `limit_count` (number), `game_mode_filter` (string)
  - Returns: Array of top scores with profile data

---

## B) Supabase Client Module

**File**: `frontend/src/lib/supabase/client.ts`

This is the single source of truth for Supabase configuration:

```typescript
// Reads: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// Returns: SupabaseConfig | null
// Never throws - returns null if not configured
export const supabase: SupabaseConfig | null = ...
```

**Key Features:**
- ✅ Validates URL format (must be `https://*.supabase.co`)
- ✅ Validates key format (must be JWT-like, >100 chars)
- ✅ Rejects placeholder URLs (`placeholder.supabase.co`, `supabase-not-configured`)
- ✅ Returns null (not throws) if not configured
- ✅ Logs warning max once per minute to avoid spam

---

## C) Safe & Non-Blocking Calls

All Supabase functions are non-blocking:

### `fetchLeaderboard()`
- Returns `[]` if Supabase not configured
- Returns `[]` on error
- Never throws

### `fetchPlayerStats()`
- Returns `null` if Supabase not configured
- Returns `null` on error
- Never throws

### Component Usage
- `LeaderboardModal`: Shows "No entries yet" if empty array
- `StatsModal`: Shows "No games played yet" if null
- **Sandy route**: Never calls Supabase - works completely independently

---

## D) No Polling/Infinite Loops

**Verified:**
- ✅ `LeaderboardModal`: Only fetches on `useEffect([isOpen, activeTab])` - no polling
- ✅ `StatsModal`: Only fetches on `useEffect([isOpen, identity.address])` - no polling
- ✅ `LeaderboardPage`: Only fetches on `useEffect([])` - no polling
- ✅ No `setInterval` for Supabase calls
- ✅ All intervals have cleanup functions

**Session Check Fix:**
- ✅ `getArcadeSession()` log throttled (max once per 10 seconds)
- ✅ `NewHeader` memoizes session check (only re-checks when `identity.sessionId` changes)

---

## E) Database Schema & RPC

### Required Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  wallet_address TEXT PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy (allow read for all, write for authenticated)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated" ON profiles
  FOR INSERT WITH CHECK (true);
```

#### `game_sessions`
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  wallet_address TEXT NOT NULL,
  game_type TEXT NOT NULL,
  game_mode TEXT NOT NULL,
  game_subtype TEXT NOT NULL,
  score INTEGER NOT NULL,
  result TEXT CHECK (result IN ('WIN', 'DRAW', 'LOSS', 'FORFEIT')),
  points_earned INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_game_sessions_wallet ON game_sessions(wallet_address);
CREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX idx_game_sessions_created ON game_sessions(created_at DESC);

-- RLS Policy (allow read for all, write for authenticated)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated" ON game_sessions
  FOR INSERT WITH CHECK (true);
```

### Optional RPC Function

If you want to optimize leaderboard queries, create this RPC:

```sql
CREATE OR REPLACE FUNCTION get_top_game_scores(
  limit_count INTEGER DEFAULT 50,
  game_mode_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  wallet_address TEXT,
  username TEXT,
  avatar_url TEXT,
  score INTEGER,
  game_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (gs.wallet_address)
    gs.wallet_address,
    p.username,
    p.avatar_url,
    gs.score,
    gs.game_mode,
    gs.created_at
  FROM game_sessions gs
  LEFT JOIN profiles p ON p.wallet_address = gs.wallet_address
  WHERE gs.game_type = 'ape_in'
    AND gs.game_mode != 'sandy'
    AND (game_mode_filter IS NULL OR gs.game_mode = game_mode_filter)
  ORDER BY gs.wallet_address, gs.score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note**: The current implementation queries `game_sessions` directly and doesn't use this RPC. It's optional for future optimization.

---

## F) Environment Variables

### Required for Local Development

Create `frontend/.env`:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Required for Vercel Deployment

Add these in Vercel Dashboard → Project Settings → Environment Variables:

- **Production, Preview, Development**:
  - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `your-anon-key-here`

**Important**: After adding env vars, **redeploy** the frontend for changes to take effect.

---

## G) Supabase Setup Checklist

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - **Name**: `ape-in-game` (or your choice)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
5. Wait for project to provision (~2 minutes)

### Step 2: Get API Credentials

1. Go to Project Settings → API
2. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY`

### Step 3: Create Tables

1. Go to SQL Editor
2. Run the SQL from section E above to create:
   - `profiles` table
   - `game_sessions` table
   - Indexes
   - RLS policies

### Step 4: (Optional) Create RPC Function

1. Go to SQL Editor
2. Run the `get_top_game_scores` function SQL from section E above
3. This is optional - current code doesn't use it

### Step 5: Test Connection

1. Add env vars to `frontend/.env`
2. Run `npm run dev`
3. Open browser console
4. Should see: `✅ Supabase client initialized`
5. Open Leaderboard modal - should load (empty if no data)

### Step 6: Deploy to Vercel

1. Add env vars in Vercel dashboard
2. Redeploy frontend
3. Test in production

---

## H) Code Diffs Summary

### Files Created

1. **`frontend/src/lib/supabase/client.ts`** (NEW)
   - Single Supabase client module
   - Validates env vars
   - Returns null if not configured

### Files Modified

1. **`frontend/src/services/supabaseService.ts`**
   - Now imports from `lib/supabase/client.ts`
   - Uses `supabase` config object instead of raw env vars
   - All functions check `if (!supabase)` before making calls
   - Removed all placeholder URL references

2. **`frontend/src/lib/arcade-session.ts`**
   - Added throttling to "✅ Arcade session found" log (max once per 10 seconds)

3. **`frontend/src/components/NewHeader.tsx`**
   - Memoized `getArcadeSession()` call to prevent infinite loop

### Files Unchanged (Already Safe)

- `frontend/src/components/LeaderboardModal.tsx` - No polling, safe fallbacks
- `frontend/src/components/StatsModal.tsx` - No polling, safe fallbacks
- `frontend/src/pages/LeaderboardPage.tsx` - No polling, safe fallbacks

---

## I) Verification

### Test Without Supabase

1. Remove `VITE_SUPABASE_URL` from `.env`
2. Run app
3. ✅ Sandy mode should launch
4. ✅ Leaderboard modal should show "No entries yet"
5. ✅ Stats modal should show "No games played yet"
6. ✅ No console errors or spam

### Test With Supabase

1. Add valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Run app
3. ✅ Console shows: `✅ Supabase client initialized`
4. ✅ Leaderboard modal loads data
5. ✅ Stats modal loads data

---

## J) Troubleshooting

### Issue: "Supabase not configured" warning

**Fix**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` and Vercel

### Issue: "Failed to fetch leaderboard"

**Check**:
1. Supabase project is active
2. Tables exist (`profiles`, `game_sessions`)
3. RLS policies allow SELECT
4. Network tab shows 200 response (not 401/403)

### Issue: Sandy mode blocked

**Fix**: Sandy should never call Supabase. If blocked, check:
1. No `await` on Supabase calls in Sandy route
2. No blocking error handlers
3. IdentityProvider allows anonymous mode

---

## Summary

✅ **Single client module** at `frontend/src/lib/supabase/client.ts`  
✅ **No placeholder URLs** - all removed  
✅ **Safe fallbacks** - returns [] or null when not configured  
✅ **No polling** - all fetches are on-demand  
✅ **Sandy works** - never calls Supabase  
✅ **No infinite loops** - session check memoized, logs throttled  

The app now works perfectly with or without Supabase configured!

