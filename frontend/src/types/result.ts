/**
 * Result types for game submission to Arcade Hub
 */

import { GameMode } from './game'

export type GameResult = 'WIN' | 'DRAW' | 'LOSS' | 'FORFEIT'

export interface ResultSubmissionPayload {
  playerAddress: string
  modeId: GameMode
  isRanked: boolean
  result: GameResult
  runId: string
  playToken?: string // Required for ranked modes
  meta?: {
    durationMs?: number
    rawScore?: number
    opponent?: string // Bot id (aida/lana/nifty/enj1n/sandy) or 'pvp'/'multiplayer'
    clientVersion?: string
  }
}

export interface ResultSubmissionResponse {
  success: boolean
  error?: string
  message?: string
}

