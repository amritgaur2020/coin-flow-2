'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, CreditCard, Smartphone, Bitcoin, MessageCircle, Mail, Copy, CheckCircle, ExternalLink, Banknote, Wallet } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

interface AlternativePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: string
  onSuccess: (amount: number) => void
}

export function AlternativePaymentModal({ isOpen, onClose, amount, onSuccess }: AlternativePaymentModalProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'bank' | 'crypto' | 'paypal' | 'manual'>('bank')

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const usdAmount = amount ? (parseFloat(amount) / 83).toFixed(2) : '0.00'

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
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-green-400" />
                  Alternative Payment Methods
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-700/30">
                  <div className="text-2xl font-bold text-white mb-2">₹ {amount || '0'}</div>
                  <div className="text-sm text-slate-400">≈ ${usdAmount} USD</div>
                </div>

                <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-slate-700">
                    <TabsTrigger value="bank" className="data-[state=active]:bg-green-600">
                      <Banknote className="w-4 h-4 mr-1" />
                      Bank
                    </TabsTrigger>
                    <TabsTrigger value="crypto" className="data-[state=active]:bg-orange-600">
                      <Bitcoin className="w-4 h-4 mr-1" />
                      Crypto
                    </TabsTrigger>
                    <TabsTrigger value="paypal" className="data-[state=active]:bg-blue-600">
                      <CreditCard className="w-4 h-4 mr-1" />
                      PayPal
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="data-[state=active]:bg-purple-600">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Support
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bank" className="space-y-4">
                    <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/30">
                      <h3 className="text-lg font-semibold text-green-300 mb-3">Bank Transfer / UPI</h3>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-slate-400">Account Name</div>
                            <div className="text-white font-mono text-sm">CryptoWallet India Pvt Ltd</div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">Account Number</div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono text-sm">50200012345678</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard('50200012345678', 'Account Number')}
                                className="h-6 w-6 p-0"
                              >
                                {copiedText === 'Account Number' ? 
                                  <CheckCircle className="w-3 h-3 text-green-400" /> : 
                                  <Copy className="w-3 h-3" />
                                }
                              </Button>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">IFSC Code</div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono text-sm">HDFC0001234</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard('HDFC0001234', 'IFSC Code')}
                                className="h-6 w-6 p-0"
                              >
                                {copiedText === 'IFSC Code' ? 
                                  <CheckCircle className="w-3 h-3 text-green-400" /> : 
                                  <Copy className="w-3 h-3" />
                                }
                              </Button>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">UPI ID</div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono text-sm">cryptowallet@hdfc</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard('cryptowallet@hdfc', 'UPI ID')}
                                className="h-6 w-6 p-0"
                              >
                                {copiedText === 'UPI ID' ? 
                                  <CheckCircle className="w-3 h-3 text-green-400" /> : 
                                  <Copy className="w-3 h-3" />
                                }
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator className="bg-slate-600" />

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-green-300">Instructions:</h4>
                          <ul className="text-xs text-slate-300 space-y-1">
                            <li>• Transfer exactly ₹ {amount || '0'} to the above account</li>
                            <li>• Use reference: <span className="font-mono bg-slate-700 px-1 rounded">USER123</span></li>
                            <li>• WhatsApp payment screenshot to <span className="font-mono">+91-9999999999</span></li>
                            <li>• Funds credited within 2-4 hours after verification</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="crypto" className="space-y-4">
                    <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-700/30">
                      <h3 className="text-lg font-semibold text-orange-300 mb-3">Crypto Deposit</h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <div className="text-sm text-slate-400 mb-1">Bitcoin (BTC)</div>
                            <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded">
                              <span className="text-white font-mono text-xs break-all">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'BTC Address')}
                                className="h-6 w-6 p-0 flex-shrink-0"
                              >
                                {copiedText === 'BTC Address' ? 
                                  <CheckCircle className="w-3 h-3 text-green-400" /> : 
                                  <Copy className="w-3 h-3" />
                                }
                              </Button>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-slate-400 mb-1">USDT (Multiple Networks)</div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded">
                                <div className="flex-1">
                                  <div className="text-xs text-slate-300">Ethereum (ERC-20)</div>
                                  <span className="text-white font-mono text-xs break-all">0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard('0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', 'USDT-ERC20')}
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                >
                                  {copiedText === 'USDT-ERC20' ? 
                                    <CheckCircle className="w-3 h-3 text-green-400" /> : 
                                    <Copy className="w-3 h-3" />
                                  }
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded">
                                <div className="flex-1">
                                  <div className="text-xs text-slate-300">Tron (TRC-20) - Lower Fees</div>
                                  <span className="text-white font-mono text-xs break-all">TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', 'USDT-TRC20')}
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                >
                                  {copiedText === 'USDT-TRC20' ? 
                                    <CheckCircle className="w-3 h-3 text-green-400" /> : 
                                    <Copy className="w-3 h-3" />
                                  }
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator className="bg-slate-600" />

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-orange-300">Instructions:</h4>
                          <ul className="text-xs text-slate-300 space-y-1">
                            <li>• Send equivalent crypto worth ₹ {amount || '0'} (≈ ${usdAmount})</li>
                            <li>• Include memo/note: <span className="font-mono bg-slate-700 px-1 rounded">USER123</span></li>
                            <li>• Minimum: $10 equivalent • Recommended: USDT TRC-20 (lowest fees)</li>
                            <li>• Funds credited after 3 network confirmations</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="paypal" className="space-y-4">
                    <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                      <h3 className="text-lg font-semibold text-blue-300 mb-3">PayPal Payment</h3>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-slate-400">PayPal Email</div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono text-sm">payments@cryptowallet.in</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard('payments@cryptowallet.in', 'PayPal Email')}
                                className="h-6 w-6 p-0"
                              >
                                {copiedText === 'PayPal Email' ? 
                                  <CheckCircle className="w-3 h-3 text-green-400" /> : 
                                  <Copy className="w-3 h-3" />
                                }
                              </Button>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-400">Amount (USD)</div>
                            <div className="text-white font-mono text-sm">${usdAmount}</div>
                          </div>
                        </div>

                        <Separator className="bg-slate-600" />

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-blue-300">Instructions:</h4>
                          <ul className="text-xs text-slate-300 space-y-1">
                            <li>• Send ${usdAmount} USD to payments@cryptowallet.in</li>
                            <li>• Add note: <span className="font-mono bg-slate-700 px-1 rounded">USER123 - ₹ {amount || '0'}</span></li>
                            <li>• Use "Friends & Family" to avoid fees</li>
                            <li>• Funds credited within 1 hour of confirmation</li>
                          </ul>
                        </div>

                        <Button
                          onClick={() => window.open(`https://paypal.me/cryptowallet/${usdAmount}`, '_blank')}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Pay ${usdAmount} via PayPal
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4">
                    <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                      <h3 className="text-lg font-semibold text-purple-300 mb-3">Manual Verification</h3>
                      
                      <div className="space-y-4">
                        <div className="text-sm text-slate-300">
                          For large amounts (₹ 50,000+) or if you need assistance with payments, contact our support team:
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded">
                            <MessageCircle className="w-5 h-5 text-green-400" />
                            <div>
                              <div className="text-sm font-semibold text-white">WhatsApp</div>
                              <div className="text-xs text-slate-400">+91-9999999999</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('https://wa.me/919999999999', '_blank')}
                            >
                              Chat
                            </Button>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded">
                            <MessageCircle className="w-5 h-5 text-blue-400" />
                            <div>
                              <div className="text-sm font-semibold text-white">Telegram</div>
                              <div className="text-xs text-slate-400">@cryptowallet_support</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('https://t.me/cryptowallet_support', '_blank')}
                            >
                              Chat
                            </Button>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded">
                            <Mail className="w-5 h-5 text-purple-400" />
                            <div>
                              <div className="text-sm font-semibold text-white">Email</div>
                              <div className="text-xs text-slate-400">support@cryptowallet.in</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('mailto:support@cryptowallet.in', '_blank')}
                            >
                              Email
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-purple-300">What to include:</h4>
                          <ul className="text-xs text-slate-300 space-y-1">
                            <li>• Your User ID: USER123</li>
                            <li>• Amount to deposit: ₹ {amount || '0'}</li>
                            <li>• Preferred payment method</li>
                            <li>• KYC documents (for amounts ₹ 50,000+)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Alert className="bg-yellow-900/20 border-yellow-700">
                  <MessageCircle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-200">
                    <strong>Important:</strong> Always include your User ID (USER123) in payment references. 
                    Contact support if you don't receive funds within the specified timeframe.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      toast({
                        title: "Payment Instructions Noted!",
                        description: "Follow the instructions above to complete your payment.",
                      })
                      onClose()
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Got It
                  </Button>
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
