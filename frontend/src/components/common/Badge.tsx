import React from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'orange' | 'blue' | 'success'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const variants = {
    default: 'bg-charcoal/5 text-charcoal border-charcoal/10',
    orange: 'bg-safety-orange/10 text-safety-orange border-safety-orange/25',
    blue: 'bg-steel-blue/10 text-steel-blue border-steel-blue/20',
    success: 'bg-success/10 text-success border-success/20',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

