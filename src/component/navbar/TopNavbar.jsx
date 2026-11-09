import SignOutButton from '../auth/SignOutButton.jsx'

export default function TopNavbar({ userEmail, onError }) {
  const accountLabel = userEmail || 'Account'
  const initials = accountLabel.trim().slice(0, 1).toUpperCase()

  return <header className="topbar board-topbar">
    <a className="brand" href="/" aria-label="Dashcheck home">
      <span className="brand-mark">d.</span>
      <span>dashcheck</span>
    </a>
    <div className="account-actions">
      <div className="account-identity" title={accountLabel}>
        <span className="account-avatar" aria-hidden="true">{initials}</span>
        <span className="user-email">{accountLabel}</span>
      </div>
      <SignOutButton onError={onError} />
    </div>
  </header>
}
