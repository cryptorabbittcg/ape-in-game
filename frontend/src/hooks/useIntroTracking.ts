import { useState, useEffect } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { GameMode } from '../types/game'

interface IntroCompletion {
  [gameMode: string]: boolean
}

export function useIntroTracking() {
  const account = useActiveAccount()
  const [introCompletion, setIntroCompletion] = useState<IntroCompletion>({})

  // Load intro completion from localStorage
  useEffect(() => {
    if (account?.address) {
      const saved = localStorage.getItem(`intro_completion_${account.address}`)
      if (saved) {
        try {
          setIntroCompletion(JSON.parse(saved))
        } catch (error) {
          console.error('Failed to parse intro completion:', error)
        }
      }
    }
  }, [account?.address])

  // Check if intro has been completed for a specific game mode
  const hasCompletedIntro = (gameMode: GameMode): boolean => {
    const completed = introCompletion[gameMode] === true
    console.log(`🎬 Intro tracking for ${gameMode}:`, completed)
    console.log('📊 Current intro completion state:', introCompletion)
    return completed
  }

  // Mark intro as completed for a specific game mode
  const markIntroCompleted = (gameMode: GameMode) => {
    if (account?.address) {
      const updated = {
        ...introCompletion,
        [gameMode]: true
      }
      setIntroCompletion(updated)
      localStorage.setItem(`intro_completion_${account.address}`, JSON.stringify(updated))
    }
  }

  // Reset intro completion (for testing or user preference)
  const resetIntroCompletion = () => {
    if (account?.address) {
      setIntroCompletion({})
      localStorage.removeItem(`intro_completion_${account.address}`)
    }
  }

  // Reset intro completion for a specific game mode
  const resetIntroForMode = (gameMode: GameMode) => {
    if (account?.address) {
      const updated = { ...introCompletion }
      delete updated[gameMode]
      setIntroCompletion(updated)
      localStorage.setItem(`intro_completion_${account.address}`, JSON.stringify(updated))
    }
  }

  return {
    hasCompletedIntro,
    markIntroCompleted,
    resetIntroCompletion,
    resetIntroForMode,
    introCompletion
  }
}
