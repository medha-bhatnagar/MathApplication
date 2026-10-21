import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DifficultySelector, OperationSelector, SessionLengthSelector } from './Selectors'

describe('practice selectors', () => {
  it('supports multiple operations and selecting every operation', () => {
    const onChange = vi.fn()
    render(<OperationSelector value={['addition']} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Subtraction/ }))
    expect(onChange).toHaveBeenLastCalledWith(['addition', 'subtraction'])
    fireEvent.click(screen.getByRole('button', { name: 'Select all operations' }))
    expect(onChange).toHaveBeenLastCalledWith([
      'addition',
      'subtraction',
      'multiplication',
      'division',
    ])
  })

  it('shows the chosen difficulty and session length', () => {
    const onDifficultyChange = vi.fn()
    const onLengthChange = vi.fn()
    render(
      <>
        <DifficultySelector value="beginner" onChange={onDifficultyChange} />
        <SessionLengthSelector value={10} onChange={onLengthChange} />
      </>,
    )

    expect(screen.getByRole('button', { name: /Beginner/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /Advanced/ }))
    fireEvent.click(screen.getByRole('button', { name: '20 questions' }))
    expect(onDifficultyChange).toHaveBeenCalledWith('advanced')
    expect(onLengthChange).toHaveBeenCalledWith(20)
  })
})
