/**
 * @file Shared TypeScript type definitions for the Motion client.
 * 
 * Contains interfaces for events, users, and API responses.
 * These types should be kept in sync with server-side models.
 */

import type { ReactNode } from 'react';

export type EventSummary = {
  id: string;
  title: string;
  host: string;
  datetime: string;
  startsAt?: string;
  distance?: string;
  tags?: string[];
  heroImageUrl: string;
  rsvpLabel?: string;
  footerNode?: ReactNode;
  location?: {
    coordinates: [number, number]; // [longitude, latitude] per GeoJSON
  };
};

/**
 * API response type for /events/feed endpoint.
 * Represents raw event data from the backend before transformation.
 */
export interface EventFeedItem {
  _id: string;
  title: string;
  dateTime: string;
  description: string;
  distance?: number; // in meters
  tags?: string[];
  images?: string[];
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  creatorDetails?: {
    _id: string; // Added ID for host linking
    name: string;
    avatarUrl?: string; // If backend provides this or we mock it
    bio?: string; // If backend provides this
  };
  participantCount?: number;
}

export interface EventDetail extends EventSummary {
  description: string;
  attendeeCount: number;
  attendees: {
    id: string;
    name: string;
    avatarUrl?: string;
    status: 'following' | 'going' | 'interested';
  }[];
  galleryImages: string[];
  hostDetails: {
    id: string;
    name: string;
    avatarUrl: string;
    mutualConnections: number;
    bio: string;
  };
  otherEventsByHost: EventSummary[];
  similarEvents: EventSummary[];
}
