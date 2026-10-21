import type { PracticeAttempt } from '../types/session'
import type {
  AccuracyStatistics,
  DifficultyStatistics,
  OperationStatistics,
  PracticeStatistics,
  RecentSessionStatistics,
  ArchivedStatistics,
} from '../types/statistics'
import type { PracticeSession } from '../types/session'
import type { DifficultyLevel, MathOperation } from '../types/question'

function summarize(attempts: PracticeAttempt[]): AccuracyStatistics {
  const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length
  const totalAttempts = attempts.length
  return {
    totalAttempts,
    correctAttempts,
    incorrectAttempts: totalAttempts - correctAttempts,
    accuracy: totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
  }
}

export function calculateStatistics(
  attempts: PracticeAttempt[],
  sessions: PracticeSession[],
  archived?: ArchivedStatistics,
): PracticeStatistics {
  const operations: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
  const difficulties: DifficultyLevel[] = ['beginner', 'easy', 'intermediate', 'advanced']
  const recentSessions: RecentSessionStatistics[] = sessions
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 10)
    .map((session) => ({
      sessionId: session.id,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      operations: session.operations,
      difficulty: session.difficulty,
      ...summarize(session.attempts),
    }))

  return {
    ...combineStatistics(summarize(attempts), archived),
    byOperation: operations.map((operation): OperationStatistics => ({
      operation,
      ...combineStatistics(
        summarize(attempts.filter((attempt) => attempt.operation === operation)),
        archived?.byOperation[operation],
      ),
    })),
    byDifficulty: difficulties.map((difficulty): DifficultyStatistics => ({
      difficulty,
      ...combineStatistics(
        summarize(attempts.filter((attempt) => attempt.difficulty === difficulty)),
        archived?.byDifficulty[difficulty],
      ),
    })),
    recentSessions,
  }
}

function combineStatistics(
  current: AccuracyStatistics,
  archived?: AccuracyStatistics,
): AccuracyStatistics {
  const totalAttempts = current.totalAttempts + (archived?.totalAttempts ?? 0)
  const correctAttempts = current.correctAttempts + (archived?.correctAttempts ?? 0)
  const incorrectAttempts = current.incorrectAttempts + (archived?.incorrectAttempts ?? 0)
  return {
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
    accuracy: totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
  }
}

export function accuracyPercent(correct: number, total: number): number {
  return total ? Math.round((correct / total) * 100) : 0
}
