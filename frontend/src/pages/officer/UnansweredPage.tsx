import React, { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react'
import { getUnansweredQuestions } from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import type { UnansweredItem } from '@/types/api'
import { Table, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatDateTimeID } from '@/utils/format'

export const UnansweredPage: React.FC = () => {
  const [items, setItems] = useState<UnansweredItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getUnansweredQuestions()
      setItems(res.items)
      setTotal(res.total)
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Gagal memuat daftar pertanyaan tak terjawab.')
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const columns: Column<UnansweredItem>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      sortValue: (row) => row.id,
      render: (row) => (
        <span className="font-mono text-xs text-muted-gray">#{row.id}</span>
      ),
    },
    {
      key: 'pertanyaan',
      header: 'Pertanyaan Pengguna',
      render: (row) => (
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-safety-orange" />
          <span className="font-medium text-charcoal">{row.pertanyaan}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Waktu',
      sortable: true,
      sortValue: (row) => row.created_at || '',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-muted-gray">
          {formatDateTimeID(row.created_at)}
        </span>
      ),
    },
    {
      key: 'session_id',
      header: 'Pengguna / Sesi',
      render: (row) => (
        <span className="font-mono text-xs text-muted-gray">
          {row.user_id
            ? `User #${row.user_id}`
            : row.session_id
            ? row.session_id.slice(0, 12)
            : 'Anonim'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Jawaban',
      render: () => <Badge variant="warning">Belum Terjawab</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ui-title">
            Pertanyaan Tak Terjawab
          </h1>
          <p className="text-sm text-muted-gray">
            Daftar pertanyaan di Asisten AI yang belum dapat dijawab otomatis
            ({total} total).
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

      {error ? (
        <div className="rounded-2xl border border-critical/25 bg-surface p-6 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-critical" />
          <p className="mt-2 text-sm text-charcoal">{error}</p>
        </div>
      ) : (
        <Table
          data={items}
          columns={columns}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="Tidak ada pertanyaan tak terjawab"
          emptyDescription="Semua pertanyaan pengguna berhasil ditangani atau belum ada pertanyaan masuk."
        />
      )}
    </div>
  )
}
