import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QuestionCard } from '../components/QuestionCard'
import { Message } from '../components/Message'
import {
  buildQuestion,
  generateQuestion,
  generateSimilarQuestion,
} from '../services/questionGenerator'
import { completeSession, loadData, saveSessionProgress } from '../services/storage'
import type { PracticeAttempt, PracticeSession } from '../types/session'

function encouragingMessage(isCorrect: boolean): string {
  const messages = isCorrect
    ? ['Nice work! Keep it up.', 'You’re making progress!', 'Great effort!']
    : [
        'That’s okay. Every try helps you learn.',
        'Mistakes help your brain grow.',
        'Keep going—you’re learning.',
      ]
  return messages[Math.floor(Math.random() * messages.length)]
}

export function SessionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState<PracticeSession | null>(() => loadData().activeSession)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [storageWarning, setStorageWarning] = useState(
    (location.state as { storageWarning?: boolean } | null)?.storageWarning ?? false,
  )
  const question = session?.questions[session.currentQuestionIndex]
  const data = loadData()

  function playResultTone(isCorrect: boolean) {
    if (!data.settings.soundEffectsEnabled || typeof window.AudioContext === 'undefined') return
    try {
      const context = new window.AudioContext()
      const oscillator = context.createOscillator()
      const volume = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = isCorrect ? 660 : 330
      volume.gain.setValueAtTime(0.035, context.currentTime)
      volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12)
      oscillator.connect(volume)
      volume.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.12)
      oscillator.onended = () => void context.close()
    } catch {
      if (import.meta.env.DEV) console.warn('Sound effects are not available in this browser.')
    }
  }

  useEffect(() => {
    if (!session || session.status !== 'active') return
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeave)
    return () => window.removeEventListener('beforeunload', warnBeforeLeave)
  }, [session])

  function finish(current: PracticeSession, status: 'completed' | 'ended') {
    const finished = {
      ...current,
      status,
      completedAt: new Date().toISOString(),
    } satisfies PracticeSession
    const saved = completeSession(finished)
    setSession(finished)
    navigate('/practice/summary', { state: { sessionId: finished.id, storageWarning: !saved } })
  }

  function confirmEndSession() {
    if (session && window.confirm('End this practice session and see your summary?')) {
      finish(session, 'ended')
    }
  }

  function getNextQuestion(current: PracticeSession): PracticeSession['questions'][number] {
    if (current.mode === 'mistake-review' && current.reviewPatternIds?.length) {
      const patternId =
        current.reviewPatternIds[current.attempts.length % current.reviewPatternIds.length]
      const pattern = data.mistakePatterns.find((item) => item.id === patternId)
      if (pattern) return generateSimilarQuestion(pattern)
    }
    return generateQuestion(current.operations, current.difficulty)
  }

  function recordResult(isCorrect: boolean, selectedAnswer: number) {
    if (!session || !question || session.status !== 'active') return
    playResultTone(isCorrect)
    const attempt: PracticeAttempt = {
      id: `${session.id}-${session.attempts.length + 1}`,
      sessionId: session.id,
      questionId: question.id,
      operation: question.operation,
      difficulty: question.difficulty,
      operands: question.operands,
      correctAnswer: question.correctAnswer,
      selectedAnswer,
      isCorrect,
      attemptedAt: new Date().toISOString(),
      source: question.source ?? 'practice',
      relatedMistakePatternId: question.relatedMistakePatternId,
    }
    const next: PracticeSession = {
      ...session,
      selectedAnswer: undefined,
      isCardFlipped: false,
      attempts: [...session.attempts, attempt],
      currentQuestionIndex: session.currentQuestionIndex + 1,
      correctCount: session.correctCount + Number(isCorrect),
      incorrectCount: session.incorrectCount + Number(!isCorrect),
    }
    const isComplete = next.length !== 'continuous' && next.attempts.length >= next.length
    if (isComplete) {
      finish({ ...next, status: 'completed' }, 'completed')
      return
    }
    try {
      let nextQuestion = getNextQuestion(next)
      for (let retries = 0; nextQuestion.prompt === question.prompt && retries < 4; retries += 1) {
        nextQuestion = getNextQuestion(next)
      }
      next.questions = [...next.questions, nextQuestion]
      if (!saveSessionProgress(next)) setStorageWarning(true)
      setSession(next)
      setFeedback(data.settings.feedbackEnabled ? encouragingMessage(isCorrect) : '')
      setError('')
    } catch {
      if (import.meta.env.DEV)
        console.error('Question generation failed; using a fallback question.')
      const fallback = buildQuestion('addition', 'beginner', [1, 1])
      next.questions = [...next.questions, fallback]
      if (!saveSessionProgress(next)) setStorageWarning(true)
      setSession(next)
      setError(
        'We had trouble making a question, so we added a simple one and saved your progress.',
      )
    }
  }

  if (!session) return <Navigate to="/practice/setup" replace />
  if (!question)
    return (
      <div className="content-card" role="alert">
        <h1>Session could not be restored</h1>
        <Link className="button button-primary" to="/practice/setup">
          Start a new session
        </Link>
      </div>
    )

  const total = session.length
  const completed = session.attempts.length
  const progressValue = total === 'continuous' ? undefined : Math.round((completed / total) * 100)

  return (
    <section className="content-card session-page" aria-labelledby="session-title">
      <div className="session-topline">
        <div>
          <p className="eyebrow">
            {session.mode === 'mistake-review' ? 'Mistake review' : 'Practice time'}
          </p>
          <h1 id="session-title" className="session-title">
            You’ve got this!
          </h1>
        </div>
        <button className="button button-secondary" onClick={confirmEndSession}>
          End Session
        </button>
      </div>
      {progressValue !== undefined && (
        <div className="progress-wrap">
          <div className="progress-label">
            <span>Progress</span>
            <span>
              {completed} of {total}
            </span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Session progress"
            aria-valuemin={0}
            aria-valuemax={typeof total === 'number' ? total : undefined}
            aria-valuenow={completed}
            aria-valuetext={`${completed} of ${total} questions completed`}
          >
            <span style={{ width: `${progressValue}%` }} />
          </div>
        </div>
      )}
      {feedback && <Message kind="feedback">{feedback}</Message>}
      {storageWarning && (
        <Message kind="warning">
          Your browser can’t save progress right now. This session will be available only until you
          close this page.
        </Message>
      )}
      {error && <Message kind="error">{error}</Message>}
      <QuestionCard
        key={question.id}
        question={question}
        number={completed + 1}
        total={total}
        animationsEnabled={data.settings.animationsEnabled}
        showExplanation={data.settings.explanationsEnabled}
        initialSelectedAnswer={session.selectedAnswer}
        initialFlipped={session.isCardFlipped}
        onSelectionChange={(selectedAnswer) => {
          const updated = { ...session, selectedAnswer }
          if (!saveSessionProgress(updated)) setStorageWarning(true)
          setSession(updated)
        }}
        onFlipChange={(isCardFlipped) => {
          const updated = { ...session, isCardFlipped }
          if (!saveSessionProgress(updated)) setStorageWarning(true)
          setSession(updated)
        }}
        onRate={recordResult}
      />
      <p className="session-tally" aria-live="polite">
        {session.correctCount} correct · {session.incorrectCount} to practice
      </p>
    </section>
  )
}
