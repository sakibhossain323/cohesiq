import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// Cohesiq design system: display / heading font
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

// Cohesiq design system: body / UI font
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

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
    <ClerkProvider>
      <html
        lang="en"
        className={`bg-background ${plusJakartaSans.variable} ${dmSans.variable}`}
        suppressHydrationWarning
      >
        <body className="antialiased" suppressHydrationWarning>
          <ThemeProvider>
            {children}
            <Toaster />
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
