import React, { useEffect, useRef } from 'react'
import { ArrowUp, BookOpen } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** true saat menunggu jawaban: pengguna tetap bisa mengetik, tombol kirim dikunci. */
  disabled?: boolean
  autoFocus?: boolean
  /** isi baris bawah di sisi kiri (mis. tombol sesi baru). */
  footer?: React.ReactNode
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  autoFocus = false,
  footer,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  const canSend = value.trim().length > 0 && !disabled

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`
  }, [value])

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  const submit = () => {
    if (canSend) onSubmit()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className={cn(
        'rounded-[28px] bg-gradient-to-b from-steel-blue/45 to-charcoal/5 p-px transition-colors',
        'shadow-[0_24px_70px_-34px_rgb(36_84_106/0.55)] dark:shadow-[0_24px_80px_-30px_rgb(27_125_150/0.75)]',
        'focus-within:from-safety-orange/70'
      )}
    >
      <div className="rounded-[27px] bg-surface">
        <p className="flex items-center gap-2 px-5 pt-3.5 text-xs font-medium text-muted-gray">
          <BookOpen className="h-3.5 w-3.5 text-steel-blue" />
          Jawaban diambil dari dokumen SOP yang diunggah petugas K3
        </p>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Tanyakan soal APD, mesin, atau prosedur darurat"
          aria-label="Pertanyaan untuk Asisten K3"
          className="block max-h-40 min-h-[52px] w-full resize-none bg-transparent px-5 pb-1 pt-2.5 text-[15px] leading-6 text-charcoal outline-none placeholder:text-muted-gray/80"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          <div className="flex min-w-0 items-center gap-2">{footer}</div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-muted-gray sm:block">
              Enter kirim, Shift+Enter baris baru
            </span>
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Kirim pertanyaan"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-safety-orange text-night shadow-sm transition-all hover:scale-105 hover:shadow-[0_10px_22px_-10px_rgba(242,140,40,0.95)] active:scale-95 disabled:cursor-not-allowed disabled:bg-charcoal/10 disabled:text-muted-gray disabled:shadow-none disabled:hover:scale-100"
            >
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
