// ZkVerifyTest.tsx - Test component for zkVerify integration
import React, { useState } from 'react'
import { mockVerifyApeInGame, createGameStateFromGame, type ApeInGameState } from '../lib/zkverify'

export default function ZkVerifyTest() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const runZkVerifyTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      // Create a test game state
      const testGameState = createGameStateFromGame(
        'test-game-123',
        'TestPlayer',
        'sandy',
        150, // winning score
        165, // final score (victory)
        8,   // rounds played
        [10, 15, 20, 25, 30, 35], // cards drawn
        [3, 4, 5, 6, 2, 1], // dice rolls
        [
          { type: 'draw_card', value: 10, timestamp: Date.now() - 60000, round: 1 },
          { type: 'roll_dice', value: 3, timestamp: Date.now() - 58000, round: 1 },
          { type: 'stack_sats', timestamp: Date.now() - 56000, round: 1 },
          { type: 'draw_card', value: 15, timestamp: Date.now() - 54000, round: 2 },
          { type: 'roll_dice', value: 4, timestamp: Date.now() - 52000, round: 2 },
          { type: 'stack_sats', timestamp: Date.now() - 50000, round: 2 },
        ], // moves
        '0x1234567890123456789012345678901234567890' // wallet address
      )

      console.log('🧪 Testing zkVerify with game state:', testGameState)

      // Test mock verification
      const result = mockVerifyApeInGame(testGameState)

      if (result.isValid) {
        setTestResult(`✅ Mock verification successful! Proof ID: ${result.proofId}`)
        console.log('✅ zkVerify test passed:', result)
      } else {
        setTestResult(`❌ Mock verification failed: ${result.message}`)
        console.error('❌ zkVerify test failed:', result)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setTestResult(`❌ Test error: ${errorMessage}`)
      console.error('❌ zkVerify test error:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const testInvalidGameState = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      // Create an invalid game state (score below winning threshold)
      const invalidGameState = createGameStateFromGame(
        'test-game-invalid',
        'TestPlayer',
        'sandy',
        150, // winning score
        120, // final score (loss)
        8,   // rounds played
        [10, 15, 20, 25, 30], // cards drawn
        [3, 4, 5, 6, 2], // dice rolls
        [
          { type: 'draw_card', value: 10, timestamp: Date.now() - 60000, round: 1 },
          { type: 'roll_dice', value: 3, timestamp: Date.now() - 58000, round: 1 },
          { type: 'stack_sats', timestamp: Date.now() - 56000, round: 1 },
        ], // moves
        '0x1234567890123456789012345678901234567890' // wallet address
      )

      console.log('🧪 Testing zkVerify with invalid game state:', invalidGameState)

      // Test mock verification
      const result = mockVerifyApeInGame(invalidGameState)

      if (!result.isValid) {
        setTestResult(`✅ Correctly rejected invalid game: ${result.message}`)
        console.log('✅ zkVerify correctly rejected invalid game:', result)
      } else {
        setTestResult(`❌ Should have rejected invalid game but didn't!`)
        console.error('❌ zkVerify should have rejected invalid game')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setTestResult(`❌ Test error: ${errorMessage}`)
      console.error('❌ zkVerify test error:', error)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800/90 border border-slate-600 rounded-lg p-4 max-w-sm">
      <h3 className="text-lg font-bold mb-3 text-white">🧪 zkVerify Test</h3>
      
      <div className="space-y-2">
        <button
          onClick={runZkVerifyTest}
          disabled={isTesting}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white text-sm rounded font-semibold"
        >
          {isTesting ? '⏳ Testing...' : '✅ Test Valid Game'}
        </button>
        
        <button
          onClick={testInvalidGameState}
          disabled={isTesting}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-sm rounded font-semibold"
        >
          {isTesting ? '⏳ Testing...' : '❌ Test Invalid Game'}
        </button>
      </div>
      
      {testResult && (
        <div className="mt-3 p-2 bg-slate-700 rounded text-xs text-slate-200 font-mono">
          {testResult}
        </div>
      )}
      
      <div className="mt-3 text-xs text-slate-400">
        <div>Mode: {import.meta.env.VITE_USE_ZKVERIFY === 'true' ? '🔐 Real zkVerify' : '🧪 Mock Mode'}</div>
        <div>API Key: {import.meta.env.VITE_ZKVERIFY_API_KEY ? '✅ Set' : '❌ Not Set'}</div>
      </div>
    </div>
  )
}
