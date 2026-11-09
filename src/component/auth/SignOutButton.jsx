import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'

export default function SignOutButton({ onError }) {
  async function handleSignOut() {
    try { await signOut(auth) }
    catch (error) { onError(error.message) }
  }

  return <button className="signout-button" onClick={handleSignOut}>Sign out</button>
}
