/**
 * @file Modal overlay for event preview/details.
 * 
 * Displays event information in a centered modal with hero image, title,
 * host, location, and RSVP button. Responsive tag display adapts to screen width.
 * Closes on ESC key or backdrop click.
 * 
 * @example
 * <EventPreviewOverlay event={selectedEvent} onClose={() => setSelectedEvent(null)} />
 */

import { useEffect, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { motionTheme, cn } from '../theme';
import type { EventSummary } from '../types';
import { Tooltip } from './Tooltip';
import { HiArrowLongLeft, HiArrowLongRight } from 'react-icons/hi2';

/** Props for the EventPreviewOverlay component */
type EventPreviewOverlayProps = {
  /** Event data to display in the overlay */
  event: EventSummary;
  /** Callback fired when overlay should close (ESC, backdrop click, or back button) */
  onClose: () => void;
};

/**
 * Formats event date using date-fns.
 * Returns "Today @ time" for today's events, otherwise "M/D @ time".
 */
const formatEventDate = (dateStr?: string): string => {
  if (!dateStr) return 'Date TBA';
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return `Today @ ${format(date, 'h:mm a')}`;
    }
    return format(date, 'M/d @ h:mm a');
  } catch {
    return 'Date TBA';
  }
};

/**
 * Modal overlay component for event preview/details.
 * 
 * Features:
 * - Responsive tag display (adapts to screen width)
 * - Closes on ESC key or backdrop click
 * - Floating back/more-info buttons
 * - Scrollable description area
 */
const EventPreviewOverlay = ({ event, onClose }: EventPreviewOverlayProps) => {

  /**
   * Close overlay when user presses Escape key.
   * Registers global keydown listener on mount, cleans up on unmount.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ----- Adaptive Tag Counting -----
  // Number of tags to display before showing "+N" badge
  // Adjusts based on screen width for responsive layout
  const [visibleCount, setVisibleCount] = useState(3);

  /**
   * Adjusts visible tag count based on viewport width.
   * - < 640px: Hide all tags (mobile)
   * - < 1280px: Show 1 tag (tablet)
   * - >= 1280px: Show 3 tags (desktop)
   */
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleCount(0);
      } else if (width < 1280) {
        setVisibleCount(1);
      } else {
        setVisibleCount(3);
      }
    };

    // Initial check on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Split address if possible or just use location
  const locationString = '1410 NE Campus Parkway\nSeattle, WA 98195' // Hardcoded for demo/mock as most mocks lack full address

  return (
    <div
      className="absolute inset-0 z-[50] flex items-center justify-center bg-motion-plum/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full w-[90vw] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Back Button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute -top-14 left-0 z-50 flex items-center gap-2 rounded-full px-8 py-1 text-xl font-medium border-2 border-transparent transition-all duration-150",
            "bg-motion-yellow text-motion-purple",
            motionTheme.shadows.soft,
            motionTheme.states.primaryHoverBorder,
            motionTheme.shadows.hoverGlow,
            motionTheme.states.primaryActiveBg,
            motionTheme.states.primaryActiveText,
            motionTheme.states.primaryActiveBorder
          )}
        >
          <HiArrowLongLeft className="text-4xl" />
          Back to Map
        </button>

        {/* Main Card */}
        <div className={cn("flex rounded-[25px] bg-white h-[70vh]", motionTheme.shadows.soft)}>
          {/* Left Content */}
          <div className="flex w-1/2 flex-col p-12 bg-motion-warmWhite min-w-0 rounded-l-[25px]">

            {/* Top Content Area */}
            {/* Fixed Header Area */}
            <div className="shrink-0 space-y-4 min-w-0">
              {/* Header: Title */}
              <Tooltip content={event.title} side="bottom" className="w-full" contentClassName="max-w-md">
                <h2
                  className={cn("font-bold leading-tight text-motion-plum line-clamp-2", "text-4xl")}
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {event.title}
                </h2>
              </Tooltip>

              {/* Tags Row */}
              <div
                className="mt-3 flex flex-wrap gap-2"
              >
                {event.tags?.slice(0, visibleCount).map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-motion-lilac px-6 py-2 text-md text-motion-purple"
                  >
                    {tag}
                  </span>
                ))}
                {(event.tags?.length || 0) > visibleCount && (
                  <Tooltip
                    content={event.tags?.join(', ')}
                    side="bottom"
                    contentClassName="max-w-xs"
                  >
                    <span className="rounded-full bg-motion-lilac px-6 py-2 text-md text-motion-purple cursor-help">
                      +{event.tags!.length - visibleCount}
                    </span>
                  </Tooltip>
                )}
              </div>

              <div className="min-w-0">
                <Tooltip content={event.host} side="bottom" className="w-full" contentClassName="max-w-md">
                  <p className="text-2xl font-semibold text-motion-plum line-clamp-1 w-full">{event.host}</p>
                </Tooltip>

                <Tooltip content={locationString} side="bottom" className="w-full" contentClassName="max-w-md">
                  <div
                    className="mt-2 text-xl italic text-motion-plum line-clamp-2 w-full whitespace-pre-line"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {locationString}
                  </div>
                </Tooltip>
              </div>
            </div>

            {/* Scrollable Description Area */}
            <div className="flex-1 overflow-y-auto pr-4 min-h-0 mt-4">
              <p className="text-lg text-motion-plum leading-relaxed" style={{ overflowWrap: 'anywhere' }}>
                Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event! Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event! Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event! Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event! Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event! Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event! Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event!
                {/* Hardcoded description for demo matching screenshot text */}
              </p>
            </div>

            {/* Bottom: RSVP Button */}
            <button
              className={cn(
                "mt-6 w-full rounded-2xl py-2 text-center text-2xl font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]",
                "bg-motion-purple"
              )}
            >
              {event.rsvpLabel || 'RSVP'}
            </button>
          </div>

          {/* Right Image */}
          <div className="relative w-1/2 overflow-hidden rounded-r-[25px]">
            <img
              src={event.heroImageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />

            {/* Date Badge Overlay */}
            <div className="absolute top-8 right-8 rounded-full bg-motion-orange px-8 py-3 text-lg font-medium text-white">
              {formatEventDate(event.startsAt || event.datetime)}
            </div>
          </div>
        </div>

        {/* Floating More Info Button */}
        <button
          className={cn(
            "absolute -bottom-14 right-0 z-50 flex items-center gap-2 rounded-full px-12 py-1 text-xl font-medium text-motion-purple border-2 border-transparent transition-all duration-150",
            "bg-motion-yellow",
            motionTheme.shadows.soft,
            motionTheme.states.primaryHoverBorder,
            motionTheme.shadows.hoverGlow,
            motionTheme.states.primaryActiveBg,
            motionTheme.states.primaryActiveText,
            motionTheme.states.primaryActiveBorder
          )}
        >
          More Information
          <HiArrowLongRight className="text-4xl" />
        </button>
      </div>
    </div>
  )
}

export default EventPreviewOverlay
