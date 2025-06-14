'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [targetId, setTargetId] = useState('')
  const router = useRouter()

  const handleStartChat = () => {
    if (!targetId.trim()) return alert('Please enter a user ID')

    // Create a guest ID and store in localStorage if not already saved
    let guestId = localStorage.getItem('guest_id')
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 10)
      localStorage.setItem('guest_id', guestId)
    }

    // Navigate to chat page with target ID
    router.push(`/chat/${targetId.trim()}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-4 text-center">Start a Chat</h1>
        <input
          type="text"
          placeholder="Enter user ID (e.g. kawe123)"
          className="w-full p-3 border rounded-lg mb-4"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
        />
        <button
          onClick={handleStartChat}
          className="w-full bg-blue-600 text-white cursor-pointer py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Start Chat
        </button>
      </div>
    </div>
  )
}
