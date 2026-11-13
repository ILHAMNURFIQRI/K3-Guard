import React, { useEffect, useRef, useState } from 'react'

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const isSmallScreen = window.innerWidth < 1024

    if (isTouchDevice || prefersReducedMotion || isSmallScreen) {
      setEnabled(false)
      return
    }

    setEnabled(true)

    let mouseX = 0
    let mouseY = 0
    let currentX = 0
    let currentY = 0
    let animationFrameId = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      setIsVisible(true)

      const target = e.target as HTMLElement | null
      if (target) {
        const interactive = target.closest(
          'a, button, [role="button"], input, textarea, select'
        )
        setIsHovering(Boolean(interactive))
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const animate = () => {
      currentX += (mouseX - currentX) * 0.18
      currentY += (mouseY - currentY) * 0.18

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  if (!enabled || !isVisible) return null

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="custom-cursor pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2 hidden lg:block"
    >
      <div
        className={`rounded-full border transition-all duration-200 ease-out ${
          isHovering
            ? 'h-11 w-11 border-safety-orange bg-safety-orange/20'
            : 'h-6 w-6 border-steel-blue/70 bg-transparent'
        }`}
      />
    </div>
  )
}

