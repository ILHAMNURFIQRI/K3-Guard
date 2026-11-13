import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface AssistantOrbProps {
  size?: number
  /** true saat menunggu jawaban: cincin berputar lebih cepat dan aura berdenyut. */
  thinking?: boolean
  /** false untuk avatar kecil di daftar pesan (tanpa animasi). */
  animated?: boolean
  className?: string
}

// Potret kepala diambil dari gambar maskot (896x1776, kepala di sekitar x 432, y 250, lebar 260).
const SRC_W = 896
const SRC_H = 1776
const HEAD_X = 432
const HEAD_Y = 262
const HEAD_W = 262

export const AssistantOrb: React.FC<AssistantOrbProps> = ({
  size = 120,
  thinking = false,
  animated = true,
  className,
}) => {
  const reduce = useReducedMotion()
  const live = animated && !reduce
  const ring = Math.max(2, Math.round(size / 36))
  const d = size - ring * 2
  const f = (d * 0.86) / HEAD_W

  return (
    <div className={className} style={{ width: size, height: size }} aria-hidden="true">
      <div className="relative h-full w-full">
        {animated && (
          <motion.div
            className="absolute -inset-[22%] rounded-full blur-2xl"
            style={{
              background:
                'radial-gradient(closest-side, rgb(59 120 148 / 0.6), rgb(36 84 106 / 0.22) 60%, transparent)',
            }}
            animate={live ? { scale: [1, 1.14, 1], opacity: [0.65, 1, 0.65] } : undefined}
            transition={{ duration: thinking ? 1.3 : 4.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, #3B7894, #7FC0DA, #F28C28, #24546A, #3B7894)',
          }}
          animate={live ? { rotate: 360 } : undefined}
          transition={{ duration: thinking ? 2.6 : 14, repeat: Infinity, ease: 'linear' }}
        />

        <div
          className="absolute overflow-hidden rounded-full"
          style={{
            inset: ring,
            background: 'radial-gradient(circle at 50% 30%, #2D6B86 0%, #123241 55%, #0A1A23 100%)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/mascot.webp)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${SRC_W * f}px ${SRC_H * f}px`,
              backgroundPosition: `${d / 2 - HEAD_X * f}px ${d * 0.5 - HEAD_Y * f}px`,
            }}
          />
          {/* pantulan kaca */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 38% at 32% 14%, rgb(255 255 255 / 0.34), transparent 70%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
