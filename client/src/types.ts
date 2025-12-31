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
