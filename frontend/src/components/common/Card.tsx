import React from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
}) => {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl border border-charcoal/10 p-6 md:p-8',
        hover &&
          'transition-colors duration-200 hover:border-steel-blue/40',
        className
      )}
    >
      {children}
    </div>
  )
}

