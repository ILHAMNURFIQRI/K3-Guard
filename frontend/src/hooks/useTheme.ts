import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'k3guard-theme'

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Tema terang/gelap. Kelas "dark" dipasang di <html>; pilihan disimpan di localStorage.
 * Tanpa pilihan tersimpan, mengikuti pengaturan sistem (skrip kecil di index.html memasangnya sebelum render).
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme)

  useEffect(() => {
    // sinkron antar komponen yang memakai hook ini (landing, login, dasbor)
    const sync = () => setThemeState(readTheme())
    window.addEventListener('k3guard-theme', sync)
    return () => window.removeEventListener('k3guard-theme', sync)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement
    root.classList.add('theme-anim')
    root.classList.toggle('dark', next === 'dark')
    window.setTimeout(() => root.classList.remove('theme-anim'), 350)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* penyimpanan dinonaktifkan: tema hanya berlaku sampai halaman dimuat ulang */
    }
    window.dispatchEvent(new Event('k3guard-theme'))
  }, [])

  const toggleTheme = useCallback(
    () => setTheme(readTheme() === 'dark' ? 'light' : 'dark'),
    [setTheme]
  )

  return { theme, setTheme, toggleTheme }
}
