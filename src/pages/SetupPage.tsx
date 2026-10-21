import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  DifficultySelector,
  OperationSelector,
  SessionLengthSelector,
} from '../components/Selectors'
import { Message } from '../components/Message'
import { generateQuestion, generateSimilarQuestion } from '../services/questionGenerator'
import { prioritizeMistakePatterns } from '../services/mistakePatterns'
import { loadData, saveActiveSession } from '../services/storage'
import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeMode, PracticeSession, SessionLength } from '../types/session'
import { createId } from '../utils/random'

export function SetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = loadData()
  const [operations, setOperations] = useState<MathOperation[]>(data.settings.defaultOperations)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(data.settings.defaultDifficulty)
  const [length, setLength] = useState<SessionLength>(data.settings.defaultSessionLength)
  const requestedMode = (location.state as { mode?: PracticeMode } | null)?.mode
  const [mode, setMode] = useState<PracticeMode>(requestedMode ?? 'regular')
  const [error, setError] = useState('')
  const activePatterns = useMemo(
    () => data.mistakePatterns.filter((pattern) => !pattern.isMastered),
    [data.mistakePatterns],
  )

  function startSession() {
    setError('')
    const activeSession = loadData().activeSession
    if (
      activeSession?.status === 'active' &&
      !window.confirm('A practice session is already in progress. Start a new one and replace it?')
    ) {
      return
    }
    if (mode === 'regular' && operations.length === 0) {
      setError('Choose at least one operation to start.')
      return
    }
    if (mode === 'mistake-review' && activePatterns.length === 0) {
      setError('There are no active mistakes to review yet. Try a regular practice session first.')
      return
    }
    try {
      const sortedPatterns = prioritizeMistakePatterns(activePatterns)
      const reviewPatternIds =
        mode === 'mistake-review' ? sortedPatterns.map((pattern) => pattern.id) : undefined
      const firstQuestion =
        mode === 'mistake-review'
          ? generateSimilarQuestion(sortedPatterns[0])
          : generateQuestion(operations, difficulty)
      const session: PracticeSession = {
        id: createId(),
        operations:
          mode === 'mistake-review'
            ? [...new Set(sortedPatterns.map((pattern) => pattern.operation))]
            : operations,
        mode,
        reviewPatternIds,
        difficulty,
        length,
        status: 'active',
        currentQuestionIndex: 0,
        correctCount: 0,
        incorrectCount: 0,
        questions: [firstQuestion],
        attempts: [],
        startedAt: new Date().toISOString(),
      }
      const saved = saveActiveSession(session)
      navigate('/practice/session', { state: { storageWarning: !saved } })
    } catch {
      setError('We could not make a question just now. Please try again.')
    }
  }

  return (
    <section className="content-card setup-page">
      <div className="page-heading">
        <p className="eyebrow">Make it your own</p>
        <h1>Set up practice</h1>
        <p>Choose what you want to work on today.</p>
      </div>
      <div className="mode-switch" role="group" aria-label="Practice mode">
        <button
          type="button"
          className={mode === 'regular' ? 'is-selected' : ''}
          aria-pressed={mode === 'regular'}
          onClick={() => setMode('regular')}
        >
          Regular practice
        </button>
        <button
          type="button"
          className={mode === 'mistake-review' ? 'is-selected' : ''}
          aria-pressed={mode === 'mistake-review'}
          disabled={!activePatterns.length}
          title={
            !activePatterns.length
              ? 'Complete a session with an incorrect answer to unlock review.'
              : undefined
          }
          onClick={() => setMode('mistake-review')}
        >
          Review mistakes ({activePatterns.length})
        </button>
      </div>
      {activePatterns.length === 0 && (
        <p className="helper-message">
          Finish a session and mark an answer wrong to unlock mistake review.
        </p>
      )}
      {mode === 'regular' ? (
        <>
          <OperationSelector value={operations} onChange={setOperations} />
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </>
      ) : (
        <div className="review-note">
          <strong>Personalized review</strong>
          <p>
            We’ll mix similar questions from your {activePatterns.length} active{' '}
            {activePatterns.length === 1 ? 'mistake' : 'mistakes'}.
          </p>
        </div>
      )}
      <SessionLengthSelector value={length} onChange={setLength} />
      {mode === 'regular' && operations.length === 0 && (
        <Message kind="error">Choose at least one operation to start.</Message>
      )}
      {error && <Message kind="error">{error}</Message>}
      <div className="form-actions">
        <button
          className="button button-primary"
          onClick={startSession}
          disabled={mode === 'regular' && operations.length === 0}
        >
          Start Session
        </button>
        <Link className="text-button" to="/">
          Back home
        </Link>
      </div>
    </section>
  )
}
