'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, CreditCard, Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (amount: number) => void
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Elements stripe={stripePromise}>
              <PaymentForm onClose={onClose} onSuccess={onSuccess} />
            </Elements>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PaymentForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: (amount: number) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const handleAmountChange = async (newAmount: string) => {
    setAmount(newAmount)
    const amountNum = parseFloat(newAmount)
    
    if (amountNum >= 10) {
      try {
        const response = await fetch('/api/payments/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: amountNum,
            userId: 'user_123' // Replace with actual user ID
          })
        })
        
        const data = await response.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        }
      } catch (err) {
        console.error('Failed to create payment intent:', err)
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found')
      setProcessing(false)
      return
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'Crypto Wallet User',
        },
      }
    })

    if (stripeError) {
      setError(stripeError.message || 'Payment failed')
      setProcessing(false)
    } else if (paymentIntent?.status === 'succeeded') {
      toast({
        title: "Payment Successful!",
        description: `$${amount} has been added to your wallet.`,
      })
      onSuccess(parseFloat(amount))
      onClose()
    }
    
    setProcessing(false)
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#334155',
        '::placeholder': {
          color: '#94a3b8',
        },
      },
    },
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          Add Funds
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-200">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Minimum $10"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              min="10"
              step="0.01"
            />
            {amount && parseFloat(amount) < 10 && (
              <p className="text-sm text-red-400">Minimum deposit is $10</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Card Details</Label>
            <div className="p-3 bg-slate-700 border border-slate-600 rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {error && (
            <Alert className="bg-red-900/20 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Separator className="bg-slate-600" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Amount</span>
              <span className="text-white">${amount || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Processing Fee</span>
              <span className="text-white">$0.00</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-white">Total</span>
              <span className="text-white">${amount || '0.00'}</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!stripe || !clientSecret || processing || !amount || parseFloat(amount) < 10}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {processing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Pay ${amount || '0.00'}
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-3 h-3" />
            Secured by Stripe • Your payment info is encrypted
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
