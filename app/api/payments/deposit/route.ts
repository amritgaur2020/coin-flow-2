import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Check if Stripe is properly configured
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const isStripeConfigured = stripeSecretKey && stripeSecretKey.startsWith('sk_')

let stripe: Stripe | null = null

if (isStripeConfigured) {
  stripe = new Stripe(stripeSecretKey!, {
    apiVersion: '2024-06-20',
  })
}

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'inr', paymentMethod = 'card', userId } = await request.json()

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least ₹100' },
        { status: 400 }
      )
    }

    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      console.warn('Stripe not configured properly - API key missing or invalid')
      return NextResponse.json(
        { 
          error: 'Payment system not configured',
          demo: true,
          message: 'Payment gateway not configured. Using demo mode.'
        },
        { status: 200 }
      )
    }

    // Create payment intent based on method
    const paymentIntentData: any = {
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit for INR)
      currency: currency.toLowerCase(),
      metadata: {
        userId: userId || 'anonymous',
        type: 'crypto_wallet_deposit',
        paymentMethod: paymentMethod
      },
    }

    // Configure payment methods based on selection
    if (paymentMethod === 'upi') {
      paymentIntentData.payment_method_types = ['upi']
      paymentIntentData.payment_method_options = {
        upi: {
          flow: 'redirect'
        }
      }
    } else {
      paymentIntentData.automatic_payment_methods = {
        enabled: true,
      }
      // Enable Indian payment methods
      paymentIntentData.payment_method_types = ['card']
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      paymentMethod: paymentMethod
    })
  } catch (error: any) {
    console.error('Payment intent creation failed:', error)
    
    // Handle specific Stripe errors
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { 
          error: 'Payment system authentication failed',
          demo: true,
          message: 'Invalid payment gateway configuration. Using demo mode.'
        },
        { status: 200 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
