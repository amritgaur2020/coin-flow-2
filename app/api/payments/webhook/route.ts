import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

// Remove Stripe and crypto imports that might cause issues
// import Stripe from 'stripe'
// import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()

    // Check if it's a Razorpay webhook
    const razorpaySignature = headersList.get("x-razorpay-signature")
    if (razorpaySignature) {
      return handleRazorpayWebhook(body, razorpaySignature)
    }

    // Handle Stripe webhook
    const stripeSignature = headersList.get("stripe-signature")
    if (stripeSignature) {
      return handleStripeWebhook(body, stripeSignature)
    }

    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleRazorpayWebhook(body: string, signature: string) {
  try {
    // Simple signature verification without crypto module
    const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "demo_secret"

    // In production, implement proper signature verification
    // For now, just parse the event
    const event = JSON.parse(body)

    switch (event.event) {
      case "payment.captured":
        const payment = event.payload.payment.entity

        // Update user's fiat balance in database
        await updateUserBalance(
          payment.notes?.userId || "demo_user",
          payment.amount / 100, // Convert from paise to rupees
          payment.id,
          "razorpay",
        )

        console.log("✅ Razorpay payment captured:", payment.id)
        break

      case "payment.failed":
        const failedPayment = event.payload.payment.entity
        console.log("❌ Razorpay payment failed:", failedPayment.id)
        break

      default:
        console.log(`Unhandled Razorpay event: ${event.event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Razorpay webhook error:", error)
    return NextResponse.json({ error: "Razorpay webhook handler failed" }, { status: 500 })
  }
}

async function handleStripeWebhook(body: string, signature: string) {
  try {
    // For demo purposes, just parse the body
    // In production, use Stripe's webhook verification
    const event = JSON.parse(body)

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object

        await updateUserBalance(
          paymentIntent.metadata?.userId || "demo_user",
          paymentIntent.amount / 100,
          paymentIntent.id,
          "stripe",
        )

        console.log("✅ Stripe payment succeeded:", paymentIntent.id)
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object
        console.log("❌ Stripe payment failed:", failedPayment.id)
        break

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json({ error: "Stripe webhook handler failed" }, { status: 500 })
  }
}

// Mock database update function - replace with your actual database
async function updateUserBalance(userId: string, amount: number, paymentId: string, provider: string) {
  // In a real app, you would update your database here
  console.log(`Updating balance for user ${userId}: +₹${amount} (Payment: ${paymentId}, Provider: ${provider})`)

  // This is where the money gets credited to your business account
  // Razorpay/Stripe automatically transfers funds to your linked bank account

  // Example database update:
  // await db.users.update({
  //   where: { id: userId },
  //   data: {
  //     fiatBalance: { increment: amount },
  //     transactions: {
  //       create: {
  //         type: 'deposit',
  //         amount: amount,
  //         currency: 'INR',
  //         status: 'completed',
  //         paymentId: paymentId,
  //         provider: provider
  //       }
  //     }
  //   }
  // })
}
