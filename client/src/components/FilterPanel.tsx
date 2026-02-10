/**
 * @file Filter panel dialog for event feed.
 * 
 * Provides UI for filtering events by time window, tags, and sort order.
 * Exports filter type definitions for use in parent components.
 * Renders as a modal overlay with backdrop click-to-close.
 * 
 * @example
 * <FilterPanel
 *   isOpen={isFilterOpen}
 *   onClose={() => setFilterOpen(false)}
 *   timeWindow={timeWindow}
 *   setTimeWindow={setTimeWindow}
 *   // ...other props
 * />
 */

import { useRef, useEffect } from "react";
import { motionTheme, cn } from "../theme";

export type SortOption = "recommended" | "soonest" | "closest";
export type TimeOption = "any" | "today" | "week" | "month";

interface FilterPanelProps {
  /** Whether the panel is currently visible */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;

  // Filter State
  /** Currently selected time window filter */
  timeWindow: TimeOption;
  /** Setter for time window filter */
  setTimeWindow: (val: TimeOption) => void;
  /** Currently selected tag filters */
  selectedTags: string[];
  /** Toggles a tag in the selected tags array */
  toggleTag: (tag: string) => void;
  /** Current sort order */
  sortBy: SortOption;
  /** Setter for sort order */
  setSortBy: (val: SortOption) => void;

  // Data
  /** All available tags extracted from events */
  allTags: string[];

  // Actions
  /** Resets all filters to defaults */
  onClear: () => void;
  /** Applies filters and closes panel */
  onApply: () => void;
}

/**
 * Filter panel modal for narrowing down event results.
 * 
 * Features:
 * - Time window selection (any, today, this week, this month)
 * - Tag-based filtering with pills
 * - Sort order selection
 * - Clear/Apply actions
 * - ESC key and backdrop click to close
 */
export const FilterPanel = ({
  isOpen,
  onClose,
  timeWindow,
  setTimeWindow,
  selectedTags,
  toggleTag,
  sortBy,
  setSortBy,
  allTags,
  onClear,
  onApply,
}: FilterPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-motion-plum/10"
        onClick={onClose} // Simple backdrop click to close
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Filters"
        className={cn(
          "absolute right-6 top-[88px] w-[340px] max-w-[calc(100%-48px)] rounded-3xl border bg-white p-5",
          motionTheme.borders.authInput,
          motionTheme.shadows.soft
        )}
      >


        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-bold text-motion-plum">Filters</p>
            <p className="text-xs text-motion-plum/60">Narrow down events</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-semibold text-motion-plum/70 hover:bg-motion-lavender"
            aria-label="Close filters"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-motion-plum">Time</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  { id: "any", label: "Any time" },
                  { id: "today", label: "Today" },
                  { id: "week", label: "This week" },
                  { id: "month", label: "This month" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTimeWindow(opt.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                    timeWindow === opt.id
                      ? "border-motion-purple bg-motion-lavender text-motion-plum"
                      : "border-motion-plum/15 bg-white text-motion-plum/70 hover:border-motion-purple/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-motion-plum/50">
              UI only (wiring date logic later).
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-motion-plum">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition",
                      active
                        ? "border-motion-purple bg-motion-lavender text-motion-plum"
                        : "border-motion-plum/15 bg-white text-motion-plum/70 hover:border-motion-purple/30"
                    )}
                    aria-pressed={active}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-motion-plum">Sort</p>
            <div className="mt-2 space-y-2">
              {(
                [
                  { id: "recommended", label: "Recommended" },
                  { id: "soonest", label: "Soonest" },
                  { id: "closest", label: "Closest" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-2xl border bg-white px-3 py-2 transition",
                    motionTheme.borders.authInput,
                    "hover:border-motion-purple/30"
                  )}
                >
                  <span className="text-sm font-semibold text-motion-plum/80">
                    {opt.label}
                  </span>
                  <input
                    type="radio"
                    name="sort"
                    value={opt.id}
                    checked={sortBy === opt.id}
                    onChange={() => setSortBy(opt.id)}
                    className="h-4 w-4 accent-motion-purple"
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-motion-plum/50">
              UI only (wiring sort logic later).
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClear}
            className="rounded-full px-4 py-2 text-sm font-semibold text-motion-plum/70 hover:bg-motion-lavender"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={onApply}
            className={cn(
              "rounded-full border-2 border-transparent bg-motion-yellow px-5 py-2 text-sm font-bold transition",
              motionTheme.text.accent,
              "hover:border-motion-orange",
              motionTheme.states.primaryActiveBg,
              motionTheme.states.primaryActiveText
            )}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
