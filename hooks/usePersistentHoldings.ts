import { useState, useEffect } from 'react'

interface CryptoHolding {
  symbol: string
  name: string
  amount: number
  averagePrice: number
}

export function usePersistentHoldings() {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load holdings from localStorage on mount
  useEffect(() => {
    try {
      const savedHoldings = localStorage.getItem('crypto-wallet-holdings')
      if (savedHoldings) {
        const parsedHoldings = JSON.parse(savedHoldings)
        setHoldings(parsedHoldings)
        console.log('✅ Loaded holdings from localStorage:', parsedHoldings)
      } else {
        // Set default holdings only if no saved data exists
        const defaultHoldings = [
          { symbol: 'BTC', name: 'Bitcoin', amount: 0.025, averagePrice: 3500000 }, // ₹ 35,00,000
          { symbol: 'ETH', name: 'Ethereum', amount: 1.5, averagePrice: 207500 }, // ₹ 2,07,500
          { symbol: 'ADA', name: 'Cardano', amount: 1000, averagePrice: 43 }, // ₹ 43
          { symbol: 'USDT', name: 'Tether USD', amount: 100, averagePrice: 83 } // ₹ 83
        ]
        setHoldings(defaultHoldings)
        localStorage.setItem('crypto-wallet-holdings', JSON.stringify(defaultHoldings))
        console.log('📦 Set default holdings and saved to localStorage')
      }
    } catch (error) {
      console.error('❌ Error loading holdings from localStorage:', error)
      // Fallback to default holdings
      const defaultHoldings = [
        { symbol: 'BTC', name: 'Bitcoin', amount: 0.025, averagePrice: 3500000 }, // ₹ 35,00,000
        { symbol: 'ETH', name: 'Ethereum', amount: 1.5, averagePrice: 207500 }, // ₹ 2,07,500
        { symbol: 'ADA', name: 'Cardano', amount: 1000, averagePrice: 43 }, // ₹ 43
        { symbol: 'USDT', name: 'Tether USD', amount: 100, averagePrice: 83 } // ₹ 83
      ]
      setHoldings(defaultHoldings)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save holdings to localStorage whenever they change
  const updateHoldings = (newHoldings: CryptoHolding[]) => {
    setHoldings(newHoldings)
    try {
      localStorage.setItem('crypto-wallet-holdings', JSON.stringify(newHoldings))
      console.log('💾 Saved holdings to localStorage:', newHoldings)
    } catch (error) {
      console.error('❌ Error saving holdings to localStorage:', error)
    }
  }

  return { holdings, updateHoldings, isLoaded }
}
