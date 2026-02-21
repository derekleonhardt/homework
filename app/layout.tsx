import { ErrorBoundary } from '@/components/ErrorBoundary'
import SkipLink from '@/components/SkipLink'
import { ThemeProvider } from '@/components/ThemeProvider'
import { TooltipProvider } from '@/components/Tooltip'
import type { Metadata } from 'next'
import { DM_Sans, Inter, Lora } from 'next/font/google'
import './globals.css'

// Anti-FOUC script - storage key must match hooks/useTheme.ts
const themeScript = `
(function() {
  var stored = localStorage.getItem('homework-theme');
  var theme = stored === 'light' || stored === 'dark' ? stored : 'light';
  document.documentElement.classList.add(theme);
})();
`

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const lora = Lora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Homework',
  description: 'Your personal library for saving and organizing content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: required for anti-FOUC theme script */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${lora.variable} ${dmSans.variable} antialiased`}>
        <SkipLink />
        <ThemeProvider>
          <ErrorBoundary>
            <TooltipProvider>{children}</TooltipProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
