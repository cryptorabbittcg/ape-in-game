import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import Card from './Card'
import Dice from './Dice'
import React, { useState } from 'react'
import { gameAPI } from '../services/api'
import { GameMode } from '../types/game'

interface GameBoardProps {
  gameId: string
  playerName: string
  opponentName: string
  gameMode?: GameMode
}

export default function GameBoard({ gameId, playerName, opponentName, gameMode }: GameBoardProps) {
  const {
    playerScore,
    opponentScore,
    playerTurnScore,
    currentCard,
    lastRoll,
    isPlayerTurn,
    gameStatus,
    winner,
    apeInActive,
    roundCount,
    maxRounds,
    setCurrentCard,
    setLastRoll,
    updateScore,
    toggleTurn,
    setGameState,
  } = useGameStore()

  const [isDrawing, setIsDrawing] = useState(false)
  const [isRolling, setIsRolling] = useState(false)
  const [floatingMessage, setFloatingMessage] = useState<{text: string, sats?: number} | null>(null)
  const [botTurnData, setBotTurnData] = useState<{card: any, roll: number | null, turnSats: number, isRolling?: boolean} | null>(null)
  const [isBotPlaying, setIsBotPlaying] = useState(false)
  const [showRoundPopup, setShowRoundPopup] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)

  // Refresh game state from backend
  const refreshGameState = async () => {
    try {
      const gameData = await gameAPI.getGameState(gameId)
      setGameState(gameData)
    } catch (error) {
      console.error('Failed to refresh game state:', error)
    }
  }

  // Detect round changes and show popup
  React.useEffect(() => {
    if (roundCount > currentRound && !isBotPlaying) {
      setCurrentRound(roundCount)
      setShowRoundPopup(true)
      setTimeout(() => setShowRoundPopup(false), 2500)
    }
  }, [roundCount, currentRound, isBotPlaying])

  const handleDrawCard = async () => {
    if (!isPlayerTurn || isDrawing) return

    setIsDrawing(true)
    setFloatingMessage(null)

    try {
      const card = await gameAPI.drawCard(gameId)
      
      // Refresh game state to sync
      await refreshGameState()

      if (card.name === 'Ape In!') {
        // Ape In! card - show message, clear card, allow immediate next draw
        setFloatingMessage({text: '🚀 APE IN ACTIVATED! Next card value DOUBLED!'})
        useGameStore.getState().activateApeIn()
        
        // Clear the Ape In card after 1.5 seconds to allow next draw
        setTimeout(() => {
          setCurrentCard(null)
          setFloatingMessage(null)
        }, 1500)
      }

      setIsDrawing(false)
    } catch (error) {
      console.error('Failed to draw card:', error)
      setFloatingMessage({text: 'Failed to draw card. Please try again.'})
      setIsDrawing(false)
    }
  }

  const handleRollDice = async () => {
    if (!isPlayerTurn || !currentCard || isRolling) return

    setIsRolling(true)
    setFloatingMessage(null)

    try {
      const result = await gameAPI.rollDice(gameId)
      console.log('Roll result:', result) // Debug logging
      setLastRoll(result.value)

      setTimeout(async () => {
        setIsRolling(false)

        if (result.success) {
          // Show floating success message with sats gained (KEEP CARD VISIBLE)
          const satsGained = result.satsGained !== undefined ? result.satsGained : currentCard.value
          console.log('Sats gained:', satsGained, 'Current card value:', currentCard.value, 'Ape In active:', apeInActive) // Debug
          setFloatingMessage({
            text: `Great roll! +${satsGained} sats`,
            sats: result.turnScore
          })
          
          // Wait for message to display, THEN clear card
          setTimeout(async () => {
            setFloatingMessage(null)
            setCurrentCard(null)
            await refreshGameState()
          }, 2000)
        } else {
          // Player busted - show message then replay bot turn
          setFloatingMessage({text: result.message || 'Busted! Turn ended.'})
          setCurrentCard(null)
          
          setTimeout(async () => {
            setFloatingMessage(null)
            
            // Replay bot's turn if actions are provided
            if (result.botActions && result.botActions.length > 0) {
              await replayBotTurn(result.botActions)
            } else {
              await refreshGameState()
            }
          }, 1500)
        }
      }, 1000)
    } catch (error) {
      console.error('Failed to roll dice:', error)
      setFloatingMessage({text: 'Failed to roll dice. Please try again.'})
      setIsRolling(false)
    }
  }

  // Replay bot's turn with SLOW, clear sequential animations (1 second per step)
  const replayBotTurn = async (botActions: any[]) => {
    if (!botActions || botActions.length === 0) return
    
    setIsBotPlaying(true)
    let previousTurnScore = 0
    
    // Step 1: Announce bot's turn
    setFloatingMessage({text: `${opponentName}'s turn...`})
    await new Promise(resolve => setTimeout(resolve, 1500))
    setFloatingMessage(null)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Process each action sequentially
    for (let i = 0; i < botActions.length; i++) {
      const action = botActions[i]
      
      if (action.type === 'ape_in') {
        // Handle Ape In card special case
        const cardData = action.card
        setBotTurnData({card: cardData, roll: null, turnSats: previousTurnScore, isRolling: false})
        setFloatingMessage({text: `${opponentName} draws APE IN! 🚀`})
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Clear and show "Next card doubled" message
        setFloatingMessage({text: `Next card value doubled!`})
        await new Promise(resolve => setTimeout(resolve, 1500))
        setFloatingMessage(null)
        setBotTurnData(prev => prev ? {...prev, card: null} : null)
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } else if (action.type === 'draw') {
        // Step 2: Show card being drawn
        const cardData = action.card
        setBotTurnData({card: cardData, roll: null, turnSats: previousTurnScore, isRolling: false})
        setFloatingMessage({text: `${opponentName} draws a card...`})
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Step 3: Pause to show the card clearly
        setFloatingMessage(null)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Step 4: Look for the corresponding roll action
        const nextAction = botActions[i + 1]
        if (nextAction && nextAction.type === 'roll') {
          i++ // Skip the roll action in next iteration
          
          const rollValue = nextAction.value
          const isSuccess = nextAction.success
          const currentTurnScore = nextAction.turnScore || 0
          const satsGained = currentTurnScore - previousTurnScore
          
          // Step 5: Announce rolling
          setFloatingMessage({text: `${opponentName} rolls...`})
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Step 6: Start dice rolling animation
          setBotTurnData(prev => prev ? {...prev, isRolling: true} : null)
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // Step 7: Show the roll result
          setBotTurnData(prev => prev ? {...prev, roll: rollValue, isRolling: false} : null)
          setFloatingMessage({text: `Rolled: ${rollValue}`})
          await new Promise(resolve => setTimeout(resolve, 1200))
          
          // Step 8: Show outcome
          if (isSuccess) {
            previousTurnScore = currentTurnScore
            setBotTurnData(prev => prev ? {...prev, turnSats: currentTurnScore} : null)
            setFloatingMessage({text: `+${satsGained} sats`, sats: currentTurnScore})
            await new Promise(resolve => setTimeout(resolve, 1500))
          } else {
            const message = nextAction.message || 'Busted!'
            setFloatingMessage({text: `${opponentName}: ${message}`})
            await new Promise(resolve => setTimeout(resolve, 1800))
            break // Bot busted, end turn
          }
        }
        
        // Step 9: Clear card and pause before next action
        setFloatingMessage(null)
        setBotTurnData(prev => prev ? {...prev, card: null, roll: null, isRolling: false} : null)
        await new Promise(resolve => setTimeout(resolve, 800))
        
      } else if (action.type === 'stack') {
        // Bot decided to stack
        const finalScore = action.finalScore || 0
        setFloatingMessage({text: `${opponentName} stacks ${previousTurnScore} sats!`})
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    // Step 9: Clean up and return to player's turn
    setBotTurnData(null)
    setIsBotPlaying(false)
    setFloatingMessage({text: 'Your turn!'})
    await new Promise(resolve => setTimeout(resolve, 1200))
    setFloatingMessage(null)
    await refreshGameState()
  }

  const handleStackSats = async () => {
    if (!isPlayerTurn || playerTurnScore === 0) return

    try {
      setFloatingMessage({text: 'Banking sats...'})
      const result = await gameAPI.stackSats(gameId)
      
      setTimeout(async () => {
        setFloatingMessage(null)
        
        // Replay bot's turn if actions are provided
        if (result.botActions && result.botActions.length > 0) {
          await replayBotTurn(result.botActions)
        }
        
        // Final state update
        await refreshGameState()
      }, 800)
    } catch (error) {
      console.error('Failed to stack sats:', error)
      setFloatingMessage({text: 'Failed to stack sats. Please try again.'})
    }
  }

  const handleForfeit = async () => {
    if (window.confirm('Are you sure you want to forfeit?')) {
      try {
        await gameAPI.forfeitGame(gameId)
        setFloatingMessage({text: 'Game forfeited.'})
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } catch (error) {
        console.error('Failed to forfeit:', error)
      }
    }
  }

  if (gameStatus === 'finished') {
    const playerWon = winner === playerName
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="game-board text-center py-12"
      >
        <h2 className="text-5xl font-bold mb-6">
          {playerWon ? '🎉 You Win!' : `${opponentName} Wins This Time!`}
        </h2>
        {!playerWon && (
          <p className="text-xl text-slate-300 mb-6">Better luck next game!</p>
        )}
        <div className="text-2xl mb-8">
          <div>Your Score: <span className="score-display">{playerScore}</span></div>
          <div className="flex items-center justify-center space-x-3">
            {/* Bot Avatar in Game Over Screen */}
            {gameMode && (gameMode === 'sandy' || gameMode === 'aida' || gameMode === 'lana' || gameMode === 'enj1n' || gameMode === 'nifty') ? (
              <img 
                src={`/assets/bots/${gameMode}.png?v=${Date.now()}`} 
                alt={`${gameMode} avatar`} 
                className="w-8 h-8 object-cover rounded-full border-2 border-purple-500/50 shadow-lg" 
                onError={(e) => {
                  console.error(`Failed to load Game Over portrait for ${gameMode}:`, e);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={(e) => {
                  console.log(`Successfully loaded Game Over portrait for ${gameMode}`);
                }}
              />
            ) : null}
            <span>{opponentName} Score: <span className="score-display">{opponentScore}</span></span>
          </div>
        </div>
        <button onClick={() => window.location.href = '/'} className="btn-primary text-lg">
          Play Again
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Compact Score Display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-board text-center py-3">
          <h3 className="text-base font-semibold mb-1 text-slate-300">{playerName}</h3>
          <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{playerScore}</div>
          <div className="text-xs text-slate-400 mt-1">
            Turn: <span className="text-yellow-400 font-semibold">{playerTurnScore}</span>
          </div>
        </div>
        <div className="game-board text-center py-3">
          {/* Bot Avatar */}
          {gameMode && (gameMode === 'sandy' || gameMode === 'aida' || gameMode === 'lana' || gameMode === 'enj1n' || gameMode === 'nifty') ? (
            <div className="flex justify-center mb-2">
              <img 
                src={`/assets/bots/${gameMode}.png?v=${Date.now()}`} 
                alt={`${gameMode} avatar`} 
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full border-2 border-purple-500/50 shadow-lg" 
                onError={(e) => {
                  console.error(`Failed to load GameBoard portrait for ${gameMode}:`, e);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={(e) => {
                  console.log(`Successfully loaded GameBoard portrait for ${gameMode}`);
                }}
              />
            </div>
          ) : null}
          <h3 className="text-base font-semibold mb-1 text-slate-300">{opponentName}</h3>
          <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{opponentScore}</div>
          {isBotPlaying && botTurnData && (
            <div className="text-xs text-emerald-400 mt-1 animate-pulse">
              Turn: {botTurnData.turnSats}
            </div>
          )}
        </div>
      </div>

      {/* Compact Game Area */}
      <div className="game-board">
        {/* Card Section - Full width on top */}
        <div className="flex flex-col items-center space-y-2 mb-4">
          <div className="transform-gpu">
            <Card
              card={isBotPlaying && botTurnData ? botTurnData.card : currentCard}
              isRevealing={isBotPlaying ? true : isDrawing}
            />
          </div>
          {isBotPlaying && (
            <div className="text-sm text-emerald-400 font-semibold animate-pulse">
              {opponentName}'s Turn
            </div>
          )}
        </div>

        {/* Mobile: 2-column layout (Dice left, Buttons right) | Desktop: Horizontal layout */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-6">
          {/* Dice Section - Left column on mobile */}
          <div className="flex flex-col items-center space-y-2 w-full sm:w-auto">
            <div className="h-6 text-sm text-slate-400">
              {isRolling || (botTurnData?.isRolling ?? false) ? 'Rolling...' : 'Dice'}
            </div>
            
            <Dice 
              value={isBotPlaying && botTurnData ? botTurnData.roll : lastRoll} 
              isRolling={(() => {
                const shouldRoll = isRolling || (botTurnData?.isRolling ?? false);
                if (isBotPlaying) {
                  console.log('🎲 Dice Debug:', {
                    isBotPlaying,
                    isRolling,
                    botTurnDataIsRolling: botTurnData?.isRolling,
                    shouldRoll,
                    botRoll: botTurnData?.roll,
                    lastRoll
                  });
                }
                return shouldRoll;
              })()}
            />
          </div>

          {/* Action Buttons - Right column on mobile */}
          <div className="flex flex-col gap-1.5 sm:gap-2 w-full sm:w-auto sm:min-w-[160px]">
            <button
              onClick={handleDrawCard}
              disabled={!isPlayerTurn || (!!currentCard && currentCard.type !== 'Special') || isDrawing || isBotPlaying}
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-lg transition-all ${
                !isPlayerTurn || (!!currentCard && currentCard.type !== 'Special') || isDrawing || isBotPlaying
                  ? 'bg-slate-600 opacity-50 cursor-not-allowed'
                  : apeInActive
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse ring-2 ring-green-400'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 animate-pulse'
              }`}
            >
              {isDrawing ? '⏳ Drawing...' : apeInActive ? '🚀 Draw (APE IN!)' : '🎴 Draw Card'}
            </button>

            <button
              onClick={handleRollDice}
              disabled={!isPlayerTurn || !currentCard || isRolling || isBotPlaying}
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-lg transition-all ${
                !isPlayerTurn || !currentCard || isRolling || isBotPlaying
                  ? 'bg-slate-600 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 animate-pulse'
              }`}
            >
              {isRolling ? '⏳ Rolling...' : '🎲 Roll Dice'}
            </button>

            <button
              onClick={handleStackSats}
              disabled={!isPlayerTurn || playerTurnScore === 0 || isBotPlaying}
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-lg transition-all ${
                !isPlayerTurn || playerTurnScore === 0 || isBotPlaying
                  ? 'bg-slate-600 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse'
              }`}
            >
              💰 Stack {playerTurnScore > 0 ? `(${playerTurnScore})` : ''}
            </button>

            <button
              onClick={handleForfeit}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-xs sm:text-sm shadow-lg transition-all"
            >
              🏳️ Forfeit
            </button>
          </div>
        </div>

      </div>

      {/* Floating Ape In Status Overlay */}
      {apeInActive && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="fixed top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-2xl border-2 border-yellow-400 font-bold text-center max-w-[90vw] mx-4"
        >
          <div className="text-base sm:text-lg">🚀 APE IN ACTIVE!</div>
          <div className="text-xs sm:text-sm">Next card value doubled!</div>
        </motion.div>
      )}

      {/* Floating Success Message */}
      {floatingMessage && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl border-2 border-green-300 font-bold text-center max-w-[90vw] mx-4"
        >
          <div className="text-sm sm:text-lg">{floatingMessage.text}</div>
          {floatingMessage.sats !== undefined && (
            <div className="text-xs sm:text-sm mt-1">Turn Sats: {floatingMessage.sats}</div>
          )}
        </motion.div>
      )}

      {/* Floating Bearish Card Warning */}
      {currentCard?.type === 'Bearish' && isPlayerTurn && !lastRoll && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-red-600 to-red-800 text-white px-4 sm:px-8 py-4 sm:py-6 rounded-2xl shadow-2xl border-4 border-red-400 max-w-[90vw] mx-4"
        >
          <div className="text-center">
            <div className="text-2xl sm:text-4xl mb-2 sm:mb-3">⚠️ BEARISH CARD!</div>
            <div className="text-lg sm:text-xl font-bold mb-2">{currentCard.penalty}</div>
            <div className="text-xs sm:text-sm opacity-90 mb-2 sm:mb-3">
              Roll an <span className="font-bold text-yellow-300">EVEN number (2, 4, or 6)</span> to dodge the penalty!
            </div>
            <div className="text-xs opacity-75">
              Rolling 1, 3, or 5 = Penalty applied!
            </div>
          </div>
        </motion.div>
      )}

      {/* Round Announcement Popup */}
      {showRoundPopup && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-purple-600 to-pink-600 text-white px-6 sm:px-12 py-6 sm:py-8 rounded-2xl shadow-2xl border-4 border-purple-300 max-w-[90vw] mx-4"
        >
          <div className="text-center">
            <div className="text-3xl sm:text-5xl font-black mb-2">
              ROUND {roundCount}
            </div>
            <div className="text-sm sm:text-lg opacity-90">
              of {maxRounds}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
