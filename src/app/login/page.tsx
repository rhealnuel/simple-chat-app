'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    setLoading(true)
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/chat')
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

 return (
  <div className="min-h-screen flex items-center justify-center">
    <form onSubmit={handleLogin} className="space-y-4 w-80">
      <h2 className="text-2xl font-bold text-center">Log In</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}

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

      <button className="w-full bg-blue-600 text-white p-2 rounded">{loading? "Loading": "Log In"} </button>

      <p className="text-sm text-center">
        Don't have an account?{' '}
        <span
          onClick={() => router.push('/signup')}
          className="text-blue-600 cursor-pointer hover:underline"
        >
          Sign up
        </span>
      </p>
    </form>
  </div>
)

}
