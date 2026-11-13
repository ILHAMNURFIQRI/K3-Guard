import React from 'react'
import { cn } from '@/utils/cn'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
  id?: string
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  as: Component = 'div',
  id,
}) => {
  return (
    <Component
      id={id}
      className={cn('w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20', className)}
    >
      {children}
    </Component>
  )
}
