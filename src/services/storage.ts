import { DEFAULT_APPLICATION_SETTINGS, type ApplicationSettings } from '../types/settings'
import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import type { AccuracyStatistics, ArchivedStatistics } from '../types/statistics'

const STORAGE_KEY = 'math-practice-data'
const SCHEMA_VERSION = 2
const MAX_SESSIONS = 100
const MAX_ATTEMPTS = 10_000
let memoryData: PersistedAppData | null = null
let memoryDataDirty = false

export interface PersistedAppData {
  schemaVersion: number
  settings: ApplicationSettings
  sessions: PracticeSession[]
  attempts: PracticeAttempt[]
  mistakePatterns: MistakePattern[]
  activeSession: PracticeSession | null
  archivedStatistics: ArchivedStatistics
}

const emptyData = (): PersistedAppData => ({
  schemaVersion: SCHEMA_VERSION,
  settings: {
    ...DEFAULT_APPLICATION_SETTINGS,
    defaultOperations: [...DEFAULT_APPLICATION_SETTINGS.defaultOperations],
  },
  sessions: [],
  attempts: [],
  mistakePatterns: [],
  activeSession: null,
  archivedStatistics: {
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
    accuracy: 0,
    reviewAttempts: 0,
    reviewCorrect: 0,
    byOperation: {},
    byDifficulty: {},
  },
})

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isOperation(value: unknown): value is MathOperation {
  return ['addition', 'subtraction', 'multiplication', 'division'].includes(String(value))
}

function isDifficulty(value: unknown): value is DifficultyLevel {
  return ['beginner', 'easy', 'intermediate', 'advanced'].includes(String(value))
}

function isQuestion(value: unknown): value is Question {
  if (
    !isObject(value) ||
    typeof value.id !== 'string' ||
    !isOperation(value.operation) ||
    !isDifficulty(value.difficulty) ||
    !Array.isArray(value.operands) ||
    value.operands.length !== 2 ||
    !value.operands.every(Number.isInteger) ||
    typeof value.prompt !== 'string' ||
    !Number.isInteger(value.correctAnswer) ||
    !Array.isArray(value.choices) ||
    value.choices.length !== 4 ||
    (value.explanation !== undefined && typeof value.explanation !== 'string') ||
    !value.choices.every(Number.isInteger) ||
    new Set(value.choices).size !== 4 ||
    !value.choices.includes(value.correctAnswer as number)
  )
    return false

  const [first, second] = value.operands as [number, number]
  if (value.operation === 'subtraction' && first < second) return false
  if (value.operation === 'division' && (second === 0 || first % second !== 0)) return false
  const answer =
    value.operation === 'addition'
      ? first + second
      : value.operation === 'subtraction'
        ? first - second
        : value.operation === 'multiplication'
          ? first * second
          : first / second
  return answer === value.correctAnswer && value.choices.every((choice) => (choice as number) >= 0)
}

function isAttempt(value: unknown): value is PracticeAttempt {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.sessionId === 'string' &&
    typeof value.questionId === 'string' &&
    isOperation(value.operation) &&
    isDifficulty(value.difficulty) &&
    Array.isArray(value.operands) &&
    value.operands.length === 2 &&
    value.operands.every(Number.isInteger) &&
    Number.isInteger(value.correctAnswer) &&
    Number.isInteger(value.selectedAnswer) &&
    typeof value.isCorrect === 'boolean' &&
    typeof value.attemptedAt === 'string' &&
    ['practice', 'mistake-review'].includes(String(value.source))
  )
}

function isSession(value: unknown): value is PracticeSession {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    Array.isArray(value.operations) &&
    value.operations.every(isOperation) &&
    ['regular', 'mistake-review'].includes(String(value.mode)) &&
    isDifficulty(value.difficulty) &&
    [5, 10, 20, 'continuous'].includes(value.length as number | string) &&
    ['active', 'completed', 'ended'].includes(String(value.status)) &&
    Number.isInteger(value.currentQuestionIndex) &&
    Number.isInteger(value.correctCount) &&
    Number.isInteger(value.incorrectCount) &&
    (value.selectedAnswer === undefined || Number.isInteger(value.selectedAnswer)) &&
    (value.isCardFlipped === undefined || typeof value.isCardFlipped === 'boolean') &&
    Array.isArray(value.questions) &&
    value.questions.every(isQuestion) &&
    Array.isArray(value.attempts) &&
    value.attempts.every(isAttempt) &&
    typeof value.startedAt === 'string'
  )
}

function isMistakePattern(value: unknown): value is MistakePattern {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    isOperation(value.operation) &&
    isDifficulty(value.difficulty) &&
    Array.isArray(value.operands) &&
    value.operands.length === 2 &&
    value.operands.every(Number.isInteger) &&
    Number.isInteger(value.correctAnswer) &&
    typeof value.mostRecentIncorrectAt === 'string' &&
    Number.isInteger(value.incorrectCount) &&
    Number.isInteger(value.similarQuestionCount) &&
    Number.isInteger(value.similarCorrectCount) &&
    typeof value.isMastered === 'boolean'
  )
}

function isAccuracyStatistics(value: unknown): value is AccuracyStatistics {
  return (
    isObject(value) &&
    Number.isInteger(value.totalAttempts) &&
    Number.isInteger(value.correctAttempts) &&
    Number.isInteger(value.incorrectAttempts) &&
    typeof value.accuracy === 'number'
  )
}

function isArchivedStatistics(value: unknown): value is ArchivedStatistics {
  return (
    isObject(value) &&
    Number.isInteger(value.totalAttempts) &&
    Number.isInteger(value.correctAttempts) &&
    Number.isInteger(value.incorrectAttempts) &&
    typeof value.accuracy === 'number' &&
    Number.isInteger(value.reviewAttempts) &&
    Number.isInteger(value.reviewCorrect) &&
    isObject(value.byOperation) &&
    Object.entries(value.byOperation).every(
      ([operation, stats]) => isOperation(operation) && isAccuracyStatistics(stats),
    ) &&
    isObject(value.byDifficulty) &&
    Object.entries(value.byDifficulty).every(
      ([difficulty, stats]) => isDifficulty(difficulty) && isAccuracyStatistics(stats),
    )
  )
}

function normalizeData(value: unknown): PersistedAppData {
  const defaults = emptyData()
  if (
    !isObject(value) ||
    typeof value.schemaVersion !== 'number' ||
    value.schemaVersion > SCHEMA_VERSION
  )
    return defaults
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: normalizeSettings(value.settings, defaults.settings),
    sessions:
      Array.isArray(value.sessions) && value.sessions.every(isSession)
        ? value.sessions.slice(-MAX_SESSIONS)
        : [],
    attempts:
      Array.isArray(value.attempts) && value.attempts.every(isAttempt)
        ? value.attempts.slice(-MAX_ATTEMPTS)
        : [],
    mistakePatterns:
      Array.isArray(value.mistakePatterns) && value.mistakePatterns.every(isMistakePattern)
        ? value.mistakePatterns
        : [],
    activeSession:
      value.activeSession === null || value.activeSession === undefined
        ? null
        : isSession(value.activeSession) && value.activeSession.status === 'active'
          ? value.activeSession
          : null,
    archivedStatistics: isArchivedStatistics(value.archivedStatistics)
      ? value.archivedStatistics
      : defaults.archivedStatistics,
  }
}

function normalizeSettings(value: unknown, defaults: ApplicationSettings): ApplicationSettings {
  if (!isObject(value)) return defaults
  return {
    defaultOperations:
      Array.isArray(value.defaultOperations) && value.defaultOperations.every(isOperation)
        ? value.defaultOperations
        : defaults.defaultOperations,
    defaultDifficulty: isDifficulty(value.defaultDifficulty)
      ? value.defaultDifficulty
      : defaults.defaultDifficulty,
    defaultSessionLength: [5, 10, 20, 'continuous'].includes(
      value.defaultSessionLength as number | string,
    )
      ? (value.defaultSessionLength as ApplicationSettings['defaultSessionLength'])
      : defaults.defaultSessionLength,
    animationsEnabled:
      typeof value.animationsEnabled === 'boolean'
        ? value.animationsEnabled
        : defaults.animationsEnabled,
    feedbackEnabled:
      typeof value.feedbackEnabled === 'boolean' ? value.feedbackEnabled : defaults.feedbackEnabled,
    explanationsEnabled:
      typeof value.explanationsEnabled === 'boolean'
        ? value.explanationsEnabled
        : defaults.explanationsEnabled,
    soundEffectsEnabled:
      typeof value.soundEffectsEnabled === 'boolean'
        ? value.soundEffectsEnabled
        : defaults.soundEffectsEnabled,
    masteryThreshold:
      Number.isInteger(value.masteryThreshold) &&
      Number(value.masteryThreshold) >= 1 &&
      Number(value.masteryThreshold) <= 10
        ? Number(value.masteryThreshold)
        : defaults.masteryThreshold,
  }
}

export function loadData(): PersistedAppData {
  if (memoryDataDirty && memoryData) return memoryData
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return memoryData ?? emptyData()
    const parsed: unknown = JSON.parse(raw)
    const data = normalizeData(parsed)
    memoryData = data
    memoryDataDirty = false
    return data
  } catch {
    return memoryData ?? emptyData()
  }
}

export function saveData(data: PersistedAppData): boolean {
  memoryData = data
  try {
    if (!globalThis.localStorage) {
      memoryDataDirty = true
      return false
    }
    globalThis.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION }),
    )
    memoryDataDirty = false
    return true
  } catch {
    memoryDataDirty = true
    return false
  }
}

export function saveSettings(settings: ApplicationSettings): boolean {
  const data = loadData()
  return saveData({ ...data, settings })
}

export function saveActiveSession(activeSession: PracticeSession | null): boolean {
  const data = loadData()
  return saveData({ ...data, activeSession })
}

export function completeSession(session: PracticeSession): boolean {
  const data = loadData()
  const sessions = [...data.sessions.filter((item) => item.id !== session.id), session].slice(
    -MAX_SESSIONS,
  )
  const combinedAttempts = [...data.attempts, ...session.attempts]
  const overflow = Math.max(0, combinedAttempts.length - MAX_ATTEMPTS)
  const archivedStatistics = archiveAttempts(
    data.archivedStatistics,
    combinedAttempts.slice(0, overflow),
  )
  const attempts = combinedAttempts.slice(-MAX_ATTEMPTS)
  const patterns = updateMistakePatterns(
    data.mistakePatterns,
    session.attempts,
    data.settings.masteryThreshold,
  )
  return saveData({
    ...data,
    sessions,
    attempts,
    archivedStatistics,
    mistakePatterns: patterns,
    activeSession: null,
  })
}

export function saveSessionProgress(session: PracticeSession): boolean {
  const data = loadData()
  return saveData({ ...data, activeSession: session })
}

export function resetStatistics(): boolean {
  const data = loadData()
  return saveData({
    ...data,
    sessions: [],
    attempts: [],
    archivedStatistics: emptyData().archivedStatistics,
    mistakePatterns: [],
    activeSession: null,
  })
}

export function clearAllData(): boolean {
  memoryData = null
  memoryDataDirty = false
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

function updateMistakePatterns(
  patterns: MistakePattern[],
  attempts: PracticeAttempt[],
  masteryThreshold: number,
): MistakePattern[] {
  const updated = [...patterns]
  for (const attempt of attempts) {
    if (attempt.source === 'mistake-review' && attempt.relatedMistakePatternId) {
      const related = updated.find((item) => item.id === attempt.relatedMistakePatternId)
      if (related) {
        related.similarQuestionCount += 1
        related.similarCorrectCount += Number(attempt.isCorrect)
        if (related.similarCorrectCount >= masteryThreshold) {
          related.isMastered = true
          related.masteredAt = attempt.attemptedAt
        }
      }
      continue
    }
    if (attempt.isCorrect) continue
    const key = `${attempt.operation}:${attempt.operands[0]}:${attempt.operands[1]}:${attempt.correctAnswer}`
    const existing = updated.find(
      (item) =>
        `${item.operation}:${item.operands[0]}:${item.operands[1]}:${item.correctAnswer}` === key,
    )
    if (existing) {
      existing.incorrectCount += 1
      existing.mostRecentIncorrectAt = attempt.attemptedAt
      if (existing.isMastered) {
        existing.similarCorrectCount = 0
        existing.similarQuestionCount = 0
      } else {
        existing.similarCorrectCount = Math.max(0, existing.similarCorrectCount - 1)
      }
      existing.isMastered = false
      existing.masteredAt = undefined
    } else {
      updated.push({
        id: attempt.questionId,
        operation: attempt.operation,
        difficulty: attempt.difficulty,
        operands: attempt.operands,
        correctAnswer: attempt.correctAnswer,
        mostRecentIncorrectAt: attempt.attemptedAt,
        incorrectCount: 1,
        similarQuestionCount: 0,
        similarCorrectCount: 0,
        isMastered: false,
      })
    }
  }
  return updated
}

function updateArchivedBucket(
  bucket: AccuracyStatistics | undefined,
  isCorrect: boolean,
): AccuracyStatistics {
  const next = bucket ?? { totalAttempts: 0, correctAttempts: 0, incorrectAttempts: 0, accuracy: 0 }
  next.totalAttempts += 1
  if (isCorrect) next.correctAttempts += 1
  else next.incorrectAttempts += 1
  next.accuracy = Math.round((next.correctAttempts / next.totalAttempts) * 100)
  return next
}

function archiveAttempts(
  archive: ArchivedStatistics,
  attempts: PracticeAttempt[],
): ArchivedStatistics {
  const updated: ArchivedStatistics = {
    ...archive,
    byOperation: { ...archive.byOperation },
    byDifficulty: { ...archive.byDifficulty },
  }
  for (const attempt of attempts) {
    updated.totalAttempts += 1
    if (attempt.isCorrect) updated.correctAttempts += 1
    else updated.incorrectAttempts += 1
    if (attempt.source === 'mistake-review') {
      updated.reviewAttempts += 1
      if (attempt.isCorrect) updated.reviewCorrect += 1
    }
    updated.byOperation[attempt.operation] = updateArchivedBucket(
      updated.byOperation[attempt.operation],
      attempt.isCorrect,
    )
    updated.byDifficulty[attempt.difficulty] = updateArchivedBucket(
      updated.byDifficulty[attempt.difficulty],
      attempt.isCorrect,
    )
  }
  updated.accuracy = updated.totalAttempts
    ? Math.round((updated.correctAttempts / updated.totalAttempts) * 100)
    : 0
  return updated
}
