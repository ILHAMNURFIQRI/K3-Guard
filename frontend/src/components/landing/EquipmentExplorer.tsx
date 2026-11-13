import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Footprints, HardHat, Shield, Shirt, type LucideIcon } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { cn } from '@/utils/cn'

// Isi diambil dari SOP bengkel mesin, bagian 3 dan 4.
const MUST: {
  id: string
  icon: LucideIcon
  title: string
  rule: string
  box: { left: number; top: number; width: number; height: number }
}[] = [
  {
    id: 'helm',
    icon: HardHat,
    title: 'Helm safety',
    rule: 'Terpasang di kepala dengan tali dagu dikencangkan. Helm yang hanya dibawa atau digantung dianggap tidak dipakai.',
    box: { left: 33, top: 2.5, width: 31, height: 11 },
  },
  {
    id: 'wearpack',
    icon: Shirt,
    title: 'Wearpack',
    rule: 'Menutup badan dan lengan, dikancingkan atau diresleting, tidak longgar. Lengan tidak boleh digulung.',
    box: { left: 14, top: 19, width: 70, height: 34 },
  },
  {
    id: 'celana',
    icon: Shield,
    title: 'Celana panjang tebal',
    rule: 'Jeans atau celana wearpack. Celana pendek, rok pendek, dan celana robek dilarang.',
    box: { left: 28, top: 53, width: 44, height: 35 },
  },
  {
    id: 'sepatu',
    icon: Footprints,
    title: 'Sepatu safety',
    rule: 'Tertutup, ujung baja atau komposit, sol anti selip. Sandal, sepatu kain, dan sepatu berhak dilarang.',
    box: { left: 26, top: 88.5, width: 46, height: 9 },
  },
]

const EXTRA: [string, string][] = [
  ['Kacamata pengaman', 'Membubut, mengefrais, mengebor, menggerinda, memotong'],
  ['Sumbat atau penutup telinga', 'Area bising, misalnya saat menggerinda'],
  ['Masker atau respirator', 'Menggerinda, mengecat, debu dan uap kimia'],
  ['Pelindung wajah', 'Menggerinda dan memotong logam, bersama kacamata'],
  ['Sarung tangan', 'Benda panas atau tajam, dan mengelas'],
  ['Celemek kulit dan helm las', 'Pengelasan'],
]

export const EquipmentExplorer: React.FC = () => {
  const [active, setActive] = useState(MUST[0].id)
  const current = MUST.find((m) => m.id === active) ?? MUST[0]

  return (
    <section id="equipment" className="relative scroll-mt-4 py-24 lg:py-32">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="ui-h2 text-charcoal">APD wajib di bengkel mesin</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-gray">
              Empat APD ini wajib dipakai semua orang di area bengkel, mesin menyala atau tidak. Arahkan kursor ke tiap
              baris untuk melihat letaknya di badan.
            </p>

            <ul className="mt-8 space-y-2">
              {MUST.map((m) => {
                const on = m.id === active
                const Icon = m.icon
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(m.id)}
                      onFocus={() => setActive(m.id)}
                      onClick={() => setActive(m.id)}
                      aria-expanded={on}
                      className={cn(
                        'w-full cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200',
                        on ? 'border-steel-blue/50 bg-surface shadow-lg' : 'border-charcoal/10 hover:border-steel-blue/30'
                      )}
                    >
                      <span className="flex items-center gap-4">
                        <span
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
                            on ? 'bg-steel-blue text-pure-white' : 'bg-charcoal/[0.06] text-charcoal/70'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="ui-section">{m.title}</span>
                      </span>
                      <AnimatePresence initial={false}>
                        {on && (
                          <motion.span
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="block overflow-hidden"
                          >
                            <span className="block pl-[60px] pt-2 text-sm leading-6 text-muted-gray">{m.rule}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </li>
                )
              })}
            </ul>

            <h3 className="ui-section mt-10">Tambahan sesuai pekerjaan</h3>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {EXTRA.map(([name, when]) => (
                <div key={name} className="rounded-xl border border-charcoal/10 px-4 py-3">
                  <dt className="text-sm font-semibold text-charcoal">{name}</dt>
                  <dd className="mt-0.5 text-xs leading-5 text-muted-gray">{when}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex gap-3 rounded-2xl border border-critical/30 bg-critical/[0.07] p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-critical" />
              <p className="text-sm leading-6 text-charcoal">
                <span className="font-semibold">Jangan pakai sarung tangan di mesin yang berputar.</span> Pada bubut,
                frais, dan bor, sarung tangan bisa tertarik dan menyeret tangan.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-28 lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-charcoal/10 bg-surface px-6 pb-6 pt-8">
              <div className="canvas-glow pointer-events-none absolute inset-0" aria-hidden="true" />
              <div className="relative mx-auto aspect-[896/1776] h-[520px] max-h-[70vh]">
                <img
                  src="/mascot.webp"
                  alt="Maskot memakai helm, wearpack, celana panjang, dan sepatu safety"
                  width={896}
                  height={1776}
                  draggable={false}
                  loading="lazy"
                  className="h-full w-full select-none object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.16)]"
                />
                <motion.div
                  className="pointer-events-none absolute rounded-md border-2 border-safety-orange bg-safety-orange/10"
                  initial={false}
                  animate={{
                    left: `${current.box.left}%`,
                    top: `${current.box.top}%`,
                    width: `${current.box.width}%`,
                    height: `${current.box.height}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                >
                  <span className="absolute -top-6 left-[-2px] whitespace-nowrap rounded-sm bg-safety-orange px-1.5 py-0.5 text-[11px] font-semibold text-night">
                    {current.title}
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
