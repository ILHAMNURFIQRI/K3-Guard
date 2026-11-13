import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  HelpCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import {
  getAreas,
  getEvents,
  getMonitoringStatus,
  getStats,
} from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import type {
  Area,
  EventItem,
  MonitoringStatus,
  StatsResponse,
} from '@/types/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
  type ChartPoint,
} from '@/components/ui/Charts'
import { formatDateShortID, formatEventTypeLabel } from '@/utils/format'

export const OverviewPage: React.FC = () => {
  const [status, setStatus] = useState<MonitoringStatus | null>(null)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statusRes, statsRes, eventsRes, areasRes] = await Promise.all([
        getMonitoringStatus(),
        getStats(),
        getEvents({ page: 1, size: 100 }),
        getAreas(),
      ])
      setStatus(statusRes)
      setStats(statsRes)
      setEvents(eventsRes)
      setAreas(areasRes)
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Gagal memuat ringkasan dashboard petugas.')
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const dailyChartData = useMemo<ChartPoint[]>(() => {
    if (events.length === 0) return []
    const byDay = new Map<string, number>()
    const ordered = [...events].reverse()
    for (const ev of ordered) {
      const label = formatDateShortID(ev.created_at)
      byDay.set(label, (byDay.get(label) || 0) + 1)
    }
    return Array.from(byDay.entries()).map(([label, value]) => ({
      label,
      value,
    }))
  }, [events])

  const ppeChartData = useMemo<ChartPoint[]>(() => {
    if (!stats?.events_by_type) return []
    return Object.entries(stats.events_by_type).map(([type, value]) => ({
      label: formatEventTypeLabel(type),
      value,
    }))
  }, [stats])

  const areaChartData = useMemo<ChartPoint[]>(() => {
    if (events.length === 0) return []
    const areaMap = new Map<number, string>(areas.map((a) => [a.id, a.nama]))
    const counts = new Map<string, number>()
    for (const ev of events) {
      const name =
        (ev.area_id && areaMap.get(ev.area_id)) || 'Area Tidak Diketahui'
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    return Array.from(counts.entries()).map(([label, value]) => ({
      label,
      value,
    }))
  }, [events, areas])

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" label="Memuat ringkasan sistem K3..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-critical/25 bg-surface p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-critical" />
        <h2 className="mt-2 ui-section">
          Gagal Memuat Data
        </h2>
        <p className="mt-1 text-sm text-muted-gray">{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-steel-blue px-4 py-2 text-sm font-semibold text-pure-white hover:bg-industrial-blue cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
      </div>
    )
  }

  const cameraOnline = (status?.active_cameras ?? 0) > 0
  const modelReady = status?.yolo_model === 'ready'
  const fallAlerts =
    (stats?.events_by_type?.fall ?? 0) +
    (stats?.events_by_type?.fall_detected ?? 0)
  const nonCompliantCount = stats?.verified_events ?? 0
  const compliantCount = stats?.dismissed_events ?? 0
  const unverifiedCount = stats?.pending_events ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ui-title">
            Ringkasan Pemantauan K3
          </h1>
          <p className="text-sm text-muted-gray">
            Status sistem real-time, kepatuhan APD, dan rekap kejadian terkini.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-surface px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-off-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Segarkan Data
        </button>
      </div>

      {/* System & Metric Cards (8 cards per spec) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-gray">
              Status Kamera
            </span>
            <Camera className="h-4 w-4 text-steel-blue" />
          </div>
          <div className="mt-3">
            <StatusIndicator
              tone={cameraOnline ? 'success' : 'danger'}
              pulse={cameraOnline}
              label={
                cameraOnline
                  ? `ONLINE (${status?.active_cameras}/${status?.total_cameras})`
                  : 'OFFLINE'
              }
            />
          </div>
          <p className="mt-2 text-xs text-muted-gray">
            {status?.total_cameras ?? 0} kamera terdaftar di{' '}
            {stats?.total_areas ?? 0} area
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-gray">
              Status Model AI
            </span>
            <Cpu className="h-4 w-4 text-steel-blue" />
          </div>
          <div className="mt-3">
            <StatusIndicator
              tone={modelReady ? 'success' : 'warning'}
              label={modelReady ? 'READY' : 'NOT CONFIGURED'}
            />
          </div>
          <p className="mt-2 text-xs text-muted-gray">
            {modelReady
              ? 'Model YOLO siap melakukan inferensi'
              : 'Model YOLO belum dikonfigurasi pada backend'}
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-gray">
              Total Kejadian Terdeteksi
            </span>
            <Activity className="h-4 w-4 text-steel-blue" />
          </div>
          <p className="mt-3 font-heading text-3xl font-extrabold text-charcoal">
            {stats?.total_events ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-gray">
            {stats?.events_today ?? 0} kejadian tercatat hari ini
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-gray">
              Patuh / False Alarm
            </span>
            <ShieldCheck className="h-4 w-4 text-success" />
          </div>
          <p className="mt-3 font-heading text-3xl font-extrabold text-success">
            {compliantCount}
          </p>
          <p className="mt-1 text-xs text-muted-gray">
            Kejadian dinyatakan patuh / false alarm
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-gray">
              Pelanggaran Terverifikasi
            </span>
            <ShieldAlert className="h-4 w-4 text-critical" />
          </div>
          <p className="mt-3 font-heading text-3xl font-extrabold text-critical">
            {nonCompliantCount}
          </p>
          <p className="mt-1 text-xs text-muted-gray">
            Dikonfirmasi benar sebagai pelanggaran K3
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-gray">
              Belum Diverifikasi
            </span>
            <HelpCircle className="h-4 w-4 text-muted-gray" />
          </div>
          <p className="mt-3 font-heading text-3xl font-extrabold text-charcoal">
            {unverifiedCount}
          </p>
          <p className="mt-1 text-xs text-muted-gray">
            Status unverified / belum ditinjau
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-gray">
              Antrean Verifikasi
            </span>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <p className="mt-3 font-heading text-3xl font-extrabold text-warning">
            {stats?.pending_events ?? 0}
          </p>
          <Link
            to="/dashboard/officer/events"
            className="mt-1 inline-block text-xs font-semibold text-steel-blue hover:underline"
          >
            Tinjau laporan kejadian →
          </Link>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-gray">
              Peringatan Jatuh
            </span>
            <CheckCircle2 className="h-4 w-4 text-safety-orange" />
          </div>
          <p className="mt-3 font-heading text-3xl font-extrabold text-safety-orange">
            {fallAlerts}
          </p>
          <p className="mt-1 text-xs text-muted-gray">
            Total insiden deteksi jatuh tercatat
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <LineChartCard
            title="Tren Pelanggaran & Kejadian Harian"
            subtitle="Rekap kejadian berdasarkan data aktual dari server"
            data={dailyChartData}
            emptyMessage="Belum ada kejadian tercatat. Grafik akan terisi otomatis saat deteksi atau laporan masuk."
          />
        </div>
        <BarChartCard
          title="Kejadian Berdasarkan Jenis Pelanggaran"
          subtitle="Distribusi tipe pelanggaran APD & insiden jatuh"
          data={ppeChartData}
          emptyMessage="Belum ada pelanggaran APD atau insiden yang tercatat."
        />
        <PieChartCard
          title="Distribusi Kejadian Per Area"
          subtitle="Proporsi kejadian pada masing-masing laboratorium/bengkel"
          data={areaChartData}
          emptyMessage="Belum ada kejadian per area yang tercatat."
        />
      </div>
    </div>
  )
}
