import { useState, useEffect, useCallback, useRef } from 'react'

interface CryptoPrice {
  price: number
  change24h: number
  marketCap: number
  volume: number
  high24h?: number
  low24h?: number
  priceHistory?: number[]
}

interface CryptoPrices {
  [key: string]: CryptoPrice
}

export function useWebSocketPrices() {
  const [prices, setPrices] = useState<CryptoPrices>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const priceHistoryRef = useRef<{ [key: string]: number[] }>({})

  // Initialize price history for each symbol
  const initializePriceHistory = useCallback((symbol: string, price: number) => {
    if (!priceHistoryRef.current[symbol]) {
      // Generate initial history with small variations around current price
      const history = []
      let currentPrice = price * 0.98 // Start slightly lower
      for (let i = 0; i < 50; i++) {
        const variation = (Math.random() - 0.5) * 0.01 // ±0.5% variation
        currentPrice = currentPrice * (1 + variation)
        history.push(currentPrice)
      }
      // Ensure the last price matches current price
      history[history.length - 1] = price
      priceHistoryRef.current[symbol] = history
    }
  }, [])

  // Update price history
  const updatePriceHistory = useCallback((symbol: string, newPrice: number) => {
    if (priceHistoryRef.current[symbol]) {
      const history = [...priceHistoryRef.current[symbol]]
      history.push(newPrice)
      // Keep only last 50 data points
      if (history.length > 50) {
        history.shift()
      }
      priceHistoryRef.current[symbol] = history
    }
  }, [])

  const fetchInitialPrices = useCallback(async () => {
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
      
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        // Initialize price history for each symbol
        Object.entries(data).forEach(([symbol, priceData]: [string, any]) => {
          initializePriceHistory(symbol, priceData.price)
        })

        // Add price history to the data
        const dataWithHistory: CryptoPrices = {}
        Object.entries(data).forEach(([symbol, priceData]: [string, any]) => {
          dataWithHistory[symbol] = {
            ...priceData,
            priceHistory: priceHistoryRef.current[symbol] || [],
            high24h: priceData.price * (1 + Math.random() * 0.05), // Simulate 24h high
            low24h: priceData.price * (1 - Math.random() * 0.05)   // Simulate 24h low
          }
        })
        
        setPrices(dataWithHistory)
        setLastUpdated(new Date())
        setLoading(false)
        setIsUsingFallback(false)
        console.log('✅ Initial prices loaded with history')
      } else {
        throw new Error('Invalid data format received')
      }
    } catch (err) {
      console.warn('⚠️ Error fetching initial prices:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsUsingFallback(true)
      setLoading(false)
    }
  }, [initializePriceHistory])

  // Simulate WebSocket connection (since we can't use real WebSocket in this environment)
  const connectWebSocket = useCallback(() => {
    setConnectionStatus('connecting')
    console.log('🔌 Connecting to WebSocket...')
    
    // Simulate connection delay
    setTimeout(() => {
      setConnectionStatus('connected')
      console.log('✅ WebSocket connected (simulated)')
      
      // Simulate real-time price updates every 2-5 seconds
      const interval = setInterval(() => {
        setPrices(prevPrices => {
          const updatedPrices = { ...prevPrices }
          
          // Update 1-3 random cryptocurrencies each time
          const symbols = Object.keys(updatedPrices)
          const numToUpdate = Math.floor(Math.random() * 3) + 1
          const symbolsToUpdate = symbols.sort(() => 0.5 - Math.random()).slice(0, numToUpdate)
          
          symbolsToUpdate.forEach(symbol => {
            const currentData = updatedPrices[symbol]
            if (currentData) {
              // Realistic price movement (±0.1% to ±0.3%)
              const variation = (Math.random() - 0.5) * 0.006 // ±0.3%
              const newPrice = currentData.price * (1 + variation)
              
              // Update price history
              updatePriceHistory(symbol, newPrice)
              
              // Calculate new 24h change
              const change24hVariation = (Math.random() - 0.5) * 0.2
              const newChange24h = currentData.change24h + change24hVariation
              
              updatedPrices[symbol] = {
                ...currentData,
                price: newPrice,
                change24h: newChange24h,
                marketCap: currentData.marketCap * (1 + variation * 0.5),
                volume: currentData.volume * (1 + (Math.random() - 0.5) * 0.02),
                priceHistory: priceHistoryRef.current[symbol] || [],
                high24h: Math.max(currentData.high24h || newPrice, newPrice),
                low24h: Math.min(currentData.low24h || newPrice, newPrice)
              }
              
              console.log(`📊 ${symbol}: $${currentData.price.toFixed(4)} → $${newPrice.toFixed(4)} (${variation > 0 ? '+' : ''}${(variation * 100).toFixed(2)}%)`)
            }
          })
          
          setLastUpdated(new Date())
          return updatedPrices
        })
      }, Math.random() * 3000 + 2000) // Random interval between 2-5 seconds
      
      // Store interval reference for cleanup
      wsRef.current = { close: () => clearInterval(interval) } as any
    }, 1000)
  }, [updatePriceHistory])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setConnectionStatus('disconnected')
    console.log('🔌 WebSocket disconnected')
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket()
    }, 2000)
  }, [disconnect, connectWebSocket])

  useEffect(() => {
    fetchInitialPrices().then(() => {
      connectWebSocket()
    })

    return () => {
      disconnect()
    }
  }, [fetchInitialPrices, connectWebSocket, disconnect])

  return { 
    prices, 
    loading, 
    error, 
    lastUpdated, 
    isUsingFallback, 
    connectionStatus,
    refetch: fetchInitialPrices,
    reconnect
  }
}
