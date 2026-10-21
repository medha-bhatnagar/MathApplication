import { describe, expect, it } from 'vitest'
import { accuracyPercent, calculateStatistics } from './statistics'
import type { PracticeAttempt } from '../types/session'

const attempts: PracticeAttempt[] = [
  {
    id: 'a1',
    sessionId: 's1',
    questionId: 'q1',
    operation: 'addition',
    difficulty: 'beginner',
    operands: [1, 2],
    correctAnswer: 3,
    selectedAnswer: 3,
    isCorrect: true,
    attemptedAt: '2026-10-21T10:00:00.000Z',
    source: 'practice',
  },
  {
    id: 'a2',
    sessionId: 's1',
    questionId: 'q2',
    operation: 'division',
    difficulty: 'easy',
    operands: [8, 2],
    correctAnswer: 4,
    selectedAnswer: 5,
    isCorrect: false,
    attemptedAt: '2026-10-21T10:01:00.000Z',
    source: 'practice',
  },
]

describe('statistics calculations', () => {
  it('calculates totals and accuracy without dividing by zero', () => {
    expect(calculateStatistics([], []).accuracy).toBe(0)
    expect(calculateStatistics(attempts, [])).toMatchObject({
      totalAttempts: 2,
      correctAttempts: 1,
      incorrectAttempts: 1,
      accuracy: 50,
    })
    expect(accuracyPercent(3, 4)).toBe(75)
    expect(accuracyPercent(0, 0)).toBe(0)
  })

  it('groups performance by operation and difficulty', () => {
    const stats = calculateStatistics(attempts, [])
    expect(stats.byOperation.find((item) => item.operation === 'addition')).toMatchObject({
      totalAttempts: 1,
      accuracy: 100,
    })
    expect(stats.byOperation.find((item) => item.operation === 'division')).toMatchObject({
      totalAttempts: 1,
      accuracy: 0,
    })
    expect(stats.byDifficulty.find((item) => item.difficulty === 'easy')).toMatchObject({
      totalAttempts: 1,
      incorrectAttempts: 1,
    })
  })
})
