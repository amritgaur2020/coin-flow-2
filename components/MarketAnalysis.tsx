'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Activity, Target, Zap, AlertTriangle } from 'lucide-react'
import { AnimatedNumber } from './AnimatedNumber'

interface MarketAnalysisProps {
  prices: { [key: string]: any }
}

export function MarketAnalysis({ prices }: MarketAnalysisProps) {
  const marketData = useMemo(() => {
    const symbols = Object.keys(prices)
    if (symbols.length === 0) return null

    // Calculate market metrics
    const totalMarketCap = Object.values(prices).reduce((sum: number, data: any) => sum + (data.marketCap || 0), 0)
    const totalVolume = Object.values(prices).reduce((sum: number, data: any) => sum + (data.volume || 0), 0)
    
    // Count gainers vs losers
    const gainers = symbols.filter(symbol => (prices[symbol]?.change24h || 0) > 0)
    const losers = symbols.filter(symbol => (prices[symbol]?.change24h || 0) < 0)
    
    // Calculate market sentiment
    const avgChange = symbols.reduce((sum, symbol) => sum + (prices[symbol]?.change24h || 0), 0) / symbols.length
    const sentiment = avgChange > 2 ? 'Extremely Bullish' : 
                     avgChange > 0.5 ? 'Bullish' : 
                     avgChange > -0.5 ? 'Neutral' : 
                     avgChange > -2 ? 'Bearish' : 'Extremely Bearish'
    
    // Find top performers
    const sortedByChange = symbols
      .map(symbol => ({ symbol, change: prices[symbol]?.change24h || 0, price: prices[symbol]?.price || 0 }))
      .sort((a, b) => b.change - a.change)
    
    const topGainer = sortedByChange[0]
    const topLoser = sortedByChange[sortedByChange.length - 1]
    
    // Calculate volatility index (average of absolute changes)
    const volatilityIndex = symbols.reduce((sum, symbol) => sum + Math.abs(prices[symbol]?.change24h || 0), 0) / symbols.length
    
    // Market dominance (BTC dominance simulation)
    const btcMarketCap = prices.BTC?.marketCap || 0
    const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 0
    
    // Fear & Greed Index simulation
    const fearGreedScore = Math.max(0, Math.min(100, 50 + (avgChange * 10) + (volatilityIndex * 5)))
    const fearGreedLabel = fearGreedScore > 75 ? 'Extreme Greed' :
                          fearGreedScore > 55 ? 'Greed' :
                          fearGreedScore > 45 ? 'Neutral' :
                          fearGreedScore > 25 ? 'Fear' : 'Extreme Fear'
    
    return {
      totalMarketCap,
      totalVolume,
      gainers: gainers.length,
      losers: losers.length,
      sentiment,
      avgChange,
      topGainer,
      topLoser,
      volatilityIndex,
      btcDominance,
      fearGreedScore,
      fearGreedLabel
    }
  }, [prices])

  if (!marketData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">Loading market analysis...</div>
        </CardContent>
      </Card>
    )
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Extremely Bullish': return 'text-green-400'
      case 'Bullish': return 'text-green-300'
      case 'Neutral': return 'text-yellow-400'
      case 'Bearish': return 'text-red-300'
      case 'Extremely Bearish': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const getFearGreedColor = (score: number) => {
    if (score > 75) return 'bg-red-500'
    if (score > 55) return 'bg-orange-500'
    if (score > 45) return 'bg-yellow-500'
    if (score > 25) return 'bg-blue-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-slate-400">Total Market Cap</div>
              <div className="text-lg font-bold text-white">
                <AnimatedNumber 
                  value={marketData.totalMarketCap} 
                  prefix="$" 
                  decimals={0}
                />
                <span className="text-xs ml-1">
                  {marketData.totalMarketCap >= 1e12 ? 'T' : 
                   marketData.totalMarketCap >= 1e9 ? 'B' : 
                   marketData.totalMarketCap >= 1e6 ? 'M' : 'K'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-slate-400">24h Volume</div>
              <div className="text-lg font-bold text-white">
                <AnimatedNumber 
                  value={marketData.totalVolume} 
                  prefix="$" 
                  decimals={0}
                />
                <span className="text-xs ml-1">
                  {marketData.totalVolume >= 1e9 ? 'B' : 
                   marketData.totalVolume >= 1e6 ? 'M' : 'K'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-slate-400">Market Sentiment</div>
              <div className={`text-lg font-bold ${getSentimentColor(marketData.sentiment)}`}>
                {marketData.sentiment}
              </div>
              <div className="text-xs text-slate-500">
                Avg Change: <AnimatedNumber value={marketData.avgChange} prefix={marketData.avgChange >= 0 ? '+' : ''} suffix="%" decimals={2} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-slate-400">BTC Dominance</div>
              <div className="text-lg font-bold text-orange-400">
                <AnimatedNumber value={marketData.btcDominance} suffix="%" decimals={1} />
              </div>
              <div className="text-xs text-slate-500">
                Market share
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fear & Greed Index */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Fear & Greed Index
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              <AnimatedNumber value={marketData.fearGreedScore} decimals={0} />
            </div>
            <div className={`text-lg font-semibold mb-4 ${
              marketData.fearGreedScore > 75 ? 'text-red-400' :
              marketData.fearGreedScore > 55 ? 'text-orange-400' :
              marketData.fearGreedScore > 45 ? 'text-yellow-400' :
              marketData.fearGreedScore > 25 ? 'text-blue-400' : 'text-green-400'
            }`}>
              {marketData.fearGreedLabel}
            </div>
            <div className="relative">
              <Progress 
                value={marketData.fearGreedScore} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Extreme Fear</span>
                <span>Neutral</span>
                <span>Extreme Greed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Movers */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Top Movers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <motion.div 
              className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-700/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <div>
                  <div className="font-semibold text-white">Top Gainer</div>
                  <div className="text-sm text-slate-400">{marketData.topGainer.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">
                  <AnimatedNumber 
                    value={marketData.topGainer.change} 
                    prefix="+" 
                    suffix="%" 
                    decimals={2}
                  />
                </div>
                <div className="text-sm text-slate-400">
                  ${marketData.topGainer.price.toFixed(4)}
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-700/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <div>
                  <div className="font-semibold text-white">Top Loser</div>
                  <div className="text-sm text-slate-400">{marketData.topLoser.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-400">
                  <AnimatedNumber 
                    value={marketData.topLoser.change} 
                    suffix="%" 
                    decimals={2}
                  />
                </div>
                <div className="text-sm text-slate-400">
                  ${marketData.topLoser.price.toFixed(4)}
                </div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Market Statistics */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Market Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{marketData.gainers}</div>
              <div className="text-sm text-slate-400">Gainers</div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{marketData.losers}</div>
              <div className="text-sm text-slate-400">Losers</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Volatility Index</span>
              <span className="text-white font-semibold">
                <AnimatedNumber value={marketData.volatilityIndex} decimals={2} />%
              </span>
            </div>
            <Progress 
              value={Math.min(100, marketData.volatilityIndex * 10)} 
              className="h-2"
            />
            <div className="text-xs text-slate-500">
              {marketData.volatilityIndex > 5 ? 'High Volatility' : 
               marketData.volatilityIndex > 2 ? 'Medium Volatility' : 'Low Volatility'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
