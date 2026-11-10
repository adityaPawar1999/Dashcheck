import { useRef, useState } from 'react'
import SignOutButton from '../auth/SignOutButton.jsx'
import BrandMark from '../BrandMark.jsx'

export default function TopNavbar({ userEmail, onError, activeTab, onTabChange }) {
  const musicRef = useRef(null)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const accountLabel = userEmail || 'Account'
  const initials = accountLabel.trim().slice(0, 1).toUpperCase()

  async function toggleMusic() {
    const music = musicRef.current
    if (!music) return
    if (musicPlaying) {
      music.pause()
      setMusicPlaying(false)
      return
    }
    try {
      await music.play()
      setMusicPlaying(true)
    } catch {
      onError?.('Music could not be played. Please try again.')
    }
  }

  return <header className="topbar board-topbar">
    <a className="brand" href="/" aria-label="Dashcheck home">
      <BrandMark />
      <span>dashcheck</span>
    </a>
    <nav className="workspace-nav" aria-label="Main navigation">
      <button type="button" className={activeTab === 'projects' ? 'is-active' : ''} aria-current={activeTab === 'projects' ? 'page' : undefined} onClick={() => onTabChange('projects')}>Projects</button>
      <button type="button" className={activeTab === 'notes' ? 'is-active' : ''} aria-current={activeTab === 'notes' ? 'page' : undefined} onClick={() => onTabChange('notes')}>Notes</button>
      <button type="button" className={`music-nav-button ${musicPlaying ? 'is-playing' : ''}`} aria-pressed={musicPlaying} onClick={toggleMusic}><span aria-hidden="true">♫</span> The Weekly Drop</button>
    </nav>
    <audio ref={musicRef} src="/music-of-week.mp4" preload="none" onEnded={() => setMusicPlaying(false)} onPause={() => setMusicPlaying(false)} onPlay={() => setMusicPlaying(true)} />
    <div className="account-actions">
      <div className="account-identity" title={accountLabel}>
        <span className="account-avatar" aria-hidden="true">{initials}</span>
        <span className="user-email">{accountLabel}</span>
      </div>
      <SignOutButton onError={onError} />
    </div>
  </header>
}
