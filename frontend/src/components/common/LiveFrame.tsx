import React, { useEffect, useState } from 'react'
import { api } from '@/services/api'

interface LiveFrameProps {
  cameraId: number
  alt: string
  className?: string
}

/**
 * Video live: mengambil satu frame JPEG terbaru ~4x per detik lewat /api/frame/{id}.
 * Tanpa koneksi MJPEG yang panjang, jadi tidak tersangkut di proxy atau batas koneksi browser.
 */
export const LiveFrame: React.FC<LiveFrameProps> = ({
  cameraId,
  alt,
  className = '',
}) => {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let busy = false
    let current: string | null = null

    const tick = async () => {
      if (busy) return
      busy = true
      try {
        const res = await api.get<Blob>(`/frame/${cameraId}`, {
          responseType: 'blob',
          headers: { 'Cache-Control': 'no-store' },
        })
        if (cancelled) return
        const next = URL.createObjectURL(res.data)
        setSrc(next)
        if (current) URL.revokeObjectURL(current)
        current = next
      } catch {
        // 503 = kamera/model belum siap: coba lagi di putaran berikutnya
      } finally {
        busy = false
      }
    }

    tick()
    const timer = window.setInterval(tick, 250)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      if (current) URL.revokeObjectURL(current)
    }
  }, [cameraId])

  if (!src) {
    return (
      <p className="text-xs text-pure-white/70">Menunggu gambar dari kamera...</p>
    )
  }
  return <img src={src} alt={alt} className={className} />
}
