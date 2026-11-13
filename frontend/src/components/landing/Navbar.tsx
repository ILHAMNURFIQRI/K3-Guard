import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/common/Button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { cn } from '@/utils/cn'

const NAV_LINKS = [
  { label: 'Fitur', href: '#features' },
  { label: 'Alur kerja', href: '#how-it-works' },
  { label: 'APD wajib', href: '#equipment' },
  { label: 'Kontak', href: '#contact' },
]

/** Bagian yang sedang terlihat, untuk menandai tautan aktif. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const els = ids.map((id) => document.querySelector(id)).filter(Boolean) as Element[]
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ids])
  return active
}

const SECTION_IDS = NAV_LINKS.map((l) => l.href)

export const Navbar: React.FC = () => {
  const { isScrolled } = useScrollProgress(24)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const active = useActiveSection(SECTION_IDS)
  // sudah masuk: tombol berubah menjadi jalan kembali ke dashboard
  const cta =
    isAuthenticated && user
      ? { to: user.role === 'officer' ? '/dashboard/officer' : '/dashboard/student', label: 'Buka dashboard' }
      : { to: '/login', label: 'Masuk' }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setMobileOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-3 py-2 transition-all duration-300 sm:px-4',
          isScrolled || mobileOpen
            ? 'border-charcoal/10 bg-surface/85 shadow-lg backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        )}
      >
        <a href="#home" onClick={(e) => go(e, '#home')} className="flex items-center gap-2.5" aria-label="K3Guard AI, ke atas">
          <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
          <span className="font-heading text-lg font-extrabold tracking-tight text-charcoal">
            K3Guard <span className="text-safety-orange">AI</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => go(e, link.href)}
              className={cn(
                'relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
                active === link.href ? 'text-charcoal' : 'text-muted-gray hover:text-charcoal'
              )}
            >
              {active === link.href && (
                <motion.span
                  layoutId="landing-nav-active"
                  className="absolute inset-0 rounded-lg bg-charcoal/[0.06]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to={cta.to} className="hidden sm:block">
            <Button variant="primary" size="sm">
              {cta.label}
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-charcoal/10 bg-surface text-charcoal lg:hidden"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mx-auto mt-2 max-w-6xl rounded-2xl border border-charcoal/10 bg-surface p-3 shadow-xl lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Navigasi seluler">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => go(e, link.href)}
                  className="rounded-xl px-4 py-3 text-base font-semibold text-charcoal hover:bg-charcoal/[0.05]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <Link to={cta.to} onClick={() => setMobileOpen(false)}>
              <Button variant="primary" size="lg" className="mt-2 w-full">
                {cta.label}
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
