import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EventPreviewOverlay from './EventPreviewOverlay'
import type { EventSummary } from '../types'

describe('EventPreviewOverlay', () => {
  const mockEvent: EventSummary = {
    id: '1',
    title: 'Test Event Title',
    host: 'Test Host Name',
    datetime: 'Friday, December 27',
    startsAt: '2025-12-27T20:00:00.000Z',
    heroImageUrl: 'test-image.jpg',
    tags: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5'],
    location: {
      coordinates: [-122.3, 47.6]
    },
    rsvpLabel: 'RSVP Now'
  }

  const mockOnClose = vi.fn()

  it('renders event details correctly', () => {
    render(<EventPreviewOverlay event={mockEvent} onClose={mockOnClose} />)

    expect(screen.getByText('Test Event Title')).toBeDefined()
    expect(screen.getByText('Test Host Name')).toBeDefined()
    expect(screen.getByText('Back to Map')).toBeDefined()
    expect(screen.getByText('More Information')).toBeDefined()
  })

  it('calls onClose when back button is clicked', () => {
    render(<EventPreviewOverlay event={mockEvent} onClose={mockOnClose} />)

    fireEvent.click(screen.getByText('Back to Map'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows 3 tags on desktop (large screen)', () => {
    // Mock desktop width
    window.innerWidth = 1400
    fireEvent(window, new Event('resize'))

    render(<EventPreviewOverlay event={mockEvent} onClose={mockOnClose} />)

    expect(screen.getByText('Tag1')).toBeDefined()
    expect(screen.getByText('Tag2')).toBeDefined()
    expect(screen.getByText('Tag3')).toBeDefined()

    expect(screen.queryByText('Tag4')).toBeNull()

    // Badge should be visible: +2 (5 total - 3 visible)
    expect(screen.getByText('+2')).toBeDefined()
  })

  it('shows 1 tag on tablet/laptop (< 1280px)', () => {
    window.innerWidth = 1000
    fireEvent(window, new Event('resize'))

    render(<EventPreviewOverlay event={mockEvent} onClose={mockOnClose} />)

    expect(screen.getByText('Tag1')).toBeDefined()
    expect(screen.queryByText('Tag2')).toBeNull()

    expect(screen.getByText('+4')).toBeDefined()
  })

  it('shows 0 tags on mobile (< 400px)', () => {
    window.innerWidth = 350
    fireEvent(window, new Event('resize'))

    render(<EventPreviewOverlay event={mockEvent} onClose={mockOnClose} />)

    expect(screen.queryByText('Tag1')).toBeNull()
    expect(screen.getByText('+5')).toBeDefined()
  })
})
