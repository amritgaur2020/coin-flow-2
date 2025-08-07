'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  showChange?: boolean
  duration?: number
}

export function AnimatedNumber({ 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 2, 
  className = '',
  showChange = false,
  duration = 0.8
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)
  const [isIncreasing, setIsIncreasing] = useState(false)
  const [showChangeIndicator, setShowChangeIndicator] = useState(false)
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only animate if the value actually changed and is different enough
    if (Math.abs(value - displayValue) > 0.01) {
      // Cancel any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setPreviousValue(displayValue)
      setIsIncreasing(value > displayValue)
      
      if (showChange) {
        setShowChangeIndicator(true)
        timeoutRef.current = setTimeout(() => setShowChangeIndicator(false), 2000)
      }

      // Animate the number change
      const startValue = displayValue
      const endValue = value
      const startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / (duration * 1000), 1)
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        const currentValue = startValue + (endValue - startValue) * easeOutCubic
        
        setDisplayValue(currentValue)
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          animationRef.current = null
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value]) // Only depend on value, not displayValue

  // Initialize displayValue on mount
  useEffect(() => {
    setDisplayValue(value)
    setPreviousValue(value)
  }, []) // Empty dependency array for mount only

  const formatNumber = (num: number) => {
    if (decimals === 0) {
      return Math.round(num).toLocaleString()
    }
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })
  }

  return (
    <div className={`relative ${className}`}>
      <motion.div
        key={Math.floor(displayValue * 100)} // Key changes when significant change occurs
        initial={{ scale: 1 }}
        animate={{ 
          scale: showChangeIndicator ? [1, 1.05, 1] : 1,
          color: showChangeIndicator 
            ? isIncreasing 
              ? ['#ffffff', '#10b981', '#ffffff'] 
              : ['#ffffff', '#ef4444', '#ffffff']
            : '#ffffff'
        }}
        transition={{ 
          duration: showChangeIndicator ? 0.6 : 0,
          ease: "easeInOut"
        }}
        className="inline-block"
      >
        {prefix}{formatNumber(displayValue)}{suffix}
      </motion.div>
      
      {/* Change indicator */}
      <AnimatePresence>
        {showChangeIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`absolute -top-6 left-0 text-xs font-semibold ${
              isIncreasing ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isIncreasing ? '↗' : '↘'} {prefix}{formatNumber(Math.abs(value - previousValue))}{suffix}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
