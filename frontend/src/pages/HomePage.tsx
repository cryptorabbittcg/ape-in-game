import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GameMode } from '../types/game'

interface GameModeCard {
  mode: GameMode
  name: string
  description: string
  color: string
  difficulty?: string
}

const gameModes: GameModeCard[] = [
  {
    mode: 'sandy',
    name: 'Sandy',
    description: 'Learn the ropes with Sandy. Perfect for beginners!',
    color: 'from-yellow-500 to-orange-500',
    difficulty: 'Tutorial',
  },
  {
    mode: 'aida',
    name: 'Aida',
    description: 'Strategic and efficient. A balanced challenge.',
    color: 'from-purple-500 to-pink-500',
    difficulty: 'Easy',
  },
  {
    mode: 'lana',
    name: 'Lana',
    description: 'High-risk, high-reward gameplay. Can you keep up?',
    color: 'from-blue-500 to-cyan-500',
    difficulty: 'Medium',
  },
  {
    mode: 'enj1n',
    name: 'En-J1n',
    description: 'Relentless and aggressive. Only for the brave!',
    color: 'from-red-500 to-orange-600',
    difficulty: 'Hard',
  },
  {
    mode: 'nifty',
    name: 'Nifty',
    description: 'Unpredictable and creative strategies await.',
    color: 'from-orange-500 to-yellow-500',
    difficulty: 'Medium',
  },
  {
    mode: 'pvp',
    name: 'PvP',
    description: 'Face off against another player in real-time!',
    color: 'from-pink-500 to-purple-600',
  },
  {
    mode: 'multiplayer',
    name: 'Multiplayer',
    description: '3-10 players compete for the top spot!',
    color: 'from-green-500 to-teal-500',
  },
  {
    mode: 'tournament',
    name: 'Tournament',
    description: 'Compete in brackets for ultimate glory!',
    color: 'from-indigo-500 to-purple-600',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  const handleModeSelect = (mode: GameMode) => {
    navigate(`/game/${mode}`)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* CxRH Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center mb-8"
      >
        <img 
          src="/assets/cxrh-banner.png" 
          alt="CxRH Banner" 
          className="max-w-2xl w-full h-auto"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center mb-16"
      >
        <h1 className="text-6xl md:text-8xl font-display font-black mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
          APE IN!
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
          Push your luck in this high-stakes card and dice game. Draw cards, roll dice, and stack
          your sats to victory!
        </p>
      </motion.div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-200">
          Choose Your Game Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gameModes.map((gameMode, index) => (
            <motion.div
              key={gameMode.mode}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="game-card cursor-pointer"
              onClick={() => handleModeSelect(gameMode.mode)}
            >
              <div className={`bg-gradient-to-br ${gameMode.color} p-1 rounded-xl h-full`}>
                <div className="bg-slate-800 rounded-lg p-6 h-full flex flex-col">
                  {gameMode.difficulty && (
                    <span className="text-xs font-semibold text-slate-400 uppercase mb-2">
                      {gameMode.difficulty}
                    </span>
                  )}
                  <h3 className="text-2xl font-bold mb-3 text-white">{gameMode.name}</h3>
                  <p className="text-slate-300 flex-grow">{gameMode.description}</p>
                  <button className="mt-4 w-full btn-primary text-sm">Play Now</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="game-board max-w-4xl mx-auto mt-16"
      >
        <h3 className="text-2xl font-bold mb-4 text-slate-200">How to Play</h3>
        <div className="space-y-4 text-slate-300">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">
              1
            </div>
            <p>
              <strong className="text-white">Draw Cards:</strong> Draw cards from the deck to earn
              sats (points). Different card types have different values!
            </p>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">
              2
            </div>
            <p>
              <strong className="text-white">Roll Dice:</strong> After drawing a card, roll the dice.
              If you roll a 1, you lose all your turn sats!
            </p>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">
              3
            </div>
            <p>
              <strong className="text-white">Stack Your Sats:</strong> End your turn to add your
              turn sats to your total score. First to reach the winning score wins!
            </p>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">
              4
            </div>
            <p>
              <strong className="text-white">Watch Out for Bears:</strong> Bearish cards can reset
              your score, cut it in half, or subtract points. Roll an even number to dodge them!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

