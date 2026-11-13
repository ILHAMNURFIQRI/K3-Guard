import React, { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import type { PersonTrackStatus } from '@/types/api'

const PPE_ROWS = [
  ['head', 'Helm'],
  ['body', 'Coverall'],
  ['legs', 'Jeans'],
  ['feet', 'Sepatu safety'],
] as const

const ATTR_STATUS: Record<
  'OK' | 'VIOLATION' | 'UNVERIFIED',
  [string, BadgeVariant]
> = {
  OK: ['Aman', 'success'],
  VIOLATION: ['Tidak aman', 'danger'],
  UNVERIFIED: ['Belum terlihat', 'neutral'],
}

const SPOKEN: Record<'head' | 'body' | 'legs' | 'feet', string> = {
  head: 'helm',
  body: 'coverall',
  legs: 'celana jeans',
  feet: 'sepatu safety',
}
const REPEAT_MS = 15000 // ulangi peringatan bila pelanggaran masih berlanjut

/** Suara peringatan hanya untuk bagian "Tidak aman"; "Belum terlihat" diabaikan. */
function useVoiceAlert(persons: PersonTrackStatus[], enabled: boolean) {
  const last = useRef<Record<string, number>>({})
  useEffect(() => {
    if (!enabled || !('speechSynthesis' in window)) return
    const now = Date.now()
    for (const p of persons) {
      if (p.status === 'DANGER') continue
      const missing = (Object.keys(SPOKEN) as (keyof typeof SPOKEN)[])
        .filter((k) => p.attributes?.[k] === 'VIOLATION')
        .map((k) => SPOKEN[k])
      if (missing.length === 0) continue
      const text = `Harap gunakan ${missing.join(', ')}`
      const key = `${p.track_id}:${text}`
      if (now - (last.current[key] ?? 0) < REPEAT_MS) continue
      last.current[key] = now
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'id-ID'
      window.speechSynthesis.speak(u)
    }
  }, [persons, enabled])
}

function readSoundPref(): boolean {
  try {
    return localStorage.getItem('k3guard-voice') !== 'off'
  } catch {
    return true
  }
}

/** Daftar orang di frame kamera, dengan status tiap perlengkapan (dipakai petugas dan mahasiswa). */
export const PersonStatusList: React.FC<{ persons: PersonTrackStatus[] }> = ({
  persons,
}) => {
  const [sound, setSound] = useState(readSoundPref)
  useVoiceAlert(persons, sound)
  const toggle = () => {
    const next = !sound
    setSound(next)
    if (!next) window.speechSynthesis?.cancel()
    try {
      localStorage.setItem('k3guard-voice', next ? 'on' : 'off')
    } catch {
      /* abaikan */
    }
  }
  return (
  <div className="space-y-2">
    <button
      type="button"
      onClick={toggle}
      aria-pressed={sound}
      className="flex items-center gap-1.5 rounded-lg border border-charcoal/10 px-2.5 py-1 text-xs font-medium text-muted-gray hover:text-charcoal cursor-pointer"
    >
      {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      Suara peringatan {sound ? 'aktif' : 'mati'}
    </button>
    {persons.map((p) => (
      <div
        key={p.track_id}
        className="rounded-xl border border-charcoal/10 p-2.5 text-xs"
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-charcoal">Track #{p.track_id}</p>
          <Badge
            variant={
              p.status === 'COMPLIANT'
                ? 'success'
                : p.status === 'NON_COMPLIANT' || p.status === 'DANGER'
                ? 'danger'
                : 'neutral'
            }
          >
            {p.status}
          </Badge>
        </div>
        {p.status === 'DANGER' ? (
          <p className="mt-1.5 text-muted-gray">
            Orang terbaring atau jatuh, perlengkapan tidak dinilai.
            {p.detail ? ` ${p.detail}` : ''}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {PPE_ROWS.map(([key, label]) => {
              const [text, variant] =
                ATTR_STATUS[p.attributes?.[key] ?? 'UNVERIFIED']
              return (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-charcoal">{label}</span>
                  <Badge variant={variant}>{text}</Badge>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    ))}
  </div>
  )
}
