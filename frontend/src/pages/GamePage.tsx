import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useActiveAccount } from 'thirdweb/react'
import { motion } from 'framer-motion'
import { gameAPI } from '../services/api'
import { wsService } from '../services/websocket'
import { useGameStore } from '../store/gameStore'
import GameBoard from '../components/GameBoard'
import { GameMode } from '../types/game'

const gameNames: Record<GameMode, string> = {
  sandy: 'Sandy',
  aida: 'Aida',
  lana: 'Lana',
  enj1n: 'En-J1n',
  nifty: 'Nifty',
  pvp: 'PvP',
  multiplayer: 'Multiplayer',
  tournament: 'Tournament',
}

export default function GamePage() {
  const { mode } = useParams<{ mode: GameMode }>()
  const navigate = useNavigate()
  const account = useActiveAccount()
  const address = account?.address
  const [isLoading, setIsLoading] = useState(true)
  const [playerName, setPlayerName] = useState('')
  const [gameId, setGameId] = useState('')
  const { setGameState, gameStatus } = useGameStore()

  useEffect(() => {
    if (!mode) {
      navigate('/')
      return
    }

    const initGame = async () => {
      try {
        // Get player name (from wallet or prompt)
        const name = address ? `Player ${address.slice(0, 6)}` : prompt('Enter your name:') || 'Player'
        setPlayerName(name)

        // Create game
        const game = await gameAPI.createGame(mode, name, address)
        setGameId(game.gameId)
        setGameState(game)

        // Connect WebSocket for real-time updates
        if (mode === 'pvp' || mode === 'multiplayer') {
          wsService.connect(game.gameId)
          wsService.on('game_update', (data) => {
            setGameState(data)
          })
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize game:', error)
        alert('Failed to start game. Please try again.')
        navigate('/')
      }
    }

    initGame()

    return () => {
      wsService.disconnect()
    }
  }, [mode, address, navigate, setGameState])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const opponentName = mode ? gameNames[mode] : 'Opponent'

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-display font-bold mb-2">
          {mode && gameNames[mode]} Mode
        </h1>
        <p className="text-slate-400">First to 150 sats wins!</p>
      </motion.div>

      <GameBoard gameId={gameId} playerName={playerName} opponentName={opponentName} />
    </div>
  )
}

