import React from 'react'
import { cn } from '@/utils/cn'

export type IndicatorTone = 'success' | 'warning' | 'danger' | 'neutral'

export interface StatusIndicatorProps {
  tone?: IndicatorTone
  label: string
  pulse?: boolean
  className?: string
}

const dotClasses: Record<IndicatorTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-critical',
  neutral: 'bg-muted-gray',
}

const textClasses: Record<IndicatorTone, string> = {
  success: 'text-success',
  warning: 'text-[#9c6f00] dark:text-warning',
  danger: 'text-critical',
  neutral: 'text-muted-gray',
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  tone = 'neutral',
  label,
  pulse = false,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-semibold tracking-wide',
        textClasses[tone],
        className
      )}
    >
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              dotClasses[tone]
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex h-2.5 w-2.5 rounded-full',
            dotClasses[tone]
          )}
        />
      </span>
      <span>{label}</span>
    </span>
  )
}
