import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const sig = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update user's fiat balance in database
        await updateUserBalance(
          paymentIntent.metadata.userId,
          paymentIntent.amount / 100, // Convert from cents
          paymentIntent.id
        )
        
        console.log('✅ Payment succeeded:', paymentIntent.id)
        break
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed:', failedPayment.id)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Mock database update function - replace with your actual database
async function updateUserBalance(userId: string, amount: number, paymentId: string) {
  // In a real app, you would update your database here
  console.log(`Updating balance for user ${userId}: +$${amount} (Payment: ${paymentId})`)
  
  // Example database update:
  // await db.users.update({
  //   where: { id: userId },
  //   data: { 
  //     fiatBalance: { increment: amount },
  //     transactions: {
  //       create: {
  //         type: 'deposit',
  //         amount: amount,
  //         currency: 'USD',
  //         status: 'completed',
  //         paymentId: paymentId
  //       }
  //     }
  //   }
  // })
}
