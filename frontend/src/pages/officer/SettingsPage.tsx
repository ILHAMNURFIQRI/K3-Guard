import React, { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Plus,
  Save,
  Send,
  Shield,
  Sliders,
} from 'lucide-react'
import {
  createArea,
  getAreas,
  getMonitoringStatus,
  getThresholdSettings,
  updateAreaRules,
  updateThresholdSettings,
} from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import type { Area, CameraStatus, ThresholdSettings } from '@/types/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const PPE_ATTRIBUTES = [
  { key: 'head', label: 'Pelindung Kepala (Helm Safety)' },
  { key: 'body', label: 'Pelindung Tubuh (Rompi / Jas Lab)' },
  { key: 'legs', label: 'Pelindung Kaki (Celana Kerja Panjang)' },
  { key: 'feet', label: 'Alas Kaki (Sepatu Safety)' },
]

export const SettingsPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([])
  const [cameras, setCameras] = useState<CameraStatus[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [areaRulesMap, setAreaRulesMap] = useState<
    Record<number, Record<string, boolean>>
  >({})

  const [newAreaName, setNewAreaName] = useState('')
  const [newAreaDesc, setNewAreaDesc] = useState('')
  const [isAddingArea, setIsAddingArea] = useState(false)

  const [thresholds, setThresholds] = useState<ThresholdSettings>({
    confidence_threshold: 0.5,
    fall_sensitivity: 0.7,
    notification_cooldown_seconds: 60,
    max_concurrent_streams: 4,
  })
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [areasRes, threshRes, statusRes] = await Promise.all([
        getAreas(),
        getThresholdSettings(),
        getMonitoringStatus(),
      ])
      setAreas(areasRes)
      setThresholds(threshRes)
      setCameras(statusRes.cameras)

      const rulesObj: Record<number, Record<string, boolean>> = {}
      const aliasToUi: Record<string, string> = {
        head: 'head',
        helmet: 'head',
        body: 'body',
        coverall: 'body',
        legs: 'legs',
        jeans: 'legs',
        feet: 'feet',
        safety_shoes: 'feet',
      }
      areasRes.forEach((a) => {
        const entry: Record<string, boolean> = {
          head: false,
          body: false,
          legs: false,
          feet: false,
        }
        a.rules.forEach((r) => {
          const uiKey = aliasToUi[r.attribute.toLowerCase()] || r.attribute
          entry[uiKey] = Boolean(entry[uiKey]) || r.required
        })
        rulesObj[a.id] = entry
      })
      setAreaRulesMap(rulesObj)
      if (areasRes.length > 0 && selectedAreaId === null) {
        setSelectedAreaId(areasRes[0].id)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat pengaturan sistem.'))
    } finally {
      setIsLoading(false)
    }
  }, [selectedAreaId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAreaName.trim()) return
    setIsAddingArea(true)
    setFeedback(null)
    try {
      const created = await createArea({
        nama: newAreaName.trim(),
        deskripsi: newAreaDesc.trim(),
      })
      setNewAreaName('')
      setNewAreaDesc('')
      setSelectedAreaId(created.id)
      setFeedback({
        type: 'success',
        text: `Area "${created.nama}" berhasil ditambahkan.`,
      })
      await loadSettings()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Gagal menambahkan area baru.'),
      })
    } finally {
      setIsAddingArea(false)
    }
  }

  const toggleRule = (areaId: number, attr: string) => {
    setAreaRulesMap((prev) => ({
      ...prev,
      [areaId]: {
        ...(prev[areaId] || {}),
        [attr]: !(prev[areaId]?.[attr] ?? false),
      },
    }))
  }

  const handleSaveAreaRules = async () => {
    if (!selectedAreaId) return
    setIsSaving(true)
    setFeedback(null)
    try {
      const rulesForArea = areaRulesMap[selectedAreaId] || {}
      const payload = PPE_ATTRIBUTES.map((attr) => ({
        attribute: attr.key,
        required: Boolean(rulesForArea[attr.key]),
      }))
      await updateAreaRules(selectedAreaId, payload)
      setFeedback({
        type: 'success',
        text: 'Aturan wajib APD untuk area berhasil disimpan.',
      })
      await loadSettings()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Gagal menyimpan aturan APD area.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)
    try {
      const payload = {
        ...thresholds,
        ...(telegramToken.trim()
          ? { telegram_bot_token: telegramToken.trim() }
          : {}),
        ...(telegramChatId.trim()
          ? { telegram_chat_id: telegramChatId.trim() }
          : {}),
      }
      const updated = await updateThresholdSettings(payload)
      setThresholds(updated)
      // Never retain or display back the password Telegram token after submission
      setTelegramToken('')
      setFeedback({
        type: 'success',
        text: 'Pengaturan threshold deteksi berhasil disimpan.',
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Gagal menyimpan pengaturan threshold.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)
    try {
      const payload = {
        ...thresholds,
        ...(telegramToken.trim()
          ? { telegram_bot_token: telegramToken.trim() }
          : {}),
        ...(telegramChatId.trim()
          ? { telegram_chat_id: telegramChatId.trim() }
          : {}),
      }
      await updateThresholdSettings(payload)
      setTelegramToken('')
      setFeedback({
        type: 'success',
        text: 'Pengaturan notifikasi Telegram telah dikirim. Token tidak ditampilkan kembali demi keamanan.',
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Gagal menyimpan pengaturan Telegram.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" label="Memuat pengaturan..." />
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

  const currentArea = areas.find((a) => a.id === selectedAreaId) ?? areas[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ui-title">
          Pengaturan Sistem K3Guard
        </h1>
        <p className="text-sm text-muted-gray">
          Kelola area pantau, aturan kewajiban APD, ambang batas AI, kamera,
          dan integrasi Telegram.
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === 'success'
              ? 'border-success/25 bg-success/10 text-success'
              : 'border-critical/25 bg-critical/10 text-critical'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Area Management & PPE Rules */}
        <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-steel-blue" />
            <h2 className="ui-section">
              Manajemen Area &amp; Wajib APD
            </h2>
          </div>

          <form
            onSubmit={handleAddArea}
            className="rounded-xl border border-charcoal/10 bg-off-white/60 p-3.5 space-y-3"
          >
            <p className="text-xs font-semibold text-charcoal">
              Tambah Area Baru
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Input
                placeholder="Nama area (mis. Bengkel CNC)"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
              />
              <Input
                placeholder="Deskripsi singkat"
                value={newAreaDesc}
                onChange={(e) => setNewAreaDesc(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={isAddingArea || !newAreaName.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
              {isAddingArea ? 'Menambahkan...' : 'Tambah Area'}
            </Button>
          </form>

          {areas.length > 0 && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-gray ">
                  Pilih Area untuk Mengatur APD
                </p>
                <div className="flex flex-wrap gap-2">
                  {areas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => setSelectedAreaId(area.id)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        currentArea?.id === area.id
                          ? 'border-steel-blue bg-steel-blue text-pure-white'
                          : 'border-charcoal/15 bg-surface text-charcoal hover:bg-off-white'
                      }`}
                    >
                      {area.nama}
                    </button>
                  ))}
                </div>
              </div>

              {currentArea && (
                <div className="space-y-3 border-t border-charcoal/10 pt-4">
                  <p className="text-xs text-muted-gray">
                    Aturan APD Wajib untuk{' '}
                    <strong className="text-charcoal">
                      {currentArea.nama}
                    </strong>
                    :
                  </p>
                  <div className="space-y-2">
                    {PPE_ATTRIBUTES.map((attr) => {
                      const checked = Boolean(
                        areaRulesMap[currentArea.id]?.[attr.key]
                      )
                      return (
                        <label
                          key={attr.key}
                          className="flex items-center justify-between rounded-xl border border-charcoal/10 p-3 text-sm hover:bg-off-white/60 cursor-pointer"
                        >
                          <span className="font-medium text-charcoal">
                            {attr.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleRule(currentArea.id, attr.key)
                            }
                            className="h-4 w-4 accent-steel-blue cursor-pointer"
                          />
                        </label>
                      )
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleSaveAreaRules}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Simpan Aturan Area
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Thresholds & Fall Detection */}
        <div className="space-y-6">
          <form
            onSubmit={handleSaveThresholds}
            className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-steel-blue" />
              <h2 className="ui-section">
                Threshold Deteksi APD &amp; Insiden Jatuh
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Confidence Threshold YOLO</span>
                  <span className="font-mono font-bold text-steel-blue">
                    {thresholds.confidence_threshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={thresholds.confidence_threshold}
                  onChange={(e) =>
                    setThresholds((t) => ({
                      ...t,
                      confidence_threshold: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-steel-blue"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Sensitivitas Deteksi Jatuh (Fall Detection)</span>
                  <span className="font-mono font-bold text-safety-orange">
                    {thresholds.fall_sensitivity.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={thresholds.fall_sensitivity}
                  onChange={(e) =>
                    setThresholds((t) => ({
                      ...t,
                      fall_sensitivity: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-safety-orange"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Cooldown Notifikasi (detik)"
                  type="number"
                  min={5}
                  max={600}
                  value={thresholds.notification_cooldown_seconds}
                  onChange={(e) =>
                    setThresholds((t) => ({
                      ...t,
                      notification_cooldown_seconds: Number(e.target.value),
                    }))
                  }
                />
                <Input
                  label="Maksimal Stream Paralel"
                  type="number"
                  min={1}
                  max={16}
                  value={thresholds.max_concurrent_streams}
                  onChange={(e) =>
                    setThresholds((t) => ({
                      ...t,
                      max_concurrent_streams: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan AI'}
            </Button>
          </form>

          {/* Camera Summary & Telegram Config */}
          <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-steel-blue" />
              <h2 className="ui-section">
                Konfigurasi Kamera
              </h2>
            </div>
            {cameras.length === 0 ? (
              <p className="text-xs text-muted-gray">
                Belum ada kamera yang terdaftar di sistem.
              </p>
            ) : (
              <div className="space-y-2">
                {cameras.map((cam) => (
                  <div
                    key={cam.id}
                    className="flex items-center justify-between rounded-xl border border-charcoal/10 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-charcoal">{cam.nama}</p>
                      <p className="text-muted-gray">{cam.source}</p>
                    </div>
                    <Badge variant={cam.aktif ? 'success' : 'neutral'}>
                      {cam.aktif ? 'Aktif' : 'Offline'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSaveTelegram}
              className="border-t border-charcoal/10 pt-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-steel-blue" />
                <h3 className="ui-section">
                  Notifikasi Telegram Bot
                </h3>
              </div>
              <Input
                label="Bot Token Telegram"
                type="password"
                autoComplete="off"
                placeholder="Masukkan token bot baru (tidak ditampilkan ulang)"
                hint="Demi keamanan, token yang telah disimpan tidak ditampilkan kembali."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
              />
              <Input
                label="Chat ID Tujuan"
                type="text"
                placeholder="Contoh: -1001234567890"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={
                  isSaving ||
                  (!telegramToken.trim() && !telegramChatId.trim())
                }
              >
                <Save className="h-3.5 w-3.5" />
                Simpan Pengaturan Telegram
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
