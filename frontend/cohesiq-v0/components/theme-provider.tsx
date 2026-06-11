'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'cohesiq-theme'
const ThemeContext = React.createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
} | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('light')

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    const initialTheme = storedTheme === 'dark' ? 'dark' : 'light'
    setThemeState(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Drop-in icon button that toggles light/dark using the Cohesiq token palette. */
export function ThemeToggle({ className }: { className?: string }) {
  const themeContext = React.useContext(ThemeContext)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const buttonClassName = cn(
    'inline-grid size-10 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent',
    className
  )

  if (!mounted) {
    // Prevent hydration mismatch by rendering the same shell before mount.
    return (
      <button
        type="button"
        className={buttonClassName}
        suppressHydrationWarning
        aria-label="Toggle theme"
      />
    )
  }

  const isDark = themeContext?.theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => themeContext?.setTheme(isDark ? 'light' : 'dark')}
      className={buttonClassName}
      suppressHydrationWarning
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
