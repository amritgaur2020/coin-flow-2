import { useState, useEffect } from 'react'

interface TrendingCoin {
  id: string
  name: string
  symbol: string
  market_cap_rank: number | null
  thumb: string
  price_btc: number
}

export function useTrendingCrypto() {
  const [trending, setTrending] = useState<TrendingCoin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/crypto-news')
        if (!response.ok) {
          throw new Error('Failed to fetch trending data')
        }
        const data = await response.json()
        
        // Better handling of the API response structure
        const coins = data.coins || []
        const validCoins = coins
          .filter((coin: any) => coin && coin.item && coin.item.name && coin.item.symbol)
          .map((coin: any) => ({
            id: coin.item.id || '',
            name: coin.item.name || '',
            symbol: coin.item.symbol || '',
            market_cap_rank: coin.item.market_cap_rank || null,
            thumb: coin.item.thumb || '',
            price_btc: coin.item.price_btc || 0
          }))
          .slice(0, 5)
        
        setTrending(validCoins)
      } catch (error) {
        console.error('Error fetching trending:', error)
        setTrending([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
    // 2 hour interval for trending data (7,200,000 milliseconds)
    const interval = setInterval(fetchTrending, 7200000)
    
    return () => clearInterval(interval)
  }, [])

  return { trending, loading }
}
