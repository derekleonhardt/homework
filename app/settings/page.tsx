'use client'

import { useThemeContext } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeContext()

  return (
    <div className="min-h-dvh bg-[var(--color-warm-50)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="p-2 rounded-md text-[var(--color-warm-500)] hover:bg-[var(--color-warm-200)] hover:text-[var(--color-warm-600)] transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
          </Link>
          <h1 className="font-[family-name:var(--font-lora)] text-2xl font-medium text-[var(--color-warm-700)]">
            Settings
          </h1>
        </div>

        {/* Theme */}
        <section className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[var(--color-warm-700)]">Theme</h2>
              <p className="text-sm text-[var(--color-warm-500)] mt-1">
                Switch between light and dark mode.
              </p>
            </div>
            <div className="relative flex items-center p-0.5 bg-[var(--color-warm-200)] rounded-md">
              <div
                className={cn(
                  'absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-[var(--color-warm-50)] rounded transition-transform duration-200 ease-out',
                  theme === 'dark' && 'translate-x-[calc(100%+2px)]',
                )}
              />
              <button
                type="button"
                onClick={() => theme !== 'light' && toggleTheme()}
                aria-label="Light mode"
                aria-pressed={theme === 'light'}
                className={cn(
                  'relative z-10 flex items-center justify-center size-7 rounded transition-colors duration-150',
                  theme === 'light'
                    ? 'text-[var(--color-warm-700)]'
                    : 'text-[var(--color-warm-500)] hover:text-[var(--color-warm-600)]',
                )}
              >
                <Sun className="size-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => theme !== 'dark' && toggleTheme()}
                aria-label="Dark mode"
                aria-pressed={theme === 'dark'}
                className={cn(
                  'relative z-10 flex items-center justify-center size-7 rounded transition-colors duration-150',
                  theme === 'dark'
                    ? 'text-[var(--color-warm-700)]'
                    : 'text-[var(--color-warm-500)] hover:text-[var(--color-warm-600)]',
                )}
              >
                <Moon className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
