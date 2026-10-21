import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearAllData, loadData } from './services/storage'

beforeEach(() => {
  clearAllData()
  window.history.replaceState({}, '', '/')
})

describe('App', () => {
  it('renders the Math Practice welcome screen', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Math Practice' })).toBeInTheDocument()
    expect(
      screen.getByText('Build confidence with math, one question at a time.'),
    ).toBeInTheDocument()
  })

  it('completes a practice session and offers mistake review', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const view = render(<App />)

    await user.click(screen.getAllByRole('link', { name: 'Start Practice' })[0])
    await user.click(screen.getByRole('button', { name: '5 questions' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))

    await user.keyboard('1')
    const selected = loadData().activeSession?.selectedAnswer
    expect(selected).toBeDefined()
    view.unmount()
    window.history.replaceState({}, '', '/practice/session')
    render(<App />)
    expect(screen.getByRole('button', { name: `Answer ${selected}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    for (let question = 0; question < 5; question += 1) {
      const answerButtons = screen.getAllByRole('button', { name: /^Answer / })
      await user.click(answerButtons[0])
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      await user.click(
        screen.getByRole('button', { name: question === 0 ? 'I got it wrong' : 'I got it right' }),
      )
    }

    expect(await screen.findByText('Session complete')).toBeInTheDocument()
    expect(loadData().attempts).toHaveLength(5)
    expect(loadData().mistakePatterns).toHaveLength(1)

    await user.click(screen.getByRole('link', { name: 'Practice Mistakes' }))
    expect(screen.getByText('Personalized review')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review mistakes (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('link', { name: 'Statistics' }))
    await screen.findByRole('heading', { name: 'Statistics' })
    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Reset statistics' }))
    expect(loadData().attempts).toEqual([])
    expect(loadData().mistakePatterns).toEqual([])
    confirm.mockRestore()
  })

  it('ends continuous practice after confirmation', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)

    await user.click(screen.getAllByRole('link', { name: 'Start Practice' })[0])
    await user.click(screen.getByRole('button', { name: 'Continuous' }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'End Session' }))

    expect(confirm).toHaveBeenCalledOnce()
    expect(await screen.findByText('Session finished')).toBeInTheDocument()
    confirm.mockRestore()
  })

  it('shows statistics and confirms a history reset', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'View Statistics' }))
    expect(screen.getByText('Your progress will show up here')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset statistics' }))
    expect(confirm).toHaveBeenCalledOnce()
    confirm.mockRestore()
  })
})
