import type { ReactNode } from 'react'

export type EventSummary = {
  id: string
  title: string
  host: string
  datetime: string
  startsAt?: string
  distance?: string
  tags?: string[]
  heroImageUrl: string
  rsvpLabel?: string
  footerNode?: ReactNode
  location?: {
    coordinates: [number, number] // [longitude, latitude] per GeoJSON
  }
}
