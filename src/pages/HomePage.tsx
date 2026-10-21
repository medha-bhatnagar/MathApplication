import { Link } from 'react-router-dom'
import { loadData } from '../services/storage'

export function HomePage() {
  const hasActiveSession = loadData().activeSession?.status === 'active'
  return (
    <section className="welcome-panel home-panel" aria-labelledby="app-title">
      <p className="eyebrow">A little practice goes a long way</p>
      <h1 id="app-title">Math Practice</h1>
      <p className="intro">Build confidence with math, one question at a time.</p>
      <div className="home-actions">
        <Link
          className="button button-primary"
          to={hasActiveSession ? '/practice/session' : '/practice/setup'}
        >
          {hasActiveSession ? 'Resume Practice' : 'Start Practice'}
        </Link>
        <Link className="button button-secondary" to="/statistics">
          View Statistics
        </Link>
        <Link className="button button-secondary" to="/settings">
          Settings
        </Link>
      </div>
    </section>
  )
}
