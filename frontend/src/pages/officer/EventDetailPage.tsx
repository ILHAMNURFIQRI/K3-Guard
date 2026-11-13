import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ImageOff,
  Save,
  XCircle,
} from 'lucide-react'
import {
  addEventNote,
  getAreas,
  getEventDetail,
  verifyEvent,
} from '@/services/dashboard'
import { API_BASE_URL, getApiErrorMessage } from '@/services/api'
import { getStoredToken } from '@/services/auth'
import type { Area, EventDetail } from '@/types/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  formatDateTimeID,
  formatEventTypeLabel,
  formatVerificationLabel,
} from '@/utils/format'

function resolveMediaUrl(filePath: string): string {
  if (!filePath) return ''
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }
  const host = API_BASE_URL.replace(/\/api\/?$/, '')
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const baseUrl = normalized.startsWith('storage/')
    ? `${host}/${normalized}`
    : `${host}/storage/${normalized}`
  const token = getStoredToken()
  if (!token) return baseUrl
  const sep = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${sep}token=${encodeURIComponent(token)}`
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const eventId = Number(id)

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    if (!eventId || Number.isNaN(eventId)) {
      setError('ID kejadian tidak valid.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const [detailRes, areasRes] = await Promise.all([
        getEventDetail(eventId),
        getAreas(),
      ])
      setEvent(detailRes)
      setNote(detailRes.follow_up_note || '')
      setAreas(areasRes)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat detail kejadian.'))
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const handleVerify = async (status: 'verified' | 'dismissed') => {
    if (!event) return
    setIsSaving(true)
    setFeedback(null)
    try {
      const updated = await verifyEvent(event.id, status)
      setEvent(updated)
      setFeedback({
        type: 'success',
        text:
          status === 'verified'
            ? 'Kejadian berhasil diverifikasi sebagai pelanggaran benar.'
            : 'Kejadian ditandai sebagai False Alarm.',
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Gagal memperbarui status verifikasi.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setIsSaving(true)
    setFeedback(null)
    try {
      const updated = await addEventNote(event.id, note)
      setEvent(updated)
      setFeedback({
        type: 'success',
        text: 'Catatan tindak lanjut berhasil disimpan.',
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Gagal menyimpan catatan tindak lanjut.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" label="Memuat detail kejadian..." />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard/officer/events"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-steel-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Laporan Kejadian
        </Link>
        <div className="rounded-2xl border border-critical/25 bg-surface p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-critical" />
          <p className="mt-2 text-sm text-charcoal">
            {error || 'Data kejadian tidak ditemukan.'}
          </p>
        </div>
      </div>
    )
  }

  const areaName =
    areas.find((a) => a.id === event.area_id)?.nama ||
    (event.area_id ? `Area #${event.area_id}` : '-')

  const primaryMedia = event.media?.[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/dashboard/officer/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-steel-blue hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Daftar Kejadian
          </Link>
          <h1 className="mt-1 ui-title">
            Detail Kejadian #{event.id}
          </h1>
        </div>

        <Badge
          variant={
            event.verification === 'verified'
              ? 'danger'
              : event.verification === 'dismissed'
              ? 'neutral'
              : 'warning'
          }
          className="px-3 py-1 text-xs"
        >
          Status: {formatVerificationLabel(event.verification)}
        </Badge>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === 'success'
              ? 'border-success/25 bg-success/10 text-success'
              : 'border-critical/25 bg-critical/10 text-critical'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Snapshot / Evidence Viewer */}
        <div className="lg:col-span-3 rounded-2xl border border-charcoal/10 bg-surface p-4 shadow-xs">
          <h2 className="mb-3 ui-section">
            Bukti Gambar / Snapshot Deteksi
          </h2>
          {primaryMedia ? (
            <div className="relative overflow-hidden rounded-xl border border-charcoal/10 bg-night">
              <img
                src={resolveMediaUrl(primaryMedia.file_path)}
                alt={`Bukti kejadian #${event.id}`}
                className="w-full max-h-[420px] object-contain"
              />
              <span className="absolute left-3 top-3 rounded-lg bg-charcoal/80 px-2.5 py-1 text-[11px] font-semibold text-pure-white backdrop-blur-xs">
                {formatEventTypeLabel(event.type)} ·{' '}
                {(event.confidence * 100).toFixed(1)}%
              </span>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-charcoal/15 bg-off-white p-8 text-center">
              <ImageOff className="h-8 w-8 text-muted-gray" />
              <p className="mt-2 text-sm font-semibold text-charcoal">
                Snapshot Gambar Tidak Tersedia
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-gray">
                Kejadian ini belum memiliki file media/bounding-box tersimpan di
                penyimpanan server.
              </p>
            </div>
          )}
        </div>

        {/* Metadata + Verification Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
            <h2 className="mb-4 ui-section">
              Informasi Kejadian
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-charcoal/8 pb-2">
                <dt className="text-muted-gray">Waktu Deteksi</dt>
                <dd className="font-medium text-charcoal text-right">
                  {formatDateTimeID(event.created_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-charcoal/8 pb-2">
                <dt className="text-muted-gray">Jenis Kejadian</dt>
                <dd className="font-semibold text-charcoal text-right">
                  {formatEventTypeLabel(event.type)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-charcoal/8 pb-2">
                <dt className="text-muted-gray">Area</dt>
                <dd className="font-medium text-charcoal text-right">
                  {areaName}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-charcoal/8 pb-2">
                <dt className="text-muted-gray">Kamera</dt>
                <dd className="font-medium text-charcoal text-right">
                  {event.camera_id ? `Kamera #${event.camera_id}` : '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-charcoal/8 pb-2">
                <dt className="text-muted-gray">Track ID</dt>
                <dd className="font-mono text-xs font-semibold text-charcoal text-right">
                  {event.track_id || '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-charcoal/8 pb-2">
                <dt className="text-muted-gray">Skor Confidence</dt>
                <dd className="font-mono font-semibold text-steel-blue text-right">
                  {(event.confidence * 100).toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-muted-gray mb-1">Temuan / Rincian</dt>
                <dd className="rounded-xl bg-off-white p-3 text-xs text-charcoal">
                  {event.detail || 'Tidak ada catatan rincian temuan.'}
                </dd>
              </div>
              {event.verified_at && (
                <div className="flex justify-between gap-4 pt-1 text-xs text-muted-gray">
                  <dt>Diverifikasi pada</dt>
                  <dd>{formatDateTimeID(event.verified_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs space-y-4">
            <h2 className="ui-section">
              Verifikasi Petugas K3
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={() => handleVerify('verified')}
                className="bg-critical hover:bg-critical/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Benar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => handleVerify('dismissed')}
              >
                <XCircle className="h-4 w-4" />
                False Alarm
              </Button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3 pt-2 border-t border-charcoal/10">
              <label
                htmlFor="follow-up-note"
                className="block text-xs font-semibold text-charcoal"
              >
                Catatan Tindak Lanjut
              </label>
              <textarea
                id="follow-up-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tuliskan tindakan korektif atau keterangan verifikasi..."
                className="w-full rounded-xl border border-charcoal/15 bg-off-white/60 p-3 text-xs text-charcoal placeholder:text-muted-gray focus:border-steel-blue focus:bg-surface focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                className="w-full"
              >
                <Save className="h-3.5 w-3.5" />
                Simpan Catatan
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
