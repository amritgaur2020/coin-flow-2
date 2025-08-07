'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, TrendingUp, Send, Plus, ArrowUpRight, ArrowDownLeft, Bitcoin, Coins, RefreshCw, AlertCircle, Clock, Wifi, WifiOff, Activity, BarChart3, CreditCard, ExternalLink, CheckCircle } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { useWebSocketPrices } from "@/hooks/useWebSocketPrices"
import { usePersistentHoldings } from "@/hooks/usePersistentHoldings"
import { PriceHistoryChart } from "@/components/PriceHistoryChart"
import { MarketAnalysis } from "@/components/MarketAnalysis"
import { TrendingSection } from "@/components/TrendingSection"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PaymentModal } from "@/components/PaymentModal"
import { CryptoSendModal } from "@/components/CryptoSendModal"

interface Transaction {
  id: string
  type: 'deposit' | 'buy' | 'send'
  amount: number
  currency: string
  timestamp: Date
  status: 'completed' | 'pending'
  address?: string
  price?: number
  txHash?: string
}

const CRYPTO_INFO = {
  BTC: { name: 'Bitcoin', icon: '₿' },
  ETH: { name: 'Ethereum', icon: 'Ξ' },
  ADA: { name: 'Cardano', icon: '₳' },
  SOL: { name: 'Solana', icon: '◎' },
  MATIC: { name: 'Polygon', icon: '⬟' },
  BNB: { name: 'BNB', icon: '🔶' },
  XRP: { name: 'XRP', icon: '✕' },
  DOGE: { name: 'Dogecoin', icon: 'Ð' },
  LINK: { name: 'Chainlink', icon: '🔗' },
  DOT: { name: 'Polkadot', icon: '●' }
}

export default function CryptoWalletApp() {
  const { prices, loading: pricesLoading, error: pricesError, lastUpdated, isUsingFallback, connectionStatus, refetch, reconnect } = useWebSocketPrices()
  const { holdings, updateHoldings, isLoaded: holdingsLoaded } = usePersistentHoldings()
  
  const [fiatBalance, setFiatBalance] = useState(2500.00)
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'deposit', amount: 1000, currency: 'USD', timestamp: new Date(Date.now() - 86400000), status: 'completed' },
    { id: '2', type: 'buy', amount: 0.025, currency: 'BTC', timestamp: new Date(Date.now() - 43200000), status: 'completed', price: 42000 },
    { id: '3', type: 'send', amount: 0.1, currency: 'ETH', timestamp: new Date(Date.now() - 21600000), status: 'completed', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', price: 2500 }
  ])

  const [buyAmount, setBuyAmount] = useState('')
  const [selectedCrypto, setSelectedCrypto] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  // Track previous values for change detection
  const [previousPortfolioValue, setPreviousPortfolioValue] = useState(0)
  const [previousTotalBalance, setPreviousTotalBalance] = useState(0)
  const [portfolioChanged, setPortfolioChanged] = useState(false)
  const [totalBalanceChanged, setTotalBalanceChanged] = useState(false)

  // Calculate portfolio value using real-time prices (memoized for performance)
  const totalPortfolioValue = useMemo(() => {
    const value = holdings.reduce((sum, holding) => {
      const currentPrice = prices[holding.symbol]?.price || holding.averagePrice
      return sum + (holding.amount * currentPrice)
    }, 0) // Add initial value of 0
    
    if (value !== previousPortfolioValue && previousPortfolioValue !== 0) {
      const change = value - previousPortfolioValue
      const changePercent = ((change / previousPortfolioValue) * 100).toFixed(2)
      console.log(`💰 Portfolio value changed: $${previousPortfolioValue.toFixed(2)} → $${value.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent}%)`)
    }
    
    return value
  }, [holdings, prices, previousPortfolioValue])

  // Calculate total P&L with real-time updates
  const totalPnL = useMemo(() => {
    return holdings.reduce((sum, holding) => {
      const currentPrice = prices[holding.symbol]?.price || holding.averagePrice
      const currentValue = holding.amount * currentPrice
      const costBasis = holding.amount * holding.averagePrice
      return sum + (currentValue - costBasis)
    }, 0) // Add initial value of 0
  }, [holdings, prices])

  // Additional code can be added here
}
