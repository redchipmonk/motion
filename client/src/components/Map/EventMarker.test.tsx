import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import EventMarker from './EventMarker'
import type { EventSummary } from '../../types'

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Marker: ({ children, icon }: any) => (
    <div data-testid="marker" data-icon-html={icon?.options?.html}>
      {children}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
}))

// Mock leaflet
vi.mock('leaflet', () => ({
  default: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    divIcon: (options: any) => ({ options }),
  },
}))

describe('EventMarker', () => {
  const mockPosition: [number, number] = [47.6, -122.3]

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders standard marker with tooltip for future events', () => {
    const today = new Date(2024, 0, 1, 12) // Jan 1 2024
    vi.setSystemTime(today)

    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + 5) // Jan 6 2024

    const event: EventSummary = {
      id: '1',
      title: 'Future Event',
      host: 'Test Host',
      datetime: 'Future Date',
      startsAt: futureDate.toISOString(),
      heroImageUrl: 'test.jpg',
    }

    render(<EventMarker event={event} position={mockPosition} />)

    const marker = screen.getByTestId('marker')
    // Check NOT today
    expect(marker.getAttribute('data-icon-html')).not.toContain('Today')

    // Check Tooltip IS present
    expect(screen.getByTestId('tooltip')).toBeTruthy()
  })

  it('renders special "Today" marker with tooltip for today events', () => {
    const today = new Date(2024, 0, 1, 12, 0, 0) // Jan 1 2024, 12:00 PM
    vi.setSystemTime(today)

    const event: EventSummary = {
      id: '2',
      title: 'Special Event', // Title doesn't contain "Today"
      host: 'Test Host',
      datetime: 'Today',
      startsAt: today.toISOString(),
      heroImageUrl: 'test.jpg',
    }

    render(<EventMarker event={event} position={mockPosition} />)

    const marker = screen.getByTestId('marker')
    // Check DOES contain "Today" badge text
    expect(marker.getAttribute('data-icon-html')).toContain('Today')

    // Check Tooltip IS present
    expect(screen.getByTestId('tooltip')).toBeTruthy()
  })
})
