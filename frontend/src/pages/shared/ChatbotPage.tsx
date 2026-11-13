import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Cog, Flame, HardHat, RotateCcw, Zap } from 'lucide-react'
import { ChatMessage, type ChatBubbleItem } from '@/components/chatbot/ChatMessage'
import { ChatInput } from '@/components/chatbot/ChatInput'
import { TypingIndicator } from '@/components/chatbot/TypingIndicator'
import { AssistantOrb } from '@/components/chatbot/AssistantOrb'
import { sendChatMessage } from '@/services/dashboard'
import { getApiErrorMessage } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

// Pertanyaan contoh diambil dari topik yang benar-benar ada di dokumen SOP bengkel mesin.
const SUGGESTIONS = [
  { icon: HardHat, title: 'APD wajib', ask: 'APD apa saja yang wajib digunakan di bengkel mesin?' },
  { icon: Cog, title: 'Mesin bubut', ask: 'Apa aturan keselamatan saat memakai mesin bubut?' },
  { icon: Zap, title: 'Tersengat listrik', ask: 'Apa yang harus dilakukan jika ada yang tersengat listrik?' },
  { icon: Flame, title: 'Kebakaran', ask: 'Bagaimana cara memakai APAR saat terjadi kebakaran?' },
]

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Riwayat disimpan per akun di sessionStorage: bertahan saat pindah halaman dan refresh, hilang saat tab ditutup.
interface SavedChat {
  sessionId: string
  messages: ChatBubbleItem[]
}

function loadChat(key: string): SavedChat | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as SavedChat) : null
  } catch {
    return null
  }
}

const nowTime = () =>
  new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

export const ChatbotPage: React.FC = () => {
  const { user } = useAuth()
  const storageKey = `k3guard-chat-${user?.id ?? 'anon'}`
  const [saved] = useState(() => loadChat(storageKey))
  const [sessionId, setSessionId] = useState<string>(() => saved?.sessionId ?? createSessionId())
  // sapaan lama ("welcome") tidak lagi dipakai; layar kosong sekarang berisi sapaan sendiri
  const [messages, setMessages] = useState<ChatBubbleItem[]>(() =>
    (saved?.messages ?? []).filter((m) => !m.id.startsWith('welcome'))
  )
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [serviceNotConfigured, setServiceNotConfigured] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const hasChat = messages.length > 0
  const firstName = user?.nama?.split(' ')[0] ?? ''

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ sessionId, messages }))
    } catch {
      /* penyimpanan penuh atau dinonaktifkan: riwayat hanya di memori */
    }
  }, [storageKey, sessionId, messages])

  useEffect(() => {
    if (hasChat) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending, hasChat])

  const handleSend = async (questionText?: string) => {
    const pertanyaan = (questionText ?? input).trim()
    if (!pertanyaan || isSending) return

    setErrorBanner(null)
    if (!questionText) setInput('')

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text: pertanyaan, timestamp: nowTime() },
    ])
    setIsSending(true)

    try {
      const res = await sendChatMessage({ session_id: sessionId, pertanyaan })

      if (res.session_id) setSessionId(res.session_id)
      if (res.jawaban.toLowerCase().includes('belum dikonfigurasi')) setServiceNotConfigured(true)

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, sender: 'ai', text: res.jawaban, sources: res.sumber, timestamp: nowTime() },
      ])
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Gagal memperoleh jawaban dari Asisten AI.')
      setErrorBanner(msg)
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, sender: 'ai', text: msg, timestamp: nowTime(), isError: true },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleResetChat = () => {
    setSessionId(createSessionId())
    setErrorBanner(null)
    setMessages([])
  }

  const banners = (
    <>
      {serviceNotConfigured && (
        <div className="mb-3 flex items-start gap-3 rounded-2xl border border-warning/35 bg-warning/10 p-3.5 text-sm text-[#7a5600] dark:text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">Layanan chatbot belum dikonfigurasi</p>
            <p className="mt-0.5 text-xs">
              Server LLM belum aktif. Pertanyaanmu tetap dicatat agar bisa ditinjau petugas K3.
            </p>
          </div>
        </div>
      )}
      {errorBanner && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-critical/25 bg-critical/10 px-4 py-2.5 text-xs font-medium text-critical">
          <span>{errorBanner}</span>
          <button type="button" onClick={() => setErrorBanner(null)} className="cursor-pointer font-semibold underline">
            Tutup
          </button>
        </div>
      )}
    </>
  )

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <AnimatePresence mode="wait" initial={false}>
        {!hasChat ? (
          <motion.div
            key="hero"
            className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-6 text-center"
            exit={{ opacity: 0, y: -12, transition: { duration: 0.18 } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 16 }}
            >
              <AssistantOrb size={124} thinking={isSending} />
            </motion.div>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4, ease: 'easeOut' }}
            >
              <p className="text-xl font-semibold text-muted-gray">Halo{firstName ? `, ${firstName}` : ''}</p>
              <h1 className="ui-hero mt-1 text-charcoal">Ada yang bisa dibantu soal K3?</h1>
              <p className="ui-lead mx-auto mt-3 max-w-md">
                Tanyakan aturan APD, keselamatan mesin, atau langkah darurat. Setiap jawaban disertai sumber SOP.
              </p>
            </motion.div>

            <motion.div
              className="mt-8 w-full text-left"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4, ease: 'easeOut' }}
            >
              {banners}
              <ChatInput value={input} onChange={setInput} onSubmit={() => handleSend()} disabled={isSending} autoFocus />
            </motion.div>

            <motion.div
              className="mt-4 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.34 } } }}
            >
              {SUGGESTIONS.map(({ icon: Icon, title, ask }) => (
                <motion.button
                  key={title}
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSend(ask)}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className="group flex cursor-pointer items-start gap-3 text-left rounded-2xl border border-charcoal/10 bg-surface/70 p-4 backdrop-blur-sm transition-colors hover:border-steel-blue/50 hover:bg-surface disabled:opacity-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-steel-blue/10 text-steel-blue transition-colors group-hover:bg-steel-blue group-hover:text-pure-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-charcoal">{title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-gray">{ask}</span>
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            className="mx-auto flex w-full max-w-3xl flex-1 flex-col"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-charcoal/10 pb-4 pt-1">
              <div className="flex items-center gap-3">
                <AssistantOrb size={40} thinking={isSending} />
                <div>
                  <h1 className="ui-section">Asisten K3</h1>
                  <p className="text-xs text-muted-gray">Dijawab dari dokumen SOP resmi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetChat}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-charcoal/15 bg-surface px-3.5 text-xs font-semibold text-charcoal transition-colors hover:border-steel-blue/50 hover:text-steel-blue"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Sesi baru
              </button>
            </div>

            <div className="flex-1 space-y-6 py-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isSending && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            <div className="sticky bottom-4 z-10 pt-4">
              {banners}
              <ChatInput value={input} onChange={setInput} onSubmit={() => handleSend()} disabled={isSending} autoFocus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
