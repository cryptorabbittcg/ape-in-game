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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-48 h-72 rounded-xl shadow-2xl overflow-hidden cursor-pointer"
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
      initial={isRevealing ? { rotateY: 180, scale: 0.8 } : { scale: 1 }}
      animate={isRevealing ? { rotateY: 0, scale: 1 } : { scale: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className={`w-48 h-72 rounded-xl shadow-2xl overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className={`bg-gradient-to-br ${getCardGradient(card.type)} h-full p-1`}>
        <div className="bg-slate-900 rounded-lg h-full p-2 flex flex-col">
          {/* Card Type Badge */}
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{card.type}</div>

          {/* Card Image - takes most of the space */}
          <div className="flex-grow flex items-center justify-center overflow-hidden rounded-lg mb-2">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-6xl">
                {card.type === 'Bearish' ? '🐻' : card.type === 'Special' ? '🚀' : '🎴'}
              </div>
            )}
          </div>

          {/* Card Name - compact */}
          <div className="text-center">
            <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{card.name}</h3>
            {card.type !== 'Bearish' ? (
              <div className="text-xl font-bold text-yellow-400">{card.value} sats</div>
            ) : (
              <div className="text-base font-bold text-red-400">{card.penalty}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}


