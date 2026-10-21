import { describe, expect, it } from 'vitest'
import { createId, randomInteger, shuffle } from './random'

describe('random utilities', () => {
  it('returns an integer within inclusive bounds', () => {
    for (let run = 0; run < 100; run += 1) {
      const value = randomInteger(3, 8)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(8)
    }
  })

  it('rejects invalid random bounds', () => {
    expect(() => randomInteger(2, 1)).toThrow(RangeError)
    expect(() => randomInteger(1.5, 4)).toThrow(RangeError)
  })

  it('shuffles without changing the source array', () => {
    const source = [1, 2, 3, 4]
    const result = shuffle(source)
    expect(source).toEqual([1, 2, 3, 4])
    expect(result.toSorted()).toEqual(source)
  })

  it('creates nonempty unique IDs', () => {
    expect(createId()).toBeTruthy()
    expect(createId()).not.toBe(createId())
  })
})
