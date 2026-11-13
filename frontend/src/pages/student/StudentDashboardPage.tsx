import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  Footprints,
  HardHat,
  Minus,
  Phone,
  ScanLine,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  Siren,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getMonitoringStatus } from '@/services/dashboard'
import type { MonitoringStatus } from '@/types/api'
import { LiveFrame } from '@/components/common/LiveFrame'
import { PersonStatusList } from '@/components/common/PersonStatusList'
import { AssistantOrb } from '@/components/chatbot/AssistantOrb'
import { cn } from '@/utils/cn'

type Attr = 'OK' | 'VIOLATION' | 'UNVERIFIED'

const PPE: { key: 'head' | 'body' | 'legs' | 'feet'; label: string; hint: string; icon: LucideIcon }[] = [
  { key: 'head', label: 'Helm safety', hint: 'helm', icon: HardHat },
  { key: 'body', label: 'Coverall atau wearpack', hint: 'coverall', icon: Shirt },
  { key: 'legs', label: 'Celana panjang tebal', hint: 'celana panjang', icon: Shield },
  { key: 'feet', label: 'Sepatu safety', hint: 'sepatu safety', icon: Footprints },
]

/** Jika ada beberapa orang di frame, bagian yang paling buruk yang ditampilkan. */
function worst(values: Attr[]): Attr | null {
  if (values.length === 0) return null
  if (values.includes('VIOLATION')) return 'VIOLATION'
  if (values.includes('UNVERIFIED')) return 'UNVERIFIED'
  return 'OK'
}

type Gate = 'offline' | 'empty' | 'ok' | 'warn' | 'bad' | 'danger'

const GATE_STYLE: Record<Gate, { icon: LucideIcon; tone: string; ring: string }> = {
  offline: { icon: CameraOff, tone: 'bg-charcoal/10 text-muted-gray', ring: 'border-charcoal/10' },
  empty: { icon: ScanLine, tone: 'bg-steel-blue/12 text-steel-blue', ring: 'border-steel-blue/30' },
  ok: { icon: ShieldCheck, tone: 'bg-success text-pure-white', ring: 'border-success/40' },
  warn: { icon: ScanLine, tone: 'bg-warning text-night', ring: 'border-warning/45' },
  bad: { icon: ShieldAlert, tone: 'bg-critical text-pure-white', ring: 'border-critical/40' },
  danger: { icon: Siren, tone: 'bg-critical text-pure-white', ring: 'border-critical/50' },
}

const CARD_LINKS = [
  { to: '/dashboard/student/sop', icon: BookOpen, title: 'Dokumen SOP', text: 'Baca dan unduh prosedur resmi bengkel.' },
  { to: '/dashboard/student/equipment', icon: HardHat, title: 'Info perlengkapan', text: 'APD wajib untuk tiap area praktikum.' },
]

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [status, setStatus] = useState<MonitoringStatus | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const s = await getMonitoringStatus()
        if (active) setStatus(s)
      } catch {
        // status hanya pelengkap; video tetap mencoba tampil sendiri
      }
    }
    load()
    const timer = window.setInterval(load, 2000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const cameraOnline = (status?.active_cameras ?? 0) > 0
  const persons = useMemo(() => status?.person_statuses ?? [], [status])
  const firstName = user?.nama?.split(' ')[0] || 'Mahasiswa'

  const rows = useMemo(
    () =>
      PPE.map((item) => ({
        ...item,
        state: worst(
          persons
            .filter((p) => p.status !== 'DANGER')
            .map((p) => (p.attributes?.[item.key] ?? 'UNVERIFIED') as Attr)
        ),
      })),
    [persons]
  )

  const gate: Gate = !cameraOnline
    ? 'offline'
    : persons.length === 0
      ? 'empty'
      : persons.some((p) => p.status === 'DANGER')
        ? 'danger'
        : persons.some((p) => p.status === 'NON_COMPLIANT')
          ? 'bad'
          : persons.every((p) => p.status === 'COMPLIANT')
            ? 'ok'
            : 'warn'

  const missing = rows.filter((r) => r.state === 'VIOLATION').map((r) => r.hint)
  const copy: Record<Gate, [string, string]> = {
    offline: ['Kamera belum aktif', 'Hubungi petugas K3 bila kamera tidak menyala.'],
    empty: ['Berdiri di depan kamera', 'Jarak 2 sampai 3 meter, sampai seluruh badan terlihat.'],
    ok: ['APD lengkap', 'Semua bagian terbaca aman. Kamu boleh masuk bengkel.'],
    warn: ['Belum semua bagian terlihat', 'Putar badan perlahan agar kamera melihat seluruh APD.'],
    bad: ['APD belum lengkap', missing.length ? `Lengkapi dulu: ${missing.join(', ')}.` : 'Periksa daftar di bawah.'],
    danger: ['Ada orang terbaring di area', 'Segera hubungi petugas K3.'],
  }
  const { icon: GateIcon, tone, ring } = GATE_STYLE[gate]

  return (
    <div className="space-y-6">
      {/* Gerbang APD: satu status besar yang berubah mengikuti kamera */}
      <section className={cn('relative overflow-hidden rounded-3xl border bg-surface p-5 sm:p-7 transition-colors duration-500', ring)}>
        <div className="flex flex-wrap items-center gap-5 sm:gap-7">
          <div className="relative shrink-0">
            {(gate === 'ok' || gate === 'bad' || gate === 'danger') && (
              <motion.span
                key={gate}
                className={cn('absolute inset-0 rounded-full', gate === 'ok' ? 'bg-success' : 'bg-critical')}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={gate}
                className={cn('relative flex h-[72px] w-[72px] items-center justify-center rounded-full', tone)}
                initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              >
                <GateIcon className="h-8 w-8" />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="text-sm font-semibold text-muted-gray">Halo, {firstName}. Cek APD sebelum masuk bengkel.</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={gate + copy[gate][1]}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.1 } }}
                transition={{ duration: 0.22 }}
              >
                <h1 className="ui-hero mt-1 text-charcoal">{copy[gate][0]}</h1>
                <p className="mt-1.5 text-[15px] leading-6 text-muted-gray">{copy[gate][1]}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Kamera */}
        <div className="relative overflow-hidden rounded-3xl bg-night">
          <div className="flex aspect-video items-center justify-center p-2 text-center">
            {cameraOnline ? (
              <LiveFrame
                cameraId={status?.cameras[0]?.id ?? 1}
                alt="Video kamera bengkel"
                className="h-full w-full rounded-2xl object-contain"
              />
            ) : (
              <div className="space-y-2 px-4">
                <CameraOff className="mx-auto h-9 w-9 text-safety-orange" />
                <p className="text-sm font-semibold text-pure-white">Kamera belum aktif</p>
                <p className="text-xs text-pure-white/70">Hubungi petugas K3 bila kamera tidak menyala.</p>
              </div>
            )}
          </div>
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-night/70 px-3 py-1 text-xs font-semibold text-pure-white backdrop-blur">
            <span className={cn('h-2 w-2 rounded-full', cameraOnline ? 'animate-pulse bg-success' : 'bg-pure-white/40')} />
            {cameraOnline ? 'Langsung, Kamera Utama' : 'Kamera mati'}
          </div>
          <Camera className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-pure-white/50" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-pure-white/30" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-pure-white/30" />
        </div>

        {/* Daftar periksa APD */}
        <div className="flex flex-col rounded-3xl border border-charcoal/10 bg-surface p-5">
          <h2 className="ui-section">Daftar periksa APD</h2>
          <p className="ui-lead mt-0.5">Diperbarui langsung dari kamera.</p>
          <ul className="mt-4 flex-1 space-y-2.5">
            {rows.map(({ key, label, icon: Icon, state }) => {
              const v =
                state === 'OK'
                  ? { text: 'Aman', cls: 'bg-success/12 text-success', Mark: Check }
                  : state === 'VIOLATION'
                    ? { text: 'Tidak aman', cls: 'bg-critical/12 text-critical', Mark: X }
                    : state === 'UNVERIFIED'
                      ? { text: 'Belum terlihat', cls: 'bg-warning/15 text-[#8a6300] dark:text-warning', Mark: Minus }
                      : { text: 'Menunggu', cls: 'bg-charcoal/[0.06] text-muted-gray', Mark: Minus }
              return (
                <li key={key} className="flex items-center gap-3 rounded-2xl border border-charcoal/10 p-2.5 pr-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
                      state === 'OK' ? 'bg-success text-pure-white' : state === 'VIOLATION' ? 'bg-critical text-pure-white' : 'bg-steel-blue/10 text-steel-blue'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-charcoal">{label}</span>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-300', v.cls)}>
                    <v.Mark className="h-3 w-3" strokeWidth={3} />
                    {v.text}
                  </span>
                </li>
              )
            })}
          </ul>

          <details className="group mt-4 rounded-2xl border border-charcoal/10 open:bg-charcoal/[0.03]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-muted-gray hover:text-charcoal">
              Detail per orang dan suara peringatan
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3">
              {persons.length === 0 ? (
                <p className="px-1 py-2 text-xs text-muted-gray">Belum ada orang terbaca.</p>
              ) : (
                <PersonStatusList persons={persons} />
              )}
            </div>
          </details>
        </div>
      </div>

      {/* Menu cepat: Asisten K3 jadi yang paling besar */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Link
          to="/dashboard/student/chatbot"
          className="group relative overflow-hidden rounded-3xl bg-night p-6 text-pure-white transition-transform hover:-translate-y-0.5 lg:col-span-2"
        >
          <div className="canvas-glow absolute inset-0 opacity-90" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="max-w-xs">
              <h2 className="font-heading text-xl font-bold tracking-tight">Asisten K3</h2>
              <p className="mt-1.5 text-sm leading-6 text-pure-white/75">
                Tanya aturan APD, keselamatan mesin, atau langkah darurat. Dijawab dari SOP resmi.
              </p>
              <span className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-safety-orange px-4 text-sm font-semibold text-night">
                Tanya sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <AssistantOrb size={92} className="shrink-0" />
          </div>
        </Link>

        {CARD_LINKS.map(({ to, icon: Icon, title, text }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col justify-between rounded-3xl border border-charcoal/10 bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-steel-blue/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-steel-blue/10 text-steel-blue transition-colors group-hover:bg-steel-blue group-hover:text-pure-white">
              <Icon className="h-5 w-5" />
            </span>
            <div className="mt-6">
              <h3 className="ui-section">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-gray">{text}</p>
            </div>
          </Link>
        ))}

        <Link
          to="/dashboard/student/contact"
          className="group flex items-center gap-4 rounded-3xl border border-critical/25 bg-critical/[0.06] p-5 transition-colors hover:border-critical/50 lg:col-span-4"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-critical text-pure-white">
            <Phone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="ui-section">Keadaan darurat?</h3>
            <p className="text-sm text-muted-gray">Lihat kontak petugas K3 dan cara melapor.</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-critical transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
