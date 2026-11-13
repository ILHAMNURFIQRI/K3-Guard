import React, { useEffect, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { Activity, Check, MessageSquareText, ScanLine, ShieldCheck } from 'lucide-react'

const TIPS = [
  'Halo! Aku maskot K3Guard. Sudah pakai APD lengkap?',
  'Helm wajib dipakai sebelum masuk area mesin.',
  'Jeans tidak cukup. Pakai coverall atau wearpack di bengkel.',
  'Sepatu safety melindungi kakimu dari benda berat dan tajam.',
  'Ada yang terjatuh? Segera hubungi petugas K3.',
  'Bingung soal SOP? Tanya Asisten K3 setelah login.',
]

// Posisi kotak deteksi dalam persen dari gambar maskot (zona tubuh sama dengan config.yaml).
const ZONES = [
  { label: 'helmet', conf: '0.94', box: { left: 33, top: 2.5, width: 31, height: 11 }, delay: 0.3 },
  { label: 'coverall', conf: '0.91', box: { left: 14, top: 19, width: 70, height: 34 }, delay: 0.85 },
  { label: 'safety_shoes', conf: '0.89', box: { left: 26, top: 88, width: 46, height: 9.5 }, delay: 1.4 },
]

interface ChipProps {
  sx: MotionValue<number>
  sy: MotionValue<number>
  depth: number
  className: string
  icon: React.ReactNode
  text: string
  delay: number
}

const FloatingChip: React.FC<ChipProps> = ({ sx, sy, depth, className, icon, text, delay }) => {
  const x = useTransform(sx, (v) => v * -depth)
  const y = useTransform(sy, (v) => v * -depth * 0.6)
  return (
    <motion.div className={`pointer-events-none absolute hidden sm:block ${className}`} style={{ x, y }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{
          opacity: { delay: 0.5 + delay, duration: 0.4 },
          scale: { delay: 0.5 + delay, duration: 0.4 },
          y: { delay, duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="flex items-center gap-2 rounded-xl border border-charcoal/10 bg-surface px-3 py-2 text-xs font-semibold text-charcoal shadow-lg"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-steel-blue/10 text-steel-blue">
          {icon}
        </span>
        {text}
      </motion.div>
    </motion.div>
  )
}

export const HeroMascot: React.FC = () => {
  const reduce = useReducedMotion()
  const [tip, setTip] = useState(0)
  const [showBoxes, setShowBoxes] = useState(false)
  const [scanKey, setScanKey] = useState(0)
  const jump = useAnimationControls()

  // kursor -> kemiringan 3D maskot dan pergeseran chip. Tidak memicu render ulang React.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 18 })
  const sy = useSpring(my, { stiffness: 90, damping: 18 })
  const rotateY = useTransform(sx, (v) => v * 10)
  const rotateX = useTransform(sy, (v) => v * -6)

  useEffect(() => {
    if (reduce) return
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduce, mx, my])

  // ganti tips otomatis; klik pada maskot mengubah `tip` sehingga timer mulai dari awal
  useEffect(() => {
    const t = window.setTimeout(() => setTip((i) => (i + 1) % TIPS.length), 7000)
    return () => window.clearTimeout(t)
  }, [tip])

  const greet = () => {
    setTip((i) => (i + 1) % TIPS.length)
    jump.start({
      y: [0, -56, 0],
      scaleY: [1, 1.05, 0.95, 1],
      scaleX: [1, 0.97, 1.04, 1],
      transition: { duration: 0.65, ease: 'easeOut' },
    })
  }

  const toggleDetection = () => {
    if (showBoxes) {
      setShowBoxes(false)
    } else {
      setShowBoxes(true)
      setScanKey((k) => k + 1)
    }
  }

  return (
    <div className="relative h-[480px] md:h-[560px] lg:h-[640px] xl:h-[700px] w-full">
      {/* sudut siku ala gambar teknik */}
      <span className="pointer-events-none absolute top-2 left-2 h-4 w-4 border-t border-l border-charcoal/25" />
      <span className="pointer-events-none absolute top-2 right-2 h-4 w-4 border-t border-r border-charcoal/25" />
      <span className="pointer-events-none absolute bottom-10 left-2 h-4 w-4 border-b border-l border-charcoal/25" />
      <span className="pointer-events-none absolute bottom-10 right-2 h-4 w-4 border-b border-r border-charcoal/25" />

      {/* halo + cincin orbit */}
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] h-[86%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--color-steel-blue) 20%, transparent), transparent)',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[46%] h-[80%] aspect-square -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="h-full w-full rounded-full border border-dashed border-steel-blue/30"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[46%] h-[62%] aspect-square -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative h-full w-full rounded-full border border-steel-blue/20"
          animate={reduce ? undefined : { rotate: -360 }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-safety-orange" />
        </motion.div>
      </div>

      {/* bayangan di lantai */}
      <motion.div
        className="pointer-events-none absolute bottom-[3.1rem] left-1/2 h-4 w-40 -translate-x-1/2 rounded-[50%] bg-charcoal/25 blur-md"
        animate={reduce ? undefined : { scaleX: [1, 0.82, 1], opacity: [0.9, 0.6, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* chip fitur yang melayang */}
      <FloatingChip
        sx={sx}
        sy={sy}
        depth={22}
        delay={0}
        className="left-0 top-[20%]"
        icon={<ShieldCheck className="h-4 w-4" />}
        text="Deteksi APD"
      />
      <FloatingChip
        sx={sx}
        sy={sy}
        depth={30}
        delay={0.6}
        className="right-0 top-[46%]"
        icon={<Activity className="h-4 w-4" />}
        text="Pantau jatuh"
      />
      <FloatingChip
        sx={sx}
        sy={sy}
        depth={16}
        delay={1.2}
        className="left-2 bottom-[24%]"
        icon={<MessageSquareText className="h-4 w-4" />}
        text="Asisten SOP"
      />

      {/* maskot */}
      <div className="absolute inset-x-0 bottom-14 top-8 flex items-end justify-center" style={{ perspective: 900 }}>
        <motion.div
          className="relative h-full aspect-[896/1776]"
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d', originY: 1 }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.15 }}
        >
          <motion.div
            className="relative h-full w-full"
            style={{ originY: 1 }}
            animate={reduce ? undefined : { y: [0, -12, 0], scaleY: [1, 1.012, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div className="relative h-full w-full" style={{ originY: 1 }} animate={jump}>
              <button
                type="button"
                onClick={greet}
                aria-label="Sapa maskot K3Guard"
                className="block h-full w-full cursor-pointer select-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-steel-blue"
              >
                <img
                  src="/mascot.webp"
                  alt="Maskot K3Guard memakai helm putih, seragam kerja, dan sepatu safety"
                  width={896}
                  height={1776}
                  draggable={false}
                  className="h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.18)]"
                />
              </button>

              {/* kotak deteksi ala keluaran model */}
              <AnimatePresence>
                {showBoxes &&
                  ZONES.map((z) => (
                    <motion.div
                      key={z.label}
                      className="pointer-events-none absolute rounded-sm border-2 border-success bg-success/10"
                      style={{
                        left: `${z.box.left}%`,
                        top: `${z.box.top}%`,
                        width: `${z.box.width}%`,
                        height: `${z.box.height}%`,
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                      transition={{ delay: z.delay, duration: 0.3 }}
                    >
                      <span className="absolute -top-6 left-[-2px] flex items-center gap-1 whitespace-nowrap rounded-sm bg-success px-1.5 py-0.5 text-[11px] font-semibold text-pure-white">
                        <Check className="h-3 w-3" />
                        {z.label} {z.conf}
                      </span>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {/* garis pindai */}
              {scanKey > 0 && showBoxes && (
                <motion.div
                  key={scanKey}
                  className="pointer-events-none absolute -inset-x-[8%] h-0.5 bg-safety-orange"
                  style={{ boxShadow: '0 0 14px 3px var(--color-safety-orange)' }}
                  initial={{ top: '0%', opacity: 1 }}
                  animate={{ top: '100%', opacity: [1, 1, 0] }}
                  transition={{ duration: 1.8, ease: 'linear' }}
                />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* balon ucapan */}
      <div className="pointer-events-none absolute left-[58%] top-0 w-[min(220px,42%)] sm:left-[60%]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tip}
            role="status"
            aria-live="polite"
            className="relative rounded-2xl rounded-bl-sm border border-charcoal/10 bg-surface px-4 py-3 text-sm leading-snug text-charcoal shadow-lg"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {TIPS[tip]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* keterangan bawah + tombol deteksi */}
      <div className="absolute bottom-0 left-2 right-2 flex items-center justify-between gap-3 border-t border-charcoal/12 pt-3 text-[11px] text-muted-gray">
        <span className="hidden sm:inline">
          <span className="font-semibold text-charcoal">Maskot K3Guard</span> · klik untuk menyapa
        </span>
        <button
          type="button"
          onClick={toggleDetection}
          aria-pressed={showBoxes}
          className="inline-flex items-center gap-1.5 rounded-md border border-steel-blue/30 px-2.5 py-1 font-semibold text-steel-blue transition-colors hover:bg-steel-blue hover:text-pure-white"
        >
          <ScanLine className="h-3.5 w-3.5" />
          {showBoxes ? 'Sembunyikan deteksi' : 'Coba deteksi APD'}
        </button>
      </div>
    </div>
  )
}
