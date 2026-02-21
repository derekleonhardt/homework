'use client'

import { useEffect, useState } from 'react'

export function useIsTouchDevice(): boolean | undefined {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error msMaxTouchPoints is IE-specific
      navigator.msMaxTouchPoints > 0

    setIsTouchDevice(hasTouch)
  }, [])

  return isTouchDevice
}
