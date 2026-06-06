'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      storageKey="cohesiq-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

/** Drop-in icon button that toggles light/dark using the Cohesiq token palette. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Prevent hydration mismatch — render a placeholder with same dimensions
    return (
      <button
        className={className}
        style={{
          width: 38, height: 38, borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-elevated)',
          display: 'grid', placeItems: 'center',
          transition: 'all .2s ease',
        }}
        aria-label="Toggle theme"
        disabled
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      style={{
        width: 38, height: 38, borderRadius: 'var(--radius-full)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface-elevated)',
        color: 'var(--color-text-primary)',
        display: 'grid', placeItems: 'center',
        transition: 'all .2s ease',
        cursor: 'pointer',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        /* Sun icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round"/>
        </svg>
      ) : (
        /* Moon icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
