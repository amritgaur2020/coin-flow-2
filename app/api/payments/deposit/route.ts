import { NextRequest, NextResponse } from 'next/server'

// Alternative payment solutions when Razorpay/Stripe not available
export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'inr', paymentMethod = 'upi', userId } = await request.json()

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least ₹ 100' },
        { status: 400 }
      )
    }

    // Alternative payment methods for Indian users
    const alternativePaymentMethods = {
      bank_transfer: {
        method: 'Bank Transfer',
        details: {
          accountName: 'CryptoWallet India Pvt Ltd',
          accountNumber: 'XXXX-XXXX-XXXX-1234',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          branch: 'Mumbai Main Branch',
          upiId: 'cryptowallet@hdfc'
        },
        instructions: [
          'Transfer the exact amount to the above account',
          'Use your User ID as reference: ' + userId,
          'WhatsApp payment screenshot to +91-9999999999',
          'Funds will be credited within 2-4 hours after verification'
        ]
      },
      crypto_deposit: {
        method: 'Crypto Deposit',
        details: {
          btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          usdtAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
          ethAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4'
        },
        instructions: [
          'Send equivalent crypto amount to above addresses',
          'Include your User ID in transaction memo: ' + userId,
          'Minimum: $10 equivalent in crypto',
          'Funds credited after 3 network confirmations'
        ]
      },
      paypal: {
        method: 'PayPal',
        details: {
          email: 'payments@cryptowallet.in',
          conversionRate: '83 INR = 1 USD'
        },
        instructions: [
          'Send payment to payments@cryptowallet.in',
          'Add your User ID in notes: ' + userId,
          'Use Friends & Family to avoid fees',
          'Funds credited within 1 hour'
        ]
      },
      manual_verification: {
        method: 'Manual Verification',
        details: {
          whatsapp: '+91-9999999999',
          telegram: '@cryptowallet_support',
          email: 'support@cryptowallet.in'
        },
        instructions: [
          'Contact us for amounts above ₹ 50,000',
          'Provide KYC documents for verification',
          'Bank transfer or crypto deposit available',
          'Processing time: 24-48 hours'
        ]
      }
    }

    // Return alternative payment options
    return NextResponse.json({
      success: true,
      amount: amount,
      currency: 'INR',
      paymentMethod: paymentMethod,
      provider: 'alternative',
      alternativeOptions: alternativePaymentMethods,
      message: 'Alternative payment methods available',
      demo: true
    })

  } catch (error: any) {
    console.error('Payment setup failed:', error)
    return NextResponse.json(
      { error: 'Failed to setup payment' },
      { status: 500 }
    )
  }
}
