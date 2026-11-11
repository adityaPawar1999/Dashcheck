import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LoadingState from '../LoadingState.jsx'

export default function NotesPad({ userId, onError }) {
  const [content, setContent] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState('Loading notes…')
  const revision = useRef(0)
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty

  useEffect(() => {
    const noteRef = doc(db, 'users', userId, 'notes', 'main')
    return onSnapshot(noteRef, snapshot => {
      if (!dirtyRef.current) setContent(snapshot.exists() ? snapshot.data().content ?? '' : '')
      setLoaded(true)
      setStatus(dirtyRef.current ? 'Unsaved changes' : 'All changes saved')
    }, error => { setLoaded(true); onError(error.message) })
  }, [userId, onError])

  useEffect(() => {
    if (!loaded || !dirty) return
    const version = revision.current
    const noteRef = doc(db, 'users', userId, 'notes', 'main')
    const timer = window.setTimeout(async () => {
      setStatus('Saving…')
      try {
        await setDoc(noteRef, { content, updatedAt: serverTimestamp() }, { merge: true })
        if (revision.current === version) {
          setDirty(false)
          setStatus('All changes saved')
        }
      } catch (error) {
        setStatus('Could not save')
        onError(error.message)
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [content, dirty, loaded, userId, onError])

  function updateContent(event) {
    revision.current += 1
    dirtyRef.current = true
    setContent(event.target.value)
    setDirty(true)
    setStatus('Unsaved changes')
  }

  return <div className="notes-page">
    <div className="board-heading notes-heading">
      <div><div className="page-eyebrow">YOUR WORKSPACE</div><h1>Notes</h1><p>A private place for details you want to keep close.</p></div>
      {loaded ? <span className={`notes-save-status ${status === 'Could not save' ? 'has-error' : ''}`} aria-live="polite">{status}</span> : <LoadingState message="Loading notes…" inline />}
    </div>
    <section className="notes-paper" aria-label="Your notes">
      <div className="notes-paper-heading"><span className="notes-paper-icon" aria-hidden="true">✎</span><div><h2>Quick notes</h2><p>Your notes save automatically.</p></div></div>
      <textarea aria-label="Write your notes" placeholder="Write down an idea, a reminder, or anything you want to remember…" value={content} onChange={updateContent} disabled={!loaded} />
    </section>
  </div>
}
