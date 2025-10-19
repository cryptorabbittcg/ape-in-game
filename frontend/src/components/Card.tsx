import { motion } from 'framer-motion'
import React from 'react'
import { Card as CardType } from '../types/game'

interface CardProps {
  card: CardType | null
  isFlipped?: boolean
  className?: string
}

export default function Card({ card, isFlipped = false, className = '' }: CardProps) {
  // Handle null card case - show deck/cardback
  if (!card) {
    return (
      <div className={`w-24 h-36 rounded-lg border-2 border-indigo-600 bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center ${className}`}>
        <img 
          src="/assets/cards/Ape_In_Cardback.jpg" 
          alt="Deck"
          className="w-full h-full object-cover rounded"
          onError={(e) => {
            // Fallback to icon if image fails
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-white"><div class="text-4xl mb-2">🎴</div><div class="text-xs font-bold">APE IN!</div><div class="text-xs opacity-75">DECK</div></div>'
            }
          }}
        />
      </div>
    )
  }

  const getCardColor = () => {
    switch (card.type) {
      case 'Cipher':
        return 'bg-gradient-to-br from-blue-500 to-blue-700'
      case 'Oracle':
        return 'bg-gradient-to-br from-purple-500 to-purple-700'
      case 'Historacle':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-700'
      case 'Bearish':
        return 'bg-gradient-to-br from-red-500 to-red-700'
      case 'Special':
        return 'bg-gradient-to-br from-green-500 to-green-700'
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-700'
    }
  }

  const getCardIcon = () => {
    switch (card.type) {
      case 'Cipher':
        return '🔐'
      case 'Oracle':
        return '🔮'
      case 'Historacle':
        return '📊'
      case 'Bearish':
        return '🐻'
      case 'Special':
        return '🚀'
      default:
        return '❓'
    }
  }

  return (
    <motion.div
      className={`relative w-24 h-36 rounded-lg shadow-lg overflow-hidden ${className}`}
      initial={{ rotateY: 0 }}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {isFlipped ? (
        // Card back
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center">
          <div className="text-white text-4xl">🎴</div>
        </div>
      ) : (
        // Card front
        <div className={`absolute inset-0 w-full h-full ${getCardColor()} flex flex-col items-center justify-center p-2`}>
          {/* Card Image */}
          <div className="w-full h-20 mb-1 rounded overflow-hidden">
            <img
              src={card.image_url}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to icon if image fails
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl">${getCardIcon()}</div>`
                }
              }}
            />
          </div>
          
          {/* Card Info */}
          <div className="text-center text-white">
            <div className="text-xs font-bold truncate">{card.name}</div>
            {card.type === 'Bearish' ? (
              <div className="text-xs opacity-90">{card.penalty}</div>
            ) : (
              <div className="text-xs opacity-90">{card.value} sats</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}