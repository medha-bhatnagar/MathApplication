import { useEffect, useRef, useState } from 'react'
import type { Question } from '../types/question'

function AnswerChoice({
  value,
  selected,
  onSelect,
}: {
  value: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`answer-choice ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      aria-label={`Answer ${value}`}
      onClick={onSelect}
    >
      {value}
    </button>
  )
}

export function QuestionCard({
  question,
  number,
  total,
  animationsEnabled,
  showExplanation,
  initialSelectedAnswer,
  initialFlipped,
  onSelectionChange,
  onFlipChange,
  onRate,
}: {
  question: Question
  number: number
  total: number | 'continuous'
  animationsEnabled: boolean
  showExplanation: boolean
  initialSelectedAnswer?: number
  initialFlipped?: boolean
  onSelectionChange: (answer: number) => void
  onFlipChange: (flipped: boolean) => void
  onRate: (isCorrect: boolean, selectedAnswer: number) => void
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(initialSelectedAnswer ?? null)
  const [flipped, setFlipped] = useState(initialFlipped ?? false)
  const cardRef = useRef<HTMLDivElement>(null)

  function selectAnswer(answer: number) {
    setSelectedAnswer(answer)
    onSelectionChange(answer)
  }

  function flipCard() {
    setFlipped(true)
    onFlipChange(true)
  }

  useEffect(() => {
    function selectWithNumberKey(event: KeyboardEvent) {
      const target = event.target
      if (
        flipped ||
        !(target instanceof HTMLElement) ||
        target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return
      const answerIndex = Number(event.key) - 1
      if (answerIndex >= 0 && answerIndex < question.choices.length && answerIndex < 4) {
        event.preventDefault()
        cardRef.current?.querySelectorAll<HTMLButtonElement>('.answer-choice')[answerIndex]?.click()
      }
    }
    window.addEventListener('keydown', selectWithNumberKey)
    return () => window.removeEventListener('keydown', selectWithNumberKey)
  }, [flipped, question.choices])

  return (
    <div
      ref={cardRef}
      className={`question-card ${flipped ? 'is-flipped' : ''} ${animationsEnabled ? '' : 'no-animation'}`}
    >
      <div className="question-card-inner">
        <section
          className="question-face question-front"
          aria-label="Question"
          aria-hidden={flipped}
          inert={flipped}
        >
          <p className="question-count">
            Question {number}
            {total === 'continuous' ? '' : ` of ${total}`}
          </p>
          <div className="question-prompt" aria-live="polite">
            {question.prompt} = ?
          </div>
          <fieldset className="answer-fieldset">
            <legend>Choose your answer</legend>
            <div className="answer-grid">
              {question.choices.map((choice) => (
                <AnswerChoice
                  key={choice}
                  value={choice}
                  selected={selectedAnswer === choice}
                  onSelect={() => selectAnswer(choice)}
                />
              ))}
            </div>
          </fieldset>
          <button
            className="button button-primary flip-button"
            disabled={selectedAnswer === null}
            onClick={flipCard}
          >
            Flip Card
          </button>
        </section>
        <section
          className="question-face question-back"
          aria-label="Answer check"
          aria-hidden={!flipped}
          inert={!flipped}
        >
          <p className="eyebrow">Let’s check</p>
          <div className="question-prompt compact-prompt">{question.prompt}</div>
          <p className="answer-reveal" role="status" aria-live="polite">
            The answer is <strong>{question.correctAnswer}</strong>
          </p>
          {showExplanation && question.explanation && (
            <p className="answer-explanation">{question.explanation}</p>
          )}
          <p className="selected-reveal">You chose {selectedAnswer}</p>
          <div className="result-actions">
            <button
              className="button button-primary"
              onClick={() => selectedAnswer !== null && onRate(true, selectedAnswer)}
            >
              I got it right
            </button>
            <button
              className="button button-secondary"
              onClick={() => selectedAnswer !== null && onRate(false, selectedAnswer)}
            >
              I got it wrong
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
