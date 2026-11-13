import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  FileText,
  HardHat,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Phone,
  Settings,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getStoredToken } from '@/services/auth'
import { API_BASE_URL } from '@/services/api'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

const OFFICER_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard/officer', icon: LayoutDashboard, end: true },
  { label: 'Asisten K3', to: '/dashboard/officer/chatbot', icon: MessageSquare },
  { label: 'Laporan Kejadian', to: '/dashboard/officer/events', icon: FileText },
  { label: 'Dokumen SOP', to: '/dashboard/officer/sop', icon: BookOpen },
  { label: 'Pertanyaan Tak Terjawab', to: '/dashboard/officer/unanswered', icon: HelpCircle },
  { label: 'Pengaturan', to: '/dashboard/officer/settings', icon: Settings },
]

const STUDENT_NAV: NavItem[] = [
  { label: 'Beranda', to: '/dashboard/student', icon: LayoutDashboard, end: true },
  { label: 'Asisten K3', to: '/dashboard/student/chatbot', icon: MessageSquare },
  { label: 'Dokumen SOP', to: '/dashboard/student/sop', icon: BookOpen },
  { label: 'Info Perlengkapan', to: '/dashboard/student/equipment', icon: HardHat },
  { label: 'Hubungi Petugas', to: '/dashboard/student/contact', icon: Phone },
]

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard/officer': 'Dashboard',
  '/dashboard/officer/monitoring': 'Live Monitoring',
  '/dashboard/officer/events': 'Laporan Kejadian',
  '/dashboard/officer/stats': 'Statistik',
  '/dashboard/officer/chatbot': 'Asisten K3',
  '/dashboard/officer/sop': 'Dokumen SOP',
  '/dashboard/officer/unanswered': 'Pertanyaan Tak Terjawab',
  '/dashboard/officer/settings': 'Pengaturan',
  '/dashboard/student': 'Beranda Mahasiswa',
  '/dashboard/student/chatbot': 'Asisten K3',
  '/dashboard/student/sop': 'Dokumen SOP',
  '/dashboard/student/equipment': 'Info Perlengkapan',
  '/dashboard/student/contact': 'Hubungi Petugas',
}

interface RealtimeAlert {
  id: string
  message: string
  time: string
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const isOfficer = user?.role === 'officer'
  const navItems = isOfficer ? OFFICER_NAV : STUDENT_NAV
  const homePath = isOfficer ? '/dashboard/officer' : '/dashboard/student'

  useEffect(() => {
    setMobileOpen(false)
    setNotifOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Optional WebSocket subscription for officer realtime alerts
  useEffect(() => {
    if (!isOfficer) return
    const token = getStoredToken()
    if (!token) return
    let ws: WebSocket | null = null
    let closed = false
    try {
      const wsBase = API_BASE_URL.replace(/\/api\/?$/, '').replace(/^http/, 'ws')
      ws = new WebSocket(`${wsBase}/api/ws/notifications?token=${encodeURIComponent(token)}`)
      ws.onmessage = (evt) => {
        if (closed) return
        try {
          const payload = JSON.parse(evt.data)
          if (payload?.type === 'pong') return
          const msg = payload?.detail || payload?.message || 'Deteksi kejadian baru pada sistem K3'
          setAlerts((prev) => [
            {
              id: `${Date.now()}-${Math.random()}`,
              message: String(msg),
              time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev.slice(0, 9),
          ])
        } catch {
          // ignore non-JSON frames
        }
      }
    } catch {
      // WebSocket optional when backend offline
    }
    return () => {
      closed = true
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [isOfficer])

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const baseLabel = isOfficer ? 'Dashboard Petugas' : 'Portal Mahasiswa'
    const items: BreadcrumbItem[] = [{ label: baseLabel, to: homePath }]
    const path = location.pathname

    if (path === homePath) {
      items.push({ label: isOfficer ? 'Dashboard' : 'Beranda' })
      return items
    }

    if (path.startsWith('/dashboard/officer/events/')) {
      items.push({ label: 'Laporan Kejadian', to: '/dashboard/officer/events' })
      items.push({ label: 'Detail Kejadian' })
      return items
    }

    const currentLabel = ROUTE_LABELS[path]
    if (currentLabel) {
      items.push({ label: currentLabel })
    }
    return items
  }, [isOfficer, homePath, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = (user?.nama || 'P')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Rail: ikon bulat selalu terlihat, label muncul saat rail melebar (hover/fokus) atau di drawer HP.
  const renderRail = (isMobile = false) => {
    const reveal = isMobile
      ? 'opacity-100'
      : 'opacity-0 -translate-x-1 group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100'
    const label = (text: string, strong = false) => (
      <span
        className={cn(
          'block truncate whitespace-nowrap text-sm transition-all duration-200',
          strong ? 'font-semibold text-charcoal' : 'font-medium',
          reveal
        )}
      >
        {text}
      </span>
    )
    const roundel =
      'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors'

    return (
      <div className="flex h-full flex-col py-4">
        <div className="flex items-center justify-between px-4 pb-5">
          <Link to={homePath} className="flex items-center gap-3 overflow-hidden" aria-label="K3Guard AI">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center">
              <img src="/logo.png" alt="" className="h-9 w-9 object-contain" />
            </span>
            <span className={cn('transition-all duration-200', reveal)}>
              <span className="block font-heading text-base font-extrabold leading-tight tracking-tight text-charcoal">
                K3Guard <span className="text-safety-orange">AI</span>
              </span>
              <span className="block whitespace-nowrap text-[11px] font-medium text-muted-gray">
                {isOfficer ? 'Panel petugas' : 'Portal mahasiswa'}
              </span>
            </span>
          </Link>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="cursor-pointer rounded-lg p-1.5 text-muted-gray hover:bg-charcoal/5"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden px-4" aria-label="Menu utama">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="group/link flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-blue"
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        roundel,
                        isActive
                          ? 'text-pure-white'
                          : 'bg-charcoal/[0.05] text-charcoal/70 group-hover/link:bg-charcoal/10 group-hover/link:text-charcoal'
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId={`rail-active-${isMobile ? 'm' : 'd'}`}
                          className="absolute inset-0 rounded-full bg-steel-blue shadow-[0_8px_18px_-8px_var(--color-steel-blue)]"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      )}
                      <Icon className="relative z-10 h-[18px] w-[18px]" />
                    </span>
                    <span className={isActive ? '' : 'text-muted-gray group-hover/link:text-charcoal'}>
                      {label(item.label, isActive)}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="space-y-1.5 border-t border-charcoal/10 px-4 pt-4">
          <Link to="/" className="group/link flex items-center gap-3 rounded-full" title="Kembali ke beranda">
            <span
              className={cn(
                roundel,
                'bg-charcoal/[0.05] text-charcoal/70 group-hover/link:bg-charcoal/10 group-hover/link:text-charcoal'
              )}
            >
              <Home className="h-[18px] w-[18px]" />
            </span>
            <span className="text-muted-gray group-hover/link:text-charcoal">{label('Beranda')}</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="group/link flex w-full cursor-pointer items-center gap-3 rounded-full text-left"
          >
            <span className={cn(roundel, 'bg-critical/10 text-critical group-hover/link:bg-critical/20')}>
              <LogOut className="h-[18px] w-[18px]" />
            </span>
            <span className="text-critical">{label('Keluar')}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-off-white">
      <div className="canvas-glow pointer-events-none fixed inset-0" aria-hidden="true" />

      {/* Rail desktop */}
      <aside className="group/rail fixed inset-y-0 left-0 z-40 hidden w-[76px] overflow-hidden border-r border-charcoal/10 bg-surface/85 backdrop-blur-xl transition-[width,box-shadow] duration-300 ease-out hover:w-60 hover:shadow-xl focus-within:w-60 focus-within:shadow-xl lg:block">
        {renderRail(false)}
      </aside>

      {/* Drawer HP */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              className="fixed inset-0 bg-night/55 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="relative z-10 h-full w-72 max-w-[85vw] border-r border-charcoal/10 bg-surface"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              {renderRail(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Kolom utama */}
      <div className="relative z-10 flex min-h-screen min-w-0 flex-col lg:pl-[76px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-off-white/70 px-4 backdrop-blur-md sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex cursor-pointer rounded-xl border border-charcoal/10 bg-surface p-2 text-charcoal hover:border-steel-blue/50 lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 truncate">
              <Breadcrumb items={breadcrumbs} />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-charcoal/10 bg-surface text-charcoal transition-colors hover:border-steel-blue/50 hover:text-steel-blue"
                aria-label="Notifikasi"
              >
                <Bell className="h-4 w-4" />
                {alerts.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-safety-orange ring-2 ring-surface" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-charcoal/10 bg-surface p-4 shadow-xl"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center justify-between border-b border-charcoal/10 pb-2.5">
                      <span className="ui-section">Notifikasi sistem</span>
                      {alerts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setAlerts([])}
                          className="cursor-pointer text-xs font-semibold text-steel-blue hover:underline"
                        >
                          Bersihkan
                        </button>
                      )}
                    </div>
                    <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-gray">Belum ada notifikasi baru.</p>
                      ) : (
                        alerts.map((a) => (
                          <div key={a.id} className="rounded-xl bg-charcoal/[0.04] p-2.5 text-xs">
                            <p className="font-medium text-charcoal">{a.message}</p>
                            <span className="mt-1 block text-[11px] text-muted-gray">{a.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                    {isOfficer && (
                      <Link
                        to="/dashboard/officer/events"
                        className="mt-3 block rounded-xl bg-steel-blue/10 py-2 text-center text-xs font-semibold text-steel-blue hover:bg-steel-blue/15"
                      >
                        Lihat semua kejadian
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-charcoal/10 bg-surface py-1.5 pl-1.5 pr-3 transition-colors hover:border-steel-blue/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-steel-blue text-[11px] font-bold text-pure-white">
                  {initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[130px] truncate text-xs font-semibold leading-tight text-charcoal">
                    {user?.nama || 'Pengguna'}
                  </span>
                  <span className="block text-[11px] leading-tight text-muted-gray">
                    {isOfficer ? 'Petugas K3' : 'Mahasiswa'}
                  </span>
                </span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-charcoal/10 bg-surface p-3 shadow-xl"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="border-b border-charcoal/10 pb-3">
                      <p className="truncate font-heading text-sm font-bold text-charcoal">{user?.nama}</p>
                      <p className="truncate text-xs text-muted-gray">{user?.email}</p>
                      <div className="mt-2">
                        <Badge variant={isOfficer ? 'info' : 'default'}>
                          {isOfficer ? 'Petugas K3' : 'Mahasiswa'}
                        </Badge>
                      </div>
                    </div>
                    <Link
                      to="/"
                      className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-charcoal hover:bg-steel-blue/8 hover:text-steel-blue"
                    >
                      <Home className="h-4 w-4" />
                      Kembali ke beranda
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-critical hover:bg-critical/8"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar dari akun
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-10 pt-2 sm:px-8">
          <motion.div
            key={location.pathname}
            className="mx-auto max-w-7xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
