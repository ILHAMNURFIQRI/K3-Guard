import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  HardHat,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/services/api'

type Focus = 'none' | 'username' | 'password'
type Spring = MotionValue<number>

const INPUT_CLS =
  'h-12 w-full rounded-xl border border-pure-white/15 bg-night/55 pl-11 pr-4 text-sm text-pure-white placeholder:text-pure-white/45 outline-none transition-all duration-200 focus:border-safety-orange focus:bg-night/70 focus:ring-4 focus:ring-safety-orange/25 disabled:opacity-60'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
}
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 220, damping: 22 } },
}

/* ---------- latar: gelembung melayang yang ikut bergeser mengikuti kursor ---------- */

const BUBBLES = [
  { size: 92, left: '8%', top: '12%', color: 'steel-blue', depth: 22, dur: 8 },
  { size: 58, left: '86%', top: '9%', color: 'industrial-blue', depth: 30, dur: 7 },
  { size: 44, left: '93%', top: '42%', color: 'safety-orange', depth: 16, dur: 9 },
  { size: 66, left: '12%', top: '76%', color: 'industrial-blue', depth: 26, dur: 10 },
  { size: 38, left: '47%', top: '90%', color: 'steel-blue', depth: 12, dur: 6 },
  { size: 74, left: '82%', top: '84%', color: 'safety-orange', depth: 20, dur: 11 },
]

const Bubble: React.FC<{ b: (typeof BUBBLES)[number]; sx: Spring; sy: Spring; still: boolean }> = ({
  b,
  sx,
  sy,
  still,
}) => {
  const x = useTransform(sx, (v) => v * -b.depth)
  const y = useTransform(sy, (v) => v * -b.depth)
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: b.left, top: b.top, x, y }}>
      <motion.div
        className="rounded-full"
        style={{
          width: b.size,
          height: b.size,
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), color-mix(in srgb, var(--color-${b.color}) 40%, transparent) 70%)`,
          boxShadow: `0 8px 24px color-mix(in srgb, var(--color-${b.color}) 22%, transparent)`,
        }}
        animate={still ? undefined : { y: [0, -20, 0], x: [0, 8, 0] }}
        transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

/* ---------- ilustrasi kiri: maskot yang bereaksi terhadap isian form ---------- */

const FloatChip: React.FC<{
  className: string
  delay: number
  children: React.ReactNode
  still: boolean
}> = ({ className, delay, children, still }) => (
  <motion.div
    className={`absolute flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/10 bg-surface shadow-lg ${className}`}
    initial={{ opacity: 0, scale: 0.6 }}
    animate={{ opacity: 1, scale: 1, y: still ? 0 : [0, -9, 0] }}
    transition={{
      opacity: { delay: 0.6 + delay, duration: 0.4 },
      scale: { delay: 0.6 + delay, type: 'spring', stiffness: 260, damping: 15 },
      y: { delay, duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' },
    }}
  >
    {children}
  </motion.div>
)

const MascotScene: React.FC<{ message: string; sx: Spring; sy: Spring; still: boolean; onPoke: () => void }> = ({
  message,
  sx,
  sy,
  still,
  onPoke,
}) => {
  const jump = useAnimationControls()
  const rotateY = useTransform(sx, (v) => v * 9)
  const rotateX = useTransform(sy, (v) => v * -5)

  const poke = () => {
    onPoke()
    jump.start({
      y: [0, -50, 0],
      scaleY: [1, 1.05, 0.95, 1],
      scaleX: [1, 0.97, 1.04, 1],
      transition: { duration: 0.6, ease: 'easeOut' },
    })
  }

  return (
    <div className="relative mx-auto h-[390px] w-[340px]" style={{ perspective: 900 }}>
      {/* halo + cincin sonar */}
      <div
        className="absolute left-1/2 top-[54%] h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--color-steel-blue) 22%, transparent), color-mix(in srgb, var(--color-steel-blue) 6%, transparent) 75%, transparent)',
        }}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-1/2 top-[54%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            className="h-full w-full rounded-full border-2 border-steel-blue/40"
            animate={still ? { scale: 1.1, opacity: 0.35 } : { scale: [0.7, 1.45], opacity: [0.55, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: i * 1.2, ease: 'easeOut' }}
          />
        </div>
      ))}

      {/* alas */}
      <div className="absolute bottom-[14px] left-1/2 h-6 w-[200px] -translate-x-1/2 rounded-[50%] bg-steel-blue/20" />
      <div className="absolute bottom-[22px] left-1/2 h-3 w-24 -translate-x-1/2 rounded-[50%] bg-charcoal/25 blur-sm" />

      {/* maskot */}
      <motion.div
        className="absolute bottom-[22px] left-1/2 h-[350px] w-[176px] -translate-x-1/2"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', originY: 1 }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.35 }}
      >
        <motion.div
          className="h-full w-full"
          style={{ originY: 1 }}
          animate={still ? undefined : { y: [0, -9, 0], scaleY: [1, 1.012, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div className="h-full w-full" style={{ originY: 1 }} animate={jump}>
            <button
              type="button"
              onClick={poke}
              aria-label="Colek maskot"
              className="block h-full w-full cursor-pointer select-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-steel-blue"
            >
              <img
                src="/mascot.webp"
                alt="Maskot K3Guard"
                width={896}
                height={1776}
                draggable={false}
                className="h-full w-full object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.18)]"
              />
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ikon melayang */}
      <FloatChip className="left-1 top-[30%]" delay={0} still={still}>
        <ShieldCheck className="h-5 w-5 text-steel-blue" />
      </FloatChip>
      <FloatChip className="bottom-[26%] right-0" delay={0.7} still={still}>
        <HardHat className="h-5 w-5 text-safety-orange" />
      </FloatChip>
      <FloatChip className="left-[12%] top-[6%]" delay={1.3} still={still}>
        <motion.span
          style={{ originY: 0 }}
          animate={still ? undefined : { rotate: [0, -16, 16, -10, 10, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
        >
          <Bell className="h-5 w-5 text-safety-orange" />
        </motion.span>
      </FloatChip>

      {/* balon ucapan: berubah sesuai apa yang sedang dilakukan pengguna */}
      <div className="pointer-events-none absolute right-[-14px] top-[2px] w-[150px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            role="status"
            aria-live="polite"
            className="relative rounded-2xl rounded-bl-sm border border-charcoal/10 bg-surface px-3.5 py-2.5 text-[13px] leading-snug text-charcoal shadow-lg"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            {message}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ---------- halaman ---------- */

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const reduce = useReducedMotion() ?? false

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focus, setFocus] = useState<Focus>('none')
  const [pokeMsg, setPokeMsg] = useState<string | null>(null)
  const shake = useAnimationControls()

  // kursor -> pergeseran halus latar dan kemiringan maskot (tanpa render ulang React)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 18 })
  const sy = useSpring(my, { stiffness: 80, damping: 18 })
  useEffect(() => {
    if (reduce) return
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduce, mx, my])

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'officer' ? '/dashboard/officer' : '/dashboard/student', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (!pokeMsg) return
    const t = window.setTimeout(() => setPokeMsg(null), 2600)
    return () => window.clearTimeout(t)
  }, [pokeMsg])

  const doShake = () => {
    if (reduce) return
    shake.start({ x: [0, -10, 10, -8, 8, -4, 0], transition: { duration: 0.45 } })
  }

  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {}
    if (!username.trim()) errors.username = 'Username wajib diisi.'
    if (!password) errors.password = 'Kata sandi wajib diisi.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) {
      doShake()
      return
    }

    setIsSubmitting(true)
    try {
      const loggedUser = await login(username.trim(), password)
      navigate(loggedUser.role === 'officer' ? '/dashboard/officer' : '/dashboard/student', {
        replace: true,
      })
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Username atau kata sandi tidak sesuai.'))
      doShake()
    } finally {
      setIsSubmitting(false)
    }
  }

  // urutan prioritas pesan maskot
  const message =
    pokeMsg ??
    (submitError
      ? 'Ups, cek lagi username dan kata sandimu ya.'
      : isSubmitting
        ? 'Sebentar, aku cek dulu ya...'
        : showPassword && password
          ? 'Awas, jangan sampai ada yang lihat ya!'
          : focus === 'password'
            ? 'Tenang, kata sandimu aman.'
            : focus === 'username'
              ? 'Ketik username kamu di sini.'
              : 'Halo! Masuk untuk mulai memantau K3.')

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-off-white px-4 pb-10 pt-20"
      style={{
        backgroundImage:
          'radial-gradient(900px 500px at 8% 0%, color-mix(in srgb, var(--color-industrial-blue) 14%, transparent), transparent 70%), radial-gradient(800px 500px at 100% 100%, color-mix(in srgb, var(--color-safety-orange) 11%, transparent), transparent 70%)',
      }}
    >
      {BUBBLES.map((b) => (
        <Bubble key={`${b.left}-${b.top}`} b={b} sx={sx} sy={sy} still={reduce} />
      ))}

      {/* navigasi kembali ke landing page, kiri atas */}
      <motion.div
        className="absolute left-4 top-4 z-20"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <Link
          to="/"
          className="group flex h-10 items-center gap-2 rounded-xl border border-charcoal/10 bg-surface px-3.5 text-sm font-semibold text-charcoal transition-colors hover:border-steel-blue/50 hover:text-steel-blue"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Beranda
        </Link>
      </motion.div>

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* bentuk gelombang pemisah panel (satuan relatif terhadap panel kiri) */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id="login-wave" clipPathUnits="objectBoundingBox">
            <path d="M0,0 H0.965 C0.995,0.14 0.93,0.28 0.925,0.46 C0.92,0.64 0.995,0.82 0.975,1 H0 Z" />
          </clipPath>
        </defs>
      </svg>

      <motion.div
        className="relative z-10 w-full max-w-[1000px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#202A30] via-[#24546A] to-[#3B7894] shadow-2xl lg:min-h-[640px]"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 130, damping: 18 }}
      >
        {/* garis warna di atas kartu + kilau yang berjalan */}
        <div className="absolute inset-x-0 top-0 z-30 h-1 overflow-hidden bg-gradient-to-r from-[#202A30] via-[#3B7894] to-[#F28C28]">
          {!reduce && (
            <motion.div
              className="h-full w-1/4 bg-pure-white/60 blur-[2px]"
              animate={{ x: ['-100%', '420%'] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
            />
          )}
        </div>

        {/* panel kiri: putih dengan tepi bergelombang */}
        <div
          className="absolute inset-y-0 left-0 hidden w-[58%] lg:block"
          style={{ filter: 'drop-shadow(10px 0 18px rgba(6,18,28,0.35))' }}
        >
          <div className="flex h-full flex-col bg-surface py-9 pl-10 pr-[13%]" style={{ clipPath: 'url(#login-wave)' }}>
            <Link to="/" className="inline-flex items-center gap-2.5 self-start">
              <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
              <span className="font-heading text-lg font-extrabold tracking-tight text-charcoal">
                K3Guard <span className="text-safety-orange">AI</span>
              </span>
            </Link>

            <div className="flex flex-1 items-center justify-center">
              <MascotScene
                message={message}
                sx={sx}
                sy={sy}
                still={reduce}
                onPoke={() => setPokeMsg('Hehe, geli! Isi formnya dulu ya.')}
              />
            </div>

            <div>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-charcoal">
                Cegah sebelum celaka
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-gray">
                Pantau APD, deteksi orang jatuh, dan tanya SOP bersama K3Guard AI.
              </p>
              <p className="mt-4 text-[11px] text-muted-gray">
                Butuh bantuan? Hubungi petugas K3 laboratorium Anda.
              </p>
            </div>
          </div>
        </div>

        {/* panel kanan: form */}
        <div className="relative z-10 ml-auto flex w-full flex-col justify-center px-7 py-10 sm:px-12 lg:w-[46%] lg:px-12 lg:py-12">
          <Link to="/" className="mb-8 inline-flex items-center gap-2.5 self-start lg:hidden">
            <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
            <span className="font-heading text-lg font-extrabold tracking-tight text-pure-white">
              K3Guard <span className="text-safety-orange">AI</span>
            </span>
          </Link>

          <motion.div animate={shake} className="w-full max-w-sm lg:max-w-none">
            <motion.h1
              className="font-heading text-4xl font-extrabold tracking-tight text-pure-white"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
            >
              Masuk
            </motion.h1>
            <motion.p
              className="mt-1.5 text-sm text-pure-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Akses dashboard pemantauan dan asisten K3.
            </motion.p>

            <AnimatePresence initial={false}>
              {submitError && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-300/40 bg-critical/30 p-3 text-xs font-medium text-red-50"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              onSubmit={handleSubmit}
              noValidate
              className="mt-6 space-y-4"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={rise}>
                <label htmlFor="username" className="mb-1.5 block text-xs font-bold text-pure-white">
                  Username
                </label>
                <div className="relative">
                  <User
                    className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                      focus === 'username' ? 'text-safety-orange' : 'text-pure-white/50'
                    }`}
                  />
                  <input
                    id="username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="mahasiswa atau petugask3"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocus('username')}
                    onBlur={() => setFocus('none')}
                    disabled={isSubmitting}
                    aria-invalid={!!fieldErrors.username}
                    className={INPUT_CLS}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="mt-1.5 text-xs font-medium text-red-200">{fieldErrors.username}</p>
                )}
              </motion.div>

              <motion.div variants={rise}>
                <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-pure-white">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock
                    className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                      focus === 'password' ? 'text-safety-orange' : 'text-pure-white/50'
                    }`}
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocus('password')}
                    onBlur={() => setFocus('none')}
                    disabled={isSubmitting}
                    aria-invalid={!!fieldErrors.password}
                    className={`${INPUT_CLS} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded px-1.5 py-1 text-xs font-bold text-pure-white/80 transition-colors hover:text-safety-orange"
                  >
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-200">{fieldErrors.password}</p>
                )}
              </motion.div>

              <motion.div variants={rise}>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-safety-orange to-[#f7a94c] text-sm font-extrabold text-night shadow-[0_12px_26px_-10px_rgba(242,140,40,0.8)] transition-shadow hover:shadow-[0_16px_30px_-10px_rgba(242,140,40,0.95)] disabled:cursor-wait disabled:opacity-85"
                >
                  <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-pure-white/40 transition-transform duration-700 group-hover:translate-x-[520%]" />
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Masuk
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </motion.button>
              </motion.div>

            </motion.form>

            <p className="mt-7 text-center text-xs text-pure-white/65">
              Akun dibuat oleh petugas K3. Hubungi petugas jika belum punya akun.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
