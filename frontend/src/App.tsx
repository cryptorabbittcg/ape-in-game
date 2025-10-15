import { Routes, Route } from 'react-router-dom'
import EnhancedHomePage from './pages/EnhancedHomePage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import NewHeader from './components/NewHeader'
import ParticleBackground from './components/ParticleBackground'

function App() {
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <ParticleBackground />
      <NewHeader />
      <Routes>
        <Route path="/" element={<EnhancedHomePage />} />
        <Route path="/game/:mode" element={<GamePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </div>
  )
}

export default App
