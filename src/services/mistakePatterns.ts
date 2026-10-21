import type { MistakePattern } from '../types/mistake'
import { shuffle } from '../utils/random'

export type TieRandomizer = (patterns: readonly MistakePattern[]) => MistakePattern[]

function comparePriority(a: MistakePattern, b: MistakePattern): number {
  return (
    b.incorrectCount - a.incorrectCount ||
    Date.parse(b.mostRecentIncorrectAt) - Date.parse(a.mostRecentIncorrectAt) ||
    a.similarCorrectCount - b.similarCorrectCount
  )
}

export function prioritizeMistakePatterns(
  patterns: readonly MistakePattern[],
  randomizeTies: TieRandomizer = shuffle,
): MistakePattern[] {
  const sorted = [...patterns].sort(comparePriority)
  const result: MistakePattern[] = []
  let group: MistakePattern[] = []
  let previous: MistakePattern | undefined

  for (const pattern of sorted) {
    if (previous && comparePriority(previous, pattern) !== 0) {
      result.push(...(group.length > 1 ? randomizeTies(group) : group))
      group = []
    }
    group.push(pattern)
    previous = pattern
  }
  result.push(...(group.length > 1 ? randomizeTies(group) : group))
  return result
}
