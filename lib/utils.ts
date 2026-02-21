import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CONTENT_GRADIENTS: Record<string, string> = {
  article: 'linear-gradient(145deg, #D4A574 0%, #8B6914 100%)',
  video: 'linear-gradient(145deg, #8B4B5C 0%, #5C2A3A 100%)',
  post: 'linear-gradient(145deg, #6B8CAE 0%, #3D5A73 100%)',
  podcast: 'linear-gradient(145deg, #7D9B7A 0%, #4A5D48 100%)',
  book: 'linear-gradient(145deg, #8B7355 0%, #5C4A3A 100%)',
  note: 'linear-gradient(145deg, #C9B896 0%, #8A7D5A 100%)',
  default: 'linear-gradient(145deg, #A69F8F 0%, #5C564C 100%)',
}

export function getContentGradient(type: string): string {
  return CONTENT_GRADIENTS[type.toLowerCase()] ?? CONTENT_GRADIENTS.default
}

export function getCardImageSrc(imageUrl: string): string {
  try {
    const parsed = new URL(imageUrl)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return `/api/image?url=${encodeURIComponent(imageUrl)}`
    }
  } catch {
    // Fall through to raw URL for invalid inputs.
  }
  return imageUrl
}
