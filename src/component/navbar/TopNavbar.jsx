import SignOutButton from '../auth/SignOutButton.jsx'
import BrandMark from '../BrandMark.jsx'

export default function TopNavbar({ userEmail, onError, activeTab, onTabChange }) {
  const accountLabel = userEmail || 'Account'
  const initials = accountLabel.trim().slice(0, 1).toUpperCase()

  return <header className="topbar board-topbar">
    <a className="brand" href="/" aria-label="Dashcheck home">
      <BrandMark />
      <span>dashcheck</span>
    </a>
    <nav className="workspace-nav" aria-label="Main navigation">
      <button type="button" className={activeTab === 'projects' ? 'is-active' : ''} aria-current={activeTab === 'projects' ? 'page' : undefined} onClick={() => onTabChange('projects')}>Projects</button>
      <button type="button" className={activeTab === 'notes' ? 'is-active' : ''} aria-current={activeTab === 'notes' ? 'page' : undefined} onClick={() => onTabChange('notes')}>Notes</button>
    </nav>
    <div className="account-actions">
      <div className="account-identity" title={accountLabel}>
        <span className="account-avatar" aria-hidden="true">{initials}</span>
        <span className="user-email">{accountLabel}</span>
      </div>
      <SignOutButton onError={onError} />
    </div>
  </header>
}
