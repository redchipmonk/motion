/**
 * @file Reusable event card component.
 * 
 * Displays event summary with hero image, title, host, datetime, and optional tags.
 * Supports three variants: 'list' (feed), 'map' (marker popup), and 'preview' (compact).
 * 
 * @example
 * <EventCard event={event} variant="list" onSelect={handleSelect} />
 */

import type { KeyboardEvent } from 'react';
import { cn } from '../theme';
import type { EventSummary } from '../types';

type EventCardVariant = 'list' | 'map' | 'preview';

type EventCardProps = {
  /** Event data to display */
  event: EventSummary;
  /** Card layout variant - affects sizing and visible elements */
  variant?: EventCardVariant;
  /** Whether this card is currently selected/active */
  isActive?: boolean;
  /** Callback fired when card is clicked or activated via keyboard */
  onSelect?: (eventId: string) => void;
  /** Whether to show the host name (default: true) */
  showHost?: boolean;
  /** Whether to show tags (default: false for list, true for others) */
  showTags?: boolean;
  /** Display mode for hosted events (minimal: title + status only) */
  variantMode?: "default" | "hosted";
};

/**
 * Tailwind class strings for each card variant.
 * All variants share base styling but differ in border-radius.
 */
const VARIANT_STYLES: Record<EventCardVariant, string> = {
  list: 'rounded-[28px] bg-white border border-[#f0ebff] shadow-[0_4px_4px_rgba(0,0,0,0.15)] p-0',
  map: 'rounded-2xl bg-white border border-[#f0ebff] shadow-[0_4px_4px_rgba(0,0,0,0.15)] p-0',
  preview: 'rounded-2xl bg-white border border-[#f0ebff] shadow-[0_4px_4px_rgba(0,0,0,0.15)] p-0',
};

/**
 * Event card component displaying event summary information.
 * 
 * Accessibility:
 * - Uses role="button" for clickable card semantics
 * - Supports keyboard activation via Enter/Space
 * - aria-pressed indicates active state
 */
const EventCard = ({ event, variant = 'list', isActive = false, onSelect, showHost = true, showTags, variantMode = 'default' }: EventCardProps) => {
  // Destructure event data for easier access
  const { id, title, host, datetime, distance, tags = [], heroImageUrl, status } = event;

  /** Triggers the onSelect callback with this event's ID */
  const handleActivate = () => onSelect?.(id);

  /**
   * Handles keyboard navigation for accessibility.
   * Activates card on Enter or Space key press.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    // Card Container
    <article
      data-testid="event-card"
      role="button"
      tabIndex={0}
      aria-label={`${title} hosted by ${host}`}
      aria-pressed={isActive}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base interactive styles
        'cursor-pointer overflow-hidden transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motion-purple focus-visible:ring-offset-2 focus-visible:ring-offset-motion-warmWhite',
        // Hover and active states
        'hover:shadow-[0_6px_10px_rgba(0,0,0,0.18)] active:border-motion-purple active:shadow-[0_6px_12px_rgba(95,5,137,0.25)]',
        // Variant-specific styles
        VARIANT_STYLES[variant],
        // Active selection state
        isActive && 'border-motion-purple shadow-[0_6px_12px_rgba(95,5,137,0.25)]',
      )}
    >
      {/* Hero Image Section */}
      <div className="relative">
        <img
          src={heroImageUrl}
          alt={title}
          className={cn(
            "w-full object-cover",
            // Preview variant has smaller image height
            variant === 'preview' ? "h-24" : "h-32"
          )}
        />
        {/* Date Badge - shown on list and map variants, positioned top-right (hidden in hosted mode) */}
        {variant !== 'preview' && variantMode !== 'hosted' && (
          <span
            data-testid="event-card-datetime"
            className="absolute right-4 top-3 rounded-full bg-motion-orange px-3 py-1 text-xs font-semibold text-white shadow-[0_3px_8px_rgba(0,0,0,0.18)]"
          >
            {datetime}
          </span>
        )}
      </div>

      {/* Card Content Section */}
      {variant === 'preview' ? (
        // Preview variant: compact orange bar with condensed info
        <div className="bg-motion-orange px-3 py-2 text-white">
          <p className="line-clamp-2 text-xs font-bold leading-tight" style={{ overflowWrap: 'anywhere' }}>
            {title} hosted by {host} <span className="opacity-80">@ {datetime.split('·')[1]?.trim() || datetime}</span>
          </p>
        </div>
      ) : variantMode === 'hosted' ? (
        // Hosted mode: minimal display with title and status only
        <div className="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-base font-semibold text-motion-plum">
              {title}
            </p>
            {status && (
              <span className="shrink-0 text-sm font-medium text-motion-plum/70 capitalize">
                {status}
              </span>
            )}
          </div>
        </div>
      ) : (
        // List/Map variants: full content with title, distance, and optional tags
        <div className="space-y-2 px-4 pb-4 pt-3">
          {/* Title Row - title truncates, distance stays fixed width */}
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-base font-semibold text-motion-plum">
              {title}{showHost && ` hosted by ${host}`}
            </p>
            {distance && <p className="shrink-0 text-sm text-motion-plum/70">{distance}</p>}
          </div>

          {/* Tags - default behavior depends on variant, can be overridden */}
          {(showTags || (variant !== 'list' && showTags !== false)) && tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag} className="rounded-full bg-motion-lilac px-3 py-1 text-xs font-semibold text-motion-purple">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
};

export default EventCard;
