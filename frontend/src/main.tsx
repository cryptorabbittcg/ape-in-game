import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThirdwebProvider } from 'thirdweb/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

console.log('🚀 Starting React app...')

// Test import to see if all exports work
import('./types/game').then(({ GameMode, GameModeValues, LeaderboardEntry, Card, GameState }) => {
  console.log('✅ GameMode import successful:', GameMode)
  console.log('✅ GameModeValues import successful:', GameModeValues)
  console.log('✅ LeaderboardEntry import successful:', LeaderboardEntry)
  console.log('✅ Card import successful:', Card)
  console.log('✅ GameState import successful:', GameState)
}).catch((error) => {
  console.error('❌ Types import failed:', error)
})

try {
  const rootElement = document.getElementById('root')
  console.log('🎯 Root element found:', rootElement)
  
  if (!rootElement) {
    throw new Error('Root element not found!')
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThirdwebProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThirdwebProvider>
    </React.StrictMode>,
  )
  
  console.log('✅ React app rendered successfully')
} catch (error) {
  console.error('❌ Failed to render React app:', error)
}
