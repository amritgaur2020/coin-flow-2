import { NextRequest, NextResponse } from 'next/server'

// Mock crypto exchange API - replace with real exchange like Coinbase Pro, Binance, etc.
export async function POST(request: NextRequest) {
  try {
    const { symbol, amountUSD, userId } = await request.json()

    if (!symbol || !amountUSD || amountUSD < 10) {
      return NextResponse.json(
        { error: 'Invalid parameters. Minimum purchase is $10.' },
        { status: 400 }
      )
    }

    // Get current market price
    const priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${getCoinGeckoId(symbol)}&vs_currencies=usd`)
    const priceData = await priceResponse.json()
    const coinId = getCoinGeckoId(symbol)
    const currentPrice = priceData[coinId]?.usd

    if (!currentPrice) {
      return NextResponse.json(
        { error: 'Unable to fetch current price' },
        { status: 400 }
      )
    }

    const cryptoAmount = amountUSD / currentPrice
    const fee = amountUSD * 0.01 // 1% fee
    const totalCost = amountUSD + fee

    // In a real implementation, you would:
    // 1. Check user's fiat balance
    // 2. Execute the trade on a real exchange
    // 3. Update user's crypto holdings
    // 4. Deduct fiat balance
    // 5. Record the transaction

    // Mock successful purchase
    const transaction = {
      id: `tx_${Date.now()}`,
      type: 'buy',
      symbol: symbol,
      cryptoAmount: cryptoAmount,
      usdAmount: amountUSD,
      fee: fee,
      totalCost: totalCost,
      price: currentPrice,
      timestamp: new Date().toISOString(),
      status: 'completed'
    }

    return NextResponse.json({
      success: true,
      transaction: transaction,
      message: `Successfully purchased ${cryptoAmount.toFixed(6)} ${symbol} for $${amountUSD}`
    })

  } catch (error) {
    console.error('Crypto purchase failed:', error)
    return NextResponse.json(
      { error: 'Purchase failed. Please try again.' },
      { status: 500 }
    )
  }
}

function getCoinGeckoId(symbol: string): string {
  const mapping: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'ADA': 'cardano',
    'SOL': 'solana',
    'MATIC': 'polygon',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'DOGE': 'dogecoin',
    'LINK': 'chainlink',
    'DOT': 'polkadot'
  }
  return mapping[symbol] || symbol.toLowerCase()
}
