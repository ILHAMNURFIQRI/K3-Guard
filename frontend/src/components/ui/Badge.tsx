import React from 'react'
import { cn } from '@/utils/cn'

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'

export interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-steel-blue/10 text-steel-blue border-steel-blue/20',
  success: 'bg-success/10 text-success border-success/25',
  warning: 'bg-warning/10 text-[#9c6f00] dark:text-warning border-warning/30',
  danger: 'bg-critical/10 text-critical border-critical/25',
  info: 'bg-industrial-blue/10 text-industrial-blue border-industrial-blue/25',
  neutral: 'bg-charcoal/5 text-muted-gray border-charcoal/15',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight whitespace-nowrap',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
