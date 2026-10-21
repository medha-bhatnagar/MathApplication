import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import { createId, randomInteger, shuffle } from '../utils/random'

const SYMBOLS: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}

const LIMITS: Record<DifficultyLevel, { add: number; factor: number; quotient: number }> = {
  beginner: { add: 10, factor: 5, quotient: 5 },
  easy: { add: 20, factor: 10, quotient: 10 },
  intermediate: { add: 100, factor: 12, quotient: 12 },
  advanced: { add: 500, factor: 20, quotient: 20 },
}

export function buildQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  operands: [number, number],
): Question {
  const [first, second] = operands
  if (!Number.isInteger(first) || !Number.isInteger(second))
    throw new Error('Operands must be integers.')
  if (operation === 'subtraction' && first < second)
    throw new Error('Subtraction answer cannot be negative.')
  if (operation === 'division' && (second === 0 || first % second !== 0)) {
    throw new Error('Division must have a nonzero divisor and a whole-number answer.')
  }
  const limits = LIMITS[difficulty]
  if (operation === 'addition' && first + second > limits.add)
    throw new Error('Addition question exceeds the difficulty limit.')
  if (operation === 'subtraction' && first > limits.add)
    throw new Error('Subtraction question exceeds the difficulty limit.')
  if (operation === 'multiplication' && (first > limits.factor || second > limits.factor))
    throw new Error('Multiplication factor exceeds the difficulty limit.')
  if (
    operation === 'division' &&
    (second > Math.min(12, limits.quotient) || first / second > limits.quotient)
  ) {
    throw new Error('Division question exceeds the difficulty limit.')
  }
  const answer =
    operation === 'addition'
      ? first + second
      : operation === 'subtraction'
        ? first - second
        : operation === 'multiplication'
          ? first * second
          : first / second
  const choices = createChoices(answer, operation, first, second)

  return {
    id: createId(),
    operation,
    difficulty,
    operands,
    prompt: `${first} ${SYMBOLS[operation]} ${second}`,
    explanation:
      operation === 'addition'
        ? `Add ${first} and ${second} to get ${answer}.`
        : operation === 'subtraction'
          ? `Take ${second} away from ${first} to get ${answer}.`
          : operation === 'multiplication'
            ? `${first} groups of ${second} make ${answer}.`
            : `${answer} groups of ${second} make ${first}.`,
    correctAnswer: answer,
    choices: shuffle([answer, ...choices]),
    source: 'practice',
  }
}

function createChoices(
  answer: number,
  operation: MathOperation,
  first: number,
  second: number,
): number[] {
  const candidates = new Set<number>()
  const addCandidate = (candidate: number) => {
    if (Number.isInteger(candidate) && candidate >= 0 && candidate !== answer)
      candidates.add(candidate)
  }

  addCandidate(answer - 1)
  addCandidate(answer + 1)
  addCandidate(answer - 2)
  addCandidate(answer + 2)
  if (operation === 'addition') {
    addCandidate(first + Math.max(0, second - 1))
    addCandidate(Math.abs(first - second))
    addCandidate(first + second + 10)
  } else if (operation === 'subtraction') {
    addCandidate(first + second)
    addCandidate(Math.abs(first - second) + 1)
    addCandidate(Math.abs(first - second - 1))
  } else if (operation === 'multiplication') {
    addCandidate(first * Math.max(1, second - 1))
    addCandidate(first * (second + 1))
    addCandidate(first + second)
  } else {
    addCandidate(answer + second)
    addCandidate(Math.max(0, answer - second))
    addCandidate(first - 1)
  }

  for (let distance = 3; candidates.size < 3 && distance < 100; distance += 1) {
    addCandidate(answer + distance)
    addCandidate(answer - distance)
  }
  return [...candidates].slice(0, 3)
}

export function generateQuestion(
  operationOrOperations: MathOperation | readonly MathOperation[],
  difficulty: DifficultyLevel,
): Question {
  const operations = Array.isArray(operationOrOperations)
    ? operationOrOperations
    : [operationOrOperations]
  if (!operations.length) throw new Error('Choose at least one math operation.')
  const operation = operations[randomInteger(0, operations.length - 1)]
  const limits = LIMITS[difficulty]
  let operands: [number, number]

  if (operation === 'addition') {
    const first = randomInteger(0, limits.add)
    operands = [first, randomInteger(0, limits.add - first)]
  } else if (operation === 'subtraction') {
    const first = randomInteger(0, limits.add)
    operands = [first, randomInteger(0, first)]
  } else if (operation === 'multiplication') {
    operands = [randomInteger(1, limits.factor), randomInteger(1, limits.factor)]
  } else {
    const divisor = randomInteger(2, Math.max(2, Math.min(12, limits.quotient)))
    const quotient = randomInteger(1, limits.quotient)
    operands = [divisor * quotient, divisor]
  }

  return buildQuestion(operation, difficulty, operands)
}

export function generateSimilarQuestion(pattern: {
  id: string
  operation: MathOperation
  difficulty: DifficultyLevel
  operands: [number, number]
}): Question {
  const [first, second] = pattern.operands
  const strategy = randomInteger(0, 2)
  let operation = pattern.operation
  let operands: [number, number]

  if (strategy === 1 && (operation === 'addition' || operation === 'multiplication')) {
    operands = [second, first]
  } else if (strategy === 2 && operation === 'addition') {
    operation = 'subtraction'
    operands = [first + second, first]
  } else if (strategy === 2 && operation === 'subtraction') {
    operation = 'addition'
    operands = [first - second, second]
  } else if (strategy === 2 && operation === 'division') {
    operation = 'multiplication'
    operands = [first / second, second]
  } else if (strategy === 2 && operation === 'multiplication') {
    operation = 'division'
    operands = [first * second, first]
  } else if (operation === 'division') {
    const divisor = Math.max(2, second + randomInteger(-1, 1))
    operands = [divisor * Math.max(1, first / second + randomInteger(-1, 1)), divisor]
  } else {
    const side = randomInteger(0, 1)
    const delta = randomInteger(-2, 2) || 1
    const next = [...pattern.operands] as [number, number]
    next[side] = Math.max(operation === 'multiplication' ? 1 : 0, next[side] + delta)
    if (operation === 'subtraction' && next[0] < next[1]) next.reverse()
    operands = next
  }

  let question: Question
  try {
    question = buildQuestion(operation, pattern.difficulty, operands)
  } catch {
    question = generateQuestion(operation, pattern.difficulty)
  }
  return { ...question, source: 'mistake-review', relatedMistakePatternId: pattern.id }
}
