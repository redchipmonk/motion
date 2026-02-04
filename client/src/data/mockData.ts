import type { EventFeedItem } from '../types'
import BakeSale from './Bake-Sale_800x531.jpg'
import Trash from './trash.jpeg'
import Soccer from './wc_final_16x9.jpg'
import Showcase from './Design Showcase 1.jpg'
import Holiday from './close-up-shot-of-a-Christmas-tree.jpeg'

export const MOCK_EVENTS: EventFeedItem[] = [
  {
    _id: '1',
    title: 'Bake Sale',
    description: `Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event!\n\nStop by, satisfy your sweet tooth, and support a great cause! Don't miss out-come for the treats, stay for the fun! Proceeds will support XXX charity.`,
    dateTime: new Date(Date.now() + 172800000).toISOString(), // +2 days
    distance: 965.606, // ~0.6 miles in meters
    tags: ['Food'],
    images: [BakeSale, BakeSale, BakeSale],
    location: { coordinates: [-122.3035, 47.6553] },
    participantCount: 132,
    creatorDetails: {
      _id: 'h1',
      name: 'UW Cuisine Club',
      avatarUrl: BakeSale,
      bio: 'UW Cuisine Club is a student organization at the University of Washington that is dedicated to the study of cuisines.'
    }
  },
  {
    _id: '2',
    title: 'Campus Clean Up',
    description: 'Join us for a campus clean up event!',
    dateTime: new Date(Date.now() + 432000000).toISOString(), // +5 days
    distance: 1931.21, // ~1.2 miles
    tags: ['Service', 'Outdoors'],
    images: [Trash, Trash, Trash],
    location: { coordinates: [-122.308, 47.656] },
    participantCount: 45,
    creatorDetails: {
      _id: 'h2',
      name: 'Eco Huskies',
      avatarUrl: Trash,
      bio: 'Eco Huskies is dedicated to keeping our campus clean and green.'
    }
  },
  {
    _id: '3',
    title: 'Intramural Soccer Finals',
    description: 'Cheer on your favorite teams at the intramural soccer finals!',
    dateTime: new Date(Date.now() - 259200000).toISOString(), // -3 days (Past Event)
    distance: 0,
    tags: ['Sports'],
    images: [Soccer, Soccer, Soccer],
    location: { coordinates: [-122.302, 47.654] },
    participantCount: 300,
    creatorDetails: {
      _id: 'h3',
      name: 'UW Athletics',
      avatarUrl: Soccer,
      bio: 'Official UW Athletics intramural sports.'
    }
  },
  {
    _id: '4',
    title: 'Winter Showcase',
    description: 'A showcase of student design work.',
    dateTime: new Date(Date.now() + 864000000).toISOString(), // +10 days
    distance: 1287.48, // ~0.8 miles
    tags: ['Arts'],
    images: [Showcase, Showcase, Showcase],
    location: { coordinates: [-122.305, 47.657] },
    participantCount: 89,
    creatorDetails: {
      _id: 'h4',
      name: 'UW Design Society',
      avatarUrl: Showcase,
      bio: 'Supporting student designers at UW.'
    }
  },
  {
    _id: '5',
    title: 'End of Quarter Party',
    description: 'Celebrate the end of the quarter with us!',
    dateTime: new Date(Date.now() + 1296000000).toISOString(), // +15 days
    distance: 321.869, // ~0.2 miles
    tags: ['Social', 'Party'],
    images: [Holiday, Holiday, Holiday],
    location: { coordinates: [-122.310, 47.655] },
    participantCount: 200,
    creatorDetails: {
      _id: 'h5',
      name: 'UW Lambda Phi Epsilon',
      avatarUrl: Holiday,
      bio: 'UW Lambda Phi Epsilon fraternity.'
    }
  },
]
