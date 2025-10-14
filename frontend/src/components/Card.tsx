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
  // Show card back when no card - with same padding as drawn cards
  if (!card) {
    return (
      <motion.div
        whileHover={{ scale: 1.08, rotateZ: 2 }}
        whileTap={{ scale: 0.98 }}
        className="w-72 h-[28rem] md:w-80 md:h-[32rem] rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        {/* Slate border matching drawn cards */}
        <div className="bg-gradient-to-br from-slate-600 to-slate-800 h-full p-2 shadow-2xl relative hover:from-purple-600 hover:to-purple-800 transition-all duration-300">
          {/* Inner container with padding for 10% smaller image */}
          <div className="h-full w-full overflow-hidden rounded-xl relative p-2 bg-slate-900">
            <img
              src="/assets/cardback.jpg"
              alt="Card Back"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={isRevealing ? { rotateY: 180, scale: 0.7 } : { scale: 1 }}
      animate={isRevealing ? { rotateY: 0, scale: 1 } : { scale: 1 }}
      transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.03, y: -8 }}
      className={`w-72 h-[28rem] md:w-80 md:h-[32rem] rounded-2xl shadow-2xl overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Gradient border - proportional to card size */}
      <div className={`bg-gradient-to-br ${getCardGradient(card.type)} h-full p-2 shadow-2xl relative`}>
        {/* Glow effect for special cards */}
        {card.type === 'Special' && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-2xl animate-pulse" />
        )}
        {card.type === 'Bearish' && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/30 to-orange-400/30 rounded-2xl animate-pulse" />
        )}
        
        {/* Card Image - 10% smaller with padding for even look */}
        <div className="h-full w-full overflow-hidden rounded-xl relative p-2 bg-slate-900">
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-9xl">
              {card.type === 'Bearish' ? '🐻' : card.type === 'Special' ? '🚀' : '🎴'}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}


