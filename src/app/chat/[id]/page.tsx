'use client'

import {
addDoc,
  collection,
  doc,
  getDoc, // 👈 ADD THIS
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
import { IoImagesOutline } from 'react-icons/io5'
import {uploadImageToCloudinary } from '@/lib/cloudinary-upload'


interface ChatMessage {
  id: string;
  text?: string;
  imageUrl?: string;
  sender: string;
  timestamp?: any;
  readBy?: string[];
}
export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [chatId, setChatId] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [chatPartner, setChatPartner] = useState<{ username: string; photoURL?: string } | null>(null)

  const generateChatId = (user1: string, user2: string) => {
    return [user1, user2].sort().join('_')
  }

  // Auth check
  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async user => {
    if (!user) return router.push('/login')
    if (user.displayName === id) return router.push('/chat')
    setCurrentUser(user)

    const docSnap = await getDoc(doc(db, 'users', id as string))
    if (docSnap.exists()) {
      const data = docSnap.data()
      setChatPartner({ username: data.username, photoURL: data.photoURL })
    }
  })
  return () => unsub()
}, [id])
  // Load messages
  useEffect(() => {
  if (!currentUser?.displayName || !id) return

  const generatedId = generateChatId(currentUser.displayName, id as string)
  setChatId(generatedId)

  const chatRef = collection(db, 'messages', generatedId, 'messages')
  const q = query(chatRef, orderBy('timestamp'))

  const unsub = onSnapshot(q, async (snapshot) => {
    const updates: Promise<void>[] = []

    const msgs: ChatMessage[] = snapshot.docs.map((docSnap) => {
  const data = docSnap.data() as ChatMessage;
  const msg: ChatMessage = { id: docSnap.id, ...data };

  if (
    msg.sender !== currentUser.displayName &&
    (!msg.readBy || !msg.readBy.includes(currentUser.displayName))
  ) {
    const msgRef = doc(db, 'messages', generatedId, 'messages', docSnap.id);
    updates.push(
      setDoc(
        msgRef,
        {
          readBy: [...(msg.readBy || []), currentUser.displayName],
        },
        { merge: true }
      )
    );
  }

  return msg;

    })

    await Promise.all(updates)
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
        imageUrl = await uploadImageToCloudinary(image);

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
      <div className="w-full max-w-md flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    {chatPartner?.photoURL ? (
      <img
        src={chatPartner.photoURL}
        alt={chatPartner.username}
        className="w-10 h-10 rounded-full object-cover"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-gray-300" />
    )}
    <h2 className="text-lg font-semibold">{chatPartner?.username || id}</h2>
  </div>
  <button
    onClick={() => router.push('/chat')}
    className="text-blue-600 hover:underline text-sm"
  >
    ← Back
  </button>
</div>

      <div className="w-full max-w-md flex-1 overflow-y-auto border max-h-[75vh] overflow-y-auto p-4 rounded bg-white mb-4">
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
            <p className="text-xs text-black mt-1">
                {msg.timestamp?.toDate?.().toLocaleTimeString()}
              </p>
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
         {/* Hidden file input */}
  <input
    type="file"
    accept="image/*"
    id="file-upload"
    onChange={e => setImage(e.target.files?.[0] || null)}
    className="hidden"
  />

  {/* Icon to trigger file input */}
  <label htmlFor="file-upload" className="cursor-pointer">
    {image ? (
      <img
        src={URL.createObjectURL(image)}
        alt="preview"
        className="w-8 h-8 rounded object-cover border"
      />
    ) : (
      <IoImagesOutline size={28} className="text-gray-600 hover:text-blue-600" />
    )}
  </label>
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
