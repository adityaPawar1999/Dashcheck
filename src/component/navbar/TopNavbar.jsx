import SignOutButton from '../auth/SignOutButton.jsx'

export default function TopNavbar({ userEmail, onError }) {
  return <header className="topbar board-topbar">
    <a className="brand" href="#home"><span className="brand-mark">d.</span><span>dashcheck</span></a>
    <div className="account-actions">
      <span className="live-status"><i /> Live sync</span>
      <span className="user-email">{userEmail}</span>
      <SignOutButton onError={onError} />
    </div>
  </header>
}
