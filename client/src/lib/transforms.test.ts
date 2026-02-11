import { describe, it, expect } from 'vitest';
import { transformEventToSummary } from './transforms';
import type { EventFeedItem } from '../types';

const makeEvent = (overrides?: Partial<EventFeedItem>): EventFeedItem => ({
  _id: 'e1',
  title: 'Test Event',
  description: 'A description',
  dateTime: '2026-03-15T13:00:00.000Z',
  tags: ['Food', 'Social'],
  images: ['/img1.jpg'],
  status: 'published',
  location: { coordinates: [-122.3, 47.6], address: '123 Main St' },
  participantCount: 5,
  creatorDetails: { _id: 'u1', name: 'Alice', avatarUrl: '', bio: '' },
  ...overrides,
});

describe('transformEventToSummary', () => {
  it('maps core fields correctly', () => {
    const result = transformEventToSummary(makeEvent());
    expect(result.id).toBe('e1');
    expect(result.title).toBe('Test Event');
    expect(result.host).toBe('Alice');
    expect(result.hostId).toBe('u1');
    expect(result.tags).toEqual(['Food', 'Social']);
    expect(result.heroImageUrl).toBe('/img1.jpg');
  });

  it('formats the datetime string', () => {
    const result = transformEventToSummary(makeEvent());
    expect(result.datetime).toMatch(/Mar 15/);
  });

  it('formats distance in km when present', () => {
    const result = transformEventToSummary(makeEvent({ distance: 2500 }));
    expect(result.distance).toBe('1.6 mi');
  });

  it('leaves distance undefined when not present', () => {
    const result = transformEventToSummary(makeEvent({ distance: undefined }));
    expect(result.distance).toBeUndefined();
  });

  it('falls back to Unknown Host when no creatorDetails', () => {
    const result = transformEventToSummary(makeEvent({ creatorDetails: undefined }));
    expect(result.host).toBe('Unknown Host');
  });

  it('uses placeholder image when images is empty', () => {
    const result = transformEventToSummary(makeEvent({ images: [] }));
    expect(result.heroImageUrl).toBe('/placeholder-event.jpg');
  });

  it('preserves location coordinates and address', () => {
    const result = transformEventToSummary(makeEvent());
    expect(result.location!.coordinates).toEqual([-122.3, 47.6]);
    expect(result.location!.address).toBe('123 Main St');
  });
});
