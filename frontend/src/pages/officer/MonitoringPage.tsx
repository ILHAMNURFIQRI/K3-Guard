import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CameraOff,
  Play,
  RefreshCw,
  Square,
  Users,
  Video,
} from 'lucide-react'
import {
  getEvents,
  getMonitoringStatus,
  startCameraStream,
  stopCameraStream,
} from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import { LiveFrame } from '@/components/common/LiveFrame'
import type {
  EventItem,
  MonitoringStatus,
  PersonTrackStatus,
} from '@/types/api'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { Badge } from '@/components/ui/Badge'
import { PersonStatusList } from '@/components/common/PersonStatusList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTimeID, formatEventTypeLabel } from '@/utils/format'

export const MonitoringPage: React.FC = () => {
  const [status, setStatus] = useState<MonitoringStatus | null>(null)
  const [recentEvents, setRecentEvents] = useState<EventItem[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null)
  const [streamFeedback, setStreamFeedback] = useState<string | null>(null)
  const [streamError, setStreamError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMonitoring = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setStreamError(false)
    try {
      const [statusRes, eventsRes] = await Promise.all([
        getMonitoringStatus(),
        getEvents({ page: 1, size: 6 }),
      ])
      setStatus(statusRes)
      setRecentEvents(eventsRes)
      if (statusRes.cameras.length > 0 && selectedCameraId === null) {
        setSelectedCameraId(statusRes.cameras[0].id)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat status monitoring live.'))
    } finally {
      setIsLoading(false)
    }
  }, [selectedCameraId])

  useEffect(() => {
    loadMonitoring()
  }, [loadMonitoring])

  // status person & kejadian diperbarui otomatis tiap 3 detik, tanpa spinner
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const [statusRes, eventsRes] = await Promise.all([
          getMonitoringStatus(),
          getEvents({ page: 1, size: 6 }),
        ])
        setStatus(statusRes)
        setRecentEvents(eventsRes)
      } catch {
        // gangguan sesaat: tampilan terakhir dipertahankan
      }
    }, 3000)
    return () => window.clearInterval(timer)
  }, [])

  const handleStartStream = async (cameraId: number) => {
    setStreamFeedback(null)
    setStreamError(false)
    try {
      const res = await startCameraStream(cameraId)
      setStreamFeedback(
        res.detail || `Status streaming kamera #${cameraId}: ${res.status}`
      )
      await loadMonitoring()
    } catch (err) {
      setStreamFeedback(
        getApiErrorMessage(err, 'Gagal memulai stream kamera.')
      )
    }
  }

  const handleStopStream = async (cameraId: number) => {
    setStreamFeedback(null)
    try {
      const res = await stopCameraStream(cameraId)
      setStreamFeedback(`Streaming kamera #${cameraId}: ${res.status}`)
      await loadMonitoring()
    } catch (err) {
      setStreamFeedback(
        getApiErrorMessage(err, 'Gagal menghentikan stream kamera.')
      )
    }
  }

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" label="Memuat status kamera & model AI..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-critical/25 bg-surface p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-critical" />
        <p className="mt-2 text-sm text-charcoal">{error}</p>
        <button
          type="button"
          onClick={loadMonitoring}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-steel-blue px-4 py-2 text-xs font-semibold text-pure-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Muat Ulang
        </button>
      </div>
    )
  }

  const cameras = status?.cameras ?? []
  const activeCamera =
    cameras.find((c) => c.id === selectedCameraId) ?? cameras[0]
  const isCameraOnline = Boolean(activeCamera?.aktif)
  const isModelReady = status?.yolo_model === 'ready'

  const personStatuses: PersonTrackStatus[] = status?.person_statuses ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ui-title">
            Monitoring Kamera Live
          </h1>
          <p className="text-sm text-muted-gray">
            Pemantauan video real-time untuk kepatuhan APD dan deteksi insiden
            jatuh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-charcoal/10 bg-surface px-4 py-2.5">
          <StatusIndicator
            tone={isCameraOnline ? 'success' : 'danger'}
            pulse={isCameraOnline}
            label={isCameraOnline ? 'CAMERA ONLINE' : 'CAMERA OFFLINE'}
          />
          <span className="h-4 w-px bg-charcoal/15" />
          <StatusIndicator
            tone={isModelReady ? 'success' : 'warning'}
            label={isModelReady ? 'MODEL READY' : 'MODEL NOT CONFIGURED'}
          />
          <button
            type="button"
            onClick={loadMonitoring}
            className="ml-1 rounded-lg p-1 text-muted-gray hover:bg-off-white hover:text-charcoal cursor-pointer"
            title="Segarkan status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {streamFeedback && (
        <div className="rounded-xl border border-steel-blue/25 bg-steel-blue/8 px-4 py-3 text-xs font-medium text-steel-blue">
          {streamFeedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Feed Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-charcoal/15 bg-night text-pure-white shadow-sm">
            <div className="flex items-center justify-between border-b border-pure-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Video className="h-4 w-4 text-safety-orange" />
                <span>
                  {activeCamera
                    ? `${activeCamera.nama} (${
                        activeCamera.source || 'Sumber belum diatur'
                      })`
                    : 'Belum Ada Kamera Terdaftar'}
                </span>
              </div>
              {activeCamera && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartStream(activeCamera.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-success/90 px-2.5 py-1 text-[11px] font-semibold text-pure-white hover:bg-success cursor-pointer"
                  >
                    <Play className="h-3 w-3" />
                    Mulai
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStopStream(activeCamera.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-critical/90 px-2.5 py-1 text-[11px] font-semibold text-pure-white hover:bg-critical cursor-pointer"
                  >
                    <Square className="h-3 w-3" />
                    Hentikan
                  </button>
                </div>
              )}
            </div>

            <div className="flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-night to-[#151c20] p-6 text-center">
              {isCameraOnline && isModelReady && activeCamera ? (
                <LiveFrame
                  cameraId={activeCamera.id}
                  alt={`Live stream ${activeCamera.nama}`}
                  className="h-full w-full rounded-lg object-contain"
                />
              ) : (
                <div className="max-w-md space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pure-white/8 text-safety-orange">
                    <CameraOff className="h-7 w-7" />
                  </div>
                  <p className="font-heading text-lg font-bold tracking-wide text-pure-white">
                    {isCameraOnline && isModelReady && streamError
                      ? 'STREAM TIDAK TERSEDIA'
                      : 'CAMERA OFFLINE'}
                  </p>
                  <p className="text-xs leading-relaxed text-pure-white/70">
                    {!activeCamera
                      ? 'Belum ada kamera yang dikonfigurasi pada database sistem. Tambahkan sumber kamera melalui pengaturan atau backend.'
                      : !isModelReady
                      ? 'Kamera belum aktif dan model YOLO belum dikonfigurasi pada backend (YOLO_MODEL_PATH kosong).'
                      : streamError
                      ? 'Kamera aktif namun feed MJPEG tidak dapat diakses saat ini. Periksa koneksi CV worker / sumber kamera.'
                      : 'Kamera sedang dalam status offline. Pastikan sumber RTSP/webcam terhubung dan klik tombol Mulai.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {cameras.length > 0 && (
            <div className="rounded-2xl border border-charcoal/10 bg-surface p-4">
              <h2 className="ui-section mb-3">
                Daftar Kamera Terdaftar
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {cameras.map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      setSelectedCameraId(cam.id)
                      setStreamError(false)
                    }}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-all cursor-pointer ${
                      activeCamera?.id === cam.id
                        ? 'border-steel-blue bg-steel-blue/5'
                        : 'border-charcoal/10 hover:bg-off-white'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-charcoal">{cam.nama}</p>
                      <p className="text-muted-gray mt-0.5">
                        {cam.source || 'Belum ada URL/indeks'}
                      </p>
                    </div>
                    <Badge variant={cam.aktif ? 'success' : 'neutral'}>
                      {cam.aktif ? 'Aktif' : 'Offline'}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Person Status + Recent Notifications */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-charcoal/10 bg-surface p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="ui-section flex items-center gap-2">
                <Users className="h-4 w-4 text-steel-blue" />
                Status Personel di Frame
              </h2>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge variant="success">COMPLIANT</Badge>
              <Badge variant="danger">NON_COMPLIANT</Badge>
              <Badge variant="neutral">UNVERIFIED</Badge>
            </div>

            {personStatuses.length === 0 ? (
              <EmptyState
                title="Tidak ada deteksi aktif"
                description="Status kepatuhan individu (COMPLIANT / NON_COMPLIANT / UNVERIFIED) akan muncul saat stream kamera berjalan."
                className="py-6"
              />
            ) : (
              <PersonStatusList persons={personStatuses} />
            )}
          </div>

          <div className="rounded-2xl border border-charcoal/10 bg-surface p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="ui-section">
                Notifikasi Kejadian Terbaru
              </h2>
              <Link
                to="/dashboard/officer/events"
                className="text-xs font-semibold text-steel-blue hover:underline"
              >
                Semua →
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-gray">
                Belum ada kejadian pelanggaran atau insiden yang tercatat.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/dashboard/officer/events/${ev.id}`}
                    className="block rounded-xl border border-charcoal/10 p-3 hover:border-steel-blue/40 hover:bg-off-white/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-charcoal">
                        {formatEventTypeLabel(ev.type)}
                      </span>
                      <Badge
                        variant={
                          ev.verification === 'verified'
                            ? 'danger'
                            : ev.verification === 'dismissed'
                            ? 'neutral'
                            : 'warning'
                        }
                      >
                        {ev.verification}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-gray">
                      {ev.detail || 'Tidak ada rincian'}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-gray">
                      {formatDateTimeID(ev.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
