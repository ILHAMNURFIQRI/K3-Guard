import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/common/Button'
import { HeroMascot } from '@/components/landing/HeroMascot'
import { useAuth } from '@/hooks/useAuth'

const PROOFS = ['APD dibaca dari kamera bengkel', 'Orang jatuh langsung dikabarkan ke petugas', 'Jawaban SOP selalu menyebut sumbernya']

export const HeroSection: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const entry =
    isAuthenticated && user
      ? { to: user.role === 'officer' ? '/dashboard/officer' : '/dashboard/student', label: 'Buka dashboard' }
      : { to: '/login', label: 'Masuk ke platform' }

  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden pb-12 pt-28 lg:pb-16"
    >
      <div className="canvas-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      {/* garis bantu gambar teknik, sangat tipis */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-charcoal) 1px, transparent 1px), linear-gradient(to bottom, var(--color-charcoal) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
        aria-hidden="true"
      />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <motion.div
            className="flex flex-col items-start lg:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h1 className="ui-display text-charcoal">Praktikum aman dimulai dari APD yang lengkap</h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-gray md:text-lg">
              K3Guard membaca perlengkapan lewat kamera bengkel, mengabari petugas saat ada yang jatuh, dan menjawab
              pertanyaan SOP dari dokumen resmi laboratorium.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={entry.to}>
                <Button variant="primary" size="lg">
                  {entry.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Lihat cara kerjanya
              </Button>
            </div>

            <ul className="mt-10 space-y-2.5">
              {PROOFS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-charcoal">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-safety-orange/15 text-safety-orange">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="relative lg:col-span-6"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
          >
            <HeroMascot />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
