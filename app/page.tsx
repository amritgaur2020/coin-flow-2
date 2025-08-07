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
import { Wallet, TrendingUp, Send, Plus, ArrowUpRight, ArrowDownLeft, Bitcoin, Coins, RefreshCw, AlertCircle, Clock, Wifi, WifiOff, Activity, BarChart3, CreditCard, ExternalLink, CheckCircle, Smartphone } from 'lucide-react'
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
  
  const [fiatBalance, setFiatBalance] = useState(25000.00) // Changed to INR (₹25,000)
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'deposit', amount: 10000, currency: 'INR', timestamp: new Date(Date.now() - 86400000), status: 'completed' },
    { id: '2', type: 'buy', amount: 0.025, currency: 'BTC', timestamp: new Date(Date.now() - 43200000), status: 'completed', price: 3500000 }, // ₹35,00,000
    { id: '3', type: 'send', amount: 0.1, currency: 'ETH', timestamp: new Date(Date.now() - 21600000), status: 'completed', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', price: 207500 } // ₹2,07,500
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

  // Calculate portfolio value using real-time prices (converted to INR)
  const totalPortfolioValue = useMemo(() => {
    const value = holdings.reduce((sum, holding) => {
      const currentPriceUSD = prices[holding.symbol]?.price || (holding.averagePrice / 83) // Convert INR to USD for calculation
      const currentPriceINR = currentPriceUSD * 83 // Convert back to INR
      return sum + (holding.amount * currentPriceINR)
    }, 0)
    
    if (value !== previousPortfolioValue && previousPortfolioValue !== 0) {
      const change = value - previousPortfolioValue
      const changePercent = ((change / previousPortfolioValue) * 100).toFixed(2)
      console.log(`💰 Portfolio value changed: ₹${previousPortfolioValue.toFixed(2)} → ₹${value.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent}%)`)
    }
    
    return value
  }, [holdings, prices, previousPortfolioValue])

  // Calculate total P&L with real-time updates (in INR)
  const totalPnL = useMemo(() => {
    return holdings.reduce((sum, holding) => {
      const currentPriceUSD = prices[holding.symbol]?.price || (holding.averagePrice / 83)
      const currentPriceINR = currentPriceUSD * 83
      const currentValue = holding.amount * currentPriceINR
      const costBasis = holding.amount * holding.averagePrice
      return sum + (currentValue - costBasis)
    }, 0)
  }, [holdings, prices])

  const totalBalance = fiatBalance + totalPortfolioValue

  // Rest of the useEffect hooks remain the same...
  useEffect(() => {
    const roundedPortfolio = Math.round(totalPortfolioValue * 100) / 100
    const roundedPrevious = Math.round(previousPortfolioValue * 100) / 100
    
    if (Math.abs(roundedPortfolio - roundedPrevious) > 0.01 && previousPortfolioValue !== 0) {
      setPortfolioChanged(true)
      setTimeout(() => setPortfolioChanged(false), 3000)
    }
    
    if (Math.abs(roundedPortfolio - roundedPrevious) > 0.01) {
      setPreviousPortfolioValue(roundedPortfolio)
    }
  }, [totalPortfolioValue])

  useEffect(() => {
    const roundedTotal = Math.round(totalBalance * 100) / 100
    const roundedPrevious = Math.round(previousTotalBalance * 100) / 100
    
    if (Math.abs(roundedTotal - roundedPrevious) > 0.01 && previousTotalBalance !== 0) {
      setTotalBalanceChanged(true)
      setTimeout(() => setTotalBalanceChanged(false), 3000)
    }
    
    if (Math.abs(roundedTotal - roundedPrevious) > 0.01) {
      setPreviousTotalBalance(roundedTotal)
    }
  }, [totalBalance])

  const handlePaymentSuccess = (amountINR: number) => {
    setFiatBalance(prev => prev + amountINR)
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount: amountINR,
      currency: 'INR',
      timestamp: new Date(),
      status: 'completed'
    }
    setTransactions(prev => [newTransaction, ...prev])
  }

  const handleBuyCrypto = async () => {
    const amountINR = parseFloat(buyAmount)
    const currentPriceUSD = prices[selectedCrypto]?.price
    const currentPriceINR = currentPriceUSD ? currentPriceUSD * 83 : 0
    
    if (amountINR > 0 && selectedCrypto && amountINR <= fiatBalance && currentPriceINR) {
      try {
        const response = await fetch('/api/crypto/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: selectedCrypto,
            amountINR: amountINR,
            userId: 'user_123'
          })
        })

        const result = await response.json()
        
        if (result.success) {
          const cryptoAmount = amountINR / currentPriceINR
          
          setFiatBalance(prev => prev - (result.transaction.totalCost || amountINR))
          
          const existingHolding = holdings.find(h => h.symbol === selectedCrypto)
          if (existingHolding) {
            const newTotalAmount = existingHolding.amount + cryptoAmount
            const newAveragePrice = ((existingHolding.amount * existingHolding.averagePrice) + amountINR) / newTotalAmount
            
            const updatedHoldings = holdings.map(h => 
              h.symbol === selectedCrypto 
                ? { ...h, amount: newTotalAmount, averagePrice: newAveragePrice }
                : h
            )
            updateHoldings(updatedHoldings)
          } else {
            const newHolding = {
              symbol: selectedCrypto,
              name: CRYPTO_INFO[selectedCrypto as keyof typeof CRYPTO_INFO].name,
              amount: cryptoAmount,
              averagePrice: currentPriceINR
            }
            updateHoldings([...holdings, newHolding])
          }

          const newTransaction: Transaction = {
            id: Date.now().toString(),
            type: 'buy',
            amount: cryptoAmount,
            currency: selectedCrypto,
            timestamp: new Date(),
            status: 'completed',
            price: currentPriceINR
          }
          setTransactions(prev => [newTransaction, ...prev])
          setBuyAmount('')
          setSelectedCrypto('')
          
          toast({
            title: "Purchase Successful",
            description: `Bought ${cryptoAmount.toFixed(6)} ${selectedCrypto} for ₹${amountINR.toLocaleString()}`,
          })
        } else {
          toast({
            title: "Purchase Failed",
            description: result.error,
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Purchase Failed",
          description: "Network error. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const handleSendSuccess = (symbol: string, amount: number) => {
    const updatedHoldings = holdings.map(h => 
      h.symbol === symbol 
        ? { ...h, amount: h.amount - amount }
        : h
    ).filter(h => h.amount > 0.000001)
    
    updateHoldings(updatedHoldings)
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400'
      case 'connecting': return 'text-yellow-400'
      case 'disconnected': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-400" />
      case 'connecting': return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
      case 'disconnected': return <WifiOff className="w-4 h-4 text-red-400" />
      default: return <WifiOff className="w-4 h-4 text-slate-400" />
    }
  }

  if (pricesLoading || !holdingsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center py-8">
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">CryptoWallet India</h1>
          <p className="text-slate-300">Real cryptocurrency trading with UPI payments & blockchain integration</p>
          {lastUpdated && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-400">
              {getConnectionStatusIcon()}
              <Clock className="w-4 h-4" />
              <span className={getConnectionStatusColor()}>
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
              • Last updated: {lastUpdated.toLocaleTimeString()}
              <Button
                variant="ghost"
                size="sm"
                onClick={connectionStatus === 'disconnected' ? reconnect : refetch}
                className="h-6 px-2 text-slate-400 hover:text-white"
              >
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <RefreshCw className="w-3 h-3" />
                </motion.div>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Balance Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <AnimatedCard>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Fiat Balance</CardTitle>
                <Wallet className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ₹<AnimatedNumber value={fiatBalance} decimals={0} />
                </div>
                <p className="text-xs text-slate-400">Available for trading</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard glowOnChange changeDetected={portfolioChanged}>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Portfolio Value</CardTitle>
                <motion.div
                  animate={{ 
                    rotate: portfolioChanged ? [0, 360] : 0,
                    scale: portfolioChanged ? [1, 1.2, 1] : 1
                  }}
                  transition={{ duration: 0.8 }}
                >
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ₹<AnimatedNumber 
                    value={totalPortfolioValue} 
                    decimals={0} 
                    showChange={true}
                  />
                </div>
                <p className={`text-xs ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹<AnimatedNumber 
                    value={Math.abs(totalPnL)} 
                    prefix={totalPnL >= 0 ? '+' : '-'} 
                    decimals={0}
                  /> P&L
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard glowOnChange changeDetected={totalBalanceChanged}>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Total Balance</CardTitle>
                <motion.div
                  animate={{ 
                    rotate: totalBalanceChanged ? [0, 360] : 0,
                    scale: totalBalanceChanged ? [1, 1.2, 1] : 1
                  }}
                  transition={{ duration: 0.8 }}
                >
                  <Coins className="h-4 w-4 text-purple-400" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ₹<AnimatedNumber 
                    value={totalBalance} 
                    decimals={0} 
                    showChange={true}
                  />
                </div>
                <p className="text-xs text-slate-400">Fiat + Crypto</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Connection</CardTitle>
                {getConnectionStatusIcon()}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getConnectionStatusColor()}`}>
                  {connectionStatus === 'connected' ? 'Live' : 
                   connectionStatus === 'connecting' ? 'Sync...' : 'Offline'}
                </div>
                <p className="text-xs text-slate-400">
                  {connectionStatus === 'connected' ? 'Real-time updates' : 
                   connectionStatus === 'connecting' ? 'Establishing connection' : 'Cached data'}
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>

        {/* Main Content - Portfolio Tab */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Tabs defaultValue="portfolio" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-purple-600">Portfolio</TabsTrigger>
                <TabsTrigger value="markets" className="data-[state=active]:bg-purple-600">Markets</TabsTrigger>
                <TabsTrigger value="analysis" className="data-[state=active]:bg-purple-600">Analysis</TabsTrigger>
                <TabsTrigger value="trade" className="data-[state=active]:bg-purple-600">Trade</TabsTrigger>
                <TabsTrigger value="send" className="data-[state=active]:bg-purple-600">Send</TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Your Holdings</CardTitle>
                    <CardDescription className="text-slate-400">
                      Real cryptocurrency holdings with blockchain integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AnimatePresence>
                      {holdings.map((holding, index) => {
                        const currentPriceUSD = prices[holding.symbol]?.price || (holding.averagePrice / 83)
                        const currentPriceINR = currentPriceUSD * 83
                        const currentValue = holding.amount * currentPriceINR
                        const costBasis = holding.amount * holding.averagePrice
                        const pnl = currentValue - costBasis
                        const pnlPercentage = costBasis > 0 ? (pnl / costBasis) * 100 : 0
                        const priceChange = prices[holding.symbol]?.change24h || 0

                        return (
                          <motion.div
                            key={holding.symbol}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <motion.div 
                                className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center text-lg font-bold text-white"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.2 }}
                              >
                                {CRYPTO_INFO[holding.symbol as keyof typeof CRYPTO_INFO]?.icon || holding.symbol.slice(0, 2)}
                              </motion.div>
                              <div>
                                <div className="font-semibold text-white">{holding.name}</div>
                                <div className="text-sm text-slate-400">{holding.symbol}</div>
                                <div className="text-xs text-slate-500">
                                  Avg: ₹{holding.averagePrice.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-white">
                                {holding.amount.toFixed(6)} {holding.symbol}
                              </div>
                              <div className="text-sm text-slate-400">
                                ₹<AnimatedNumber value={currentValue} decimals={0} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={pnl >= 0 ? "default" : "destructive"} className="text-xs">
                                  ₹<AnimatedNumber 
                                    value={Math.abs(pnl)} 
                                    prefix={pnl >= 0 ? '+' : '-'} 
                                    decimals={0}
                                  /> ({pnlPercentage.toFixed(1)}%)
                                </Badge>
                                <Badge variant={priceChange >= 0 ? "default" : "destructive"} className="text-xs">
                                  <AnimatedNumber 
                                    value={priceChange} 
                                    prefix={priceChange >= 0 ? '+' : ''} 
                                    suffix="%" 
                                    decimals={2}
                                  />
                                </Badge>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                    {holdings.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        No holdings yet. Start by buying some cryptocurrency!
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AnimatePresence>
                      {transactions.slice(0, 5).map((tx, index) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30"
                        >
                          <div className="flex items-center space-x-4">
                            <motion.div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                tx.type === 'deposit' ? 'bg-green-600' : 
                                tx.type === 'buy' ? 'bg-blue-600' : 'bg-purple-600'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5 text-white" /> :
                               tx.type === 'buy' ? <TrendingUp className="w-5 h-5 text-white" /> :
                               <ArrowUpRight className="w-5 h-5 text-white" />}
                            </motion.div>
                            <div>
                              <div className="font-semibold text-white capitalize">
                                {tx.type} {tx.currency}
                              </div>
                              <div className="text-sm text-slate-400">
                                {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                              </div>
                              {tx.address && (
                                <div className="text-xs text-slate-500">To: {tx.address.slice(0, 20)}...</div>
                              )}
                              {tx.txHash && (
                                <div className="text-xs text-blue-400 cursor-pointer hover:underline">
                                  TX: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-white">
                              {tx.type === 'deposit' ? '₹' : ''}{tx.amount.toFixed(tx.type === 'deposit' ? 0 : 6)} {tx.type !== 'deposit' ? tx.currency : ''}
                            </div>
                            {tx.price && (
                              <div className="text-xs text-slate-400">
                                @ ₹{tx.price.toLocaleString()}
                              </div>
                            )}
                            <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                              {tx.status}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="markets" className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {Object.entries(prices).map(([symbol, data], index) => (
                    <motion.div
                      key={symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <PriceHistoryChart
                        symbol={symbol}
                        name={CRYPTO_INFO[symbol as keyof typeof CRYPTO_INFO]?.name || symbol}
                        price={data.price}
                        change24h={data.change24h}
                        volume={data.volume}
                        marketCap={data.marketCap}
                        high24h={data.high24h}
                        low24h={data.low24h}
                        priceHistory={data.priceHistory}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <MarketAnalysis prices={prices} />
                </motion.div>
              </TabsContent>

              <TabsContent value="trade" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Add Money</CardTitle>
                      <CardDescription className="text-slate-400">Add funds via UPI or Card payments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Smartphone className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-300">UPI & Card Payments</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          PhonePe, Google Pay, Paytm • Visa, Mastercard, RuPay • Instant deposits
                        </p>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          onClick={() => setShowPaymentModal(true)} 
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Money
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Buy Cryptocurrency</CardTitle>
                      <CardDescription className="text-slate-400">
                        Purchase crypto with live market prices
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="crypto-select" className="text-slate-200">Select Cryptocurrency</Label>
                        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Choose crypto" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(prices).map(([symbol, data]) => (
                              <SelectItem key={symbol} value={symbol}>
                                {CRYPTO_INFO[symbol as keyof typeof CRYPTO_INFO]?.name || symbol} ({symbol}) - ₹{(data.price * 83).toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="buy-amount" className="text-slate-200">Amount (INR)</Label>
                        <Input
                          id="buy-amount"
                          type="number"
                          placeholder="Minimum ₹100"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          min="100"
                        />
                        {buyAmount && selectedCrypto && prices[selectedCrypto] && (
                          <div className="text-sm text-slate-400">
                            ≈ {(parseFloat(buyAmount) / (prices[selectedCrypto].price * 83)).toFixed(6)} {selectedCrypto}
                          </div>
                        )}
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          onClick={handleBuyCrypto} 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={!selectedCrypto || !buyAmount || parseFloat(buyAmount) > fiatBalance || parseFloat(buyAmount) < 100}
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Buy Crypto
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="send" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-white">Send to Real Wallet</CardTitle>
                    <CardDescription className="text-slate-400">Transfer cryptocurrency to external blockchain addresses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-purple-300">Blockchain Transfer</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Send to any wallet address • Real blockchain transactions • Network fees apply
                      </p>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={() => setShowSendModal(true)} 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={holdings.length === 0}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Cryptocurrency
                      </Button>
                    </motion.div>
                    {holdings.length === 0 && (
                      <p className="text-sm text-slate-400 text-center">
                        Buy some cryptocurrency first to enable sending
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TrendingSection />
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Platform Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">UPI Payments</span>
                  <Badge className="bg-green-600">
                    Live
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Card Payments</span>
                  <Badge className="bg-green-600">
                    Live
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Blockchain</span>
                  <Badge className="bg-blue-600">
                    Connected
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">WebSocket</span>
                  <Badge className={
                    connectionStatus === 'connected' ? "bg-green-600" : 
                    connectionStatus === 'connecting' ? "bg-yellow-600" : "bg-red-600"
                  }>
                    {connectionStatus === 'connected' ? 'Live' : 
                     connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Security Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">UPI Security</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">RBI Compliance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Blockchain Verified</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
      
      <CryptoSendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        holdings={holdings}
        prices={prices}
        onSuccess={handleSendSuccess}
      />
    </div>
  )
}
