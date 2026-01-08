/**
 * Play Balance Service
 * Manages free play balance, purchases, and rewards
 * 
 * System:
 * - Start with 5 free plays (one-time, not daily reset)
 * - Can purchase plays for 0.1 APE each
 * - After every 10 games, receive 5 free plays as reward
 */

import { GameMode } from '../types/game'

const INITIAL_FREE_PLAYS = 5
const REWARD_PLAYS = 5
const GAMES_FOR_REWARD = 10
const PLAY_PRICE_APE = 0.1

export interface PlayBalance {
  freePlays: number // Current free play balance
  totalGamesPlayed: number // Total games completed (for reward tracking)
  lastRewardGame: number // Last game number that triggered a reward
}

export class PlayBalanceService {
  /**
   * Get storage key for a wallet address
   */
  private static getStorageKey(walletAddress: string): string {
    return `playBalance_${walletAddress.toLowerCase()}`
  }

  /**
   * Get current play balance for a wallet
   */
  static getBalance(walletAddress: string): PlayBalance {
    if (!walletAddress) {
      return {
        freePlays: 0,
        totalGamesPlayed: 0,
        lastRewardGame: 0,
      }
    }

    const storageKey = this.getStorageKey(walletAddress)
    const stored = localStorage.getItem(storageKey)

    if (!stored) {
      // First time - initialize with 5 free plays
      const initialBalance: PlayBalance = {
        freePlays: INITIAL_FREE_PLAYS,
        totalGamesPlayed: 0,
        lastRewardGame: 0,
      }
      localStorage.setItem(storageKey, JSON.stringify(initialBalance))
      return initialBalance
    }

    try {
      return JSON.parse(stored) as PlayBalance
    } catch (error) {
      console.error('Error parsing play balance:', error)
      // Return initial balance on error
      return {
        freePlays: INITIAL_FREE_PLAYS,
        totalGamesPlayed: 0,
        lastRewardGame: 0,
      }
    }
  }

  /**
   * Check if user has free plays available
   */
  static hasFreePlays(walletAddress: string): boolean {
    if (!walletAddress) return false
    
    // Sandy is always free
    // For other modes, check balance
    const balance = this.getBalance(walletAddress)
    return balance.freePlays > 0
  }

  /**
   * Get free plays remaining
   */
  static getFreePlaysRemaining(walletAddress: string): number {
    if (!walletAddress) return 0
    const balance = this.getBalance(walletAddress)
    return balance.freePlays
  }

  /**
   * Check if user can play a mode (has free plays or can purchase)
   */
  static canPlay(walletAddress: string, gameMode: GameMode): boolean {
    if (!walletAddress) return false
    
    // Sandy is always free
    if (gameMode === 'sandy') return true
    
    // Check if has free plays
    return this.hasFreePlays(walletAddress)
  }

  /**
   * Use a free play (deduct from balance)
   */
  static useFreePlay(walletAddress: string, gameMode: GameMode): boolean {
    if (!walletAddress) return false
    
    // Sandy is always free, don't deduct
    if (gameMode === 'sandy') return true

    const balance = this.getBalance(walletAddress)
    
    if (balance.freePlays <= 0) {
      return false // No free plays available
    }

    // Deduct one free play
    balance.freePlays -= 1
    
    this.saveBalance(walletAddress, balance)
    console.log(`✅ Used free play. Remaining: ${balance.freePlays}`)
    
    return true
  }

  /**
   * Record a completed game and check for rewards
   */
  static recordGameCompleted(walletAddress: string, gameMode: GameMode): {
    receivedReward: boolean
    newBalance: number
  } {
    if (!walletAddress) {
      return { receivedReward: false, newBalance: 0 }
    }

    // Sandy doesn't count toward total games
    if (gameMode === 'sandy') {
      return { receivedReward: false, newBalance: this.getFreePlaysRemaining(walletAddress) }
    }

    const balance = this.getBalance(walletAddress)
    balance.totalGamesPlayed += 1

    // Check if we've reached a reward milestone (every 10 games)
    const gamesSinceLastReward = balance.totalGamesPlayed - balance.lastRewardGame
    let receivedReward = false

    if (gamesSinceLastReward >= GAMES_FOR_REWARD) {
      // Award 5 free plays
      balance.freePlays += REWARD_PLAYS
      balance.lastRewardGame = balance.totalGamesPlayed
      receivedReward = true
      console.log(`🎉 Reward! Received ${REWARD_PLAYS} free plays after ${GAMES_FOR_REWARD} games`)
    }

    this.saveBalance(walletAddress, balance)

    return {
      receivedReward,
      newBalance: balance.freePlays,
    }
  }

  /**
   * Purchase plays (add to balance after payment)
   */
  static purchasePlays(walletAddress: string, quantity: number = 1): void {
    if (!walletAddress || quantity <= 0) return

    const balance = this.getBalance(walletAddress)
    balance.freePlays += quantity

    this.saveBalance(walletAddress, balance)
    console.log(`✅ Purchased ${quantity} play(s). New balance: ${balance.freePlays}`)
  }

  /**
   * Get play price
   */
  static getPlayPrice(): number {
    return PLAY_PRICE_APE
  }

  /**
   * Save balance to localStorage
   */
  private static saveBalance(walletAddress: string, balance: PlayBalance): void {
    const storageKey = this.getStorageKey(walletAddress)
    localStorage.setItem(storageKey, JSON.stringify(balance))
  }

  /**
   * Get games until next reward
   */
  static getGamesUntilReward(walletAddress: string): number {
    if (!walletAddress) return GAMES_FOR_REWARD

    const balance = this.getBalance(walletAddress)
    const gamesSinceLastReward = balance.totalGamesPlayed - balance.lastRewardGame
    return Math.max(0, GAMES_FOR_REWARD - gamesSinceLastReward)
  }
}

