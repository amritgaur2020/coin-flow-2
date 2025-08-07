import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Using CoinGecko's trending API for crypto news/trends
    const response = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`)
    }

    const data = await response.json()
    
    // Validate the response structure
    if (!data || !data.coins) {
      console.warn('Invalid trending data structure, using fallback')
      return NextResponse.json({
        coins: [
          { item: { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', market_cap_rank: 1 } },
          { item: { id: 'ethereum', name: 'Ethereum', symbol: 'eth', market_cap_rank: 2 } },
          { item: { id: 'solana', name: 'Solana', symbol: 'sol', market_cap_rank: 5 } },
          { item: { id: 'cardano', name: 'Cardano', symbol: 'ada', market_cap_rank: 8 } },
          { item: { id: 'polygon', name: 'Polygon', symbol: 'matic', market_cap_rank: 15 } }
        ]
      })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching trending data:', error)
    
    // Return fallback trending data
    return NextResponse.json({
      coins: [
        { item: { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', market_cap_rank: 1 } },
        { item: { id: 'ethereum', name: 'Ethereum', symbol: 'eth', market_cap_rank: 2 } },
        { item: { id: 'solana', name: 'Solana', symbol: 'sol', market_cap_rank: 5 } },
        { item: { id: 'cardano', name: 'Cardano', symbol: 'ada', market_cap_rank: 8 } },
        { item: { id: 'polygon', name: 'Polygon', symbol: 'matic', market_cap_rank: 15 } }
      ]
    })
  }
}
