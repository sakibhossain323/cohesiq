import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cohesiq - Match Creators and Brands in Bangladesh',
  description: 'The smart way to match influencers and brands in Bangladesh. Find creators, post campaigns, and grow together.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="bg-background"
      style={
        {
          '--font-display': '"Plus Jakarta Sans", "Avenir Next", "Segoe UI", system-ui, sans-serif',
          '--font-body': '"DM Sans", "Avenir Next", "Segoe UI", system-ui, sans-serif',
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <ClerkProvider>
          <ThemeProvider>
            {children}
            <Toaster />
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
