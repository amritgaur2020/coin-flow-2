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
import { X, Send, ExternalLink, AlertTriangle, CheckCircle, Clock, Network } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

interface CryptoSendModalProps {
  isOpen: boolean
  onClose: () => void
  holdings: Array<{ symbol: string; name: string; amount: number; averagePrice: number }>
  prices: { [key: string]: { price: number } }
  onSuccess: (symbol: string, amount: number) => void
}

// Network configurations for different cryptocurrencies
const NETWORK_CONFIG = {
  BTC: [
    { id: 'bitcoin', name: 'Bitcoin Network', fee: 0.0001, confirmTime: '10-60 minutes' },
    { id: 'lightning', name: 'Lightning Network', fee: 0.000001, confirmTime: '< 1 second' }
  ],
  ETH: [
    { id: 'ethereum', name: 'Ethereum Mainnet', fee: 0.002, confirmTime: '1-5 minutes' },
    { id: 'polygon', name: 'Polygon Network', fee: 0.0001, confirmTime: '2-3 seconds' },
    { id: 'arbitrum', name: 'Arbitrum One', fee: 0.0005, confirmTime: '10-15 minutes' },
    { id: 'optimism', name: 'Optimism', fee: 0.0003, confirmTime: '10-15 minutes' }
  ],
  ADA: [
    { id: 'cardano', name: 'Cardano Network', fee: 0.17, confirmTime: '2-5 minutes' }
  ],
  SOL: [
    { id: 'solana', name: 'Solana Network', fee: 0.00025, confirmTime: '30 seconds' }
  ],
  MATIC: [
    { id: 'polygon', name: 'Polygon Network', fee: 0.001, confirmTime: '2-3 seconds' },
    { id: 'ethereum', name: 'Ethereum (ERC-20)', fee: 0.002, confirmTime: '1-5 minutes' }
  ],
  BNB: [
    { id: 'bsc', name: 'BNB Smart Chain', fee: 0.0005, confirmTime: '3 seconds' },
    { id: 'ethereum', name: 'Ethereum (ERC-20)', fee: 0.002, confirmTime: '1-5 minutes' }
  ],
  XRP: [
    { id: 'xrp', name: 'XRP Ledger', fee: 0.00001, confirmTime: '3-5 seconds' }
  ],
  DOGE: [
    { id: 'dogecoin', name: 'Dogecoin Network', fee: 1, confirmTime: '1 minute' }
  ],
  LINK: [
    { id: 'ethereum', name: 'Ethereum (ERC-20)', fee: 0.002, confirmTime: '1-5 minutes' },
    { id: 'polygon', name: 'Polygon Network', fee: 0.0001, confirmTime: '2-3 seconds' }
  ],
  DOT: [
    { id: 'polkadot', name: 'Polkadot Network', fee: 0.01, confirmTime: '6 seconds' }
  ],
  USDT: [
    { id: 'ethereum', name: 'Ethereum (ERC-20)', fee: 0.002, confirmTime: '1-5 minutes' },
    { id: 'tron', name: 'Tron Network (TRC-20)', fee: 1, confirmTime: '3 minutes' },
    { id: 'polygon', name: 'Polygon Network', fee: 0.0001, confirmTime: '2-3 seconds' },
    { id: 'bsc', name: 'BNB Smart Chain (BEP-20)', fee: 0.0005, confirmTime: '3 seconds' },
    { id: 'arbitrum', name: 'Arbitrum One', fee: 0.0005, confirmTime: '10-15 minutes' },
    { id: 'optimism', name: 'Optimism', fee: 0.0003, confirmTime: '10-15 minutes' },
    { id: 'avalanche', name: 'Avalanche C-Chain', fee: 0.01, confirmTime: '2 seconds' }
  ]
}

export function CryptoSendModal({ isOpen, onClose, holdings, prices, onSuccess }: CryptoSendModalProps) {
  const [selectedCrypto, setSelectedCrypto] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [amount, setAmount] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txResult, setTxResult] = useState<any>(null)

  const selectedHolding = holdings.find(h => h.symbol === selectedCrypto)
  const currentPrice = prices[selectedCrypto]?.price || 0
  const usdValue = parseFloat(amount) * currentPrice
  const availableNetworks = selectedCrypto ? NETWORK_CONFIG[selectedCrypto as keyof typeof NETWORK_CONFIG] || [] : []
  const selectedNetworkConfig = availableNetworks.find(n => n.id === selectedNetwork)
  const networkFee = selectedNetworkConfig?.fee || 0
  const totalAmount = parseFloat(amount) + networkFee

  const handleCryptoChange = (crypto: string) => {
    setSelectedCrypto(crypto)
    setSelectedNetwork('') // Reset network when crypto changes
    const networks = NETWORK_CONFIG[crypto as keyof typeof NETWORK_CONFIG] || []
    if (networks.length > 0) {
      setSelectedNetwork(networks[0].id) // Auto-select first network
    }
  }

  const handleSend = async () => {
    if (!selectedCrypto || !amount || !toAddress || !selectedNetwork) {
      setError('Please fill in all fields')
      return
    }

    if (!selectedHolding || parseFloat(amount) > selectedHolding.amount) {
      setError('Insufficient balance')
      return
    }

    if (!selectedNetworkConfig) {
      setError('Please select a valid network')
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
          network: selectedNetwork,
          networkName: selectedNetworkConfig.name,
          userId: 'user_123'
        })
      })

      const result = await response.json()

      if (result.success) {
        setTxResult(result.transaction)
        onSuccess(selectedCrypto, parseFloat(amount))
        toast({
          title: "Transaction Submitted!",
          description: `${amount} ${selectedCrypto} sent via ${selectedNetworkConfig.name}`,
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
    setSelectedNetwork('')
    setAmount('')
    setToAddress('')
    setError(null)
    setTxResult(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateAddress = (address: string, crypto: string, network: string) => {
    // Basic address validation - implement proper validation for each crypto/network
    const patterns: { [key: string]: { [key: string]: RegExp } } = {
      BTC: {
        bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
        lightning: /^ln[a-z0-9]+$/
      },
      ETH: {
        ethereum: /^0x[a-fA-F0-9]{40}$/,
        polygon: /^0x[a-fA-F0-9]{40}$/,
        arbitrum: /^0x[a-fA-F0-9]{40}$/,
        optimism: /^0x[a-fA-F0-9]{40}$/
      },
      ADA: {
        cardano: /^addr1[a-z0-9]{98}$/
      },
      SOL: {
        solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      },
      MATIC: {
        polygon: /^0x[a-fA-F0-9]{40}$/,
        ethereum: /^0x[a-fA-F0-9]{40}$/
      },
      BNB: {
        bsc: /^0x[a-fA-F0-9]{40}$/,
        ethereum: /^0x[a-fA-F0-9]{40}$/
      },
      XRP: {
        xrp: /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/
      },
      DOGE: {
        dogecoin: /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/
      },
      LINK: {
        ethereum: /^0x[a-fA-F0-9]{40}$/,
        polygon: /^0x[a-fA-F0-9]{40}$/
      },
      DOT: {
        polkadot: /^1[a-zA-Z0-9]{47}$/
      },
      USDT: {
        ethereum: /^0x[a-fA-F0-9]{40}$/,
        tron: /^T[A-Za-z1-9]{33}$/,
        polygon: /^0x[a-fA-F0-9]{40}$/,
        bsc: /^0x[a-fA-F0-9]{40}$/,
        arbitrum: /^0x[a-fA-F0-9]{40}$/,
        optimism: /^0x[a-fA-F0-9]{40}$/,
        avalanche: /^0x[a-fA-F0-9]{40}$/
      }
    }
    
    const cryptoPatterns = patterns[crypto]
    if (!cryptoPatterns) return address.length > 20
    
    const pattern = cryptoPatterns[network]
    return pattern ? pattern.test(address) : address.length > 20
  }

  const isValidAddress = toAddress && selectedCrypto && selectedNetwork ? 
    validateAddress(toAddress, selectedCrypto, selectedNetwork) : false

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
                  Send to Cold Wallet
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
                        <Select value={selectedCrypto} onValueChange={handleCryptoChange}>
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

                      {selectedCrypto && availableNetworks.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-slate-200 flex items-center gap-2">
                            <Network className="w-4 h-4" />
                            Select Network
                          </Label>
                          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Choose network" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableNetworks.map((network) => (
                                <SelectItem key={network.id} value={network.id}>
                                  <div className="flex flex-col">
                                    <span>{network.name}</span>
                                    <span className="text-xs text-slate-400">
                                      Fee: {network.fee} {selectedCrypto} • {network.confirmTime}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedNetworkConfig && (
                            <div className="text-xs text-slate-400 p-2 bg-slate-700/30 rounded">
                              <strong>{selectedNetworkConfig.name}</strong> - Network fee: {selectedNetworkConfig.fee} {selectedCrypto} 
                              • Confirmation time: {selectedNetworkConfig.confirmTime}
                            </div>
                          )}
                        </div>
                      )}

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
                          placeholder={`Enter ${selectedCrypto || 'wallet'} address for ${selectedNetworkConfig?.name || 'selected network'}`}
                          value={toAddress}
                          onChange={(e) => setToAddress(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                        />
                        {toAddress && selectedCrypto && selectedNetwork && (
                          <div className={`text-xs ${isValidAddress ? 'text-green-400' : 'text-red-400'}`}>
                            {isValidAddress ? '✓ Valid address format' : '✗ Invalid address format'}
                          </div>
                        )}
                      </div>

                      {selectedCrypto && amount && selectedNetworkConfig && (
                        <div className="p-4 bg-slate-700/30 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Amount</span>
                            <span className="text-white">{amount} {selectedCrypto}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Network</span>
                            <span className="text-white">{selectedNetworkConfig.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Network Fee</span>
                            <span className="text-white">{networkFee} {selectedCrypto}</span>
                          </div>
                          <Separator className="bg-slate-600" />
                          <div className="flex justify-between font-semibold">
                            <span className="text-white">Total Deducted</span>
                            <span className="text-white">{totalAmount.toFixed(6)} {selectedCrypto}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-2">
                            Confirmation time: {selectedNetworkConfig.confirmTime}
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
                          <strong>Cold Wallet Transfer:</strong> Double-check the recipient address and network. 
                          Transactions to cold wallets cannot be reversed.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <Button
                      onClick={handleSend}
                      disabled={!selectedCrypto || !amount || !toAddress || !selectedNetwork || !isValidAddress || sending || (selectedHolding && totalAmount > selectedHolding.amount)}
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
                          Send to Cold Wallet
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
                      <p className="text-slate-400">Your transaction has been broadcast to {txResult.networkName}</p>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg space-y-2 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Amount</span>
                        <span className="text-white">{txResult.amount} {txResult.symbol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Network</span>
                        <span className="text-white">{txResult.networkName}</span>
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
