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
import { X, CreditCard, Shield, Lock, CheckCircle, AlertCircle, Smartphone, QrCode, ExternalLink, Banknote } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { AlternativePaymentModal } from './AlternativePaymentModal'

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
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('upi')
  const [showAlternativeModal, setShowAlternativeModal] = useState(false)

  const handleAmountChange = async (newAmount: string) => {
    setAmount(newAmount)
    const amountNum = parseFloat(newAmount)
    
    if (amountNum >= 100) {
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
        setPaymentData(data)
        setError(null)
      } catch (err) {
        console.error('Failed to setup payment:', err)
        setError('Network error. Please check your connection.')
      }
    } else {
      setPaymentData(null)
      setError(null)
    }
  }

  const handleUPIPayment = async () => {
    if (!amount || !paymentData) {
      setError('Please enter a valid amount')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      if (paymentData.provider === 'razorpay') {
        // Load Razorpay script
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)

        script.onload = () => {
          const options = {
            key: paymentData.razorpayKeyId,
            amount: paymentData.amount * 100,
            currency: 'INR',
            name: 'CryptoWallet India',
            description: 'Add money to wallet',
            order_id: paymentData.orderId,
            handler: function (response: any) {
              toast({
                title: "UPI Payment Successful!",
                description: `₹ ${amount} has been added to your wallet.`,
              })
              onSuccess(parseFloat(amount))
              onClose()
            },
            prefill: {
              name: 'Crypto User',
              email: 'user@example.com',
              contact: '9999999999'
            },
            notes: {
              address: 'CryptoWallet India'
            },
            theme: {
              color: '#7c3aed'
            },
            method: {
              upi: true,
              card: false,
              netbanking: false,
              wallet: false
            }
          }

          const rzp = new (window as any).Razorpay(options)
          rzp.on('payment.failed', function (response: any) {
            setError('Payment failed. Please try again.')
            setProcessing(false)
          })
          rzp.open()
        }
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast({
          title: "Demo UPI Payment!",
          description: `₹ ${amount} added to wallet (demo mode).`,
        })
        onSuccess(parseFloat(amount))
        onClose()
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

    if (!paymentData) {
      setError('Payment not ready. Please enter a valid amount.')
      return
    }

    setProcessing(true)
    setError(null)

    if (paymentData.provider === 'demo') {
      setTimeout(() => {
        toast({
          title: "Demo Card Payment!",
          description: `₹ ${amount} added to wallet (demo mode).`,
        })
        onSuccess(parseFloat(amount))
        onClose()
        setProcessing(false)
      }, 2000)
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found')
      setProcessing(false)
      return
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(paymentData.clientSecret, {
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
        title: "Card Payment Successful!",
        description: `₹ ${amount} has been added to your wallet.`,
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

        {/* Alternative Payment Methods */}
        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">Alternative Payment Options</span>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            <div>• <strong>Bank Transfer:</strong> Direct NEFT/RTGS to our account</div>
            <div>• <strong>Crypto Deposit:</strong> Send USDT/BTC directly to our wallet</div>
            <div>• <strong>PayPal:</strong> International payments accepted</div>
            <div>• <strong>Manual Verification:</strong> Contact support for large amounts</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-200">Amount (INR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Minimum ₹ 100"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              min="100"
              step="1"
            />
            {amount && parseFloat(amount) < 100 && (
              <p className="text-sm text-red-400">Minimum deposit is ₹ 100</p>
            )}
            {amount && parseFloat(amount) >= 100 && (
              <p className="text-sm text-slate-400">≈ ${usdAmount} USD</p>
            )}
          </div>

          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'card' | 'upi')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="upi" className="data-[state=active]:bg-purple-600">
                <Smartphone className="w-4 h-4 mr-2" />
                UPI (Recommended)
              </TabsTrigger>
              <TabsTrigger value="card" className="data-[state=active]:bg-purple-600">
                <CreditCard className="w-4 h-4 mr-2" />
                Card
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upi" className="space-y-4">
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-300">UPI Payment</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Instant transfer • Zero fees • Supported: PhonePe, Google Pay, Paytm, BHIM
                </p>
                <div className="text-xs text-green-400">
                  ✓ Funds directly credited to merchant bank account
                </div>
              </div>

              <Alert className="bg-blue-900/20 border-blue-700">
                <ExternalLink className="h-4 w-4" />
                <AlertDescription className="text-blue-200">
                  <strong>How it works:</strong> Your payment goes directly to our business bank account via Razorpay. 
                  Funds are automatically settled within 24 hours.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  onClick={handleUPIPayment}
                  disabled={!amount || parseFloat(amount) < 100 || processing}
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
                      Pay ₹ {amount || '0'} via UPI (Demo)
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowAlternativeModal(true)}
                  disabled={!amount || parseFloat(amount) < 100}
                  className="w-full"
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  View Alternative Payment Methods
                </Button>
              </div>
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
                <p className="text-xs text-slate-400 mb-2">
                  Visa, Mastercard, RuPay • Secure 3D authentication
                </p>
                <div className="text-xs text-green-400">
                  ✓ Funds credited to merchant account via Stripe
                </div>
              </div>

              <Button
                onClick={handleCardPayment}
                disabled={!paymentData || processing || !amount || parseFloat(amount) < 100}
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
                    Pay ₹ {amount || '0'}
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {paymentData?.demo && (
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
              <span className="text-white">₹ {amount || '0'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Payment Gateway Fee</span>
              <span className="text-white">₹ 0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">GST (18%)</span>
              <span className="text-white">₹ {amount ? (parseFloat(amount) * 0.18).toFixed(0) : '0'}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-white">Total</span>
              <span className="text-white">₹ {amount ? (parseFloat(amount) * 1.18).toFixed(0) : '0'}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-3 h-3" />
            Secured by Razorpay & Stripe • RBI compliant • 256-bit encryption
          </div>
        </div>
      </CardContent>
      <AlternativePaymentModal
        isOpen={showAlternativeModal}
        onClose={() => setShowAlternativeModal(false)}
        amount={amount}
        onSuccess={onSuccess}
      />
    </Card>
  )
}
