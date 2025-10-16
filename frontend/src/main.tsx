import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThirdwebProvider } from 'thirdweb/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

console.log('🚀 Starting React app...')

// Test import to see if all exports work
import('./types/game').then(({ GameMode, GameModeValues, createLeaderboardEntry, CardType }) => {
  console.log('✅ GameMode import successful:', GameMode)
  console.log('✅ GameModeValues import successful:', GameModeValues)
  console.log('✅ createLeaderboardEntry import successful:', createLeaderboardEntry)
  console.log('✅ CardType import successful:', CardType)
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
