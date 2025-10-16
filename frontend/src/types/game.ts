export const GameModeValues = ['sandy', 'aida', 'lana', 'enj1n', 'nifty', 'pvp', 'multiplayer', 'tournament'] as const
export type GameMode = typeof GameModeValues[number]

// Export runtime objects for SES compatibility
export const GameMode = {
  SANDY: 'sandy',
  AIDA: 'aida', 
  LANA: 'lana',
  ENJ1N: 'enj1n',
  NIFTY: 'nifty',
  PVP: 'pvp',
  MULTIPLAYER: 'multiplayer',
  TOURNAMENT: 'tournament'
} as const

// Runtime exports for commonly imported interfaces
export const CardType = {
  CIPHER: 'Cipher',
  ORACLE: 'Oracle',
  HISTORACLE: 'Historacle',
  BEARISH: 'Bearish',
  SPECIAL: 'Special'
} as const

export const GameStatus = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
} as const

export const GameActionType = {
  DRAW: 'draw',
  ROLL: 'roll',
  STACK: 'stack',
  FORFEIT: 'forfeit'
} as const

export const WebSocketMessageType = {
  GAME_UPDATE: 'game_update',
  PLAYER_JOINED: 'player_joined',
  GAME_STARTED: 'game_started',
  GAME_ENDED: 'game_ended',
  ERROR: 'error'
} as const

export type CardType = 'Cipher' | 'Oracle' | 'Historacle' | 'Bearish' | 'Special'

export interface Card {
  name: string
  type: CardType
  value: number
  image_url: string
  penalty?: string
}

export interface GameState {
  gameId: string
  mode: GameMode
  playerScore: number
  opponentScore: number
  playerTurnScore: number
  opponentTurnScore: number
  currentCard: Card | null
  lastRoll: number | null
  roundCount: number
  maxRounds: number
  winningScore: number
  isPlayerTurn: boolean
  gameStatus: 'waiting' | 'playing' | 'finished'
  winner: string | null
  apeInActive: boolean
}

export interface Player {
  id: string
  name: string
  walletAddress?: string
  score: number
  turnScore: number
}

export interface LeaderboardEntry {
  rank: number
  playerName: string
  walletAddress?: string
  totalWins: number
  highScore: number
  gamesPlayed: number
}

export interface DiceRoll {
  value: number
  success: boolean
  message?: string
}

export interface GameAction {
  type: 'draw' | 'roll' | 'stack' | 'forfeit'
  playerId: string
}

export interface WebSocketMessage {
  type: 'game_update' | 'player_joined' | 'game_started' | 'game_ended' | 'error'
  data: any
}

// Runtime constructors for commonly imported interfaces
export const createLeaderboardEntry = (entry: {
  rank: number
  playerName: string
  walletAddress?: string
  totalWins: number
  highScore: number
  gamesPlayed: number
}): LeaderboardEntry => entry

export const createCard = (card: {
  name: string
  type: CardType
  value: number
  image_url: string
  penalty?: string
}): Card => card

export const createGameState = (state: {
  gameId: string
  mode: GameMode
  playerScore: number
  opponentScore: number
  playerTurnScore: number
  opponentTurnScore: number
  currentCard: Card | null
  lastRoll: number | null
  roundCount: number
  maxRounds: number
  winningScore: number
  isPlayerTurn: boolean
  gameStatus: 'waiting' | 'playing' | 'finished'
  winner: string | null
  apeInActive: boolean
}): GameState => state

export const createPlayer = (player: {
  id: string
  name: string
  walletAddress?: string
  score: number
  turnScore: number
}): Player => player

export const createWebSocketMessage = (message: {
  type: 'game_update' | 'player_joined' | 'game_started' | 'game_ended' | 'error'
  data: any
}): WebSocketMessage => message
