'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Send, ExternalLink, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

interface CryptoSendModalProps {
  isOpen: boolean
  onClose: () => void
  holdings: Array<{ symbol: string; name: string; amount: number; averagePrice: number }>
  prices: { [key: string]: { price: number } }
  onSuccess: (symbol: string, amount: number) => void
}

export function CryptoSendModal({ isOpen, onClose, holdings, prices, onSuccess }: CryptoSendModalProps) {
  const [selectedCrypto, setSelectedCrypto] = useState('')
  const [amount, setAmount] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txResult, setTxResult] = useState<any>(null)

  const selectedHolding = holdings.find(h => h.symbol === selectedCrypto)
  const currentPrice = prices[selectedCrypto]?.price || 0
  const usdValue = parseFloat(amount) * currentPrice
  const networkFee = getNetworkFee(selectedCrypto)
  const totalAmount = parseFloat(amount) + networkFee

  const handleSend = async () => {
    if (!selectedCrypto || !amount || !toAddress) {
      setError('Please fill in all fields')
      return
    }

    if (!selectedHolding || parseFloat(amount) > selectedHolding.amount) {
      setError('Insufficient balance')
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/crypto/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedCrypto,
          amount: parseFloat(amount),
          toAddress: toAddress,
          userId: 'user_123' // Replace with actual user ID
        })
      })

      const result = await response.json()

      if (result.success) {
        setTxResult(result.transaction)
        onSuccess(selectedCrypto, parseFloat(amount))
        toast({
          title: "Transaction Submitted!",
          description: `${amount} ${selectedCrypto} sent to blockchain network`,
        })
      } else {
        setError(result.error || 'Transaction failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const resetForm = () => {
    setSelectedCrypto('')
    setAmount('')
    setToAddress('')
    setError(null)
    setTxResult(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  function getNetworkFee(symbol: string): number {
    const fees: { [key: string]: number } = {
      'BTC': 0.0001,
      'ETH': 0.002,
      'ADA': 0.17,
      'SOL': 0.00025,
      'MATIC': 0.001,
      'BNB': 0.0005,
      'XRP': 0.00001,
      'DOGE': 1,
      'LINK': 0.001,
      'DOT': 0.01
    }
    return fees[symbol] || 0.001
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg"
          >
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-400" />
                  Send Cryptocurrency
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {!txResult ? (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-200">Select Cryptocurrency</Label>
                        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Choose crypto to send" />
                          </SelectTrigger>
                          <SelectContent>
                            {holdings.map((holding) => (
                              <SelectItem key={holding.symbol} value={holding.symbol}>
                                {holding.name} ({holding.symbol}) - Available: {holding.amount.toFixed(6)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-200">Amount</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount to send"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          max={selectedHolding?.amount || 0}
                          step="0.000001"
                        />
                        {amount && selectedCrypto && (
                          <div className="text-sm text-slate-400">
                            ≈ ${usdValue.toLocaleString()} USD
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-200">Recipient Address</Label>
                        <Input
                          placeholder={`Enter ${selectedCrypto || 'wallet'} address`}
                          value={toAddress}
                          onChange={(e) => setToAddress(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                        />
                      </div>

                      {selectedCrypto && amount && (
                        <div className="p-4 bg-slate-700/30 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Amount</span>
                            <span className="text-white">{amount} {selectedCrypto}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Network Fee</span>
                            <span className="text-white">{networkFee} {selectedCrypto}</span>
                          </div>
                          <Separator className="bg-slate-600" />
                          <div className="flex justify-between font-semibold">
                            <span className="text-white">Total</span>
                            <span className="text-white">{totalAmount.toFixed(6)} {selectedCrypto}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-2">
                            Estimated confirmation time: {getConfirmationTime(selectedCrypto)}
                          </div>
                        </div>
                      )}

                      {error && (
                        <Alert className="bg-red-900/20 border-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-red-200">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Alert className="bg-yellow-900/20 border-yellow-700">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-yellow-200">
                          Double-check the recipient address. Cryptocurrency transactions cannot be reversed.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <Button
                      onClick={handleSend}
                      disabled={!selectedCrypto || !amount || !toAddress || sending || (selectedHolding && totalAmount > selectedHolding.amount)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {sending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send {selectedCrypto || 'Crypto'}
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Transaction Submitted!</h3>
                      <p className="text-slate-400">Your transaction has been broadcast to the network</p>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg space-y-2 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Amount</span>
                        <span className="text-white">{txResult.amount} {txResult.symbol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Network Fee</span>
                        <span className="text-white">{txResult.networkFee} {txResult.symbol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Status</span>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {txResult.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">TX Hash</span>
                        <span className="text-white font-mono text-xs">
                          {txResult.txHash.slice(0, 10)}...{txResult.txHash.slice(-8)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(txResult.explorerUrl || '#', '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                      </Button>
                      <Button onClick={handleClose} className="flex-1 bg-purple-600 hover:bg-purple-700">
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function getConfirmationTime(symbol: string): string {
  const times: { [key: string]: string } = {
    'BTC': '10-60 minutes',
    'ETH': '1-5 minutes',
    'ADA': '2-5 minutes',
    'SOL': '30 seconds',
    'MATIC': '1-3 minutes',
    'BNB': '3 seconds',
    'XRP': '3-5 seconds',
    'DOGE': '1 minute',
    'LINK': '1-5 minutes',
    'DOT': '6 seconds'
  }
  return times[symbol] || '1-5 minutes'
}
