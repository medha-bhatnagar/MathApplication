import { describe, expect, it } from 'vitest'
import { prioritizeMistakePatterns } from './mistakePatterns'
import type { MistakePattern } from '../types/mistake'

function pattern(
  id: string,
  incorrectCount: number,
  recent: string,
  similarCorrectCount = 0,
): MistakePattern {
  return {
    id,
    operation: 'addition',
    difficulty: 'beginner',
    operands: [2, 3],
    correctAnswer: 5,
    mostRecentIncorrectAt: recent,
    incorrectCount,
    similarQuestionCount: similarCorrectCount,
    similarCorrectCount,
    isMastered: false,
  }
}

describe('mistake-pattern prioritization', () => {
  it('prioritizes frequency, recency, and patterns with less review success', () => {
    const items = [
      pattern('frequency', 4, '2026-01-01T00:00:00.000Z', 2),
      pattern('recency', 3, '2026-10-01T00:00:00.000Z', 1),
      pattern('low-success', 3, '2026-09-01T00:00:00.000Z', 0),
    ]
    expect(prioritizeMistakePatterns(items).map((item) => item.id)).toEqual([
      'frequency',
      'recency',
      'low-success',
    ])
  })

  it('randomizes records with identical priority', () => {
    const items = [
      pattern('one', 2, '2026-10-01T00:00:00.000Z'),
      pattern('two', 2, '2026-10-01T00:00:00.000Z'),
    ]
    const result = prioritizeMistakePatterns(items, (group) => [...group].reverse())
    expect(result.map((item) => item.id)).toEqual(['two', 'one'])
  })
})
