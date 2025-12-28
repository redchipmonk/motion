import type { EventSummary } from '../components/EventCard'
import BakeSale from './Bake-Sale_800x531.jpg'
import Trash from './trash.jpeg'
import Soccer from './wc_final_16x9.jpg'
import Showcase from './Design Showcase 1.jpg'
import Holiday from './close-up-shot-of-a-Christmas-tree.jpeg'

export const MOCK_EVENTS: EventSummary[] = [
  {
    id: '1',
    title: 'Bake Sale',
    host: 'UW Cuisine Club',
    datetime: 'Nov 20 · 1:00 PM',
    startsAt: '2025-11-20T13:00:00-08:00',
    distance: '0.6 miles',
    tags: ['Food'],
    heroImageUrl: BakeSale,
    rsvpLabel: 'RSVP',
    location: { coordinates: [-122.3035, 47.6553] },
  },
  {
    id: '2',
    title: 'Campus Clean Up',
    host: 'Eco Huskies',
    datetime: 'Nov 22 · 9:00 AM',
    startsAt: '2025-11-22T09:00:00-08:00',
    distance: '1.2 miles',
    tags: ['Service', 'Outdoors'],
    heroImageUrl: Trash,
    location: { coordinates: [-122.308, 47.656] },
  },
  {
    id: '3',
    title: 'Intramural Soccer Finals',
    host: 'UW Athletics',
    datetime: 'Nov 25 · 7:30 PM',
    startsAt: '2025-11-25T19:30:00-08:00',
    distance: 'On Campus',
    tags: ['Sports'],
    heroImageUrl: Soccer,
    location: { coordinates: [-122.302, 47.654] },
  },
  {
    id: '4',
    title: 'Winter Showcase',
    host: 'UW Design Society',
    datetime: 'Dec 3 · 6:30 PM',
    startsAt: '2026-12-03T18:30:00-08:00',
    distance: '0.8 miles',
    tags: ['Arts'],
    heroImageUrl: Showcase,
    location: { coordinates: [-122.305, 47.657] },
  },
  {
    id: '5',
    title: 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
    host: 'UW Lambda Phi Epsilon',
    datetime: 'Today · 11:59 PM',
    startsAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
    distance: '0.2 miles',
    tags: ['Social', 'Party', 'Holiday', 'Music', 'Dance', 'Food', 'Outdoors', 'Service', 'Sports', 'Arts'],
    heroImageUrl: Holiday,
    location: { coordinates: [-122.310, 47.655] },
  },
]
