import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EventFeedList from './EventFeedList'

describe('EventFeedList', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-15T12:00:00Z').getTime())
  })

  afterEach(() => {
    nowSpy.mockRestore()
  })

  it('filters events when switching between Upcoming and Past', async () => {
    const user = userEvent.setup()

    render(<EventFeedList />)

    // Upcoming (default) should show the future event and hide past ones
    expect(screen.getByText(/winter showcase hosted by/i)).toBeInTheDocument()
    expect(screen.queryByText(/bake sale hosted by/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /past/i }))

    // Past should show older events and hide the future one
    expect(screen.getByText(/bake sale hosted by/i)).toBeInTheDocument()
    expect(screen.getByText(/campus clean up hosted by/i)).toBeInTheDocument()
    expect(screen.getByText(/intramural soccer finals hosted by/i)).toBeInTheDocument()
    expect(screen.queryByText(/winter showcase hosted by/i)).not.toBeInTheDocument()
  })

  it('renders past events with a date-only label including year (no time)', async () => {
    const user = userEvent.setup()

    render(<EventFeedList />)
    await user.click(screen.getByRole('button', { name: /past/i }))

    // Old label with time should not appear
    expect(screen.queryByText(/nov 20 · 1:00 pm/i)).not.toBeInTheDocument()

    // New label should include the year and no time
    expect(screen.getByText('Nov 20, 2025')).toBeInTheDocument()
    expect(screen.queryByText(/:\d{2}\s?(am|pm)/i)).not.toBeInTheDocument()
  })
})
