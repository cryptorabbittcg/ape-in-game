import { useState, useEffect } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { getBalance } from 'thirdweb/extensions/erc20'
import { client } from '../lib/thirdweb'

// ApeCoin contract address on Ethereum mainnet
const APECOIN_CONTRACT_ADDRESS = '0x4d224452801ACEd8B2F0aebE155379bb5D594381'

export function useApeCoinBalance() {
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const account = useActiveAccount()

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) {
        setBalance('0')
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)

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
        const formattedBalance = (Number(balanceResult) / 1e18).toFixed(4)
        setBalance(formattedBalance)
      } catch (err) {
        console.error('Failed to fetch ApeCoin balance:', err)
        setError('Failed to load balance')
        setBalance('0')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)

    return () => clearInterval(interval)
  }, [account])

  return { balance, isLoading, error }
}
