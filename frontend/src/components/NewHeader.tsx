import { Link, useLocation } from 'react-router-dom'
import { ConnectButton, useActiveAccount, useDisconnect } from 'thirdweb/react'
import { client, wallet } from '../lib/thirdweb'
import { createWallet } from 'thirdweb/wallets'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface UserProfile {
  name: string
  avatar: string
  walletAddress: string
}

export default function NewHeader() {
  const account = useActiveAccount()
  const { disconnect } = useDisconnect()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Load user profile from localStorage
  useEffect(() => {
    if (account) {
      const savedProfile = localStorage.getItem(`profile_${account.address}`)
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile))
        setPlayerName(JSON.parse(savedProfile).name)
      } else {
        // Generate random abstract avatar
        const avatar = generateRandomAvatar()
        const profile: UserProfile = {
          name: '',
          avatar,
          walletAddress: account.address
        }
        setUserProfile(profile)
        setShowNameModal(true)
      }
    }
  }, [account])

  // Track scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Generate random abstract avatar
  const generateRandomAvatar = () => {
    const shapes = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪']
    const patterns = ['', '◢', '◣', '◤', '◥', '⬟', '⬢', '⬡']
    const shape = shapes[Math.floor(Math.random() * shapes.length)]
    const pattern = patterns[Math.floor(Math.random() * patterns.length)]
    return `${shape}${pattern}`
  }

  // Save user profile
  const saveProfile = () => {
    if (account && playerName.trim()) {
      const profile: UserProfile = {
        name: playerName.trim(),
        avatar: userProfile?.avatar || generateRandomAvatar(),
        walletAddress: account.address
      }
      setUserProfile(profile)
      localStorage.setItem(`profile_${account.address}`, JSON.stringify(profile))
      setShowNameModal(false)
    }
  }

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect(wallet)
    setUserProfile(null)
    setPlayerName('')
    setShowAccountMenu(false)
  }

  const isHomePage = location.pathname === '/'

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl' 
            : 'bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30'
        }`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            
            {/* Left: Logo */}
            <Link to="/" className="flex items-center group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <img 
                  src="/assets/cxrh-banner.png" 
                  alt="The Crypto Rabbit Hole" 
                  className="h-8 w-auto"
                />
              </motion.div>
            </Link>

            {/* Center: Ape In! Title (Clickable) */}
            <Link to="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className="text-3xl font-display font-black bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent cursor-pointer"
              >
                APE IN!
              </motion.div>
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
              
              {/* Leaderboard Button */}
              <Link
                to="/leaderboard"
                className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
              >
                <span className="text-lg">🏆</span>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white">Leaderboard</span>
              </Link>

              {/* Wallet Connection / Account */}
              {account ? (
                <div className="relative">
                  {/* Account Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 hover:border-green-500/50 transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-lg">
                      {userProfile?.avatar || '👤'}
                    </div>
                    
                    {/* Wallet Info */}
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-xs font-semibold text-white">
                        {userProfile?.name || 'Player'}
                      </span>
                      <span className="text-xs font-mono text-green-400">
                        {formatAddress(account.address)}
                      </span>
                    </div>
                    
                    {/* Connection Status */}
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </motion.button>

                  {/* Account Dropdown */}
                  <AnimatePresence>
                    {showAccountMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden"
                      >
                        {/* Profile Section */}
                        <div className="p-4 border-b border-slate-700/50">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-2xl">
                              {userProfile?.avatar || '👤'}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{userProfile?.name || 'Player'}</h3>
                              <p className="text-xs text-slate-400 font-mono">{formatAddress(account.address)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setShowNameModal(true)
                              setShowAccountMenu(false)
                            }}
                            className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center space-x-3"
                          >
                            <span>✏️</span>
                            <span>Edit Name</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              // TODO: Implement NFT PFP selection
                              setShowAccountMenu(false)
                            }}
                            className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center space-x-3"
                          >
                            <span>🖼️</span>
                            <span>Change Avatar</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              // TODO: Show profile stats
                              setShowAccountMenu(false)
                            }}
                            className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center space-x-3"
                          >
                            <span>📊</span>
                            <span>My Stats</span>
                          </button>
                        </div>

                        {/* Disconnect */}
                        <div className="p-2 border-t border-slate-700/50">
                          <button
                            onClick={handleDisconnect}
                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/20 transition-colors flex items-center space-x-3"
                          >
                            <span>🚪</span>
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <ConnectButton
                  client={client}
                  wallets={[
                    wallet,
                    createWallet('io.metamask'),
                    createWallet('com.coinbase.wallet'),
                    createWallet('me.rainbow'),
                  ]}
                  theme="dark"
                  connectButton={{
                    label: 'Connect Wallet',
                    className: 'custom-connect-button',
                  }}
                  connectModal={{
                    size: 'compact',
                    title: 'Welcome to Ape In!',
                    titleIcon: '🎮',
                    showThirdwebBranding: false,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Name Entry Modal */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-3xl mx-auto mb-4">
                  {userProfile?.avatar || '👤'}
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Welcome to Ape In!</h2>
                <p className="text-slate-400">Enter your name to get started</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 focus:border-purple-500/50 focus:outline-none text-white placeholder-slate-400"
                    maxLength={20}
                    autoFocus
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      if (playerName.trim()) {
                        saveProfile()
                      }
                    }}
                    disabled={!playerName.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save & Play
                  </button>
                  
                  <button
                    onClick={() => {
                      const randomName = `Player${Math.floor(Math.random() * 1000)}`
                      setPlayerName(randomName)
                    }}
                    className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg font-semibold text-slate-300 hover:bg-slate-600/50 transition-all"
                  >
                    Random
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add top padding to body to account for fixed header */}
      <div className="h-20"></div>
    </>
  )
}
