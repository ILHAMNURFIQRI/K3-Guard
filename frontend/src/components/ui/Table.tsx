import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { EmptyState } from './EmptyState'
import { LoadingSpinner } from './LoadingSpinner'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  sortValue?: (row: T) => string | number
  render: (row: T) => React.ReactNode
  className?: string
}

export interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string | number
  onRowClick?: (row: T) => void
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  page?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (nextPage: number) => void
  hasNextPage?: boolean
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data akan muncul secara otomatis setelah tersedia.',
  page,
  pageSize = 10,
  totalItems,
  onPageChange,
  hasNextPage,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return data
    const getVal = col.sortValue
    return [...data].sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, columns, sortKey, sortDir])

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !col.sortValue) return
    if (sortKey === col.key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-charcoal/10 bg-surface p-12">
        <LoadingSpinner label="Memuat data tabel..." />
      </div>
    )
  }

  if (sortedData.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  const showPagination = typeof page === 'number' && typeof onPageChange === 'function'
  const totalPages =
    typeof totalItems === 'number' && pageSize > 0
      ? Math.max(1, Math.ceil(totalItems / pageSize))
      : undefined

  return (
    <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 bg-off-white/80">
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 text-xs font-semibold text-muted-gray',
                      col.sortable && col.sortValue
                        ? 'cursor-pointer select-none hover:text-charcoal'
                        : '',
                      col.className
                    )}
                    onClick={() => handleSort(col)}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && col.sortValue && (
                        <span className="text-muted-gray/70">
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-steel-blue" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-steel-blue" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/8">
            {sortedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick
                    ? 'cursor-pointer hover:bg-steel-blue/[0.04]'
                    : 'hover:bg-off-white/50'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3.5 text-charcoal', col.className)}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-charcoal/10 bg-off-white/40 px-4 py-3 text-xs text-muted-gray">
          <span>
            Halaman <strong className="text-charcoal">{page}</strong>
            {totalPages ? ` dari ${totalPages}` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-charcoal/15 bg-surface px-3 py-1.5 font-medium text-charcoal hover:bg-off-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={
                totalPages ? page >= totalPages : hasNextPage === false
              }
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-charcoal/15 bg-surface px-3 py-1.5 font-medium text-charcoal hover:bg-off-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Berikutnya
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
