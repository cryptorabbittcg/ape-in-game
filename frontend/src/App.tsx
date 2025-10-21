import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
        // CACHE BUST: Tue Oct 21 01:45:00 AM ACDT 2025 - Force Vercel to use latest code after backend fixes
import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import NewHeader from './components/NewHeader'
import ParticleBackground from './components/ParticleBackground'
import WelcomeSplash from './components/WelcomeSplash'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showSplash, setShowSplash] = useState(true)

  // Show splash every time for that polished BAYC-style experience
  // No localStorage check - always show on new tab/window
  // No auto-navigation - wait for user click

  const handleSplashComplete = () => {
    setShowSplash(false)
    // Navigate to home page when splash is clicked
    navigate('/')
  }

  // Always show splash on new tab/window (BAYC.com style)
  if (showSplash) {
    return <WelcomeSplash onStart={handleSplashComplete} />
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <ParticleBackground />
      <NewHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:mode" element={<GamePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </div>
  )
}

export default App
