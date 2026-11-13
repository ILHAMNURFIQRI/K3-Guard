import React from 'react'
import { cn } from '@/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl whitespace-nowrap transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-blue disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary:
      'bg-safety-orange text-night shadow-sm hover:-translate-y-0.5 hover:bg-[#f59a3f] hover:shadow-[0_12px_24px_-12px_rgba(242,140,40,0.9)] active:translate-y-0 active:scale-[0.98]',
    secondary:
      'bg-steel-blue text-pure-white shadow-sm hover:-translate-y-0.5 hover:bg-industrial-blue active:translate-y-0 active:scale-[0.98]',
    outline:
      'border border-charcoal/20 text-charcoal bg-transparent hover:border-steel-blue/50 hover:bg-steel-blue/5 hover:text-steel-blue active:scale-[0.98]',
    ghost:
      'text-charcoal hover:bg-charcoal/5 bg-transparent',
  }

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-7 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

