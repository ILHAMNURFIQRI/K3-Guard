import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightElement,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-charcoal"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 text-muted-gray flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-gray/70 transition-colors focus:outline-none focus:ring-2 focus:ring-steel-blue/25 focus:border-steel-blue disabled:cursor-not-allowed disabled:bg-off-white disabled:opacity-70',
              leftIcon ? 'pl-10' : '',
              rightElement ? 'pr-10' : '',
              error
                ? 'border-critical focus:border-critical focus:ring-critical/20'
                : 'border-charcoal/15',
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 flex items-center">
              {rightElement}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-critical">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-gray">{hint}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
