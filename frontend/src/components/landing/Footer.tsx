import React from 'react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/Container'

const LINKS = [
  { label: 'Fitur', href: '#features' },
  { label: 'Alur kerja', href: '#how-it-works' },
  { label: 'APD wajib', href: '#equipment' },
]

export const Footer: React.FC = () => {
  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer id="contact" className="scroll-mt-4 border-t border-charcoal/10 pb-10 pt-14">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
              <span className="font-heading text-lg font-extrabold tracking-tight text-charcoal">
                K3Guard <span className="text-safety-orange">AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-gray">
              Pemantauan APD, deteksi orang jatuh, dan tanya jawab SOP untuk bengkel dan laboratorium praktikum.
            </p>
          </div>

          <nav className="md:col-span-3" aria-label="Pintasan">
            <h4 className="ui-section">Di halaman ini</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-gray">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={(e) => go(e, l.href)} className="transition-colors hover:text-steel-blue">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/login" className="transition-colors hover:text-steel-blue">
                  Masuk
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h4 className="ui-section">Butuh bantuan?</h4>
            <p className="mt-4 text-sm leading-6 text-muted-gray">
              Hubungi petugas K3 laboratorium untuk akun baru, APD yang rusak, atau melaporkan kejadian di bengkel.
            </p>
          </div>
        </div>

        <p className="mt-12 border-t border-charcoal/10 pt-6 text-xs leading-5 text-muted-gray">
          K3Guard AI membantu pengawasan dan tidak menggantikan petugas K3 maupun prosedur keselamatan resmi di
          lapangan. &copy; {new Date().getFullYear()}
        </p>
      </Container>
    </footer>
  )
}
