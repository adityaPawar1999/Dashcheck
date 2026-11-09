import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCea8IbyZzpn0zXJ_qD8wHjvWZFNbIwyfM',
  authDomain: 'dashcheck-c8a62.firebaseapp.com',
  projectId: 'dashcheck-c8a62',
  storageBucket: 'dashcheck-c8a62.firebasestorage.app',
  messagingSenderId: '931804544438',
  appId: '1:931804544438:web:d96f9f128c193b9cc7d517',
  measurementId: 'G-15Y3XC4M1N',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
