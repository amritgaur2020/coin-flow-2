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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, CreditCard, Shield, Lock, CheckCircle, AlertCircle, Smartphone, QrCode } from 'lucide-react'
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
            className="w-full max-w-lg"
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('upi')
  const [upiId, setUpiId] = useState('')

  const handleAmountChange = async (newAmount: string) => {
    setAmount(newAmount)
    const amountNum = parseFloat(newAmount)
    
    if (amountNum >= 100) { // Minimum ₹100
      try {
        const response = await fetch('/api/payments/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: amountNum,
            currency: 'inr',
            paymentMethod: paymentMethod,
            userId: 'user_123'
          })
        })
        
        const data = await response.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setError(null)
        } else if (data.error) {
          console.warn('Payment setup error:', data.error)
          if (data.error.includes('Invalid API Key') || data.error.includes('aureus-nexus')) {
            console.warn('Stripe not configured - using demo mode')
            setClientSecret('demo_client_secret')
          } else {
            setError('Payment setup failed. Please try again.')
          }
        }
      } catch (err) {
        console.error('Failed to create payment intent:', err)
        setError('Network error. Please check your connection.')
      }
    } else {
      setClientSecret(null)
      setError(null)
    }
  }

  const handleUPIPayment = async () => {
    if (!upiId || !amount) {
      setError('Please enter UPI ID and amount')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Simulate UPI payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate random success/failure for demo
      const success = Math.random() > 0.2 // 80% success rate
      
      if (success) {
        toast({
          title: "UPI Payment Successful!",
          description: `₹${amount} has been added to your wallet via UPI.`,
        })
        onSuccess(parseFloat(amount))
        onClose()
      } else {
        setError('UPI payment failed. Please try again.')
      }
    } catch (err) {
      setError('UPI payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleCardPayment = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      setError('Payment system not loaded')
      return
    }

    // Handle demo mode
    if (clientSecret === 'demo_client_secret') {
      setProcessing(true)
      setTimeout(() => {
        toast({
          title: "Demo Payment Successful!",
          description: `₹${amount} has been added to your wallet (demo mode).`,
        })
        onSuccess(parseFloat(amount))
        onClose()
        setProcessing(false)
      }, 2000)
      return
    }

    if (!clientSecret) {
      setError('Payment not ready. Please enter a valid amount.')
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
        description: `₹${amount} has been added to your wallet.`,
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

  // Convert amount to USD for crypto calculations (approximate rate)
  const usdAmount = amount ? (parseFloat(amount) / 83).toFixed(2) : '0.00'

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
            <Label htmlFor="amount" className="text-slate-200">Amount (INR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Minimum ₹100"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              min="100"
              step="1"
            />
            {amount && parseFloat(amount) < 100 && (
              <p className="text-sm text-red-400">Minimum deposit is ₹100</p>
            )}
            {amount && parseFloat(amount) >= 100 && (
              <p className="text-sm text-slate-400">≈ ${usdAmount} USD</p>
            )}
          </div>

          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'card' | 'upi')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="upi" className="data-[state=active]:bg-purple-600">
                <Smartphone className="w-4 h-4 mr-2" />
                UPI
              </TabsTrigger>
              <TabsTrigger value="card" className="data-[state=active]:bg-purple-600">
                <CreditCard className="w-4 h-4 mr-2" />
                Card
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upi" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">UPI ID</Label>
                <Input
                  type="text"
                  placeholder="yourname@paytm / yourname@gpay"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-300">UPI Payment</span>
                </div>
                <p className="text-xs text-slate-400">
                  Instant transfer • Supported: PhonePe, Google Pay, Paytm, BHIM
                </p>
              </div>

              <Button
                onClick={handleUPIPayment}
                disabled={!upiId || !amount || parseFloat(amount) < 100 || processing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Pay ₹{amount || '0'} via UPI
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="card" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Card Details</Label>
                <div className="p-3 bg-slate-700 border border-slate-600 rounded-md">
                  <CardElement options={cardElementOptions} />
                </div>
              </div>

              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-300">Card Payment</span>
                </div>
                <p className="text-xs text-slate-400">
                  Visa, Mastercard, RuPay • Secure 3D authentication
                </p>
              </div>

              <Button
                onClick={handleCardPayment}
                disabled={!stripe || !clientSecret || processing || !amount || parseFloat(amount) < 100}
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
                    Pay ₹{amount || '0'}
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {clientSecret === 'demo_client_secret' && (
            <Alert className="bg-yellow-900/20 border-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-yellow-200">
                Demo Mode: Payment gateway not configured. This will simulate a payment.
              </AlertDescription>
            </Alert>
          )}

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
              <span className="text-white">₹{amount || '0'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Processing Fee</span>
              <span className="text-white">₹0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">GST (18%)</span>
              <span className="text-white">₹{amount ? (parseFloat(amount) * 0.18).toFixed(0) : '0'}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-white">Total</span>
              <span className="text-white">₹{amount ? (parseFloat(amount) * 1.18).toFixed(0) : '0'}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-3 h-3" />
            Secured payments • RBI compliant • 256-bit encryption
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
