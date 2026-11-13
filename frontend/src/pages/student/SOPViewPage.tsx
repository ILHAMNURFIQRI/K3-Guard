import React, { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Download, FileText, RefreshCw } from 'lucide-react'
import { downloadSopDocument, getSopDocuments } from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import type { SOPDocument } from '@/types/api'
import { Table, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatDateTimeID } from '@/utils/format'

export const SOPViewPage: React.FC = () => {
  const [docs, setDocs] = useState<SOPDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const loadDocs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await getSopDocuments()
      setDocs(list)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat daftar dokumen SOP.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  const handleDownload = async (doc: SOPDocument) => {
    setDownloadError(null)
    try {
      await downloadSopDocument(doc.id, doc.nama_file)
    } catch (err) {
      setDownloadError(
        getApiErrorMessage(err, `Gagal mengunduh "${doc.nama_file}".`)
      )
    }
  }

  const columns: Column<SOPDocument>[] = [
    {
      key: 'nama_file',
      header: 'Nama Dokumen SOP',
      sortable: true,
      sortValue: (row) => row.nama_file,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 shrink-0 text-steel-blue" />
          <span className="font-semibold text-charcoal">{row.nama_file}</span>
        </div>
      ),
    },
    {
      key: 'versi',
      header: 'Versi',
      render: (row) => (
        <Badge variant="default">v{row.versi}</Badge>
      ),
    },
    {
      key: 'uploaded_at',
      header: 'Tanggal Terbit',
      sortable: true,
      sortValue: (row) => row.uploaded_at || '',
      render: (row) => (
        <span className="text-xs text-muted-gray">
          {formatDateTimeID(row.uploaded_at)}
        </span>
      ),
    },
    {
      key: 'download',
      header: 'Unduhan',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleDownload(row)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-steel-blue px-3 py-1.5 text-xs font-semibold text-pure-white hover:bg-industrial-blue transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Unduh File
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ui-title">
            Dokumen SOP Keselamatan
          </h1>
          <p className="text-sm text-muted-gray">
            Akses baca dan unduh dokumen Standar Operasional Prosedur K3 resmi.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDocs}
          className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-surface px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-off-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Segarkan
        </button>
      </div>

      {downloadError && (
        <div className="rounded-xl border border-critical/25 bg-critical/10 px-4 py-3 text-xs font-medium text-critical">
          {downloadError}
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-critical/25 bg-surface p-6 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-critical" />
          <p className="mt-2 text-sm text-charcoal">{error}</p>
        </div>
      ) : (
        <Table
          data={docs}
          columns={columns}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="Belum ada dokumen SOP tersedia"
          emptyDescription="Petugas K3 belum mengunggah dokumen SOP ke sistem."
        />
      )}
    </div>
  )
}
