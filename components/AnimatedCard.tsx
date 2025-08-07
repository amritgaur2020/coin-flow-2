'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  glowOnChange?: boolean
  changeDetected?: boolean
}

export function AnimatedCard({ children, className = '', glowOnChange = false, changeDetected = false }: AnimatedCardProps) {
  return (
    <motion.div
      animate={{
        boxShadow: glowOnChange && changeDetected 
          ? [
              '0 0 0 rgba(168, 85, 247, 0)',
              '0 0 20px rgba(168, 85, 247, 0.4)',
              '0 0 0 rgba(168, 85, 247, 0)'
            ]
          : '0 0 0 rgba(168, 85, 247, 0)'
      }}
      transition={{ duration: 2, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
