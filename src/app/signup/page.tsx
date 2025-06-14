'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'


export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

 const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCred.user, { displayName: username })

    // Save user to Firestore
    await setDoc(doc(db, 'users', username), {
      uid: userCred.user.uid,
      email: userCred.user.email,
      username,
    })

    router.push('/chat')
  } catch (err: any) {
    setError(err.message)
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSignup} className="space-y-4 w-80">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          className="w-full p-2 border rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full p-2 border rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Sign Up</button>
      </form>
    </div>
  )
}
