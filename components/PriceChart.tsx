'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { AnimatedNumber } from './AnimatedNumber'
import { AnimatedCard } from './AnimatedCard'

interface PriceChartProps {
  symbol: string
  name: string
  price: number
  change24h: number
  volume: number
  marketCap: number
}

export function PriceChart({ symbol, name, price, change24h, volume, marketCap }: PriceChartProps) {
  const [priceHistory, setPriceHistory] = useState<number[]>([])
  const [previousPrice, setPreviousPrice] = useState(price)
  const [priceChanged, setPriceChanged] = useState(false)
  
  useEffect(() => {
    if (price !== previousPrice) {
      setPriceChanged(true)
      setPreviousPrice(price)
      setTimeout(() => setPriceChanged(false), 3000)
    }
  }, [price, previousPrice])

  useEffect(() => {
    // Generate more stable price history that doesn't change rapidly
    const generatePriceHistory = () => {
      const history = []
      let currentPrice = price
      
      // Generate 20 data points with very small variations
      for (let i = 0; i < 20; i++) {
        // Much smaller variation to simulate stable price movement
        const variation = (Math.random() - 0.5) * 0.005 // ±0.25% variation
        currentPrice = currentPrice * (1 + variation)
        history.push(currentPrice)
      }
      return history
    }
    
    setPriceHistory(generatePriceHistory())
  }, [price]) // Only regenerate when actual price changes

  const isPositive = change24h > 0
  
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

  return (
    <AnimatedCard glowOnChange changeDetected={priceChanged}>
      <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <motion.div 
                className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center text-xs font-bold"
                animate={{ 
                  rotate: priceChanged ? [0, 360] : 0,
                  scale: priceChanged ? [1, 1.1, 1] : 1
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                {symbol.slice(0, 2)}
              </motion.div>
              {name}
            </CardTitle>
            <motion.div
              animate={{ 
                scale: priceChanged ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant={isPositive ? "default" : "destructive"} className="flex items-center gap-1">
                <motion.div
                  animate={{ rotate: priceChanged ? [0, 360] : 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </motion.div>
                <AnimatedNumber 
                  value={change24h} 
                  prefix={isPositive ? '+' : ''} 
                  suffix="%" 
                  decimals={2}
                />
              </Badge>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-2xl font-bold text-white">
            <AnimatedNumber 
              value={price} 
              prefix="$" 
              decimals={getDecimals(price)}
              showChange={true}
              className="text-2xl font-bold"
            />
          </div>
          
          {/* Animated price visualization */}
          <div className="h-16 flex items-end space-x-1">
            {priceHistory.map((histPrice, index) => (
              <motion.div
                key={index}
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: `${Math.max(10, (histPrice / Math.max(...priceHistory)) * 100)}%`,
                  opacity: 1
                }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.6,
                  ease: "easeOut"
                }}
                className={`flex-1 rounded-t ${isPositive ? 'bg-green-400' : 'bg-red-400'} opacity-70`}
              />
            ))}
          </div>
          
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
    </AnimatedCard>
  )
}
