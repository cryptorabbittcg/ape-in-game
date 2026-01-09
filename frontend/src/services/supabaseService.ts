/**
 * Supabase Service
 * Handles queries to Supabase game_sessions table for leaderboard and stats
 */

// Get Supabase config from environment only - no fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validate Supabase configuration (non-blocking - only logs warnings once)
// Check for any invalid URL patterns that would cause failed requests
const isValidSupabaseUrl = (url: string): boolean => {
  if (!url || url.length === 0) return false
  if (url.includes('placeholder')) return false
  if (url.includes('placeholder.supabase.co')) return false
  if (url.includes('supabase-not-configured')) return false
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  return true
}

if (!isValidSupabaseUrl(SUPABASE_URL)) {
  const lastWarnTime = sessionStorage.getItem('last_supabase_url_warn_time')
  const now = Date.now()
  if (!lastWarnTime || now - parseInt(lastWarnTime) > 30000) {
    console.warn('⚠️ Supabase URL not configured. Please set VITE_SUPABASE_URL environment variable.')
    sessionStorage.setItem('last_supabase_url_warn_time', now.toString())
  }
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('placeholder')) {
  const lastWarnTime = sessionStorage.getItem('last_supabase_key_warn_time')
  const now = Date.now()
  if (!lastWarnTime || now - parseInt(lastWarnTime) > 30000) {
    console.warn('⚠️ Supabase key not configured. Please set VITE_SUPABASE_ANON_KEY environment variable.')
    sessionStorage.setItem('last_supabase_key_warn_time', now.toString())
  }
}

export interface GameSession {
  id: string
  user_id?: string
  wallet_address: string
  game_type: string
  game_mode: string
  game_subtype: string
  score: number
  result?: 'WIN' | 'DRAW' | 'LOSS' | 'FORFEIT'
  points_earned?: number
  duration_ms?: number
  created_at: string
  profiles?: {
    wallet_address: string
    username?: string
    avatar_url?: string
  }
}

export interface LeaderboardEntry {
  rank: number
  walletAddress: string
  username?: string
  avatarUrl?: string
  score: number
  gameMode: string
  timeSeconds?: number
  createdAt: string
}

export interface PlayerStats {
  totalGames: number
  wins: number
  losses: number
  winRate: number
  totalPoints: number
  averageScore: number
  bestScore: number
  currentWinStreak: number
  bestWinStreak: number
  totalPlayTime: number
  averageTime: number
  bestTime?: number
  modeBreakdown: Record<string, {
    games: number
    wins: number
    bestScore: number
  }>
  subtypeBreakdown: Record<string, {
    games: number
    wins: number
    bestScore: number
  }>
}

/**
 * Check if Supabase is properly configured
 * Returns false if URL/key are missing or contain placeholder values
 * Never blocks UI - all Supabase calls are non-blocking
 */
export function hasSupabaseConfig(): boolean {
  // Strict validation - must be a valid HTTPS URL and have a key
  const hasUrl = !!(SUPABASE_URL && 
                   !SUPABASE_URL.includes('placeholder') && 
                   !SUPABASE_URL.includes('placeholder.supabase.co') &&
                   !SUPABASE_URL.includes('supabase-not-configured') &&
                   SUPABASE_URL.startsWith('https://') &&
                   SUPABASE_URL.length > 0)
  const hasKey = !!(SUPABASE_ANON_KEY && 
                   !SUPABASE_ANON_KEY.includes('placeholder') &&
                   SUPABASE_ANON_KEY.length > 0)
  const isConfigured = hasUrl && hasKey
  
  // Only log once to avoid console spam
  if (!isConfigured) {
    const lastLogTime = sessionStorage.getItem('last_supabase_log_time')
    const now = Date.now()
    if (!lastLogTime || now - parseInt(lastLogTime) > 10000) {
      console.log('🔍 Supabase config check:', {
        hasUrl,
        hasKey,
        urlConfigured: hasUrl,
        keyConfigured: hasKey,
        isConfigured: false,
        note: 'Supabase calls will be skipped (non-blocking)'
      })
      sessionStorage.setItem('last_supabase_log_time', now.toString())
    }
  }
  
  return isConfigured
}

/**
 * Make a Supabase query (non-blocking - returns empty data if not configured)
 * Wrapped in try/catch to ensure errors never block UI
 */
async function supabaseQuery(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  // Early return if not configured - never block
  if (!hasSupabaseConfig()) {
    return { data: [], error: null } // Return empty data, not an error
  }

  const queryString = new URLSearchParams(params).toString()
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}${queryString ? `?${queryString}` : ''}`

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('❌ Supabase query failed:', response.status, errorText)
      return { data: [], error: `Query failed: ${response.status}` }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    // Catch all errors to prevent UI blocking
    console.error('❌ Supabase query error (non-blocking):', error)
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Fetch leaderboard entries from Supabase
 * @param subtype - Filter by game_subtype ('single_player', 'pvp', 'multiplayer', or null for all)
 * @param limit - Number of entries to return
 */
export async function fetchLeaderboard(
  subtype: 'single_player' | 'pvp' | 'multiplayer' | null = null,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  // Non-blocking: return empty array if Supabase not configured
  if (!hasSupabaseConfig()) {
    console.log('⚠️ Supabase not configured - returning empty leaderboard (non-blocking)')
    return []
  }
  
  try {
    // Build query parameters
    const params: Record<string, string> = {
      select: 'score,game_mode,duration_ms,created_at,wallet_address,profiles!inner(wallet_address,username,avatar_url)',
      game_type: 'eq.ape_in',
      order: 'score.desc',
      limit: limit.toString(),
    }

    // Exclude Sandy mode
    params.game_mode = 'neq.sandy'

    // Filter by subtype if provided
    if (subtype) {
      params.game_subtype = `eq.${subtype}`
    }

    const queryString = new URLSearchParams(params).toString()
    const url = `${SUPABASE_URL}/rest/v1/game_sessions?${queryString}`

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ Failed to fetch leaderboard:', response.status)
      return []
    }

    const sessions: GameSession[] = await response.json()

    // Group by wallet_address and get best score per user
    const userBestScores = new Map<string, { session: GameSession; rank: number }>()
    
    sessions.forEach((session) => {
      const addr = session.wallet_address?.toLowerCase() || ''
      if (!addr) return

      const existing = userBestScores.get(addr)
      if (!existing || session.score > existing.session.score) {
        userBestScores.set(addr, { session, rank: 0 })
      }
    })

    // Sort by score and assign ranks
    const entries: LeaderboardEntry[] = Array.from(userBestScores.values())
      .sort((a, b) => b.session.score - a.session.score)
      .map((entry, index) => ({
        rank: index + 1,
        walletAddress: entry.session.wallet_address,
        username: entry.session.profiles?.username,
        avatarUrl: entry.session.profiles?.avatar_url,
        score: entry.session.score,
        gameMode: entry.session.game_mode,
        timeSeconds: entry.session.duration_ms ? Math.floor(entry.session.duration_ms / 1000) : undefined,
        createdAt: entry.session.created_at,
      }))

    return entries
  } catch (error) {
    // Catch all errors to prevent UI blocking
    console.error('❌ Error fetching leaderboard (non-blocking):', error)
    return []
  }
}

/**
 * Fetch player stats from Supabase
 * @param walletAddress - Player's wallet address
 */
export async function fetchPlayerStats(walletAddress: string): Promise<PlayerStats | null> {
  if (!walletAddress) return null

  // Non-blocking: return null if Supabase not configured
  if (!hasSupabaseConfig()) {
    console.log('⚠️ Supabase not configured - returning null stats (non-blocking)')
    return null
  }

  try {
      const params = new URLSearchParams({
      select: 'score,game_mode,game_subtype,duration_ms,created_at,points_earned,result',
      wallet_address: `eq.${walletAddress.toLowerCase()}`,
      game_type: 'eq.ape_in',
      order: 'created_at.desc',
    })

    const url = `${SUPABASE_URL}/rest/v1/game_sessions?${params}`

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ Failed to fetch player stats:', response.status)
      return null
    }

    const sessions: any[] = await response.json()

    // Filter out Sandy mode
    const filteredSessions = sessions.filter(s => s.game_mode !== 'sandy')

    if (filteredSessions.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPoints: 0,
        averageScore: 0,
        bestScore: 0,
        currentWinStreak: 0,
        bestWinStreak: 0,
        totalPlayTime: 0,
        averageTime: 0,
        modeBreakdown: {},
        subtypeBreakdown: {},
      }
    }

    // Calculate stats from existing scores (don't recalculate)
    let wins = 0
    let losses = 0
    let totalScore = 0
    let totalPoints = 0
    let bestScore = 0
    let totalPlayTime = 0
    let bestTime: number | undefined

    const modeBreakdown: Record<string, { games: number; wins: number; bestScore: number }> = {}
    const subtypeBreakdown: Record<string, { games: number; wins: number; bestScore: number }> = {}

    let currentStreak = 0
    let bestStreak = 0

    // Process sessions in chronological order for streaks
    const sortedSessions = [...filteredSessions].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    sortedSessions.forEach((session) => {
      // Use result field if available, otherwise infer from score for legacy data
      const hasResult = session.result !== undefined && session.result !== null
      const isWin = session.result === 'WIN' || (!hasResult && session.score && session.score > 0)
      const isLoss = session.result === 'LOSS' || session.result === 'FORFEIT'
      const isDraw = session.result === 'DRAW'
      
      if (isWin && !isDraw) {
        wins++
        currentStreak++
        if (currentStreak > bestStreak) bestStreak = currentStreak
      } else if (isLoss || isDraw) {
        losses++
        currentStreak = 0
      }
      // If result is null/undefined and no score, skip counting

      // Aggregate existing scores (don't recalculate)
      if (session.score) {
        totalScore += session.score
        if (session.score > bestScore) bestScore = session.score
      }

      if (session.points_earned) {
        totalPoints += session.points_earned
      }

      if (session.duration_ms) {
        const seconds = Math.floor(session.duration_ms / 1000)
        totalPlayTime += seconds
        if (!bestTime || seconds < bestTime) bestTime = seconds
      }

      // Mode breakdown
      const mode = session.game_mode || 'unknown'
      if (!modeBreakdown[mode]) {
        modeBreakdown[mode] = { games: 0, wins: 0, bestScore: 0 }
      }
      modeBreakdown[mode].games++
      if (isWin) modeBreakdown[mode].wins++
      if (session.score && session.score > modeBreakdown[mode].bestScore) {
        modeBreakdown[mode].bestScore = session.score
      }

      // Subtype breakdown
      const subtype = session.game_subtype || 'unknown'
      if (!subtypeBreakdown[subtype]) {
        subtypeBreakdown[subtype] = { games: 0, wins: 0, bestScore: 0 }
      }
      subtypeBreakdown[subtype].games++
      if (isWin) subtypeBreakdown[subtype].wins++
      if (session.score && session.score > subtypeBreakdown[subtype].bestScore) {
        subtypeBreakdown[subtype].bestScore = session.score
      }
    })

    const totalGames = wins + losses
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0
    const averageScore = wins > 0 ? totalScore / wins : 0
    const averageTime = totalGames > 0 ? totalPlayTime / totalGames : 0

    // Calculate current streak from most recent games (reverse chronological)
    currentStreak = 0
    for (let i = sortedSessions.length - 1; i >= 0; i--) {
      const session = sortedSessions[i]
      const hasResult = session.result !== undefined && session.result !== null
      const isWin = session.result === 'WIN' || (!hasResult && session.score && session.score > 0)
      const isLoss = session.result === 'LOSS' || session.result === 'FORFEIT'
      
      if (isWin && !isLoss) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      totalGames,
      wins,
      losses,
      winRate: Math.round(winRate * 100) / 100,
      totalPoints,
      averageScore: Math.round(averageScore),
      bestScore,
      currentWinStreak: currentStreak,
      bestWinStreak: bestStreak,
      totalPlayTime,
      averageTime: Math.round(averageTime),
      bestTime,
      modeBreakdown,
      subtypeBreakdown,
    }
  } catch (error) {
    // Catch all errors to prevent UI blocking
    console.error('❌ Error fetching player stats (non-blocking):', error)
    return null
  }
}

