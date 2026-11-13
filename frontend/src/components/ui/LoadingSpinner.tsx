import React from 'react'
import { cn } from '@/utils/cn'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-[2.5px]',
  lg: 'h-10 w-10 border-[3px]',
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-gray',
        className
      )}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-steel-blue/20 border-t-steel-blue',
          sizeClasses[size]
        )}
        role="status"
        aria-label={label || 'Memuat'}
      />
      {label && <p className="text-sm font-medium text-muted-gray">{label}</p>}
    </div>
  )
}
