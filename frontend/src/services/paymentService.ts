import { useActiveAccount, useReadContract } from 'thirdweb/react'
import { getBalance } from 'thirdweb/extensions/erc20'
import { client, curtisChain } from '../lib/thirdweb'

// Token from env to support CURTIS testnet during testing
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
      const balanceResult = await getBalance({
        contract: {
          address: TOKEN_ADDRESS,
          chain: curtisChain,
          client: client,
        },
        address: account.address,
      })

      // Convert units with configured decimals
      const currentBalance = Number(balanceResult) / 10 ** TOKEN_DECIMALS
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
 */
export function useTokenBalance() {
  const account = useActiveAccount()
  
  const { data, isLoading } = useReadContract({
    contract: {
      address: TOKEN_ADDRESS,
      chain: curtisChain,
      client: client,
    },
    method: "function balanceOf(address) view returns (uint256)",
    params: account?.address ? [account.address] : undefined,
    query: {
      enabled: !!account?.address && !!TOKEN_ADDRESS,
    },
  })

  const balance = data !== undefined ? (Number(data) / (10 ** TOKEN_DECIMALS)).toFixed(2) : '0.00'

  return { balance, isLoading }
}
