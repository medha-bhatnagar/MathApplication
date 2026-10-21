import { beforeEach, describe, expect, it, vi } from 'vitest'
import { completeSession, clearAllData, loadData, saveSettings } from './storage'
import { DEFAULT_APPLICATION_SETTINGS, type ApplicationSettings } from '../types/settings'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import { calculateStatistics } from './statistics'

beforeEach(() => clearAllData())

describe('local data storage', () => {
  it('saves and reloads settings', () => {
    const settings: ApplicationSettings = {
      ...DEFAULT_APPLICATION_SETTINGS,
      defaultDifficulty: 'easy' as const,
      defaultOperations: ['addition', 'division'],
    }
    saveSettings(settings)
    expect(loadData().settings).toEqual(settings)
  })

  it('stores completed sessions, attempts, and a mistake pattern', () => {
    const attempt: PracticeAttempt = {
      id: 'attempt-1',
      sessionId: 'session-1',
      questionId: 'question-1',
      operation: 'addition',
      difficulty: 'beginner',
      operands: [2, 3],
      correctAnswer: 5,
      selectedAnswer: 6,
      isCorrect: false,
      attemptedAt: '2026-10-21T12:00:00.000Z',
      source: 'practice',
    }
    const session: PracticeSession = {
      id: 'session-1',
      operations: ['addition'],
      mode: 'regular',
      difficulty: 'beginner',
      length: 5,
      status: 'completed',
      currentQuestionIndex: 1,
      correctCount: 0,
      incorrectCount: 1,
      questions: [
        {
          id: 'question-1',
          operation: 'addition',
          difficulty: 'beginner',
          operands: [2, 3],
          prompt: '2 + 3',
          correctAnswer: 5,
          choices: [5, 4, 6, 7],
        },
      ],
      attempts: [attempt],
      startedAt: '2026-10-21T11:59:00.000Z',
      completedAt: attempt.attemptedAt,
    }
    completeSession(session)
    const data = loadData()
    expect(data.sessions).toHaveLength(1)
    expect(data.attempts).toEqual([attempt])
    expect(data.mistakePatterns).toMatchObject([
      { operands: [2, 3], incorrectCount: 1, isMastered: false },
    ])
    expect(data.activeSession).toBeNull()
  })

  it('marks a pattern mastered after the configured correct reviews and reopens it after a miss', () => {
    const attempt: PracticeAttempt = {
      id: 'miss-1',
      sessionId: 'regular-1',
      questionId: 'question-1',
      operation: 'addition',
      difficulty: 'beginner',
      operands: [2, 3],
      correctAnswer: 5,
      selectedAnswer: 6,
      isCorrect: false,
      attemptedAt: '2026-10-21T12:00:00.000Z',
      source: 'practice',
    }
    const baseSession: PracticeSession = {
      id: 'regular-1',
      operations: ['addition'],
      mode: 'regular',
      difficulty: 'beginner',
      length: 5,
      status: 'completed',
      currentQuestionIndex: 1,
      correctCount: 0,
      incorrectCount: 1,
      questions: [],
      attempts: [attempt],
      startedAt: '2026-10-21T11:59:00.000Z',
    }
    completeSession(baseSession)
    const patternId = loadData().mistakePatterns[0].id
    const reviewAttempts = [1, 2, 3].map((number): PracticeAttempt => ({
      ...attempt,
      id: `review-${number}`,
      sessionId: 'review-session',
      questionId: `similar-${number}`,
      source: 'mistake-review',
      relatedMistakePatternId: patternId,
      isCorrect: true,
      selectedAnswer: 7,
      attemptedAt: `2026-10-21T12:0${number}:00.000Z`,
    }))
    completeSession({
      ...baseSession,
      id: 'review-session',
      status: 'completed',
      currentQuestionIndex: 3,
      correctCount: 3,
      incorrectCount: 0,
      attempts: reviewAttempts,
    })
    expect(loadData().mistakePatterns[0]).toMatchObject({
      isMastered: true,
      similarCorrectCount: 3,
    })

    const futureMiss = {
      ...attempt,
      id: 'miss-2',
      sessionId: 'later',
      questionId: 'question-2',
      attemptedAt: '2026-10-22T12:00:00.000Z',
    }
    completeSession({
      ...baseSession,
      id: 'later',
      attempts: [futureMiss],
      currentQuestionIndex: 1,
    })
    expect(loadData().mistakePatterns[0]).toMatchObject({
      isMastered: false,
      similarCorrectCount: 0,
      incorrectCount: 2,
    })
  })

  it('recovers from an invalid category while keeping valid settings', () => {
    localStorage.setItem(
      'math-practice-data',
      JSON.stringify({
        schemaVersion: 1,
        settings: { ...DEFAULT_APPLICATION_SETTINGS, defaultDifficulty: 'advanced' },
        sessions: [],
        attempts: [{ broken: true }],
        mistakePatterns: [],
        activeSession: null,
      }),
    )
    const data = loadData()
    expect(data.settings.defaultDifficulty).toBe('advanced')
    expect(data.attempts).toEqual([])
  })

  it('migrates older settings and supplies newly added defaults', () => {
    localStorage.setItem(
      'math-practice-data',
      JSON.stringify({
        schemaVersion: 1,
        settings: {
          defaultOperations: ['multiplication'],
          defaultDifficulty: 'advanced',
          defaultSessionLength: 20,
          animationsEnabled: false,
          feedbackEnabled: false,
        },
        sessions: [],
        attempts: [],
        mistakePatterns: [],
        activeSession: null,
      }),
    )
    const data = loadData()
    expect(data.schemaVersion).toBe(2)
    expect(data.settings).toMatchObject({
      defaultDifficulty: 'advanced',
      animationsEnabled: false,
      explanationsEnabled: true,
      soundEffectsEnabled: false,
    })
  })

  it('keeps the current page usable when browser storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError')
    })
    const settings = { ...DEFAULT_APPLICATION_SETTINGS, defaultDifficulty: 'advanced' as const }
    expect(saveSettings(settings)).toBe(false)
    expect(loadData().settings.defaultDifficulty).toBe('advanced')
  })

  it('keeps aggregate totals when detailed attempts are trimmed', () => {
    const count = 10_001
    const attempts: PracticeAttempt[] = Array.from({ length: count }, (_, index) => ({
      id: `attempt-${index}`,
      sessionId: 'large-session',
      questionId: `question-${index}`,
      operation: 'addition',
      difficulty: 'beginner',
      operands: [1, 1],
      correctAnswer: 2,
      selectedAnswer: 2,
      isCorrect: true,
      attemptedAt: '2026-10-21T12:00:00.000Z',
      source: 'practice',
    }))
    const session: PracticeSession = {
      id: 'large-session',
      operations: ['addition'],
      mode: 'regular',
      difficulty: 'beginner',
      length: 'continuous',
      status: 'completed',
      currentQuestionIndex: count,
      correctCount: count,
      incorrectCount: 0,
      questions: [],
      attempts,
      startedAt: '2026-10-21T11:00:00.000Z',
    }

    completeSession(session)
    const data = loadData()
    const stats = calculateStatistics(data.attempts, data.sessions, data.archivedStatistics)
    expect(data.attempts).toHaveLength(10_000)
    expect(data.archivedStatistics.totalAttempts).toBe(1)
    expect(stats.totalAttempts).toBe(count)
    expect(stats.byOperation.find((item) => item.operation === 'addition')?.correctAttempts).toBe(
      count,
    )
  })
})
