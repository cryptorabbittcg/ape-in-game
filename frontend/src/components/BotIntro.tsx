import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameMode } from '../types/game'

interface BotIntroProps {
  gameMode: GameMode
  onComplete: (skip: boolean) => void
}

const BOT_INTROS: Record<GameMode, string[]> = {
  sandy: [
    "🤖 Sandy: Welcome to...",
    "🎮 Risk-Reward: Stack Those Sats!",
    "🪙 In this game, you'll face off against me — Sandy!",
    "🎯 First to stack 150 sats wins.",
    "🎴 You'll draw cards, 🎲 roll dice, and ⚠️ dodge bearish penalties!",
    "📈 Stack wisely… or risk losing it all.",
    "🤞 Good luck!",
    "➡️ Let's begin..."
  ],
  aida: [
    "🧠 Aida: Let's test your probability instincts.",
    "🎯 Outsmart me in 20 rounds or accept defeat.",
    "📊 Data doesn't lie. But maybe you can bend it.",
    "🎴 Draw cards, 🎲 roll dice, 📈 stack sats, and ⚠️ dodge penalties!",
    "🏁 First to 300 sats or most after 20 rounds wins.",
    "Let us begin..."
  ],
  lana: [
    "🔧 Lana: Systems initialized.",
    "🎲 Prepare for adaptive gameplay.",
    "🧪 Let's see how you perform under strategic pressure.",
    "🎴 High-risk, high-reward is my game. I chase big wins and play boldly.",
    "🎯 First to 150 sats wins!",
    "Can you keep up or will you play it safe?"
  ],
  enj1n: [
    "🔥 En-J1n: Let's ride the volatility!",
    "🎲 No brakes. No rules. Just risk.",
    "💥 Beat me before I explode the sats stack!",
    "🎴 I play to win — relentlessly. I push the limit and barely ever stop.",
    "🎯 First to 150 sats wins!",
    "If you're not prepared, I'll leave you in the dust. Let's roll!"
  ],
  nifty: [
    "🎨 Nifty: Art of probability is my game.",
    "🎭 You'll need flair *and* strategy.",
    "📈 The charts may favor me... let's see.",
    "🎴 Time to mix things up! I love unpredictable games and creative strategies.",
    "🎯 First to 150 sats wins!",
    "Let's see what you've got in your playbook."
  ],
  pvp: [
    "👥 PvP Mode Activated!",
    "🎮 Battle another player in a 20-round trading session.",
    "🏆 Stack smarter, survive longer, win bigger.",
    "🎴 Face off against another Cipher! The first to stack the most sats wins.",
    "🎯 First to 150 sats wins!",
    "Trust your gut… and maybe don't trust your opponent."
  ],
  multiplayer: [
    "🌐 Multiplayer Activated!",
    "🎲 Compete with 3–10 players in a strategic sats-stacking brawl.",
    "🔢 First to 300 wins — or be the last player standing.",
    "🎴 Welcome to the mid-size arena. Work your strategy and watch out for unexpected busts.",
    "🎯 First to 150 sats wins!",
    "This is where legends are born. Stack wisely!"
  ],
  tournament: [
    "🏆 Tournament Mode!",
    "🎮 Compete in a structured tournament format.",
    "🏅 Multiple rounds, elimination brackets, ultimate glory!",
    "🎴 The ultimate test of skill and strategy.",
    "🎯 First to 150 sats wins!",
    "May the best Cipher win!"
  ]
}

const BOT_COLORS: Record<GameMode, string> = {
  sandy: 'from-yellow-500 to-orange-500',
  aida: 'from-purple-500 to-pink-500', 
  lana: 'from-blue-500 to-cyan-500',
  enj1n: 'from-red-500 to-orange-500',
  nifty: 'from-orange-500 to-yellow-500',
  pvp: 'from-green-500 to-emerald-500',
  multiplayer: 'from-indigo-500 to-purple-500',
  tournament: 'from-amber-500 to-yellow-500'
}

const BOT_EMOJIS: Record<GameMode, string> = {
  sandy: '🤖',
  aida: '🧠',
  lana: '🔧', 
  enj1n: '🔥',
  nifty: '🎨',
  pvp: '👥',
  multiplayer: '🌐',
  tournament: '🏆'
}

export default function BotIntro({ gameMode, onComplete }: BotIntroProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [showButtons, setShowButtons] = useState(false)

  const introMessages = BOT_INTROS[gameMode] || BOT_INTROS.sandy
  const botColor = BOT_COLORS[gameMode] || BOT_COLORS.sandy
  const botEmoji = BOT_EMOJIS[gameMode] || BOT_EMOJIS.sandy

  useEffect(() => {
    if (currentMessageIndex < introMessages.length) {
      setIsTyping(true)
      const timer = setTimeout(() => {
        setIsTyping(false)
        if (currentMessageIndex === introMessages.length - 1) {
          setShowButtons(true)
        } else {
          setTimeout(() => {
            setCurrentMessageIndex(prev => prev + 1)
          }, 1000)
        }
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [currentMessageIndex, introMessages.length])

  const handleStartGame = () => {
    onComplete(false)
  }

  const handleSkipIntro = () => {
    onComplete(true)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 max-w-2xl w-full border-2 border-slate-600 shadow-2xl"
      >
        {/* Bot Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${botColor} flex items-center justify-center text-4xl shadow-lg`}
          >
            {botEmoji}
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)} Mode
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
        </div>

        {/* Intro Messages */}
        <div className="min-h-[200px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-lg sm:text-xl text-slate-200 leading-relaxed">
                {introMessages[currentMessageIndex]}
              </div>
              
              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center mt-4"
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {introMessages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index <= currentMessageIndex ? 'bg-purple-500' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <AnimatePresence>
          {showButtons && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGame}
                className={`px-6 py-3 bg-gradient-to-r ${botColor} text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all`}
              >
                ▶️ Start Game
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSkipIntro}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                ⏭️ Skip Intro
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
