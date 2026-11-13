import React from 'react'
import { AlertTriangle, Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export const ContactOfficerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="ui-title">
          Hubungi Petugas K3
        </h1>
        <p className="text-sm text-muted-gray">
          Saluran komunikasi resmi petugas keselamatan laboratorium dan layanan
          darurat.
        </p>
      </div>

      {/* Emergency Note */}
      <div className="flex items-start gap-3 rounded-2xl border border-critical/25 bg-critical/8 p-5">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-critical" />
        <div className="space-y-1">
          <h2 className="font-heading text-sm font-bold text-critical">
            Catatan Kondisi Darurat (Kecelakaan / Cedera / Kebakaran)
          </h2>
          <p className="text-xs leading-relaxed text-charcoal">
            Apabila terjadi kecelakaan kerja, insiden jatuh, atau keadaan
            darurat di dalam laboratorium, segera hentikan mesin/peralatan
            terdekat, hubungi petugas K3 piket di lokasi, dan ikuti jalur
            evakuasi menuju titik kumpul terdekat.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="ui-section">
              Unit K3 Laboratorium &amp; Bengkel
            </h3>
            <Badge variant="info">Kontak Resmi</Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-off-white p-3">
              <Phone className="h-4 w-4 text-steel-blue shrink-0" />
              <div>
                <p className="text-xs text-muted-gray">Telepon / WhatsApp Piket</p>
                <p className="font-semibold text-charcoal">
                  +62 811-0000-0000 (Placeholder)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-off-white p-3">
              <Send className="h-4 w-4 text-steel-blue shrink-0" />
              <div>
                <p className="text-xs text-muted-gray">Telegram Resmi K3</p>
                <p className="font-semibold text-charcoal">
                  @k3guard_officer_bot (Placeholder)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-off-white p-3">
              <Mail className="h-4 w-4 text-steel-blue shrink-0" />
              <div>
                <p className="text-xs text-muted-gray">Email Pengaduan K3</p>
                <p className="font-semibold text-charcoal">
                  k3guard@kampus.ac.id (Placeholder)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs space-y-4">
          <h3 className="ui-section">
            Lokasi Pos &amp; Jam Layanan
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-xl bg-off-white p-3">
              <MapPin className="h-4 w-4 text-safety-orange shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-gray">Pos Petugas K3</p>
                <p className="font-semibold text-charcoal">
                  Gedung Laboratorium Terpadu, Lantai 1 (Ruang K3)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-off-white p-3">
              <Clock className="h-4 w-4 text-steel-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-gray">Jam Operasional</p>
                <p className="font-semibold text-charcoal">
                  Senin – Jumat, 07.30 – 17.00 WIB
                </p>
                <p className="text-xs text-muted-gray mt-0.5">
                  Pemantauan sistem kamera aktif 24 jam selama praktikum
                  berlangsung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
