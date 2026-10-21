import type { DifficultyLevel, MathOperation } from './question'

export interface MistakePattern {
  id: string
  operation: MathOperation
  difficulty: DifficultyLevel
  operands: [number, number]
  correctAnswer: number
  mostRecentIncorrectAt: string
  incorrectCount: number
  similarQuestionCount: number
  similarCorrectCount: number
  isMastered: boolean
  masteredAt?: string
}
