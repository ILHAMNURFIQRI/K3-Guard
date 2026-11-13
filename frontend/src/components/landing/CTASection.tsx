import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'

export const CTASection: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const entry =
    isAuthenticated && user
      ? { to: user.role === 'officer' ? '/dashboard/officer' : '/dashboard/student', label: 'Buka dashboard' }
      : { to: '/login', label: 'Masuk ke platform' }

  return (
    <section className="relative py-12 lg:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-night px-7 py-14 text-pure-white sm:px-12 lg:px-16 lg:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(80% 70% at 50% 130%, rgb(27 125 150 / 0.6), transparent 72%)' }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h2 className="ui-h2">Mulai praktikum berikutnya dengan pengawasan yang tidak berhenti</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-pure-white/75">
                Akun dibuat oleh petugas K3 laboratorium. Kalau belum punya, minta ke petugas yang bertugas.
              </p>
            </div>
            <Link to={entry.to} className="shrink-0">
              <Button variant="primary" size="lg">
                {entry.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
