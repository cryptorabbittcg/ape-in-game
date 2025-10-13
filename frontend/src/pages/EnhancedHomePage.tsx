import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GameMode } from '../types/game'
import { useState } from 'react'
import ParticleBackground from '../components/ParticleBackground'

interface GameModeCard {
  mode: GameMode
  name: string
  description: string
  color: string
  difficulty?: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

const gameModes: GameModeCard[] = [
  {
    mode: 'sandy',
    name: 'Sandy',
    description: 'Learn the ropes with Sandy. Perfect for beginners!',
    color: 'from-yellow-500 to-orange-500',
    difficulty: 'Tutorial',
    icon: '🟡',
    rarity: 'common',
  },
  {
    mode: 'aida',
    name: 'Aida',
    description: 'Strategic and efficient. A balanced challenge.',
    color: 'from-purple-500 to-pink-500',
    difficulty: 'Easy',
    icon: '🟣',
    rarity: 'uncommon',
  },
  {
    mode: 'lana',
    name: 'Lana',
    description: 'High-risk, high-reward gameplay. Can you keep up?',
    color: 'from-blue-500 to-cyan-500',
    difficulty: 'Medium',
    icon: '🔵',
    rarity: 'rare',
  },
  {
    mode: 'enj1n',
    name: 'En-J1n',
    description: 'Relentless and aggressive. Only for the brave!',
    color: 'from-red-500 to-orange-600',
    difficulty: 'Hard',
    icon: '🔴',
    rarity: 'epic',
  },
  {
    mode: 'nifty',
    name: 'Nifty',
    description: 'Unpredictable and creative strategies await.',
    color: 'from-orange-500 to-yellow-500',
    difficulty: 'Medium',
    icon: '🟠',
    rarity: 'rare',
  },
  {
    mode: 'pvp',
    name: 'PvP',
    description: 'Face off against another player in real-time!',
    color: 'from-pink-500 to-purple-600',
    icon: '⚔️',
    rarity: 'epic',
  },
  {
    mode: 'multiplayer',
    name: 'Multiplayer',
    description: '3-10 players compete for the top spot!',
    color: 'from-green-500 to-teal-500',
    icon: '👥',
    rarity: 'epic',
  },
  {
    mode: 'tournament',
    name: 'Tournament',
    description: 'Compete in brackets for ultimate glory!',
    color: 'from-indigo-500 to-purple-600',
    icon: '🏆',
    rarity: 'legendary',
  },
]

const rarityGlow = {
  common: 'shadow-gray-500/50',
  uncommon: 'shadow-green-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-orange-500/50',
}

export default function EnhancedHomePage() {
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const handleModeSelect = (mode: GameMode) => {
    navigate(`/game/${mode}`)
  }

  return (
    <div className="relative min-h-screen pt-24">
      {/* Particle Background */}
      <ParticleBackground />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* CxRH Banner with Enhanced Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="flex justify-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative max-w-2xl w-full"
          >
            <img 
              src="/assets/cxrh-banner.png" 
              alt="CxRH Banner" 
              className="w-full h-auto drop-shadow-2xl"
            />
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 blur-3xl opacity-20 -z-10" />
          </motion.div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-display font-black mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent relative inline-block"
            animate={{
              textShadow: [
                '0 0 20px rgba(168, 85, 247, 0.3)',
                '0 0 40px rgba(236, 72, 153, 0.3)',
                '0 0 20px rgba(168, 85, 247, 0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            APE IN!
            {/* Animated glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 blur-3xl opacity-30 -z-10"
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            Push your luck in this{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-semibold">
              high-stakes
            </span>{' '}
            card and dice game. Draw cards, roll dice, and{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 font-semibold">
              stack your sats
            </span>{' '}
            to victory!
          </motion.p>
        </motion.div>

        {/* Game Modes Section */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-200"
          >
            <span className="relative inline-block">
              Choose Your Battle
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              />
            </span>
          </motion.h2>

          {/* Game Mode Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gameModes.map((gameMode, index) => (
              <GameModeCard3D
                key={gameMode.mode}
                gameMode={gameMode}
                index={index}
                onSelect={handleModeSelect}
                isHovered={hoveredCard === gameMode.mode}
                onHoverChange={setHoveredCard}
              />
            ))}
          </div>
        </div>

        {/* How to Play Section - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="relative max-w-4xl mx-auto mt-16"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
            <h3 className="text-3xl font-bold mb-6 text-slate-200 flex items-center">
              <span className="text-3xl mr-3">📖</span>
              How to Play
            </h3>
            <div className="space-y-6">
              {[
                {
                  icon: '🎴',
                  title: 'Draw Cards',
                  desc: 'Draw cards from the deck to earn sats (points). Different card types have different values!',
                },
                {
                  icon: '🎲',
                  title: 'Roll Dice',
                  desc: 'After drawing a card, roll the dice. If you roll a 1, you lose all your turn sats!',
                },
                {
                  icon: '💰',
                  title: 'Stack Your Sats',
                  desc: 'End your turn to add your turn sats to your total score. First to reach the winning score wins!',
                },
                {
                  icon: '🐻',
                  title: 'Watch Out for Bears',
                  desc: 'Bearish cards can reset your score, cut it in half, or subtract points. Roll an even number to dodge them!',
                },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + idx * 0.1 }}
                  className="flex items-start space-x-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-slate-300">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// 3D Tilt Card Component
function GameModeCard3D({ 
  gameMode, 
  index, 
  onSelect,
  isHovered,
  onHoverChange
}: { 
  gameMode: GameModeCard
  index: number
  onSelect: (mode: GameMode) => void
  isHovered: boolean
  onHoverChange: (mode: string | null) => void
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useTransform(y, [-100, 100], [10, -10])
  const rotateY = useTransform(x, [-100, 100], [-10, 10])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 + index * 0.1, type: 'spring' }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ z: 50, scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        x.set(e.clientX - centerX)
        y.set(e.clientY - centerY)
      }}
      onMouseEnter={() => onHoverChange(gameMode.mode)}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
        onHoverChange(null)
      }}
      onClick={() => onSelect(gameMode.mode)}
      className="cursor-pointer relative"
    >
      <div className={`bg-gradient-to-br ${gameMode.color} p-[2px] rounded-2xl h-full shadow-2xl ${rarityGlow[gameMode.rarity]} transition-shadow duration-300`}>
        <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, ${gameMode.color.split(' ')[1]} 0%, transparent 50%)`,
            }}
            animate={{
              scale: isHovered ? 1.2 : 1,
              opacity: isHovered ? 0.2 : 0.1,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Icon and Difficulty Badge */}
            <div className="flex items-start justify-between mb-3">
              <motion.div
                className="text-5xl"
                animate={{
                  rotate: isHovered ? [0, -10, 10, 0] : 0,
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {gameMode.icon}
              </motion.div>
              {gameMode.difficulty && (
                <span className="text-xs font-semibold text-slate-400 uppercase px-2 py-1 rounded bg-slate-700/50">
                  {gameMode.difficulty}
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold mb-3 text-white">{gameMode.name}</h3>
            <p className="text-slate-300 text-sm mb-4 flex-grow leading-relaxed">{gameMode.description}</p>
            
            {/* Play Now Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r ${gameMode.color} shadow-lg hover:shadow-xl transition-shadow`}
            >
              Play Now →
            </motion.button>
          </div>

          {/* Rarity indicator */}
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r from-white to-transparent animate-pulse" />
        </div>
      </div>
    </motion.div>
  )
}



