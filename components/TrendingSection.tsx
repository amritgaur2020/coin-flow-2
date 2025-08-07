'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrendingCrypto } from "@/hooks/useTrendingCrypto"
import { TrendingUp, FlameIcon as Fire } from 'lucide-react'

export function TrendingSection() {
  const { trending, loading } = useTrendingCrypto()

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Fire className="w-5 h-5 text-orange-400" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Fire className="w-5 h-5 text-orange-400" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trending.map((coin, index) => (
          coin.name && coin.symbol && coin.market_cap_rank ? (
            <div key={coin.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <div className="text-white font-medium">{coin.name}</div>
                  <div className="text-slate-400 text-sm">{coin.symbol?.toUpperCase() || 'N/A'}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                #{coin.market_cap_rank || 'N/A'}
              </Badge>
            </div>
          ) : null
        ))}
      </CardContent>
    </Card>
  )
}
