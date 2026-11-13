import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Download,
  FileText,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  deleteSopDocument,
  downloadSopDocument,
  getSopDocuments,
  updateSopDocument,
  uploadSopDocument,
} from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import type { SOPDocument } from '@/types/api'
import { Table, type Column } from '@/components/ui/Table'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/common/Button'
import { formatDateTimeID, formatSopStatusLabel } from '@/utils/format'

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'indexed':
      return 'success'
    case 'processing':
      return 'info'
    case 'failed':
      return 'danger'
    default:
      return 'warning'
  }
}

export const SOPManagementPage: React.FC = () => {
  const [docs, setDocs] = useState<SOPDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [updateTarget, setUpdateTarget] = useState<SOPDocument | null>(null)  // null = unggah baru, terisi = perbarui dokumen ini
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [versi, setVersi] = useState('1.0')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [deleteTarget, setDeleteTarget] = useState<SOPDocument | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setFeedback({
        type: 'error',
        text: 'Pilih file PDF, DOCX, atau TXT terlebih dahulu.',
      })
      return
    }

    setIsUploading(true)
    setFeedback(null)
    try {
      if (updateTarget) {
        await updateSopDocument(updateTarget.id, selectedFile, versi.trim())
      } else {
        await uploadSopDocument(selectedFile, versi.trim() || '1.0')
      }
      setUploadOpen(false)
      setUpdateTarget(null)
      setSelectedFile(null)
      setVersi('1.0')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFeedback({
        type: 'success',
        text: updateTarget
          ? 'Dokumen SOP berhasil diperbarui.'
          : 'Dokumen SOP berhasil diunggah.',
      })
      await loadDocs()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(
          err,
          updateTarget
            ? 'Gagal memperbarui dokumen SOP.'
            : 'Gagal mengunggah dokumen SOP.'
        ),
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setFeedback(null)
    try {
      await deleteSopDocument(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback({
        type: 'success',
        text: 'Dokumen SOP berhasil dihapus.',
      })
      await loadDocs()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Gagal menghapus dokumen SOP.'),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async (doc: SOPDocument) => {
    try {
      await downloadSopDocument(doc.id, doc.nama_file)
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Gagal mengunduh file SOP.'),
      })
    }
  }

  const columns: Column<SOPDocument>[] = [
    {
      key: 'nama_file',
      header: 'Nama Dokumen',
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
      sortable: true,
      sortValue: (row) => row.versi,
      render: (row) => (
        <span className="font-mono text-xs font-medium text-charcoal">
          v{row.versi}
        </span>
      ),
    },
    {
      key: 'uploaded_by',
      header: 'Diunggah Oleh',
      render: (row) => (
        <span className="text-xs text-muted-gray">
          Petugas #{row.uploaded_by}
        </span>
      ),
    },
    {
      key: 'uploaded_at',
      header: 'Tanggal Unggah',
      sortable: true,
      sortValue: (row) => row.uploaded_at || '',
      render: (row) => (
        <span className="text-xs text-muted-gray">
          {formatDateTimeID(row.uploaded_at)}
        </span>
      ),
    },
    {
      key: 'status_index',
      header: 'Status Indeks',
      sortable: true,
      sortValue: (row) => row.status_index,
      render: (row) => (
        <Badge variant={getStatusVariant(row.status_index)}>
          {formatSopStatusLabel(row.status_index)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownload(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-charcoal/15 px-2.5 py-1 text-xs font-medium text-charcoal hover:bg-off-white cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh
          </button>
          <button
            type="button"
            onClick={() => {
              setUpdateTarget(row)
              setSelectedFile(null)
              setVersi('')
              setUploadOpen(true)
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-charcoal/15 px-2.5 py-1 text-xs font-medium text-charcoal hover:bg-off-white cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Perbarui
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-critical/25 px-2.5 py-1 text-xs font-medium text-critical hover:bg-critical/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ui-title">
            Manajemen Dokumen SOP
          </h1>
          <p className="text-sm text-muted-gray">
            Kelola dokumen SOP keselamatan kerja sebagai basis pengetahuan
            Asisten AI.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            setUpdateTarget(null)
            setSelectedFile(null)
            setVersi('1.0')
            setUploadOpen(true)
          }}
        >
          <Upload className="h-4 w-4" />
          Unggah Dokumen SOP
        </Button>
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
          emptyTitle="Belum ada dokumen SOP"
          emptyDescription="Unggah file SOP (PDF, DOCX, atau TXT) agar tersedia untuk mahasiswa dan Asisten AI."
        />
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false)
          setUpdateTarget(null)
        }}
        title={
          updateTarget
            ? `Perbarui ${updateTarget.nama_file}`
            : 'Unggah Dokumen SOP Baru'
        }
        description={
          updateTarget
            ? 'Isi dokumen diganti dengan file baru dan di-index ulang. Nama dokumen tetap.'
            : 'Format yang didukung: PDF, DOCX, dan TXT.'
        }
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-charcoal">
              Pilih File SOP
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-charcoal/15 bg-off-white/60 p-2.5 text-xs text-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-steel-blue file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-pure-white hover:file:bg-industrial-blue cursor-pointer"
            />
          </div>
          <Input
            label="Versi Dokumen"
            value={versi}
            onChange={(e) => setVersi(e.target.value)}
            placeholder={updateTarget ? 'Kosongkan untuk naik otomatis' : 'Contoh: 1.0'}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadOpen(false)
                setUpdateTarget(null)
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isUploading}
            >
              {isUploading
                ? 'Menyimpan...'
                : updateTarget
                  ? 'Simpan Perubahan'
                  : 'Unggah Dokumen'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Dokumen"
        description={`Apakah Anda yakin ingin menghapus dokumen "${deleteTarget?.nama_file}"?`}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-critical hover:bg-critical/90"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted-gray">
          File akan dihapus dari penyimpanan dan tidak lagi tersedia di portal
          mahasiswa.
        </p>
      </Modal>
    </div>
  )
}
