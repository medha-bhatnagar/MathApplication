export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division'

export type DifficultyLevel = 'beginner' | 'easy' | 'intermediate' | 'advanced'

export type QuestionSource = 'practice' | 'mistake-review'

export interface Question {
  id: string
  operation: MathOperation
  difficulty: DifficultyLevel
  operands: [number, number]
  prompt: string
  explanation?: string
  correctAnswer: number
  choices: number[]
  source?: QuestionSource
  relatedMistakePatternId?: string
}
