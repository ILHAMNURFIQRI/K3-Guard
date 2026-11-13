import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, Filter, RefreshCw } from 'lucide-react'
import { getAreas, getEvents } from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import type { Area, EventItem } from '@/types/api'
import { Table, type Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import {
  formatDateTimeID,
  formatEventTypeLabel,
  formatVerificationLabel,
} from '@/utils/format'

const PAGE_SIZE = 15

export const EventsPage: React.FC = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventItem[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [filterType, setFilterType] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterVerification, setFilterVerification] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [eventsRes, areasRes] = await Promise.all([
        getEvents({
          page,
          size: PAGE_SIZE,
          type: filterType || undefined,
          verification: filterVerification || undefined,
          area_id: filterArea ? Number(filterArea) : undefined,
        }),
        getAreas(),
      ])
      setEvents(eventsRes)
      setAreas(areasRes)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat daftar laporan kejadian.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, filterType, filterVerification, filterArea])

  useEffect(() => {
    loadData()
  }, [loadData])

  const areaLookup = useMemo(() => {
    const map = new Map<number, string>()
    areas.forEach((a) => map.set(a.id, a.nama))
    return map
  }, [areas])

  const filteredEvents = useMemo(() => {
    if (!startDate && !endDate) return events
    return events.filter((ev) => {
      if (!ev.created_at) return false
      const d = new Date(ev.created_at)
      if (Number.isNaN(d.getTime())) return false
      if (startDate) {
        const s = new Date(`${startDate}T00:00:00`)
        if (d < s) return false
      }
      if (endDate) {
        const e = new Date(`${endDate}T23:59:59`)
        if (d > e) return false
      }
      return true
    })
  }, [events, startDate, endDate])

  const columns: Column<EventItem>[] = [
    {
      key: 'created_at',
      header: 'Waktu',
      sortable: true,
      sortValue: (row) => row.created_at || '',
      render: (row) => (
        <span className="whitespace-nowrap text-xs font-medium text-charcoal">
          {formatDateTimeID(row.created_at)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Jenis',
      sortable: true,
      sortValue: (row) => row.type,
      render: (row) => (
        <span className="font-semibold text-charcoal">
          {formatEventTypeLabel(row.type)}
        </span>
      ),
    },
    {
      key: 'area_id',
      header: 'Area',
      render: (row) =>
        (row.area_id && areaLookup.get(row.area_id)) ||
        (row.area_id ? `Area #${row.area_id}` : '-'),
    },
    {
      key: 'camera_id',
      header: 'Kamera',
      render: (row) => (row.camera_id ? `Kamera #${row.camera_id}` : '-'),
    },
    {
      key: 'detail',
      header: 'Temuan',
      render: (row) => (
        <span className="line-clamp-1 max-w-[220px] text-xs text-muted-gray">
          {row.detail || '-'}
        </span>
      ),
    },
    {
      key: 'confidence',
      header: 'Confidence',
      sortable: true,
      sortValue: (row) => row.confidence,
      render: (row) => (
        <span className="font-mono text-xs font-semibold">
          {(row.confidence * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'verification',
      header: 'Verifikasi',
      sortable: true,
      sortValue: (row) => row.verification,
      render: (row) => {
        const variant: BadgeVariant =
          row.verification === 'verified'
            ? 'danger'
            : row.verification === 'dismissed'
            ? 'neutral'
            : 'warning'
        return (
          <Badge variant={variant}>
            {formatVerificationLabel(row.verification)}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/dashboard/officer/events/${row.id}`)
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-steel-blue/25 bg-steel-blue/8 px-2.5 py-1 text-xs font-semibold text-steel-blue hover:bg-steel-blue hover:text-pure-white transition-colors cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          Detail
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ui-title">
            Laporan Kejadian K3
          </h1>
          <p className="text-sm text-muted-gray">
            Daftar deteksi pelanggaran APD dan insiden jatuh yang memerlukan
            verifikasi petugas.
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

      {/* Filters */}
      <div className="rounded-2xl border border-charcoal/10 bg-surface p-4 shadow-xs">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-gray">
          <Filter className="h-3.5 w-3.5 text-steel-blue" />
          Filter Kejadian
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Dari Tanggal"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Sampai Tanggal"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Select
            label="Jenis Kejadian"
            value={filterType}
            onChange={(e) => {
              setPage(1)
              setFilterType(e.target.value)
            }}
            placeholder="Semua Jenis"
            options={[
              { value: 'ppe_violation', label: 'Pelanggaran APD' },
              { value: 'fall_detected', label: 'Insiden Jatuh (fall_detected)' },
              { value: 'fall', label: 'Insiden Jatuh (fall)' },
            ]}
          />
          <Select
            label="Area"
            value={filterArea}
            onChange={(e) => {
              setPage(1)
              setFilterArea(e.target.value)
            }}
            placeholder="Semua Area"
            options={areas.map((a) => ({
              value: String(a.id),
              label: a.nama,
            }))}
          />
          <Select
            label="Status Verifikasi"
            value={filterVerification}
            onChange={(e) => {
              setPage(1)
              setFilterVerification(e.target.value)
            }}
            placeholder="Semua Status"
            options={[
              { value: 'pending', label: 'Menunggu Verifikasi' },
              { value: 'verified', label: 'Benar (Terverifikasi)' },
              { value: 'dismissed', label: 'False Alarm' },
            ]}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-critical/25 bg-surface p-6 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-critical" />
          <p className="mt-2 text-sm text-charcoal">{error}</p>
        </div>
      ) : (
        <Table
          data={filteredEvents}
          columns={columns}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/dashboard/officer/events/${row.id}`)}
          isLoading={isLoading}
          emptyTitle="Tidak ada laporan kejadian"
          emptyDescription="Belum ada pelanggaran APD atau insiden yang sesuai dengan filter saat ini."
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          hasNextPage={events.length === PAGE_SIZE}
        />
      )}
    </div>
  )
}
