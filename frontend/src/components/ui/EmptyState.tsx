import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal/15 bg-surface/60 px-6 py-10 text-center',
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-steel-blue/10 text-steel-blue">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="font-heading text-base font-semibold text-charcoal">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted-gray">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
