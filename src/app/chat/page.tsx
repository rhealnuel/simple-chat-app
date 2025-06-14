'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore'

export default function ChatEntryPage() {
  const router = useRouter()
  const [targetUsername, setTargetUsername] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [chatUsers, setChatUsers] = useState<string[]>([])
  const [loadingChats, setLoadingChats] = useState(true)

  // Ensure user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setCurrentUser(user)
      } else {
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [])

  // Get list of users you've chatted with
  useEffect(() => {
    if (!currentUser?.displayName) return

    const chatQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.displayName)
    )

    const unsub = onSnapshot(chatQuery, snapshot => {
      const users = new Set<string>()
      snapshot.forEach(doc => {
        const participants = doc.data().participants || []
        participants.forEach((p: string) => {
          if (p !== currentUser.displayName) users.add(p)
        })
      })
      setChatUsers(Array.from(users))
      setLoadingChats(false)
    })

    return () => unsub()
  }, [currentUser])

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault()
    const entered = targetUsername.trim().toLowerCase()
    const current = currentUser?.displayName?.toLowerCase()

    if (entered === current) {
      alert("You can't chat with yourself.")
      return
    }

    const userDoc = await getDoc(doc(db, 'users', entered))
    if (!userDoc.exists()) {
      alert('User does not exist.')
      return
    }

    router.push(`/chat/${entered}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <form onSubmit={handleStartChat} className="space-y-4 w-full max-w-md mb-8">
        <h2 className="text-2xl font-bold text-center">Start New Chat</h2>
        <input
          className="w-full p-2 border rounded"
          type="text"
          placeholder="Enter username"
          value={targetUsername}
          onChange={e => setTargetUsername(e.target.value)}
          required
        />
        <button className="w-full bg-green-600 text-white p-2 rounded">Chat</button>
      </form>

      <div className="w-full max-w-md">
        <h3 className="text-xl font-semibold mb-2">Chats</h3>
        {loadingChats ? (
          <p>Loading...</p>
        ) : chatUsers.length === 0 ? (
          <p className="text-gray-500">No chats yet.</p>
        ) : (
          <ul className="space-y-2">
            {chatUsers.map((user, idx) => (
              <li
                key={idx}
                onClick={() => router.push(`/chat/${user}`)}
                className="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
              >
                {user}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
