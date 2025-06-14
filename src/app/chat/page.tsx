'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  Timestamp,
} from 'firebase/firestore'
import toast from 'react-hot-toast'

type ChatPreview = {
  user: string
  text: string
  timestamp: Timestamp
  unread: boolean
  profileImage?: string // 👈 new
}

export default function ChatEntryPage() {
  const router = useRouter()
  const [targetUsername, setTargetUsername] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([])
  const [loadingChats, setLoadingChats] = useState(true)

  // Auth check
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

  // Fetch chat users + messages
  useEffect(() => {
    if (!currentUser?.displayName) return

    const chatQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.displayName)
    )

    const unsub = onSnapshot(chatQuery, snapshot => {
      const chatUpdates: ChatPreview[] = []
      const unsubList: (() => void)[] = []

      snapshot.forEach(chatDoc => {
        const chatId = chatDoc.id
        const data = chatDoc.data()
        const otherUser = data.participants.find((p: string) => p !== currentUser.displayName)
        if (!otherUser) return

        const messagesQuery = query(
          collection(db, 'messages', chatId, 'messages'),
          orderBy('timestamp', 'desc'),
          limit(1)
        )

        const msgUnsub = onSnapshot(messagesQuery, msgSnap => {
          if (!msgSnap.empty) {
            const msg = msgSnap.docs[0].data()
            const isUnread = msg.sender !== currentUser.displayName && !msg.readBy?.includes(currentUser.displayName)
            const previewText = msg.text
              ? msg.text
              : msg.imageUrl
              ? '📷 Image'
              : ''

            const preview: ChatPreview = {
                user: otherUser,
                text: previewText,
                timestamp: msg.timestamp,
                unread: isUnread,
                }
          if (isUnread && Notification.permission === 'granted') {
      new Notification(`New message from ${otherUser}`, {
        body: previewText,
        icon: preview.profileImage || '/default-avatar.png',
      })
    }

    if (isUnread) {
  toast(`${msg.sender}: ${msg.text || '📷 Image'}`, { icon: '💬' })
}

               getDoc(doc(db, 'users', otherUser)).then(userSnap => {
                const userData = userSnap.data()
                if (userData?.photoURL) {
                    preview.profileImage = userData.photoURL
                }

                setChatPreviews(prev => {
                    const filtered = prev.filter(p => p.user !== otherUser)
                    return [...filtered, preview].sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
                })
                })

            setChatPreviews(prev => {
              const filtered = prev.filter(p => p.user !== otherUser)
              return [...filtered, preview].sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
            })
            
          }
        })

        unsubList.push(msgUnsub)
      })

      setLoadingChats(false)
      return () => unsubList.forEach(u => u())
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
  <div className="min-h-screen flex flex-col">
    {/* Main Header - Sticky */}
    <div className="w-full flex items-center justify-between p-4 border-b shadow-sm bg-white sticky top-0 z-20">
      {currentUser?.photoURL ? (
        <img
          src={currentUser.photoURL}
          alt="profile"
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-300" />
      )}

      <h2 className="text-xl font-bold">{currentUser?.displayName}</h2>

      <button
        onClick={async () => {
          await auth.signOut()
          router.push('/login')
        }}
        className="text-red-600 font-semibold hover:underline"
      >
        Logout
      </button>
    </div>

    {/* Scrollable content */}
    <div className="flex-1 overflow-y-auto px-4">
      {/* Search Form (will scroll out) */}
      <form
        onSubmit={handleStartChat}
        className="space-y-4 w-full max-w-md mx-auto my-6"
      >
        <h2 className="text-2xl font-bold text-center">Start New Chat</h2>
        <input
          className="w-full p-2 border rounded"
          type="text"
          placeholder="Enter username"
          value={targetUsername}
          onChange={(e) => setTargetUsername(e.target.value)}
          required
        />
        <button className="w-full bg-green-600 text-white p-2 rounded">
          Chat
        </button>
      </form>

      {/* Chats Section */}
      <div className="w-full max-w-md mx-auto pb-8">
        {/* Sticky Chats Heading */}
        <h3 className="text-xl font-semibold mb-2 sticky top-[72px] z-10 bg-white py-2">
          Chats
        </h3>

        {loadingChats ? (
          <p>Loading...</p>
        ) : chatPreviews.length === 0 ? (
          <p className="text-gray-500">No chats yet.</p>
        ) : (
          <ul className="space-y-2">
            {chatPreviews.map((chat, idx) => (
              <li
                key={idx}
                onClick={() => router.push(`/chat/${chat?.user}`)}
                className="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  {chat?.profileImage ? (
                    <img
                      src={chat?.profileImage}
                      alt="profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300" />
                  )}

                  <div className="flex flex-col">
                    <span className="font-semibold">{chat?.user}</span>
                    <span className="text-sm text-gray-600 max-w-[160px] truncate">
                      {chat?.text}
                    </span>
                  </div>
                </div>

                <div className="text-right ml-2">
                  {chat?.unread && (
                    <span className="text-red-500 text-xs font-bold">●</span>
                  )}
                  <span className="text-xs text-gray-500 block">
                    {chat.timestamp?.toDate().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
)


}
