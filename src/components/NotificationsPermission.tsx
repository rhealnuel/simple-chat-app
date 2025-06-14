import { useEffect } from 'react'

export default function NotificationPermission() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission !== 'granted'
    ) {
      Notification.requestPermission().catch(console.error)
    }
  }, [])

  return null
}
