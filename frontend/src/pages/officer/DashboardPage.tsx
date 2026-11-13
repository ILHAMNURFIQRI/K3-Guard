import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BarChart3, Video } from 'lucide-react'
import { MonitoringPage } from '@/pages/officer/MonitoringPage'
import { StatsPage } from '@/pages/officer/StatsPage'
import { Tabs } from '@/components/ui/Tabs'
import { getStats } from '@/services/dashboard'
import type { StatsResponse } from '@/types/api'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'live', label: 'Live monitoring', icon: <Video className="h-4 w-4" /> },
  { id: 'stats', label: 'Statistik', icon: <BarChart3 className="h-4 w-4" /> },
]

export const DashboardPage: React.FC = () => {
  const [params, setParams] = useSearchParams()
  const active = params.get('tab') === 'stats' ? 'stats' : 'live'
  const [stats, setStats] = useState<StatsResponse | null>(null)

  // Hal yang paling perlu dilihat petugas: kejadian yang belum diverifikasi.
  useEffect(() => {
    let on = true
    const load = () =>
      getStats()
        .then((s) => on && setStats(s))
        .catch(() => undefined)
    load()
    const t = window.setInterval(load, 15000)
    return () => {
      on = false
      window.clearInterval(t)
    }
  }, [])

  const pending = stats?.pending_events ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={TABS}
          activeTab={active}
          onChange={(id) => setParams(id === 'live' ? {} : { tab: id }, { replace: true })}
        />

        {stats && (
          <Link
            to="/dashboard/officer/events"
            className={cn(
              'group inline-flex h-11 items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-colors',
              pending > 0
                ? 'border-safety-orange/50 bg-safety-orange/10 text-charcoal hover:bg-safety-orange/15'
                : 'border-charcoal/10 bg-surface text-muted-gray hover:border-steel-blue/50'
            )}
          >
            <span className="relative flex h-2.5 w-2.5">
              {pending > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safety-orange opacity-60" />
              )}
              <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', pending > 0 ? 'bg-safety-orange' : 'bg-success')} />
            </span>
            {pending > 0 ? `${pending} kejadian menunggu verifikasi` : 'Semua kejadian sudah ditinjau'}
            <span className="hidden text-xs font-medium text-muted-gray sm:inline">Hari ini {stats.events_today}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {active === 'live' ? <MonitoringPage /> : <StatsPage />}
    </div>
  )
}
