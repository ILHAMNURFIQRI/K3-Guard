import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Calendar, RefreshCw } from 'lucide-react'
import { getAreas, getEvents, getStats } from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import type { Area, EventItem, StatsResponse } from '@/types/api'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
  type ChartPoint,
} from '@/components/ui/Charts'
import { formatDateShortID, formatEventTypeLabel } from '@/utils/format'

export const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statsRes, eventsRes, areasRes] = await Promise.all([
        getStats(),
        getEvents({ page: 1, size: 100 }),
        getAreas(),
      ])
      setStats(statsRes)
      setEvents(eventsRes)
      setAreas(areasRes)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat statistik K3.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredEvents = useMemo(() => {
    if (!startDate && !endDate) return events
    return events.filter((ev) => {
      if (!ev.created_at) return false
      const d = new Date(ev.created_at)
      if (Number.isNaN(d.getTime())) return false
      if (startDate && d < new Date(`${startDate}T00:00:00`)) return false
      if (endDate && d > new Date(`${endDate}T23:59:59`)) return false
      return true
    })
  }, [events, startDate, endDate])

  const dailyData = useMemo<ChartPoint[]>(() => {
    const map = new Map<string, number>()
    ;[...filteredEvents].reverse().forEach((ev) => {
      const lbl = formatDateShortID(ev.created_at)
      map.set(lbl, (map.get(lbl) || 0) + 1)
    })
    return Array.from(map.entries()).map(([label, value]) => ({
      label,
      value,
    }))
  }, [filteredEvents])

  const byTypeData = useMemo<ChartPoint[]>(() => {
    if (!startDate && !endDate && stats?.events_by_type) {
      return Object.entries(stats.events_by_type).map(([type, value]) => ({
        label: formatEventTypeLabel(type),
        value,
      }))
    }
    const map = new Map<string, number>()
    filteredEvents.forEach((ev) => {
      const label = formatEventTypeLabel(ev.type)
      map.set(label, (map.get(label) || 0) + 1)
    })
    return Array.from(map.entries()).map(([label, value]) => ({
      label,
      value,
    }))
  }, [filteredEvents, startDate, endDate, stats])

  const byAreaData = useMemo<ChartPoint[]>(() => {
    const areaLookup = new Map<number, string>(areas.map((a) => [a.id, a.nama]))
    const map = new Map<string, number>()
    filteredEvents.forEach((ev) => {
      const label =
        (ev.area_id && areaLookup.get(ev.area_id)) || 'Area Tidak Diketahui'
      map.set(label, (map.get(label) || 0) + 1)
    })
    return Array.from(map.entries()).map(([label, value]) => ({
      label,
      value,
    }))
  }, [filteredEvents, areas])

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" label="Memuat data statistik..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-critical/25 bg-surface p-6 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-critical" />
        <p className="mt-2 text-sm text-charcoal">{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-steel-blue px-4 py-2 text-xs font-semibold text-pure-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Muat Ulang
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ui-title">
            Statistik &amp; Analitik K3
          </h1>
          <p className="text-sm text-muted-gray">
            Analisis tren pelanggaran harian, tipe APD, dan distribusi area.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-surface px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-off-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Segarkan
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-charcoal/10 bg-surface p-4">
          <span className="text-xs font-medium text-muted-gray">
            Total Kejadian
          </span>
          <p className="mt-1 ui-title">
            {stats?.total_events ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-surface p-4">
          <span className="text-xs font-medium text-muted-gray">
            Menunggu Verifikasi
          </span>
          <p className="mt-1 font-heading text-2xl font-bold text-warning">
            {stats?.pending_events ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-surface p-4">
          <span className="text-xs font-medium text-muted-gray">
            Terverifikasi Benar
          </span>
          <p className="mt-1 font-heading text-2xl font-bold text-critical">
            {stats?.verified_events ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-surface p-4">
          <span className="text-xs font-medium text-muted-gray">
            False Alarm
          </span>
          <p className="mt-1 font-heading text-2xl font-bold text-success">
            {stats?.dismissed_events ?? 0}
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="rounded-2xl border border-charcoal/10 bg-surface p-4 shadow-xs">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-gray">
          <Calendar className="h-3.5 w-3.5 text-steel-blue" />
          Filter Rentang Tanggal
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 items-end">
          <Input
            label="Tanggal Mulai"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Tanggal Akhir"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="h-[42px] rounded-xl border border-charcoal/15 px-4 text-xs font-semibold text-charcoal hover:bg-off-white cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <LineChartCard
            title="Pelanggaran Harian"
            subtitle="Jumlah kejadian berdasarkan tanggal"
            data={dailyData}
          />
        </div>
        <BarChartCard
          title="Pelanggaran Berdasarkan Jenis APD / Insiden"
          subtitle="Rekap kategori kejadian"
          data={byTypeData}
        />
        <PieChartCard
          title="Pelanggaran Berdasarkan Area"
          subtitle="Sebaran per laboratorium atau bengkel"
          data={byAreaData}
        />
      </div>
    </div>
  )
}
