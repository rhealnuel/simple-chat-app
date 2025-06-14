'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GuestPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')

  const handleStart = () => {
    if (!userId.trim()) return
    router.push(`/guest-chat?to=${userId.trim()}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Start Chat as Guest</h2>

        <input
          type="text"
          placeholder="Enter user ID to chat with"
          className="w-full p-2 border rounded mb-4"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <button
          onClick={handleStart}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Start Chat
        </button>
      </div>
    </div>
  )
}
