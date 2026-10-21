import type { DifficultyLevel, MathOperation } from './question'
import type { SessionLength } from './session'

export interface ApplicationSettings {
  defaultOperations: MathOperation[]
  defaultDifficulty: DifficultyLevel
  defaultSessionLength: SessionLength
  animationsEnabled: boolean
  feedbackEnabled: boolean
  explanationsEnabled: boolean
  soundEffectsEnabled: boolean
  masteryThreshold: number
}

export const DEFAULT_APPLICATION_SETTINGS: ApplicationSettings = {
  defaultOperations: ['addition'],
  defaultDifficulty: 'beginner',
  defaultSessionLength: 10,
  animationsEnabled: true,
  feedbackEnabled: true,
  explanationsEnabled: true,
  soundEffectsEnabled: false,
  masteryThreshold: 3,
}
