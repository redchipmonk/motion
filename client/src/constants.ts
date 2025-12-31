/**
 * @file Client-side shared constants for the Motion application.
 * 
 * Contains reusable values for event visibility levels, tags, and API configuration.
 * Import these constants instead of defining inline to ensure consistency across components.
 * 
 * @example
 * import { VISIBILITY_OPTIONS, EVENT_TAGS } from '@/constants';
 */

/** Event visibility options for dropdown selectors */
export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'mutuals', label: 'Mutuals' },
  { value: 'followers', label: 'Followers' },
  { value: 'friends', label: 'Friends' },
  { value: 'private', label: 'Private' },
] as const;

/** TypeScript type for visibility values */
export type VisibilityOption = typeof VISIBILITY_OPTIONS[number]['value'];

/** Predefined event tag categories */
export const EVENT_TAGS = [
  "Social",
  "Food & Drink",
  "Music",
  "Tech",
  "Arts",
  "Sports",
  "Outdoors",
  "Wellness",
  "Family",
  "Nightlife",
  "Education",
  "Networking",
] as const;

/** TypeScript type for tag values */
export type EventTag = typeof EVENT_TAGS[number];

/** Base URL for the Motion API */
export const API_BASE_URL = 'http://localhost:8000';
