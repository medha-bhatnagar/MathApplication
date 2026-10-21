import type { DifficultyLevel, MathOperation } from '../types/question'

const operationOptions: { value: MathOperation; label: string; symbol: string }[] = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '−' },
  { value: 'multiplication', label: 'Multiplication', symbol: '×' },
  { value: 'division', label: 'Division', symbol: '÷' },
]

const difficultyOptions: { value: DifficultyLevel; title: string; description: string }[] = [
  { value: 'beginner', title: 'Beginner', description: 'Small numbers to build confidence.' },
  { value: 'easy', title: 'Easy', description: 'Practice familiar facts.' },
  { value: 'intermediate', title: 'Intermediate', description: 'Work with larger numbers.' },
  { value: 'advanced', title: 'Advanced', description: 'Try a bigger challenge.' },
]

export function OperationSelector({
  value,
  onChange,
}: {
  value: MathOperation[]
  onChange: (value: MathOperation[]) => void
}) {
  function toggle(operation: MathOperation) {
    onChange(
      value.includes(operation)
        ? value.filter((item) => item !== operation)
        : [...value, operation],
    )
  }

  return (
    <fieldset className="selector-fieldset">
      <legend>Choose operations</legend>
      <div className="option-grid operation-grid">
        {operationOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`choice-tile ${value.includes(option.value) ? 'is-selected' : ''}`}
            aria-pressed={value.includes(option.value)}
            onClick={() => toggle(option.value)}
          >
            <span className="operation-symbol" aria-hidden="true">
              {option.symbol}
            </span>
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="text-button"
        onClick={() =>
          onChange(
            value.length === operationOptions.length
              ? []
              : operationOptions.map((item) => item.value),
          )
        }
      >
        {value.length === operationOptions.length ? 'Clear all' : 'Select all operations'}
      </button>
    </fieldset>
  )
}

export function DifficultySelector({
  value,
  onChange,
}: {
  value: DifficultyLevel
  onChange: (value: DifficultyLevel) => void
}) {
  return (
    <fieldset className="selector-fieldset">
      <legend>Choose a difficulty</legend>
      <div className="option-grid difficulty-grid">
        {difficultyOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`choice-tile difficulty-tile ${value === option.value ? 'is-selected' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            <strong>{option.title}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function SessionLengthSelector({
  value,
  onChange,
}: {
  value: 5 | 10 | 20 | 'continuous'
  onChange: (value: 5 | 10 | 20 | 'continuous') => void
}) {
  const options: { value: 5 | 10 | 20 | 'continuous'; label: string }[] = [
    { value: 5, label: '5 questions' },
    { value: 10, label: '10 questions' },
    { value: 20, label: '20 questions' },
    { value: 'continuous', label: 'Continuous' },
  ]
  return (
    <fieldset className="selector-fieldset">
      <legend>How long would you like to practice?</legend>
      <div className="option-grid length-grid">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`choice-tile ${value === option.value ? 'is-selected' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
