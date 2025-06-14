// lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCF3KPsW25RryxAjy4JqIwjgGJoskGMkNs",
  authDomain: "chatting-app-29e7b.firebaseapp.com",
  projectId: "chatting-app-29e7b",
  storageBucket: "chatting-app-29e7b.firebasestorage.app",
  messagingSenderId: "907877117974",
  appId: "1:907877117974:web:84b76410a0559623e08537",
  measurementId: "G-KGR4CH6F6K"
}


const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

