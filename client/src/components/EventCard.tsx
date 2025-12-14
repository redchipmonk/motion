import type { ReactNode } from 'react'
import { cn } from '../theme'

export type EventSummary = {
  id: string
  title: string
  host: string
  datetime: string
  distance?: string
  tags?: string[]
  heroImageUrl: string
  rsvpLabel?: string
  footerNode?: ReactNode
}

type EventCardVariant = 'list' | 'map' | 'preview'

type EventCardProps = {
  event: EventSummary
  variant?: EventCardVariant
  isActive?: boolean
  onSelect?: (eventId: string) => void
}

const VARIANT_STYLES: Record<EventCardVariant, string> = {
  list: 'rounded-[28px] bg-white border border-[#f0ebff] shadow-[0_4px_4px_rgba(0,0,0,0.15)] p-0',
  map: 'rounded-2xl bg-white border border-[#f0ebff] shadow-[0_4px_4px_rgba(0,0,0,0.15)] p-0',
  preview: 'rounded-2xl bg-white border border-[#f0ebff] shadow-[0_4px_4px_rgba(0,0,0,0.15)] p-0',
}

const EventCard = ({ event, variant = 'list', isActive = false, onSelect }: EventCardProps) => {
  const { id, title, host, datetime, distance, tags = [], heroImageUrl } = event

  return (
    <article
      className={cn(
        'cursor-pointer overflow-hidden transition-shadow',
        'hover:shadow-[0_6px_10px_rgba(0,0,0,0.18)] active:border-motion-purple active:shadow-[0_6px_12px_rgba(95,5,137,0.25)]',
        VARIANT_STYLES[variant],
        isActive && 'border-motion-purple shadow-[0_6px_12px_rgba(95,5,137,0.25)]',
      )}
      onClick={() => onSelect?.(id)}
      aria-pressed={isActive}
    >
      <div className="relative">
        {/* slightly taller than before */}
        <img src={heroImageUrl} alt={title} className="h-32 w-full object-cover" />
        <span className="absolute right-4 top-3 rounded-full bg-motion-orange px-3 py-1 text-xs font-semibold text-white shadow-[0_3px_8px_rgba(0,0,0,0.18)]">
          {datetime}
        </span>
      </div>

      <div className="space-y-2 px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-base font-semibold text-motion-plum">{`${title} hosted by ${host}`}</p>
          {distance && <p className="shrink-0 text-sm text-motion-plum/70">{distance}</p>}
        </div>

        {variant !== 'list' && tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full bg-motion-lilac px-3 py-1 text-xs font-semibold text-motion-purple">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

export default EventCard
