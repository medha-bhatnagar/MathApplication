import { describe, expect, it } from 'vitest'
import { generateQuestion, generateSimilarQuestion } from './questionGenerator'
import type { DifficultyLevel, MathOperation } from '../types/question'

const operations: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
const difficulties: DifficultyLevel[] = ['beginner', 'easy', 'intermediate', 'advanced']

describe('question generation', () => {
  it.each(
    difficulties.flatMap((difficulty) =>
      operations.map((operation) => [difficulty, operation] as const),
    ),
  )(
    'generates a valid %s %s question with four unique whole-number choices',
    (difficulty, operation) => {
      for (let run = 0; run < 30; run += 1) {
        const question = generateQuestion(operation, difficulty)
        const [first, second] = question.operands
        expect(question.operation).toBe(operation)
        expect(question.choices).toHaveLength(4)
        expect(new Set(question.choices).size).toBe(4)
        expect(question.choices.filter((choice) => choice === question.correctAnswer)).toHaveLength(
          1,
        )
        expect(question.choices.every(Number.isInteger)).toBe(true)
        expect(question.choices.every((choice) => choice >= 0)).toBe(true)
        if (operation === 'addition')
          expect(first + second).toBeLessThanOrEqual(
            { beginner: 10, easy: 20, intermediate: 100, advanced: 500 }[difficulty],
          )
        if (operation === 'subtraction') expect(first).toBeGreaterThanOrEqual(second)
        if (operation === 'subtraction')
          expect(first).toBeLessThanOrEqual(
            { beginner: 10, easy: 20, intermediate: 100, advanced: 500 }[difficulty],
          )
        if (operation === 'multiplication') {
          expect(first).toBeGreaterThan(0)
          expect(first).toBeLessThanOrEqual(
            { beginner: 5, easy: 10, intermediate: 12, advanced: 20 }[difficulty],
          )
          expect(second).toBeLessThanOrEqual(
            { beginner: 5, easy: 10, intermediate: 12, advanced: 20 }[difficulty],
          )
        }
        if (operation === 'division') {
          expect(second).toBeGreaterThan(0)
          expect(first % second).toBe(0)
          expect(first / second).toBeLessThanOrEqual(
            { beginner: 5, easy: 10, intermediate: 12, advanced: 20 }[difficulty],
          )
        }
      }
    },
  )

  it('rejects an empty operation list', () => {
    expect(() => generateQuestion([], 'beginner')).toThrow('Choose at least one math operation.')
  })

  it.each(operations)('creates related review questions for %s mistakes', (operation) => {
    const original = generateQuestion(operation, 'beginner')
    const pattern = { ...original, id: 'pattern-1' }
    for (let run = 0; run < 20; run += 1) {
      const question = generateSimilarQuestion(pattern)
      expect(question.source).toBe('mistake-review')
      expect(question.relatedMistakePatternId).toBe('pattern-1')
      expect(question.choices).toHaveLength(4)
      expect(new Set(question.choices).size).toBe(4)
      expect(question.choices).toContain(question.correctAnswer)
    }
  })
})
