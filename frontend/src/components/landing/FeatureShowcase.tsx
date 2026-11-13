import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Activity, Check, MessageSquareText, ShieldCheck, X, type LucideIcon } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { cn } from '@/utils/cn'

const FEATURES: { id: 'apd' | 'fall' | 'sop'; icon: LucideIcon; title: string; text: string }[] = [
  {
    id: 'apd',
    icon: ShieldCheck,
    title: 'Deteksi APD',
    text: 'Kamera memeriksa helm, wearpack, celana, dan sepatu tiap orang. Status baru berubah kalau mayoritas frame sepakat.',
  },
  {
    id: 'fall',
    icon: Activity,
    title: 'Deteksi orang jatuh',
    text: 'Postur tubuh dibaca dari titik sendi. Alarm hanya menyala kalau orang tetap terbaring beberapa detik.',
  },
  {
    id: 'sop',
    icon: MessageSquareText,
    title: 'Asisten SOP',
    text: 'Pertanyaan dijawab dari dokumen SOP yang diunggah petugas, lengkap dengan bagian yang dirujuk.',
  },
]

/* ---------- panel 1: voting 15 frame ---------- */

const PPE_ROWS: [string, boolean][] = [
  ['Helm safety', true],
  ['Coverall atau wearpack', true],
  ['Celana panjang', true],
  ['Sepatu safety', false],
]

const PpePanel: React.FC = () => (
  <div>
    <div className="flex items-center justify-between">
      <p className="font-heading text-lg font-bold">Orang #3</p>
      <span className="rounded-full bg-critical/25 px-3 py-1 text-xs font-semibold text-[#ffb4b4]">Tidak sesuai</span>
    </div>
    <ul className="mt-4 space-y-2">
      {PPE_ROWS.map(([label, ok]) => (
        <li key={label} className="flex items-center justify-between rounded-xl bg-pure-white/[0.06] px-4 py-3 text-sm">
          <span className="font-medium">{label}</span>
          <span className={cn('inline-flex items-center gap-1.5 font-semibold', ok ? 'text-[#7fd68a]' : 'text-[#ff9b9b]')}>
            {ok ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
            {ok ? 'Aman' : 'Tidak aman'}
          </span>
        </li>
      ))}
    </ul>

    <p className="mt-6 text-xs font-semibold text-pure-white/60">15 frame terakhir, bagian sepatu</p>
    <div className="mt-2 flex gap-1.5" aria-hidden="true">
      {Array.from({ length: 15 }, (_, i) => {
        const bad = i >= 5
        return (
          <motion.span
            key={i}
            className="h-8 flex-1 rounded-md"
            initial={{ backgroundColor: 'rgba(255,255,255,0.1)', scaleY: 0.5 }}
            animate={{ backgroundColor: bad ? '#EF7070' : 'rgba(127,214,138,0.75)', scaleY: 1 }}
            transition={{ delay: 0.25 + i * 0.06, duration: 0.25 }}
          />
        )
      })}
    </div>
    <p className="mt-3 text-sm leading-6 text-pure-white/75">
      10 dari 15 frame melihat sepatu tidak terpasang. Itu 67%, di atas batas 60%, jadi statusnya berubah. Satu frame
      yang salah baca tidak memicu apa-apa.
    </p>
    <p className="mt-2 text-sm leading-6 text-pure-white/75">
      Kejadian baru dicatat setelah pelanggaran bertahan 5 detik.
    </p>
  </div>
)

/* ---------- panel 2: mesin status jatuh ---------- */

const STEPS = [
  { name: 'Normal', note: 'Berdiri tegak.' },
  { name: 'Jatuh', note: 'Sudut badan berubah cepat.' },
  { name: 'Terbaring', note: 'Badan datar, mulai dihitung 3 detik.' },
  { name: 'Alarm', note: 'Petugas dikabari beserta foto.' },
]
const ANGLE = [0, 52, 90, 90]

const FallPanel: React.FC = () => {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(reduce ? 3 : 0)

  useEffect(() => {
    if (reduce) return
    const t = window.setTimeout(() => setStep((s) => (s + 1) % 4), step === 3 ? 2800 : 1500)
    return () => window.clearTimeout(t)
  }, [step, reduce])

  const alert = step === 3
  return (
    <div>
      <svg viewBox="0 0 280 190" className="h-48 w-full" role="img" aria-label="Orang berdiri lalu jatuh dan terbaring">
        <line x1="20" y1="164" x2="260" y2="164" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <motion.g
          initial={false}
          animate={{ rotate: ANGLE[step] }}
          transition={{ type: 'spring', stiffness: 80, damping: 13 }}
          style={{ originX: 0.5, originY: 1 }}
        >
          <g
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            stroke={alert ? '#EF7070' : '#FFFFFF'}
            style={{ transition: 'stroke 0.3s' }}
          >
            <circle cx="140" cy="58" r="13" />
            <line x1="140" y1="71" x2="140" y2="116" />
            <line x1="140" y1="116" x2="127" y2="164" />
            <line x1="140" y1="116" x2="153" y2="164" />
            <line x1="140" y1="80" x2="122" y2="106" />
            <line x1="140" y1="80" x2="158" y2="106" />
          </g>
        </motion.g>
      </svg>

      <div className="mt-2 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.name}
            className={cn(
              'rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-colors duration-300',
              i === step ? (alert ? 'bg-critical text-pure-white' : 'bg-safety-orange text-night') : 'bg-pure-white/[0.07] text-pure-white/55'
            )}
          >
            {s.name}
          </div>
        ))}
      </div>
      <p className="mt-4 min-h-6 text-sm font-medium text-pure-white/90">{STEPS[step].note}</p>
      <p className="mt-3 text-sm leading-6 text-pure-white/70">
        Jongkok atau membungkuk tidak pernah sampai tahap alarm, karena badan tidak sampai datar.
      </p>
    </div>
  )
}

/* ---------- panel 3: tanya SOP ---------- */

const QUESTION = 'APD apa saja yang wajib di bengkel mesin?'
const ANSWER =
  'Ada empat APD wajib: helm dengan tali dagu terpasang, wearpack yang menutup badan dan lengan, celana panjang berbahan tebal, dan sepatu safety tertutup.'

const SopPanel: React.FC = () => {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? ANSWER.length : 0)

  useEffect(() => {
    if (reduce || n >= ANSWER.length) return
    const t = window.setTimeout(() => setN((c) => c + 2), n === 0 ? 700 : 22)
    return () => window.clearTimeout(t)
  }, [n, reduce])

  const done = n >= ANSWER.length
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2F6F8D] px-4 py-3 text-sm leading-6">{QUESTION}</div>
      </div>
      <div className="rounded-2xl rounded-bl-md bg-pure-white/[0.07] px-4 py-3 text-sm leading-6 text-pure-white/90">
        {ANSWER.slice(0, n)}
        {!done && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-pure-white" />}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex flex-wrap items-center gap-2 text-xs"
            >
              <span className="font-semibold text-pure-white/60">Sumber</span>
              <span className="rounded-full border border-[#7FC0DA]/40 bg-[#7FC0DA]/15 px-2.5 py-0.5 font-medium text-[#BFE3F2]">
                SOP Bengkel Mesin, bagian 3
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="pt-2 text-sm leading-6 text-pure-white/70">
        Kalau SOP tidak memuat jawabannya, asisten bilang tidak tahu dan pertanyaannya masuk daftar untuk dilengkapi
        petugas. Ia tidak mengarang.
      </p>
    </div>
  )
}

const PANELS = { apd: PpePanel, fall: FallPanel, sop: SopPanel }

export const FeatureShowcase: React.FC = () => {
  const [active, setActive] = useState<'apd' | 'fall' | 'sop'>('apd')
  const Panel = PANELS[active]

  return (
    <section id="features" className="relative scroll-mt-4 py-24 lg:py-32">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className="ui-h2 text-charcoal">Pengawasan manual tidak bisa ada di semua tempat</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-gray">
              K3Guard mengerjakan pemeriksaan yang berulang, supaya petugas bisa fokus pada kejadian yang perlu
              ditindak.
            </p>

            <div className="mt-8 space-y-2" role="tablist" aria-label="Fitur utama">
              {FEATURES.map(({ id, icon: Icon, title, text }) => {
                const on = id === active
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setActive(id)}
                    className={cn(
                      'flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200',
                      on ? 'border-steel-blue/50 bg-surface shadow-lg' : 'border-transparent hover:bg-charcoal/[0.04]'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
                        on ? 'bg-steel-blue text-pure-white' : 'bg-charcoal/[0.06] text-charcoal/70'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="ui-section block">{title}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted-gray">{text}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-7 lg:sticky lg:top-28">
            <div className="relative overflow-hidden rounded-3xl bg-night p-6 text-pure-white shadow-xl sm:p-8">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(70% 55% at 50% 120%, rgb(27 125 150 / 0.5), transparent 72%)' }}
                aria-hidden="true"
              />
              <div className="relative min-h-[26rem]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    role="tabpanel"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  >
                    <Panel />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
