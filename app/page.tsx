'use client'

import { useState, useEffect } from 'react'
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
import { Wallet, TrendingUp, Send, Plus, ArrowUpRight, ArrowDownLeft, Bitcoin, Coins, RefreshCw, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { useCryptoPrices } from "@/hooks/useCryptoPrices"
import { PriceChart } from "@/components/PriceChart"
import { TrendingSection } from "@/components/TrendingSection"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { AnimatedCard } from "@/components/AnimatedCard"

interface CryptoHolding {
  symbol: string
  name: string
  amount: number
  averagePrice: number
}

interface Transaction {
  id: string
  type: 'deposit' | 'buy' | 'send'
  amount: number
  currency: string
  timestamp: Date
  status: 'completed' | 'pending'
  address?: string
  price?: number
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
  const { prices, loading: pricesLoading, error: pricesError, lastUpdated, isUsingFallback, refetch } = useCryptoPrices()
  const [fiatBalance, setFiatBalance] = useState(2500.00)
  const [holdings, setHoldings] = useState<CryptoHolding[]>([
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.025, averagePrice: 42000 },
    { symbol: 'ETH', name: 'Ethereum', amount: 1.5, averagePrice: 2500 },
    { symbol: 'ADA', name: 'Cardano', amount: 1000, averagePrice: 0.48 }
  ])
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'deposit', amount: 1000, currency: 'USD', timestamp: new Date(Date.now() - 86400000), status: 'completed' },
    { id: '2', type: 'buy', amount: 0.025, currency: 'BTC', timestamp: new Date(Date.now() - 43200000), status: 'completed', price: 42000 },
    { id: '3', type: 'send', amount: 0.1, currency: 'ETH', timestamp: new Date(Date.now() - 21600000), status: 'completed', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', price: 2500 }
  ])

  const [depositAmount, setDepositAmount] = useState('')
  const [buyAmount, setBuyAmount] = useState('')
  const [selectedCrypto, setSelectedCrypto] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendCrypto, setSendCrypto] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')

  // Track previous values for change detection
  const [previousPortfolioValue, setPreviousPortfolioValue] = useState(0)
  const [previousTotalBalance, setPreviousTotalBalance] = useState(0)
  const [portfolioChanged, setPortfolioChanged] = useState(false)
  const [totalBalanceChanged, setTotalBalanceChanged] = useState(false)

  // Calculate portfolio value using real-time prices
  const totalPortfolioValue = holdings.reduce((sum, holding) => {
    const currentPrice = prices[holding.symbol]?.price || 0
    return sum + (holding.amount * currentPrice)
  }, 0)

  // Calculate total P&L
  const totalPnL = holdings.reduce((sum, holding) => {
    const currentPrice = prices[holding.symbol]?.price || 0
    const currentValue = holding.amount * currentPrice
    const costBasis = holding.amount * holding.averagePrice
    return sum + (currentValue - costBasis)
  }, 0)

  const totalBalance = fiatBalance + totalPortfolioValue

  // Detect changes for animations
  useEffect(() => {
    const roundedPortfolio = Math.round(totalPortfolioValue)
    const roundedPrevious = Math.round(previousPortfolioValue)
    
    if (Math.abs(roundedPortfolio - roundedPrevious) > 1 && previousPortfolioValue !== 0) {
      setPortfolioChanged(true)
      setTimeout(() => setPortfolioChanged(false), 3000)
    }
    
    // Only update previous value if it's significantly different
    if (Math.abs(roundedPortfolio - roundedPrevious) > 1) {
      setPreviousPortfolioValue(roundedPortfolio)
    }
  }, [totalPortfolioValue]) // Remove previousPortfolioValue from dependencies

  useEffect(() => {
    const roundedTotal = Math.round(totalBalance)
    const roundedPrevious = Math.round(previousTotalBalance)
    
    if (Math.abs(roundedTotal - roundedPrevious) > 1 && previousTotalBalance !== 0) {
      setTotalBalanceChanged(true)
      setTimeout(() => setTotalBalanceChanged(false), 3000)
    }
    
    // Only update previous value if it's significantly different
    if (Math.abs(roundedTotal - roundedPrevious) > 1) {
      setPreviousTotalBalance(roundedTotal)
    }
  }, [totalBalance]) // Remove previousTotalBalance from dependencies

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount)
    if (amount > 0) {
      setFiatBalance(prev => prev + amount)
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount,
        currency: 'USD',
        timestamp: new Date(),
        status: 'completed'
      }
      setTransactions(prev => [newTransaction, ...prev])
      setDepositAmount('')
      toast({
        title: "Deposit Successful",
        description: `$${amount.toLocaleString()} has been added to your wallet.`,
      })
    }
  }

  const handleBuyCrypto = () => {
    const amount = parseFloat(buyAmount)
    const currentPrice = prices[selectedCrypto]?.price
    
    if (amount > 0 && selectedCrypto && amount <= fiatBalance && currentPrice) {
      const cryptoAmount = amount / currentPrice
      
      setFiatBalance(prev => prev - amount)
      
      const existingHolding = holdings.find(h => h.symbol === selectedCrypto)
      if (existingHolding) {
        const newTotalAmount = existingHolding.amount + cryptoAmount
        const newAveragePrice = ((existingHolding.amount * existingHolding.averagePrice) + amount) / newTotalAmount
        
        setHoldings(prev => prev.map(h => 
          h.symbol === selectedCrypto 
            ? { ...h, amount: newTotalAmount, averagePrice: newAveragePrice }
            : h
        ))
      } else {
        const newHolding: CryptoHolding = {
          symbol: selectedCrypto,
          name: CRYPTO_INFO[selectedCrypto as keyof typeof CRYPTO_INFO].name,
          amount: cryptoAmount,
          averagePrice: currentPrice
        }
        setHoldings(prev => [...prev, newHolding])
      }

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'buy',
        amount: cryptoAmount,
        currency: selectedCrypto,
        timestamp: new Date(),
        status: 'completed',
        price: currentPrice
      }
      setTransactions(prev => [newTransaction, ...prev])
      setBuyAmount('')
      setSelectedCrypto('')
      toast({
        title: "Purchase Successful",
        description: `Bought ${cryptoAmount.toFixed(6)} ${selectedCrypto} at $${currentPrice.toLocaleString()}`,
      })
    }
  }

  const handleSendCrypto = () => {
    const amount = parseFloat(sendAmount)
    const holding = holdings.find(h => h.symbol === sendCrypto)
    const currentPrice = prices[sendCrypto]?.price
    
    if (amount > 0 && holding && amount <= holding.amount && recipientAddress && currentPrice) {
      setHoldings(prev => prev.map(h => 
        h.symbol === sendCrypto 
          ? { ...h, amount: h.amount - amount }
          : h
      ).filter(h => h.amount > 0.000001))

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'send',
        amount,
        currency: sendCrypto,
        timestamp: new Date(),
        status: 'completed',
        address: recipientAddress,
        price: currentPrice
      }
      setTransactions(prev => [newTransaction, ...prev])
      setSendAmount('')
      setSendCrypto('')
      setRecipientAddress('')
      toast({
        title: "Transaction Sent",
        description: `${amount} ${sendCrypto} sent to ${recipientAddress.slice(0, 10)}...`,
      })
    }
  }

  if (pricesLoading) {
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
          <h1 className="text-4xl font-bold text-white mb-2">CryptoWallet Pro</h1>
          <p className="text-slate-300">Real-time cryptocurrency trading platform</p>
          {lastUpdated && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-400">
              {isUsingFallback ? <WifiOff className="w-4 h-4 text-orange-400" /> : <Wifi className="w-4 h-4 text-green-400" />}
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdated.toLocaleTimeString()}
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
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

        {isUsingFallback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Alert className="bg-orange-900/20 border-orange-700">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="text-orange-200">
                Using simulated data due to API rate limits. Prices are updated with realistic variations.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

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
                  <AnimatedNumber value={fiatBalance} prefix="$" decimals={0} />
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
                  <AnimatedNumber 
                    value={totalPortfolioValue} 
                    prefix="$" 
                    decimals={0} 
                    showChange={true}
                  />
                </div>
                <p className={`text-xs ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <AnimatedNumber 
                    value={totalPnL} 
                    prefix={totalPnL >= 0 ? '+$' : '-$'} 
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
                  <AnimatedNumber 
                    value={totalBalance} 
                    prefix="$" 
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
                <CardTitle className="text-sm font-medium text-slate-200">Data Status</CardTitle>
                {isUsingFallback ? <WifiOff className="h-4 w-4 text-orange-400" /> : <Wifi className="h-4 w-4 text-green-400" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{isUsingFallback ? 'Simulated' : 'Live'}</div>
                <p className="text-xs text-slate-400">{isUsingFallback ? 'Rate limited' : 'Real-time data'}</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Tabs defaultValue="portfolio" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-purple-600">Portfolio</TabsTrigger>
                <TabsTrigger value="markets" className="data-[state=active]:bg-purple-600">Markets</TabsTrigger>
                <TabsTrigger value="trade" className="data-[state=active]:bg-purple-600">Trade</TabsTrigger>
                <TabsTrigger value="send" className="data-[state=active]:bg-purple-600">Send</TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Your Holdings</CardTitle>
                    <CardDescription className="text-slate-400">
                      {isUsingFallback ? 'Portfolio with simulated prices' : 'Real-time portfolio with live prices'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AnimatePresence>
                      {holdings.map((holding, index) => {
                        const currentPrice = prices[holding.symbol]?.price || 0
                        const currentValue = holding.amount * currentPrice
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
                                  Avg: ${holding.averagePrice.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-white">
                                {holding.amount.toFixed(6)} {holding.symbol}
                              </div>
                              <div className="text-sm text-slate-400">
                                <AnimatedNumber value={currentValue} prefix="$" decimals={0} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={pnl >= 0 ? "default" : "destructive"} className="text-xs">
                                  <AnimatedNumber 
                                    value={pnl} 
                                    prefix={pnl >= 0 ? '+$' : '-$'} 
                                    decimals={0}
                                  /> ({pnlPercentage.toFixed(1)}%)
                                </Badge>
                                <Badge variant={priceChange >= 0 ? "default" : "destructive"} className="text-xs">
                                  <AnimatedNumber 
                                    value={priceChange} 
                                    prefix={priceChange >= 0 ? '+' : ''} 
                                    suffix="%" 
                                    decimals={1}
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
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-white">
                              {tx.type === 'deposit' ? '$' : ''}{tx.amount.toFixed(tx.type === 'deposit' ? 2 : 6)} {tx.type !== 'deposit' ? tx.currency : ''}
                            </div>
                            {tx.price && (
                              <div className="text-xs text-slate-400">
                                @ ${tx.price.toLocaleString()}
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
                      <PriceChart
                        symbol={symbol}
                        name={CRYPTO_INFO[symbol as keyof typeof CRYPTO_INFO]?.name || symbol}
                        price={data.price}
                        change24h={data.change24h}
                        volume={data.volume}
                        marketCap={data.marketCap}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="trade" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Deposit Fiat</CardTitle>
                      <CardDescription className="text-slate-400">Add funds to your wallet</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deposit" className="text-slate-200">Amount (USD)</Label>
                        <Input
                          id="deposit"
                          type="number"
                          placeholder="Enter amount"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button onClick={handleDeposit} className="w-full bg-green-600 hover:bg-green-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Deposit Funds
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Buy Cryptocurrency</CardTitle>
                      <CardDescription className="text-slate-400">
                        Purchase crypto with {isUsingFallback ? 'simulated' : 'live'} prices
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
                                {CRYPTO_INFO[symbol as keyof typeof CRYPTO_INFO]?.name || symbol} ({symbol}) - ${data.price.toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="buy-amount" className="text-slate-200">Amount (USD)</Label>
                        <Input
                          id="buy-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        {buyAmount && selectedCrypto && prices[selectedCrypto] && (
                          <div className="text-sm text-slate-400">
                            ≈ {(parseFloat(buyAmount) / prices[selectedCrypto].price).toFixed(6)} {selectedCrypto}
                          </div>
                        )}
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          onClick={handleBuyCrypto} 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={!selectedCrypto || !buyAmount || parseFloat(buyAmount) > fiatBalance}
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
                    <CardTitle className="text-white">Send Cryptocurrency</CardTitle>
                    <CardDescription className="text-slate-400">Transfer crypto to another wallet address</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="send-crypto-select" className="text-slate-200">Select Cryptocurrency</Label>
                      <Select value={sendCrypto} onValueChange={setSendCrypto}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Choose crypto to send" />
                        </SelectTrigger>
                        <SelectContent>
                          {holdings.map((holding) => (
                            <SelectItem key={holding.symbol} value={holding.symbol}>
                              {holding.name} ({holding.symbol}) - Available: {holding.amount.toFixed(6)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="send-amount" className="text-slate-200">Amount</Label>
                      <Input
                        id="send-amount"
                        type="number"
                        placeholder="Enter amount to send"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      {sendAmount && sendCrypto && prices[sendCrypto] && (
                        <div className="text-sm text-slate-400">
                          ≈ ${(parseFloat(sendAmount) * prices[sendCrypto].price).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-slate-200">Recipient Address</Label>
                      <Input
                        id="recipient"
                        placeholder="Enter wallet address (e.g., 0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4)"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Separator className="bg-slate-600" />
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-sm text-slate-300 space-y-1">
                        <div>Network Fee: ~$2.50</div>
                        <div>Estimated Time: 2-5 minutes</div>
                        <div className="text-xs text-slate-400 mt-2">
                          Double-check the recipient address. Transactions cannot be reversed.
                        </div>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleSendCrypto} 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={!sendCrypto || !sendAmount || !recipientAddress}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Transaction
                      </Button>
                    </motion.div>
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
                <CardTitle className="text-white text-sm">Market Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Status</span>
                  <Badge className={isUsingFallback ? "bg-orange-600" : "bg-green-600"}>
                    {isUsingFallback ? 'Simulated' : 'Live'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Update Frequency</span>
                  <span className="text-white text-sm">1hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Data Source</span>
                  <span className="text-white text-sm">{isUsingFallback ? 'Simulated' : 'CoinGecko'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
