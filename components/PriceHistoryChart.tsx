'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'
import { AnimatedNumber } from './AnimatedNumber'

interface PriceHistoryChartProps {
  symbol: string
  name: string
  price: number
  change24h: number
  volume: number
  marketCap: number
  high24h?: number
  low24h?: number
  priceHistory?: number[]
}

export function PriceHistoryChart({ 
  symbol, 
  name, 
  price, 
  change24h, 
  volume, 
  marketCap, 
  high24h, 
  low24h, 
  priceHistory = [] 
}: PriceHistoryChartProps) {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H')
  
  const isPositive = change24h > 0
  
  // Calculate technical indicators
  const technicalData = useMemo(() => {
    if (priceHistory.length < 20) return null
    
    const prices = priceHistory.slice(-20) // Last 20 data points
    const sma = prices.reduce((sum, p) => sum + p, 0) / prices.length
    
    // Simple RSI calculation
    const gains = []
    const losses = []
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) {
        gains.push(change)
        losses.push(0)
      } else {
        gains.push(0)
        losses.push(Math.abs(change))
      }
    }
    
    const avgGain = gains.reduce((sum, g) => sum + g, 0) / gains.length
    const avgLoss = losses.reduce((sum, l) => sum + l, 0) / losses.length
    const rs = avgGain / (avgLoss || 1)
    const rsi = 100 - (100 / (1 + rs))
    
    // Bollinger Bands
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)
    const upperBand = sma + (stdDev * 2)
    const lowerBand = sma - (stdDev * 2)
    
    return {
      sma: sma,
      rsi: rsi,
      upperBand: upperBand,
      lowerBand: lowerBand,
      signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'HOLD'
    }
  }, [priceHistory])
  
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const getDecimals = (price: number) => {
    if (price < 1) return 4
    if (price < 100) return 2
    return 2
  }

  // Calculate chart dimensions
  const chartHeight = 120
  const chartWidth = 300
  
  // Generate SVG path for price history
  const generatePath = () => {
    if (priceHistory.length < 2) return ''
    
    const minPrice = Math.min(...priceHistory)
    const maxPrice = Math.max(...priceHistory)
    const priceRange = maxPrice - minPrice || 1
    
    const points = priceHistory.map((price, index) => {
      const x = (index / (priceHistory.length - 1)) * chartWidth
      const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight
      return `${x},${y}`
    })
    
    return `M ${points.join(' L ')}`
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <motion.div 
              className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center text-xs font-bold"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              {symbol.slice(0, 2)}
            </motion.div>
            {name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {technicalData && (
              <Badge 
                variant={technicalData.signal === 'BUY' ? 'default' : technicalData.signal === 'SELL' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {technicalData.signal}
              </Badge>
            )}
            <Badge variant={isPositive ? "default" : "destructive"} className="flex items-center gap-1">
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <AnimatedNumber 
                value={change24h} 
                prefix={isPositive ? '+' : ''} 
                suffix="%" 
                decimals={2}
              />
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            <AnimatedNumber 
              value={price} 
              prefix="$" 
              decimals={getDecimals(price)}
              showChange={true}
              className="text-2xl font-bold"
            />
          </div>
          <div className="flex gap-1">
            {['1H', '24H', '7D', '30D'].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setTimeframe(tf as any)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Price History Chart */}
        <div className="relative h-32 bg-slate-900/30 rounded-lg p-2">
          {priceHistory.length > 1 ? (
            <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgb(71 85 105)" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Price line */}
              <path
                d={generatePath()}
                fill="none"
                stroke={isPositive ? "#10b981" : "#ef4444"}
                strokeWidth="2"
                className="drop-shadow-sm"
              />
              
              {/* Fill area under curve */}
              <path
                d={`${generatePath()} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
                fill={`url(#gradient-${symbol})`}
                opacity="0.2"
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id={`gradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.8"/>
                  <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0"/>
                </linearGradient>
              </defs>
              
              {/* Current price indicator */}
              {priceHistory.length > 0 && (
                <circle
                  cx={chartWidth}
                  cy={chartHeight - ((price - Math.min(...priceHistory)) / (Math.max(...priceHistory) - Math.min(...priceHistory) || 1)) * chartHeight}
                  r="3"
                  fill={isPositive ? "#10b981" : "#ef4444"}
                  className="animate-pulse"
                />
              )}
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <BarChart3 className="w-8 h-8 mr-2" />
              Loading chart data...
            </div>
          )}
        </div>
        
        {/* Technical Analysis */}
        {technicalData && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900/30 rounded-lg">
            <div className="space-y-2">
              <div className="text-xs text-slate-400">Technical Indicators</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">RSI:</span>
                  <span className={`font-semibold ${
                    technicalData.rsi > 70 ? 'text-red-400' : 
                    technicalData.rsi < 30 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {technicalData.rsi.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">SMA:</span>
                  <span className="text-white font-semibold">${technicalData.sma.toFixed(4)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-slate-400">24h Range</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">High:</span>
                  <span className="text-green-400 font-semibold">${(high24h || price).toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Low:</span>
                  <span className="text-red-400 font-semibold">${(low24h || price).toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Market Data */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400">Market Cap</div>
            <div className="text-white font-semibold">
              <AnimatedNumber 
                value={marketCap} 
                decimals={0}
                className="text-white font-semibold"
              />
              <span className="text-xs ml-1">
                {marketCap >= 1e9 ? 'B' : marketCap >= 1e6 ? 'M' : marketCap >= 1e3 ? 'K' : ''}
              </span>
            </div>
          </div>
          <div>
            <div className="text-slate-400">24h Volume</div>
            <div className="text-white font-semibold">
              <AnimatedNumber 
                value={volume} 
                decimals={0}
                className="text-white font-semibold"
              />
              <span className="text-xs ml-1">
                {volume >= 1e9 ? 'B' : volume >= 1e6 ? 'M' : volume >= 1e3 ? 'K' : ''}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
