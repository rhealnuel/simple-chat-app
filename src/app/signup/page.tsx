'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

// Upload helper
const CLOUD_NAME = 'dnxgnmpln'
const UPLOAD_PRESET = 'chat_uploads'

async function uploadImageToCloudinary(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  })

  const data = await res.json()
  return data.secure_url
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password)

      let photoURL = ''

      if (profileImage) {
        photoURL = await uploadImageToCloudinary(profileImage)
      }

      // Update Firebase Auth profile
      await updateProfile(userCred.user, {
        displayName: username,
        photoURL
      })

      // Save user to Firestore
      await setDoc(doc(db, 'users', username), {
        uid: userCred.user.uid,
        email: userCred.user.email,
        username,
        photoURL
      })

      router.push('/chat')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

      <input
        type="file"
        accept="image/*"
        className="w-full p-2 border rounded"
        onChange={e => setProfileImage(e.target.files?.[0] || null)}
      />

      {profileImage && (
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border">
          <img
            src={URL.createObjectURL(profileImage)}
            alt="Preview"
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <button
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Sign Up'}
      </button>

      <p className="text-sm text-center">
        Already have an account?{' '}
        <span
          onClick={() => router.push('/login')}
          className="text-blue-600 cursor-pointer hover:underline"
        >
          Log in
        </span>
      </p>
    </form>
  </div>
)
}
