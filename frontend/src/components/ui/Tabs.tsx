import React, { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface TabsProps {
  items: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({ items, activeTab, onChange, className }) => {
  const pillId = useId()
  return (
    <div
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-xl border border-charcoal/10 bg-charcoal/[0.04] p-1',
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === activeTab
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
              active ? 'text-steel-blue' : 'text-muted-gray hover:text-charcoal'
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
