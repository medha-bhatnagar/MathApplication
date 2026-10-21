import type { DifficultyLevel, MathOperation, Question } from './question'

export type SessionLength = 5 | 10 | 20 | 'continuous'
export type SessionStatus = 'active' | 'completed' | 'ended'
export type PracticeMode = 'regular' | 'mistake-review'

export interface PracticeAttempt {
  id: string
  sessionId: string
  questionId: string
  operation: MathOperation
  difficulty: DifficultyLevel
  operands: [number, number]
  correctAnswer: number
  selectedAnswer: number
  isCorrect: boolean
  attemptedAt: string
  source: 'practice' | 'mistake-review'
  relatedMistakePatternId?: string
}

export interface PracticeSession {
  id: string
  operations: MathOperation[]
  mode: PracticeMode
  reviewPatternIds?: string[]
  difficulty: DifficultyLevel
  length: SessionLength
  status: SessionStatus
  currentQuestionIndex: number
  correctCount: number
  incorrectCount: number
  selectedAnswer?: number
  isCardFlipped?: boolean
  questions: Question[]
  attempts: PracticeAttempt[]
  startedAt: string
  completedAt?: string
}
