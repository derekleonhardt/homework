'use client'

import { useCallback, useEffect, useRef } from 'react'

const DEFAULT_DELAY = 500
const DEFAULT_MOVEMENT_THRESHOLD = 10

interface UseLongPressOptions {
  /** Callback fired after long press completes. Should be memoized with useCallback. */
  onLongPress: () => void
  /** Delay in ms before long press triggers (default: 500) */
  delay?: number
  /** Max movement in px before canceling (default: 10) */
  movementThreshold?: number
}

interface UseLongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchCancel: () => void
  onClick: (e: React.MouseEvent) => void
}

export function useLongPress({
  onLongPress,
  delay = DEFAULT_DELAY,
  movementThreshold = DEFAULT_MOVEMENT_THRESHOLD,
}: UseLongPressOptions): UseLongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const callbackRef = useRef(onLongPress)
  const longPressTriggeredRef = useRef(false)

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = onLongPress
  }, [onLongPress])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!e.touches?.[0]) return

      longPressTriggeredRef.current = false
      const touch = e.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }

      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true
        callbackRef.current()
        timerRef.current = null
      }, delay)
    },
    [delay],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current || !timerRef.current) return
      if (!e.touches?.[0]) return

      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)

      if (dx > movementThreshold || dy > movementThreshold) {
        clear()
      }
    },
    [clear, movementThreshold],
  )

  const onClick = useCallback((e: React.MouseEvent) => {
    if (longPressTriggeredRef.current) {
      e.preventDefault()
      e.stopPropagation()
      longPressTriggeredRef.current = false
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    clear()
    // Reset flag after a short delay to allow click to be prevented
    setTimeout(() => {
      longPressTriggeredRef.current = false
    }, 100)
  }, [clear])

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onTouchCancel: clear,
    onClick,
  }
}
