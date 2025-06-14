// components/NotificationPermission.tsx
'use client'

import { useEffect } from 'react'

export default function NotificationPermission() {
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  return null // no UI needed
}
