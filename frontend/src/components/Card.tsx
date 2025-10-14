import { motion } from 'framer-motion'
import { Card as CardType } from '../types/game'

interface CardProps {
  card: CardType | null
  isRevealing?: boolean
  onClick?: () => void
}

const getCardGradient = (type: CardType['type']) => {
  switch (type) {
    case 'Cipher':
      return 'from-blue-500 to-cyan-500'
    case 'Oracle':
      return 'from-purple-500 to-pink-500'
    case 'Historacle':
      return 'from-yellow-500 to-orange-500'
    case 'Bearish':
      return 'from-red-600 to-red-800'
    case 'Special':
      return 'from-green-500 to-emerald-600'
    default:
      return 'from-slate-600 to-slate-800'
  }
}

export default function Card({ card, isRevealing = false, onClick }: CardProps) {
  // Show card back when no card
  if (!card) {
    return (
      <motion.div
        whileHover={{ scale: 1.08, rotateZ: 2 }}
        whileTap={{ scale: 0.98 }}
        className="w-56 h-80 md:w-64 md:h-96 rounded-2xl shadow-2xl overflow-hidden cursor-pointer ring-2 ring-slate-600 hover:ring-purple-500 transition-all"
        onClick={onClick}
      >
        <img
          src="/assets/cardback.jpg"
          alt="Card Back"
          className="w-full h-full object-cover"
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={isRevealing ? { rotateY: 180, scale: 0.7 } : { scale: 1 }}
      animate={isRevealing ? { rotateY: 0, scale: 1 } : { scale: 1 }}
      transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className={`w-56 h-80 md:w-64 md:h-96 rounded-2xl shadow-2xl overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className={`bg-gradient-to-br ${getCardGradient(card.type)} h-full p-[3px] shadow-lg`}>
        <div className="bg-slate-900 rounded-2xl h-full p-3 flex flex-col relative">
          {/* Glow effect for special cards */}
          {card.type === 'Special' && (
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-2xl animate-pulse" />
          )}
          {card.type === 'Bearish' && (
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-2xl" />
          )}
          
          {/* Card Type Badge */}
          <div className="text-xs font-bold text-slate-300 uppercase mb-2 relative z-10 flex items-center justify-between">
            <span className={`px-2 py-1 rounded-lg ${
              card.type === 'Bearish' ? 'bg-red-900/50 text-red-300' :
              card.type === 'Special' ? 'bg-green-900/50 text-green-300' :
              'bg-slate-800/50'
            }`}>
              {card.type}
            </span>
            {card.value > 0 && (
              <span className="text-yellow-400 font-bold text-lg">+{card.value}</span>
            )}
          </div>

          {/* Card Image - takes most of the space */}
          <div className="flex-grow flex items-center justify-center overflow-hidden rounded-xl mb-3 relative z-10">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className="w-full h-full object-contain drop-shadow-xl"
              />
            ) : (
              <div className="text-7xl md:text-8xl">
                {card.type === 'Bearish' ? '🐻' : card.type === 'Special' ? '🚀' : '🎴'}
              </div>
            )}
          </div>

          {/* Card Name & Value - prominent */}
          <div className="text-center relative z-10">
            <h3 className="text-base md:text-lg font-black text-white mb-2 drop-shadow-lg">{card.name}</h3>
            {card.type !== 'Bearish' ? (
              <div className="text-2xl md:text-3xl font-black text-yellow-400 drop-shadow-lg animate-pulse">
                {card.value} sats
              </div>
            ) : (
              <div className="text-xl md:text-2xl font-black text-red-400 drop-shadow-lg">
                ⚠️ {card.penalty}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}


