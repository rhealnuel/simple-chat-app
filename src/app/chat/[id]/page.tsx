'use client'

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { auth, db, storage } from '@/lib/firebase'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [chatId, setChatId] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) return router.push('/login')
      if (user.displayName === id) return router.push('/chat') // prevent self-chat
      setCurrentUser(user)
    })
    return () => unsub()
  }, [id])

  // Generate consistent chat ID (sorted alphabetically)
  const generateChatId = (user1: string, user2: string) => {
    return [user1, user2].sort().join('_')
  }

  // Load messages
  useEffect(() => {
    if (!currentUser?.displayName || !id) return

    const generatedId = generateChatId(currentUser.displayName, id as string)
    setChatId(generatedId)

    const chatRef = collection(db, 'messages', generatedId, 'messages')
    const q = query(chatRef, orderBy('timestamp'))

    const unsub = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMessages(msgs)
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    })

    return () => unsub()
  }, [currentUser, id])

  // Handle sending message
 const sendMessage = async () => {
  if (!messageText && !image) return

  try {
    let imageUrl = ''

    if (image) {
      console.log("Uploading image:", image.name)

      const imageRef = ref(storage, `chat_images/${chatId}/${Date.now()}_${image.name}`)
      const snapshot = await uploadBytes(imageRef, image)

      console.log("Image uploaded to:", snapshot.ref.fullPath)

      imageUrl = await getDownloadURL(snapshot.ref)

      console.log("Image URL:", imageUrl)
    }

    const msgRef = collection(db, 'messages', chatId, 'messages')

    await addDoc(msgRef, {
      text: messageText || '',
      imageUrl,
      sender: currentUser.displayName,
      timestamp: serverTimestamp(),
      participants: [currentUser.displayName, id]
    })

    await setDoc(doc(db, 'messages', chatId), {
      participants: [currentUser.displayName, id]
    }, { merge: true })

    setMessageText('')
    setImage(null)
  } catch (err) {
    console.error("Error sending message:", err)
  }
}


  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <h2 className="text-xl font-bold mb-4">Chat with {id}</h2>

      <div className="w-full max-w-md flex-1 overflow-y-auto border p-4 rounded bg-white mb-4">
        {messages.map((msg, idx) => (
         <div
  key={idx}
  className={`mb-3 flex ${
    msg.sender === currentUser?.displayName ? 'justify-end' : 'justify-start'
  }`}
>
  <div
    className={`max-w-[70%] break-words whitespace-pre-wrap p-2 rounded-lg ${
      msg.sender === currentUser?.displayName
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-black'
    }`}
  >
    {msg.text && <p>{msg.text}</p>}
    {msg.imageUrl && (
      <img
        src={msg.imageUrl}
        alt="sent"
        className="max-w-full rounded mt-2 border"
      />
    )}
  </div>
</div>
        ))}
        <div ref={scrollRef}></div>
      </div>

      <div className="w-full max-w-md flex items-center gap-2">
        <input
          type="text"
          placeholder="Type message"
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          className="flex-1 border p-2 rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files?.[0] || null)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  )
}
