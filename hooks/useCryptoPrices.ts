import { useState, useEffect, useCallback } from 'react'

interface CryptoPrice {
  price: number
  change24h: number
  marketCap: number
  volume: number
}

interface CryptoPrices {
  [key: string]: CryptoPrice
}

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrices>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  const fetchPrices = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/crypto-prices', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Validate that we received valid data
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        // Round prices to avoid showing too many decimal places that change rapidly
        const roundedData: CryptoPrices = {}
        Object.entries(data).forEach(([symbol, priceData]: [string, any]) => {
          roundedData[symbol] = {
            price: Math.round(priceData.price * 100) / 100, // Round to 2 decimal places for most coins
            change24h: Math.round(priceData.change24h * 100) / 100, // Round to 2 decimal places
            marketCap: Math.round(priceData.marketCap),
            volume: Math.round(priceData.volume)
          }
          
          // Special handling for very small price coins (like DOGE)
          if (priceData.price < 1) {
            roundedData[symbol].price = Math.round(priceData.price * 10000) / 10000 // 4 decimal places for small coins
          }
        })
        
        setPrices(roundedData)
        setLastUpdated(new Date())
        setLoading(false)
        setIsUsingFallback(false)
      } else {
        throw new Error('Invalid data format received')
      }
    } catch (err) {
      console.warn('Error in useCryptoPrices:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsUsingFallback(true)
      
      // Set fallback data if no data exists yet
      if (Object.keys(prices).length === 0) {
        setPrices({
          BTC: { price: 43250.00, change24h: 2.50, marketCap: 850000000000, volume: 25000000000 },
          ETH: { price: 2580.00, change24h: -1.20, marketCap: 310000000000, volume: 15000000000 },
          ADA: { price: 0.5200, change24h: 4.10, marketCap: 18000000000, volume: 800000000 },
          SOL: { price: 98.50, change24h: 6.80, marketCap: 42000000000, volume: 2500000000 },
          MATIC: { price: 0.8900, change24h: -2.10, marketCap: 8500000000, volume: 450000000 },
          BNB: { price: 310.00, change24h: 1.80, marketCap: 47000000000, volume: 1800000000 },
          XRP: { price: 0.6300, change24h: -0.50, marketCap: 34000000000, volume: 1200000000 },
          DOGE: { price: 0.0820, change24h: 3.20, marketCap: 12000000000, volume: 650000000 },
          LINK: { price: 14.50, change24h: 2.10, marketCap: 8500000000, volume: 420000000 },
          DOT: { price: 7.20, change24h: -1.80, marketCap: 9200000000, volume: 380000000 }
        })
        setLastUpdated(new Date())
      }
      setLoading(false)
    }
  }, [prices])

  useEffect(() => {
    fetchPrices()
    
    // 1 hour interval (3,600,000 milliseconds) for extremely slow updates
    const interval = setInterval(fetchPrices, 3600000)
    
    return () => clearInterval(interval)
  }, [fetchPrices])

  return { prices, loading, error, lastUpdated, isUsingFallback, refetch: fetchPrices }
}
