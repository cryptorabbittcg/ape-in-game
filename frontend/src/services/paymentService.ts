import { useActiveAccount } from 'thirdweb/react'
import { getBalance } from 'thirdweb/extensions/erc20'
import { client } from '../lib/thirdweb'

// ApeCoin contract address on Ethereum mainnet
const APECOIN_CONTRACT_ADDRESS = '0x4d224452801ACEd8B2F0aebE155379bb5D594381'

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
          address: APECOIN_CONTRACT_ADDRESS,
          chain: client.chain,
          client: client,
        },
        address: account.address,
      })

      // Convert from wei to ApeCoin (18 decimals)
      const currentBalance = Number(balanceResult) / 1e18
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
    return `${amount.toFixed(2)} APE`
  }
}
