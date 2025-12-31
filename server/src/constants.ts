/**
 * @file Server-side shared constants for the Motion application.
 * 
 * Contains values for event visibility, statuses, and geospatial configuration.
 * These constants should match the client-side values and MongoDB schema enums.
 * 
 * @example
 * import { VISIBILITY_LEVELS, DEFAULT_FEED_RADIUS_MILES } from './constants';
 */

/** Valid event visibility levels (matches client + MongoDB schema) */
export const VISIBILITY_LEVELS = ['public', 'mutuals', 'followers', 'friends', 'private'] as const;

/** TypeScript type for visibility values */
export type VisibilityLevel = typeof VISIBILITY_LEVELS[number];

/** Valid event status values */
export const EVENT_STATUSES = ['published', 'past', 'draft'] as const;

/** TypeScript type for status values */
export type EventStatus = typeof EVENT_STATUSES[number];

/** Default search radius for discovery feed in miles */
export const DEFAULT_FEED_RADIUS_MILES = 10;

/** Conversion factor: 1 mile = 1609.34 meters */
export const MILES_TO_METERS = 1609.34;

// Error Messages
// Centralized error strings for consistent messaging and easy localization

/** Authorization error - user lacks permission */
export const ERROR_FORBIDDEN = 'Forbidden';

/** Event validation errors */
export const ERROR_END_DATE_BEFORE_START = 'End date must be after start date';
export const ERROR_EVENT_NOT_FOUND = 'Event not found';

/** RSVP validation errors */
export const ERROR_HOST_CANNOT_RSVP = 'Hosts cannot RSVP to their own events';

/** Configuration errors */
export const ERROR_MONGO_URI_NOT_SET = 'MONGO_URI is not set';
export const ERROR_GOOGLE_CLIENT_ID_NOT_SET = 'GOOGLE_CLIENT_ID not set';
export const ERROR_INVALID_GOOGLE_TOKEN = 'Invalid Google Token';
