import type { DifficultyLevel, MathOperation } from './question'

export interface AccuracyStatistics {
  totalAttempts: number
  correctAttempts: number
  incorrectAttempts: number
  accuracy: number
}

export interface OperationStatistics extends AccuracyStatistics {
  operation: MathOperation
}

export interface DifficultyStatistics extends AccuracyStatistics {
  difficulty: DifficultyLevel
}

export interface RecentSessionStatistics extends AccuracyStatistics {
  sessionId: string
  startedAt: string
  completedAt?: string
  operations: MathOperation[]
  difficulty: DifficultyLevel
}

export interface PracticeStatistics extends AccuracyStatistics {
  byOperation: OperationStatistics[]
  byDifficulty: DifficultyStatistics[]
  recentSessions: RecentSessionStatistics[]
}

export interface ArchivedStatistics extends AccuracyStatistics {
  reviewAttempts: number
  reviewCorrect: number
  byOperation: Partial<Record<MathOperation, AccuracyStatistics>>
  byDifficulty: Partial<Record<DifficultyLevel, AccuracyStatistics>>
}
