import { useMemo, useState } from 'react'
import { loadData, resetStatistics } from '../services/storage'
import { calculateStatistics } from '../services/statistics'

const operationNames = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
}

export function StatisticsPage() {
  const [data, setData] = useState(loadData)
  const stats = useMemo(
    () => calculateStatistics(data.attempts, data.sessions, data.archivedStatistics),
    [data],
  )
  const activeMistakes = data.mistakePatterns.filter((pattern) => !pattern.isMastered)
  const masteredMistakes = data.mistakePatterns.filter((pattern) => pattern.isMastered)
  const mostMissed = stats.byOperation
    .filter((item) => item.totalAttempts)
    .sort((a, b) => b.incorrectAttempts - a.incorrectAttempts)[0]
  const tiedMostMissed = mostMissed
    ? stats.byOperation.filter(
        (item) => item.totalAttempts && item.incorrectAttempts === mostMissed.incorrectAttempts,
      )
    : []

  function clearStats() {
    if (
      window.confirm('Clear practice history and mistake patterns? Your settings will stay saved.')
    ) {
      resetStatistics()
      setData(loadData())
    }
  }

  function renderPattern(pattern: (typeof data.mistakePatterns)[number]) {
    return (
      <article className="mistake-row" key={pattern.id}>
        <div>
          <strong>
            {pattern.operands[0]} {pattern.operation} {pattern.operands[1]} ={' '}
            {pattern.correctAnswer}
          </strong>
          <span>
            {operationNames[pattern.operation]} · missed {pattern.incorrectCount}{' '}
            {pattern.incorrectCount === 1 ? 'time' : 'times'} · {pattern.similarCorrectCount}/
            {data.settings.masteryThreshold} review correct · last missed{' '}
            {new Date(pattern.mostRecentIncorrectAt).toLocaleDateString()}
          </span>
        </div>
        <span className={`status-badge ${pattern.isMastered ? 'mastered' : ''}`}>
          {pattern.isMastered ? 'Mastered' : 'Practice'}
        </span>
      </article>
    )
  }

  return (
    <section className="content-card statistics-page">
      <div className="page-heading">
        <p className="eyebrow">Your progress</p>
        <h1>Statistics</h1>
        <p>Every bit of practice adds up.</p>
      </div>
      {stats.totalAttempts === 0 ? (
        <div className="empty-state">
          <h2>Your progress will show up here</h2>
          <p>Try a few questions and come back to see what you’ve learned.</p>
        </div>
      ) : (
        <>
          <div className="summary-grid stats-summary-grid">
            <div className="stat-tile">
              <strong>{stats.totalAttempts}</strong>
              <span>Questions answered</span>
            </div>
            <div className="stat-tile">
              <strong>{stats.correctAttempts}</strong>
              <span>Correct</span>
            </div>
            <div className="stat-tile">
              <strong>{stats.incorrectAttempts}</strong>
              <span>To practice</span>
            </div>
            <div className="stat-tile">
              <strong>{stats.accuracy}%</strong>
              <span>Accuracy</span>
            </div>
          </div>
          <h2>By operation</h2>
          <div className="stats-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Operation</th>
                  <th scope="col">Questions</th>
                  <th scope="col">Correct</th>
                  <th scope="col">To practice</th>
                  <th scope="col">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {stats.byOperation.map((item) => (
                  <tr key={item.operation}>
                    <th scope="row">{operationNames[item.operation]}</th>
                    <td>{item.totalAttempts}</td>
                    <td>{item.correctAttempts}</td>
                    <td>{item.incorrectAttempts}</td>
                    <td>{item.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>By difficulty</h2>
          <div className="stats-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Difficulty</th>
                  <th scope="col">Questions</th>
                  <th scope="col">Correct</th>
                  <th scope="col">To practice</th>
                  <th scope="col">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {stats.byDifficulty.map((item) => (
                  <tr key={item.difficulty}>
                    <th scope="row">
                      {item.difficulty[0].toUpperCase() + item.difficulty.slice(1)}
                    </th>
                    <td>{item.totalAttempts}</td>
                    <td>{item.correctAttempts}</td>
                    <td>{item.incorrectAttempts}</td>
                    <td>{item.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>Recent sessions</h2>
          {stats.recentSessions.length ? (
            <ul className="recent-sessions">
              {stats.recentSessions.map((item) => (
                <li key={item.sessionId}>
                  <span>
                    {new Date(item.startedAt).toLocaleDateString()} ·{' '}
                    {item.operations.map((operation) => operationNames[operation]).join(', ')} ·{' '}
                    {item.difficulty[0].toUpperCase() + item.difficulty.slice(1)}
                    <br />
                    {item.totalAttempts} questions · {item.correctAttempts} correct ·{' '}
                    {item.incorrectAttempts} to practice
                  </span>
                  <strong>{item.accuracy}% accuracy</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No finished sessions yet.</p>
          )}
        </>
      )}
      <section className="mistake-statistics" aria-labelledby="mistake-stats-heading">
        <h2 id="mistake-stats-heading">Mistake practice</h2>
        <div className="summary-grid stats-summary-grid">
          <div className="stat-tile">
            <strong>{activeMistakes.length}</strong>
            <span>Active patterns</span>
          </div>
          <div className="stat-tile">
            <strong>{masteredMistakes.length}</strong>
            <span>Mastered patterns</span>
          </div>
          <div className="stat-tile">
            <strong>
              {data.archivedStatistics.reviewAttempts +
                data.attempts.filter((item) => item.source === 'mistake-review').length}
            </strong>
            <span>Review questions</span>
          </div>
          <div className="stat-tile">
            <strong>
              {data.archivedStatistics.reviewCorrect +
                data.attempts.filter((item) => item.source === 'mistake-review' && item.isCorrect)
                  .length}
            </strong>
            <span>Review correct</span>
          </div>
        </div>
        {mostMissed && (
          <p>
            Most missed {tiedMostMissed.length > 1 ? 'operations' : 'operation'}:{' '}
            <strong>
              {tiedMostMissed.map((item) => operationNames[item.operation]).join(', ')}
            </strong>
          </p>
        )}
        {data.mistakePatterns.length ? (
          <div className="mistake-list">
            {activeMistakes.length > 0 && (
              <>
                <h3>Patterns to review</h3>
                {activeMistakes
                  .slice()
                  .sort((a, b) => b.incorrectCount - a.incorrectCount)
                  .map(renderPattern)}
              </>
            )}
            {masteredMistakes.length > 0 && (
              <>
                <h3>Mastered patterns</h3>
                {masteredMistakes.map(renderPattern)}
              </>
            )}
          </div>
        ) : (
          <p>No mistake patterns yet. Missing a question during practice will add one here.</p>
        )}
      </section>
      <button className="text-button destructive-link" onClick={clearStats}>
        Reset statistics
      </button>
    </section>
  )
}
