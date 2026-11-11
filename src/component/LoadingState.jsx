import BrandMark from './BrandMark.jsx'

export default function LoadingState({ message, inline = false }) {
  return <div className={`loading-state loading-brand${inline ? ' is-inline' : ' is-page'}`} role="status" aria-live="polite">
    <span className="loading-brand-mark"><BrandMark /></span>
    <span>{message}</span>
  </div>
}
