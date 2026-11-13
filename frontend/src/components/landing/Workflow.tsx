import React, { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, type MotionValue } from 'framer-motion'
import { Camera, ClipboardCheck, Cpu, Send, type LucideIcon } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { cn } from '@/utils/cn'

// Urutan nyata dari pipeline backend: kamera -> model -> kejadian -> verifikasi petugas.
const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Camera,
    title: 'Kamera membaca frame',
    text: 'Kamera bengkel diperiksa sekitar 8 kali per detik. Tiap orang diberi nomor supaya bisa diikuti dari frame ke frame.',
  },
  {
    icon: Cpu,
    title: 'Model menilai',
    text: 'APD dan postur tubuh dikenali. Hasil 15 frame terakhir divoting, jadi satu salah baca tidak jadi alarm.',
  },
  {
    icon: Send,
    title: 'Kejadian tercatat',
    text: 'Pelanggaran yang bertahan 5 detik, atau orang yang tetap terbaring, dicatat dengan foto lalu dikirim ke dashboard dan Telegram.',
  },
  {
    icon: ClipboardCheck,
    title: 'Petugas menindaklanjuti',
    text: 'Petugas melihat fotonya, menandai Benar atau Alarm palsu, dan menulis catatan tindak lanjut.',
  },
]

export const Workflow: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 65%'] })
  const [progress, setProgress] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setProgress(v))

  return (
    <section id="how-it-works" className="relative scroll-mt-4 py-24 lg:py-32">
      <Container>
        <div className="max-w-2xl">
          <h2 className="ui-h2 text-charcoal">Dari kamera sampai tindak lanjut</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-gray">
            Empat langkah berjalan sendiri, jadi petugas tidak perlu menatap layar sepanjang praktikum.
          </p>
        </div>

        <div ref={ref} className="relative mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
          {/* jalur: mendatar di layar lebar, tegak di HP; terisi mengikuti gulir */}
          <div className="absolute bottom-6 left-[21px] top-6 w-0.5 bg-charcoal/10 lg:hidden" aria-hidden="true">
            <Fill value={scrollYProgress} axis="y" />
          </div>
          <div className="absolute left-[12.5%] right-[12.5%] top-[21px] hidden h-0.5 bg-charcoal/10 lg:block" aria-hidden="true">
            <Fill value={scrollYProgress} axis="x" />
          </div>

          {STEPS.map(({ icon: Icon, title, text }, i) => {
            const on = progress >= i / 4 - 0.02
            return (
              <div key={title} className="relative flex gap-5 lg:block lg:text-center">
                <span
                  className={cn(
                    'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 lg:mx-auto',
                    on
                      ? 'border-steel-blue bg-steel-blue text-pure-white shadow-[0_10px_22px_-10px_var(--color-steel-blue)]'
                      : 'border-charcoal/15 bg-off-white text-muted-gray'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="lg:mt-6">
                  <h3 className="ui-section">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-gray lg:mx-auto lg:max-w-[16rem]">{text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

const Fill: React.FC<{ value: MotionValue<number>; axis: 'x' | 'y' }> = ({ value, axis }) => (
  <motion.div
    className="h-full w-full bg-safety-orange"
    style={axis === 'x' ? { scaleX: value, originX: 0 } : { scaleY: value, originY: 0 }}
  />
)
