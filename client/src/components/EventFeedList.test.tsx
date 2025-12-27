import { fireEvent, render, screen } from '@testing-library/react'
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

  it('filters events when switching between Upcoming and Past', () => {
    render(<EventFeedList />)

    // With "now" set to Jan 2026: only the 2026 event is upcoming; 2025 events are past.
    expect(screen.getAllByTestId('event-card')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /past/i }))
    expect(screen.getAllByTestId('event-card')).toHaveLength(4)

    fireEvent.click(screen.getByRole('button', { name: /upcoming/i }))
    expect(screen.getAllByTestId('event-card')).toHaveLength(1)
  })

  it('shows time on Upcoming, and date+year (no time) on Past', () => {
    render(<EventFeedList />)

    // Upcoming: should include a time-like marker and the middle dot separator.
    const upcomingPills = screen.getAllByTestId('event-card-datetime')
    expect(upcomingPills).toHaveLength(1)
    expect(upcomingPills[0]).toHaveTextContent('·')
    expect(upcomingPills[0]).toHaveTextContent(/\b(am|pm)\b/i)

    fireEvent.click(screen.getByRole('button', { name: /past/i }))

    // Past: should include a year and should NOT include time markers or the dot separator.
    const pastPills = screen.getAllByTestId('event-card-datetime')
    expect(pastPills).toHaveLength(4)
    for (const pill of pastPills) {
      expect(pill).toHaveTextContent(/\b20\d{2}\b/)
      expect(pill).not.toHaveTextContent('·')
      expect(pill).not.toHaveTextContent(/\b(am|pm)\b/i)
    }
  })
})
