import { Link, useLocation } from 'react-router-dom'
import { loadData } from '../services/storage'
import { accuracyPercent } from '../services/statistics'

export function SummaryPage() {
  const location = useLocation()
  const data = loadData()
  const routeState = location.state as { sessionId?: string; storageWarning?: boolean } | null
  const requestedId = routeState?.sessionId
  const session =
    data.sessions.find((item) => item.id === requestedId) ?? data.sessions[data.sessions.length - 1]
  if (!session)
    return (
      <section className="content-card">
        <h1>Nothing to summarize yet</h1>
        <p>Complete a practice session to see your results.</p>
        <Link className="button button-primary" to="/practice/setup">
          Start Practice
        </Link>
      </section>
    )
  const total = session.attempts.length
  const reviewCount = session.attempts.filter(
    (attempt) => attempt.source === 'mistake-review',
  ).length
  const accuracy = accuracyPercent(session.correctCount, total)
  const labels: Record<string, string> = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division',
  }

  return (
    <section className="content-card summary-page">
      <p className="eyebrow">
        {session.status === 'completed' ? 'Session complete' : 'Session finished'}
      </p>
      <h1>Look how far you got!</h1>
      <p className="intro summary-intro">Every question is practice for next time.</p>
      {routeState?.storageWarning && (
        <p className="warning-message" role="status">
          Your browser couldn’t save this session. Its results will be lost when you close this
          page.
        </p>
      )}
      <div className="summary-grid">
        <div className="stat-tile">
          <strong>{total}</strong>
          <span>Questions tried</span>
        </div>
        <div className="stat-tile">
          <strong>{session.correctCount}</strong>
          <span>Got right</span>
        </div>
        <div className="stat-tile">
          <strong>{session.incorrectCount}</strong>
          <span>To practice</span>
        </div>
        <div className="stat-tile">
          <strong>{accuracy}%</strong>
          <span>Accuracy</span>
        </div>
      </div>
      <div className="summary-details">
        <p>
          <strong>Operations:</strong>{' '}
          {session.operations.map((operation) => labels[operation]).join(', ')}
        </p>
        <p>
          <strong>Difficulty:</strong>{' '}
          {session.mode === 'mistake-review'
            ? 'Mixed levels'
            : session.difficulty[0].toUpperCase() + session.difficulty.slice(1)}
        </p>
        <p>
          <strong>Mistake-review questions:</strong> {reviewCount}
        </p>
      </div>
      <div className="summary-actions">
        <Link className="button button-primary" to="/practice/setup">
          Practice Again
        </Link>
        {data.mistakePatterns.some((pattern) => !pattern.isMastered) && (
          <Link
            className="button button-secondary"
            to="/practice/setup"
            state={{ mode: 'mistake-review' }}
          >
            Practice Mistakes
          </Link>
        )}
        <Link className="button button-secondary" to="/settings">
          Change Settings
        </Link>
        <Link className="button button-secondary" to="/statistics">
          View Statistics
        </Link>
        <Link className="text-button" to="/">
          Return Home
        </Link>
      </div>
    </section>
  )
}
