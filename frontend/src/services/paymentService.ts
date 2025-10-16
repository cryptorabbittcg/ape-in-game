import { useActiveAccount } from 'thirdweb/react'
import { useState, useEffect } from 'react'
import { client, curtisChain } from '../lib/thirdweb'

// CURTIS testnet configuration (matching Cryptoku working setup)
const CURTIS_RPC_URL = import.meta.env.VITE_RPC_URL || "https://curtis.rpc.caldera.xyz/http"
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || ''
const TOKEN_DECIMALS = Number(import.meta.env.VITE_TOKEN_DECIMALS || 18)
const TOKEN_SYMBOL = import.meta.env.VITE_TOKEN_SYMBOL || 'CURTIS'

export interface PaymentValidation {
  hasEnoughBalance: boolean
  requiredAmount: number
  currentBalance: number
  shortfall: number
}

export class PaymentService {
  static async validatePayment(account: any, requiredAmount: number): Promise<PaymentValidation> {
    if (!account) {
      return {
        hasEnoughBalance: false,
        requiredAmount,
        currentBalance: 0,
        shortfall: requiredAmount
      }
    }

    try {
      // Use direct RPC call like Cryptoku (for native APE balance)
      const response = await fetch(CURTIS_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [account.address, 'latest'],
          id: 1,
        }),
      })

      const data = await response.json()
      const balanceHex = data.result || "0x0"
      
      // Convert from hex to number (wei to APE)
      const balanceWei = parseInt(balanceHex, 16)
      const currentBalance = balanceWei / (10 ** TOKEN_DECIMALS)
      const shortfall = Math.max(0, requiredAmount - currentBalance)

      return {
        hasEnoughBalance: currentBalance >= requiredAmount,
        requiredAmount,
        currentBalance,
        shortfall
      }
    } catch (error) {
      console.error('Failed to validate payment:', error)
      return {
        hasEnoughBalance: false,
        requiredAmount,
        currentBalance: 0,
        shortfall: requiredAmount
      }
    }
  }

  static getGamePrice(gameMode: string): number {
    // Sandy is free, all others cost 0.10 APE
    return gameMode === 'sandy' ? 0 : 0.10
  }

  static formatApeCoin(amount: number): string {
    return `${amount.toFixed(2)} ${TOKEN_SYMBOL}`
  }
}

/**
 * Custom hook to fetch the token balance for the active account
 * Uses direct RPC calls like Cryptoku for better compatibility
 */
export function useTokenBalance() {
  const account = useActiveAccount()
  const [balance, setBalance] = useState('0.00')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!account?.address) {
      setBalance('0.00')
      return
    }

    const fetchBalance = async () => {
      console.log('🔄 Fetching balance for address:', account.address)
      console.log('🌐 Using RPC URL:', CURTIS_RPC_URL)
      
      setIsLoading(true)
      try {
        // Use direct RPC call like Cryptoku (for native APE balance)
        const response = await fetch(CURTIS_RPC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [account.address, 'latest'],
            id: 1,
          }),
        })

        const data = await response.json()
        console.log('📊 RPC Response:', data)
        
        const balanceHex = data.result || "0x0"
        console.log('💰 Balance Hex:', balanceHex)
        
        // Convert from hex to number (wei to APE)
        const balanceWei = parseInt(balanceHex, 16)
        const currentBalance = balanceWei / (10 ** TOKEN_DECIMALS)
        
        console.log('💎 Balance Wei:', balanceWei)
        console.log('🪙 Balance APE:', currentBalance)
        
        setBalance(currentBalance.toFixed(2))
      } catch (error) {
        console.error('❌ Failed to fetch balance:', error)
        setBalance('0.00')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [account?.address])

  return { balance, isLoading }
}
