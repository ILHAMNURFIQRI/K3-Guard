import { useState, useEffect } from 'react'

interface ScrollProgress {
  scrollY: number
  progress: number
  isScrolled: boolean
}

export function useScrollProgress(threshold = 40): ScrollProgress {
  const [scrollState, setScrollState] = useState<ScrollProgress>({
    scrollY: 0,
    progress: 0,
    isScrolled: false,
  })

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0
      setScrollState({
        scrollY,
        progress,
        isScrolled: scrollY > threshold,
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return scrollState
}

