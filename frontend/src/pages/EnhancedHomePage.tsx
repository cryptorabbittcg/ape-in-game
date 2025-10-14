import { motion } from 'framer-motion'
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
  const [hoveredGuide, setHoveredGuide] = useState<string | null>(null)

  const handleModeSelect = (mode: GameMode) => {
    navigate(`/game/${mode}`)
  }

  const guideSteps = [
    {
      id: 'draw',
      icon: '🎴',
      title: 'Draw Cards',
      desc: 'Click the deck to draw cards and earn sats (points). Each card type has different values!',
    },
    {
      id: 'roll',
      icon: '🎲',
      title: 'Roll Dice',
      desc: 'After drawing, roll the dice. Roll a 1 and you lose all turn sats. Keep rolling to stack more!',
    },
    {
      id: 'stack',
      icon: '💰',
      title: 'Stack Sats',
      desc: 'Bank your turn sats anytime to add them to your score. First to reach the target wins!',
    },
    {
      id: 'bears',
      icon: '🐻',
      title: 'Watch for Bears',
      desc: 'Bearish cards threaten your score! Roll even to dodge penalties: reset, half, or -10 points.',
    },
    {
      id: 'apein',
      icon: '🚀',
      title: 'Ape In!',
      desc: 'Draw this special card to DOUBLE your next card\'s value. Risk it all for massive gains!',
    },
  ]

  return (
    <div className="relative min-h-screen">
      {/* Particle Background */}
      <ParticleBackground />

      <div className="container mx-auto px-4 pt-4 pb-4 relative z-10 max-w-6xl">
        {/* Compact Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-3"
        >
          <motion.div whileHover={{ scale: 1.02 }} className="relative max-w-sm w-full">
            <img 
              src="/assets/cxrh-banner.png" 
              alt="CxRH Banner" 
              className="w-full h-auto drop-shadow-xl"
            />
          </motion.div>
        </motion.div>

        {/* Compact Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-3"
        >
          <h1 className="text-3xl md:text-4xl font-display font-black mb-1 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            APE IN!
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto">
            Push your luck • Draw cards • Roll dice • Stack sats to victory!
          </p>
        </motion.div>

        {/* Horizontal Guide Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-4"
        >
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {guideSteps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                onMouseEnter={() => setHoveredGuide(step.id)}
                onMouseLeave={() => setHoveredGuide(null)}
                className="relative group"
              >
                <div className="px-3 py-2 rounded-lg bg-slate-800/80 backdrop-blur border border-slate-700/50 hover:border-purple-500/50 transition-all cursor-help flex items-center gap-2">
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-xs font-semibold text-slate-300">{step.title}</span>
                  <motion.span
                    animate={{ rotate: hoveredGuide === step.id ? 180 : 0 }}
                    className="text-slate-500 text-xs"
                  >
                    ▼
                  </motion.span>
                </div>
                
                {/* Dropdown explanation */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scaleY: 0 }}
                  animate={{
                    opacity: hoveredGuide === step.id ? 1 : 0,
                    y: hoveredGuide === step.id ? 0 : -10,
                    scaleY: hoveredGuide === step.id ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-lg p-3 border border-purple-500/50 shadow-2xl shadow-purple-500/20 z-50 origin-top"
                  style={{ pointerEvents: hoveredGuide === step.id ? 'auto' : 'none' }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-l border-t border-purple-500/50 rotate-45" />
                  <p className="text-xs text-slate-300 leading-relaxed relative z-10">{step.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Compact Game Modes Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-2"
        >
          <h2 className="text-lg font-bold text-center mb-3 text-slate-200">Choose Your Opponent</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {gameModes.map((gameMode, index) => (
              <CompactGameCard
                key={gameMode.mode}
                gameMode={gameMode}
                index={index}
                onSelect={handleModeSelect}
                isHovered={hoveredCard === gameMode.mode}
                onHoverChange={setHoveredCard}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Compact Game Card Component
function CompactGameCard({ 
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
  const disabled = ['pvp', 'multiplayer', 'tournament'].includes(gameMode.mode)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
      whileHover={disabled ? {} : { scale: 1.03, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onMouseEnter={() => onHoverChange(gameMode.mode)}
      onMouseLeave={() => onHoverChange(null)}
      onClick={() => !disabled && onSelect(gameMode.mode)}
      className={`${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} relative`}
    >
      <div className={`bg-gradient-to-br ${gameMode.color} p-[1px] rounded-xl h-full shadow-lg hover:shadow-xl transition-shadow`}>
        <div className="bg-slate-800/95 rounded-xl p-3 h-full flex flex-col relative overflow-hidden">
          {disabled && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
              <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-800/80 rounded">Coming Soon</span>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">{gameMode.icon}</span>
            {gameMode.difficulty && (
              <span className="text-[10px] font-semibold text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-700/50">
                {gameMode.difficulty}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold mb-1 text-white">{gameMode.name}</h3>
          <p className="text-slate-400 text-[11px] mb-3 line-clamp-2 leading-tight">{gameMode.description}</p>
          
          <button
            className={`w-full px-2 py-1.5 rounded-lg font-semibold text-xs bg-gradient-to-r ${gameMode.color} mt-auto ${disabled ? 'opacity-50' : 'hover:opacity-90'}`}
            disabled={disabled}
          >
            {disabled ? 'Soon' : 'Play →'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
