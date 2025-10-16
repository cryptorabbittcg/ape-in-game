import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThirdwebProvider } from 'thirdweb/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

console.log('🚀 Starting React app...')

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
