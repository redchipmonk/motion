import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EventFeedList from './EventFeedList'
import type { EventSummary } from '../types'

describe('EventFeedList', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>

  // Define static test data relative to the mocked "now" (2026-01-15T12:00:00Z)
  // Mock Now = 1768478400000 ms
  const testEvents: EventSummary[] = [
    {
      id: '1',
      title: 'Upcoming Event',
      host: 'Host A',
      startsAt: '2026-01-20T10:00:00Z', // Future (+5 days)
      datetime: 'Jan 20 @ 10:00 am',
      tags: [],
      location: { coordinates: [0, 0] },
      heroImageUrl: ''
    },
    {
      id: '2',
      title: 'Past Event 1',
      host: 'Host B',
      startsAt: '2025-12-25T10:00:00Z', // Past
      datetime: 'Dec 25, 2025',
      tags: [],
      location: { coordinates: [0, 0] },
      heroImageUrl: ''
    },
    {
      id: '3',
      title: 'Past Event 2',
      host: 'Host C',
      startsAt: '2025-11-20T10:00:00Z', // Past
      datetime: 'Nov 20, 2025',
      tags: [],
      location: { coordinates: [0, 0] },
      heroImageUrl: ''
    },
    {
      id: '4',
      title: 'Past Event 3',
      host: 'Host D',
      startsAt: '2025-10-10T10:00:00Z', // Past
      datetime: 'Oct 10, 2025',
      tags: [],
      location: { coordinates: [0, 0] },
      heroImageUrl: ''
    },
    {
      id: '5',
      title: 'Past Event 4',
      host: 'Host E',
      startsAt: '2025-09-01T10:00:00Z', // Past
      datetime: 'Sep 01, 2025',
      tags: [],
      location: { coordinates: [0, 0] },
      heroImageUrl: ''
    }
  ]

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-15T12:00:00Z').getTime())
  })

  afterEach(() => {
    nowSpy.mockRestore()
  })

  it('filters events when switching between Upcoming and Past', () => {
    render(<EventFeedList events={testEvents} />)

    // With "now" set to Jan 2026: only the 2026 event is upcoming; 2025 events are past.
    expect(screen.getAllByTestId('event-card')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /past/i }))
    expect(screen.getAllByTestId('event-card')).toHaveLength(4)

    fireEvent.click(screen.getByRole('button', { name: /upcoming/i }))
    expect(screen.getAllByTestId('event-card')).toHaveLength(1)
  })

  it('shows time on Upcoming, and date+year (no time) on Past', () => {
    render(<EventFeedList events={testEvents} />)

    // Upcoming: should include a time-like marker and the middle dot separator.
    const upcomingPills = screen.getAllByTestId('event-card-datetime')
    expect(upcomingPills).toHaveLength(1)
    expect(upcomingPills[0]).toHaveTextContent('@')
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
