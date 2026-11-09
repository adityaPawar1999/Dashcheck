import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'

export default function LoginScreen() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      if (mode === 'signup') await createUserWithEmailAndPassword(auth, email.trim(), password)
      else await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (authError) { setError(authError.message) }
  }

  return <main className="auth-screen">
    <form className="modal auth-card" onSubmit={submit}>
      <a className="brand auth-brand" href="#home"><span className="brand-mark">d.</span><span>dashcheck</span></a>
      <div className="page-eyebrow">YOUR CHECKLIST WORKSPACE</div>
      <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
      <p>{mode === 'signup' ? 'Sign up to create private projects and checklists.' : 'Sign in to get back to your projects.'}</p>
      {error && <div className="auth-error">{error}</div>}
      <label htmlFor="email">Email address</label>
      <input id="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" minLength="6" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required placeholder="At least 6 characters" value={password} onChange={event => setPassword(event.target.value)} />
      <button className="primary-button auth-submit" type="submit">{mode === 'signup' ? 'Create account' : 'Sign in'} <span>→</span></button>
      <div className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Dashcheck?'} <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></div>
    </form>
    <div className="auth-note">Your projects are private to your account and sync with Firebase.</div>
  </main>
}
