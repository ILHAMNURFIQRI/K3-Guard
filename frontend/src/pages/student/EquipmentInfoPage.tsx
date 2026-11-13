import React, { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Footprints,
  HardHat,
  Shield,
  Shirt,
} from 'lucide-react'
import { getAreas } from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import type { Area } from '@/types/api'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

interface EquipmentSpec {
  attribute: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  image: string
  alt: string
}

const EQUIPMENT_CATALOG: EquipmentSpec[] = [
  {
    attribute: 'head',
    title: 'Helm safety',
    description:
      'Terpasang di kepala dengan tali dagu dikencangkan. Helm yang hanya dibawa atau digantung dianggap tidak dipakai.',
    icon: HardHat,
    image: '/apd/helm.webp',
    alt: 'Helm safety putih',
  },
  {
    attribute: 'body',
    title: 'Coverall atau wearpack',
    description:
      'Menutup badan dan lengan, dikancingkan atau diresleting, tidak longgar. Lengan tidak boleh digulung.',
    icon: Shirt,
    image: '/apd/wearpack.webp',
    alt: 'Wearpack lengan panjang dengan kantong dada',
  },
  {
    attribute: 'legs',
    title: 'Jeans atau celana panjang tebal',
    description:
      'Celana panjang berbahan tebal. Celana pendek, rok pendek, dan celana robek dilarang.',
    icon: Shield,
    image: '/apd/celana.webp',
    alt: 'Celana panjang tebal berwarna gelap',
  },
  {
    attribute: 'feet',
    title: 'Sepatu safety',
    description:
      'Tertutup, ujung baja atau komposit, sol anti selip. Sandal, sepatu kain, dan sepatu berhak dilarang.',
    icon: Footprints,
    image: '/apd/sepatu.webp',
    alt: 'Sepatu safety tertutup dengan ujung baja',
  },
]

export const EquipmentInfoPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAreas = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAreas()
      setAreas(res)
      if (res.length > 0) {
        setSelectedAreaId(String(res[0].id))
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat informasi area & APD.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAreas()
  }, [loadAreas])

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" label="Memuat daftar perlengkapan area..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-critical/25 bg-surface p-6 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-critical" />
        <p className="mt-2 text-sm text-charcoal">{error}</p>
      </div>
    )
  }

  const currentArea = areas.find((a) => String(a.id) === selectedAreaId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ui-title">
          Informasi Perlengkapan Wajib (APD)
        </h1>
        <p className="text-sm text-muted-gray">
          Pilih area praktikum untuk melihat Alat Pelindung Diri yang
          diwajibkan oleh sistem K3Guard.
        </p>
      </div>

      {areas.length === 0 ? (
        <EmptyState
          title="Belum ada area terdaftar"
          description="Daftar area dan aturan APD belum dikonfigurasi oleh petugas K3."
        />
      ) : (
        <>
          <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
            <div className="grid gap-4 md:grid-cols-2 md:items-center">
              <Select
                label="Pilih Area Laboratorium / Bengkel"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                options={areas.map((a) => ({
                  value: String(a.id),
                  label: a.nama,
                }))}
              />
              {currentArea && (
                <div className="rounded-xl bg-off-white p-3.5 text-xs">
                  <p className="font-semibold text-charcoal">
                    {currentArea.nama}
                  </p>
                  <p className="mt-0.5 text-muted-gray">
                    {currentArea.deskripsi ||
                      'Area terpantau sistem deteksi APD otomatis.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {EQUIPMENT_CATALOG.map((item) => {
              const Icon = item.icon
              const aliasMap: Record<string, string[]> = {
                head: ['head', 'helmet'],
                body: ['body', 'coverall'],
                legs: ['legs', 'jeans'],
                feet: ['feet', 'safety_shoes'],
              }
              const acceptedKeys = aliasMap[item.attribute] || [item.attribute]
              const matchedRule = currentArea?.rules.find((r) =>
                acceptedKeys.includes(r.attribute.toLowerCase())
              )
              const hasRulesConfigured = (currentArea?.rules?.length ?? 0) > 0
              const isRequired = matchedRule ? matchedRule.required : false

              return (
                <div
                  key={item.attribute}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-surface transition-colors hover:border-steel-blue/40"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-b from-steel-blue/[0.10] to-steel-blue/[0.03] dark:from-pure-white/[0.16] dark:to-pure-white/[0.06]">
                    <img
                      src={item.image}
                      alt={item.alt}
                      width={640}
                      height={480}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full select-none object-contain p-4 drop-shadow-[0_14px_16px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute right-3 top-3">
                      {hasRulesConfigured ? (
                        <Badge variant={isRequired ? 'danger' : 'neutral'}>
                          {isRequired ? 'Wajib digunakan' : 'Opsional'}
                        </Badge>
                      ) : (
                        <Badge variant="warning">Belum diatur</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 items-start gap-3 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-steel-blue/10 text-steel-blue">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <h3 className="ui-section">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-gray">{item.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
