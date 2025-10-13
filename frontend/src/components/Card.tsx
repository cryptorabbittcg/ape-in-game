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
  if (!card) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-48 h-72 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl border-2 border-slate-600 flex items-center justify-center cursor-pointer shadow-2xl"
        onClick={onClick}
      >
        <div className="text-6xl">🎴</div>
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
        <div className="bg-slate-900 rounded-lg h-full p-4 flex flex-col">
          {/* Card Type Badge */}
          <div className="text-xs font-semibold text-slate-400 uppercase mb-2">{card.type}</div>

          {/* Card Image */}
          <div className="flex-grow flex items-center justify-center mb-4">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-6xl">
                {card.type === 'Bearish' ? '🐻' : card.type === 'Special' ? '🚀' : '🎴'}
              </div>
            )}
          </div>

          {/* Card Name */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-1">{card.name}</h3>
            {card.type !== 'Bearish' ? (
              <div className="text-2xl font-bold text-yellow-400">{card.value} sats</div>
            ) : (
              <div className="text-xl font-bold text-red-400">{card.penalty}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}


