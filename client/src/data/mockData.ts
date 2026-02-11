import type { EventFeedItem, User, RSVP } from '../types'
import BakeSale from './Bake-Sale_800x531.jpg'
import Trash from './trash.jpeg'
import Soccer from './wc_final_16x9.jpg'
import Showcase from './Design Showcase 1.jpg'
import Holiday from './close-up-shot-of-a-Christmas-tree.jpeg'

export const MOCK_USERS: User[] = [
  { _id: 'u1', name: 'Alice Chen', email: 'alice@uw.edu', handle: '@alice', bio: 'CS major, loves hiking.', avatarUrl: Holiday, userType: 'individual' },
  { _id: 'u2', name: 'Bob Smith', email: 'bob@uw.edu', handle: '@bob_s', bio: 'Architecture student.', avatarUrl: Showcase, userType: 'individual' },
  { _id: 'u3', name: 'Charlie Kim', email: 'charlie@uw.edu', handle: '@ckim', bio: 'Foodie and photographer.', avatarUrl: BakeSale, userType: 'individual' },
  { _id: 'u4', name: 'Diana Prince', email: 'diana@uw.edu', handle: '@wonder', bio: 'Just looking for fun events.', avatarUrl: Soccer, userType: 'individual' },
  { _id: 'u5', name: 'Evan Wright', email: 'evan@uw.edu', handle: '@ewright', bio: 'Music lover.', userType: 'individual' },
  { _id: 'u6', name: 'Fiona Gallagher', email: 'fiona@uw.edu', handle: '@fi_g', bio: 'Always down for a party.', userType: 'individual' },
  { _id: 'u7', name: 'George Miller', email: 'george@uw.edu', handle: '@gmiller', bio: 'Sports fanatic.', userType: 'individual' },
  { _id: 'u8', name: 'Hannah Lee', email: 'hannah@uw.edu', handle: '@hlee', bio: 'Art enthusiast.', userType: 'individual' },
  { _id: 'u9', name: 'Ian Wright', email: 'ian@uw.edu', handle: '@iwright', bio: 'Music lover.', userType: 'individual' },
  // Organizations
  { _id: 'h2', name: 'Eco Huskies', email: 'eco@uw.edu', handle: '@ecohuskies', bio: 'Eco Huskies is dedicated to keeping our campus clean and green.', avatarUrl: Trash, userType: 'organization' },
  { _id: 'h3', name: 'UW Athletics', email: 'athletics@uw.edu', handle: '@uwathletics', bio: 'Official UW Athletics intramural sports.', avatarUrl: Soccer, userType: 'organization' },
  { _id: 'h5', name: 'UW Lambda Phi Epsilon', email: 'lambdas@uw.edu', handle: '@uwlambdas', bio: 'UW Lambda Phi Epsilon fraternity.', avatarUrl: Holiday, userType: 'organization' },
];

export const MOCK_RSVPS: RSVP[] = [
  // Event 1: Bake Sale (8 going)
  { _id: 'r2', eventId: '1', userId: 'u2', status: 'going' },
  { _id: 'r3', eventId: '1', userId: 'u3', status: 'going' },
  { _id: 'r4', eventId: '1', userId: 'u4', status: 'going' },
  { _id: 'r5', eventId: '1', userId: 'u5', status: 'going' },
  { _id: 'r1_6', eventId: '1', userId: 'u6', status: 'going' },
  { _id: 'r1_7', eventId: '1', userId: 'u7', status: 'going' },
  { _id: 'r1_8', eventId: '1', userId: 'u8', status: 'going' },
  { _id: 'r1_9', eventId: '1', userId: 'u9', status: 'going' },

  // Event 2: Campus Clean Up (2 going)
  { _id: 'r6', eventId: '2', userId: 'u6', status: 'going' },
  { _id: 'r7', eventId: '2', userId: 'u7', status: 'going' },

  // Event 3: Soccer Finals (4 going, 1 interested)
  { _id: 'r8', eventId: '3', userId: 'u7', status: 'going' },
  { _id: 'r9', eventId: '3', userId: 'u8', status: 'going' },
  { _id: 'r10', eventId: '3', userId: 'u1', status: 'going' },
  { _id: 'r11', eventId: '3', userId: 'u2', status: 'interested' },
  { _id: 'r12', eventId: '3', userId: 'u3', status: 'going' },

  // Event 4: Winter Showcase (3 going)
  { _id: 'r13', eventId: '4', userId: 'u2', status: 'going' },
  { _id: 'r14', eventId: '4', userId: 'u8', status: 'going' },
  { _id: 'r15', eventId: '4', userId: 'u4', status: 'going' },

  // Event 5: End of Quarter Party (5 going, 3 interested)
  { _id: 'r16', eventId: '5', userId: 'u1', status: 'going' },
  { _id: 'r17', eventId: '5', userId: 'u2', status: 'going' },
  { _id: 'r18', eventId: '5', userId: 'u3', status: 'going' },
  { _id: 'r19', eventId: '5', userId: 'u4', status: 'going' },
  { _id: 'r20', eventId: '5', userId: 'u5', status: 'going' },
  { _id: 'r21', eventId: '5', userId: 'u6', status: 'interested' },
  { _id: 'r22', eventId: '5', userId: 'u7', status: 'interested' },
  { _id: 'r23', eventId: '5', userId: 'u8', status: 'interested' },

  // Event 6: Study Group (6 going)
  { _id: 'r24', eventId: '6', userId: 'u1', status: 'going' },
  { _id: 'r25', eventId: '6', userId: 'u2', status: 'going' },
  { _id: 'r26', eventId: '6', userId: 'u3', status: 'going' },
  { _id: 'r27', eventId: '6', userId: 'u4', status: 'going' },
  { _id: 'r28', eventId: '6', userId: 'u5', status: 'going' },
  { _id: 'r29', eventId: '6', userId: 'u6', status: 'going' },

  // Event 7: Coffee & Code (12 going)
  { _id: 'r30', eventId: '7', userId: 'u1', status: 'going' },
  { _id: 'r31', eventId: '7', userId: 'u2', status: 'going' },
  { _id: 'r32', eventId: '7', userId: 'u3', status: 'going' },
  { _id: 'r33', eventId: '7', userId: 'u4', status: 'going' },
  { _id: 'r34', eventId: '7', userId: 'u5', status: 'going' },
  { _id: 'r35', eventId: '7', userId: 'u6', status: 'going' },
  { _id: 'r36', eventId: '7', userId: 'u7', status: 'going' },
  { _id: 'r37', eventId: '7', userId: 'u8', status: 'going' },
  { _id: 'r38', eventId: '7', userId: 'h2', status: 'going' },
  { _id: 'r39', eventId: '7', userId: 'h3', status: 'going' },
  { _id: 'r40', eventId: '7', userId: 'h5', status: 'going' },
  { _id: 'r41', eventId: '7', userId: 'u1', status: 'interested' },

  // Event 8: Open Mic Night (25 going - simulating with subset)
  { _id: 'r42', eventId: '8', userId: 'u1', status: 'going' },
  { _id: 'r43', eventId: '8', userId: 'u2', status: 'going' },
  { _id: 'r44', eventId: '8', userId: 'u3', status: 'going' },
  { _id: 'r45', eventId: '8', userId: 'u4', status: 'going' },
  { _id: 'r46', eventId: '8', userId: 'u5', status: 'going' },
  { _id: 'r47', eventId: '8', userId: 'u6', status: 'going' },
  { _id: 'r48', eventId: '8', userId: 'u7', status: 'going' },
  { _id: 'r49', eventId: '8', userId: 'u8', status: 'going' },

  // Event 9: Basketball (10 going)
  { _id: 'r50', eventId: '9', userId: 'u1', status: 'going' },
  { _id: 'r51', eventId: '9', userId: 'u2', status: 'going' },
  { _id: 'r52', eventId: '9', userId: 'u3', status: 'going' },
  { _id: 'r53', eventId: '9', userId: 'u4', status: 'going' },
  { _id: 'r54', eventId: '9', userId: 'u5', status: 'going' },
  { _id: 'r55', eventId: '9', userId: 'u6', status: 'going' },
  { _id: 'r56', eventId: '9', userId: 'u7', status: 'going' },
  { _id: 'r57', eventId: '9', userId: 'u8', status: 'going' },
  { _id: 'r58', eventId: '9', userId: 'h2', status: 'going' },
  { _id: 'r59', eventId: '9', userId: 'h3', status: 'going' },

  // Event 10: Resume Workshop (18 going - simulating with subset)
  { _id: 'r60', eventId: '10', userId: 'u1', status: 'going' },
  { _id: 'r61', eventId: '10', userId: 'u2', status: 'going' },
  { _id: 'r62', eventId: '10', userId: 'u3', status: 'going' },
  { _id: 'r63', eventId: '10', userId: 'u4', status: 'going' },
  { _id: 'r64', eventId: '10', userId: 'u5', status: 'going' },
  { _id: 'r65', eventId: '10', userId: 'u6', status: 'going' },
  { _id: 'r66', eventId: '10', userId: 'u7', status: 'going' },
  { _id: 'r67', eventId: '10', userId: 'u8', status: 'going' },

  // Event 11: Yoga (14 going - simulating with subset)
  { _id: 'r68', eventId: '11', userId: 'u1', status: 'going' },
  { _id: 'r69', eventId: '11', userId: 'u2', status: 'going' },
  { _id: 'r70', eventId: '11', userId: 'u3', status: 'going' },
  { _id: 'r71', eventId: '11', userId: 'u4', status: 'going' },
  { _id: 'r72', eventId: '11', userId: 'u5', status: 'going' },
  { _id: 'r73', eventId: '11', userId: 'u6', status: 'going' },
  { _id: 'r74', eventId: '11', userId: 'u7', status: 'going' },
  { _id: 'r75', eventId: '11', userId: 'u8', status: 'going' },

  // Event 12: Game Night (8 going)
  { _id: 'r76', eventId: '12', userId: 'u1', status: 'going' },
  { _id: 'r77', eventId: '12', userId: 'u2', status: 'going' },
  { _id: 'r78', eventId: '12', userId: 'u3', status: 'going' },
  { _id: 'r79', eventId: '12', userId: 'u4', status: 'going' },
  { _id: 'r80', eventId: '12', userId: 'u5', status: 'going' },
  { _id: 'r81', eventId: '12', userId: 'u6', status: 'going' },
  { _id: 'r82', eventId: '12', userId: 'u7', status: 'going' },
  { _id: 'r83', eventId: '12', userId: 'u8', status: 'going' },
  // RSVP for Past Concert (Event 15) for Alice (u1)
  { _id: 'r84', eventId: '15', userId: 'u1', status: 'going' },
];

// Helper function to create a date with specific time
const createEventDate = (daysOffset: number, hour: number, minute: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const MOCK_EVENTS: EventFeedItem[] = [
  {
    _id: '1',
    title: 'Bake Sale',
    description: `Treat yourself to a variety of warming homemade baked goods, from cookies and brownies to cakes and pastries, all made by our very talented club members. Join us for this once-a-year event!\n\nStop by, satisfy your sweet tooth, and support a great cause! Don't miss out-come for the treats, stay for the fun! Proceeds will support XXX charity.`,
    dateTime: createEventDate(2, 13), // +2 days at 1:00 PM
    distance: 965.606, // ~0.6 miles in meters
    tags: ['Food'],
    images: [BakeSale, BakeSale, BakeSale],
    status: 'published',
    location: {
      coordinates: [-122.3035, 47.6553],
      address: 'HUB Lawn, 4001 E Stevens Way NE, Seattle, WA 98195'
    },
    participantCount: 8,
    creatorDetails: {
      _id: 'u1', // Alice Chen - the main user/logged in user
      name: 'Alice Chen',
      avatarUrl: Holiday,
      bio: 'CS major, loves hiking and organizing community events!'
    }
  },
  {
    _id: '2',
    title: 'Campus Clean Up',
    description: 'Join us for a campus clean up event! Help us keep UW beautiful and green. We provide all supplies - just bring your energy and enthusiasm!',
    dateTime: createEventDate(5, 10), // +5 days at 10:00 AM
    distance: 1931.21, // ~1.2 miles
    tags: ['Service', 'Outdoors'],
    images: [Trash, Trash, Trash],
    status: 'published',
    location: {
      coordinates: [-122.308, 47.656],
      address: 'Red Square, Seattle, WA 98195'
    },
    participantCount: 2,
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
    description: 'Cheer on your favorite teams at the intramural soccer finals! The championship match of the season - don\'t miss the action!',
    dateTime: createEventDate(-3, 15), // -3 days at 3:00 PM (Past Event)
    distance: 0,
    tags: ['Sports'],
    images: [Soccer, Soccer, Soccer],
    status: 'published',
    location: {
      coordinates: [-122.302, 47.654],
      address: 'IMA Fields, 3924 Montlake Blvd NE, Seattle, WA 98195'
    },
    participantCount: 4,
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
    description: 'A showcase of student design work. Come see amazing projects from UW\'s most talented designers and artists. Reception to follow!',
    dateTime: createEventDate(10, 18), // +10 days at 6:00 PM
    distance: 1287.48, // ~0.8 miles
    tags: ['Arts'],
    images: [Showcase, Showcase, Showcase],
    status: 'published',
    location: {
      coordinates: [-122.305, 47.657],
      address: 'Art Building, 4000 15th Ave NE, Seattle, WA 98195'
    },
    participantCount: 3,
    creatorDetails: {
      _id: 'u1', // Alice Chen - the main user/logged in user
      name: 'Alice Chen',
      avatarUrl: Showcase,
      bio: 'CS major, loves hiking and organizing community events!'
    }
  },
  {
    _id: '5',
    title: 'End of Quarter Party',
    description: 'Celebrate the end of the quarter with us! Music, food, and good vibes. All are welcome!',
    dateTime: createEventDate(15, 20), // +15 days at 8:00 PM
    distance: 321.869, // ~0.2 miles
    tags: ['Social', 'Party'],
    images: [Holiday, Holiday, Holiday],
    status: 'published',
    location: {
      coordinates: [-122.310, 47.655],
      address: 'The Ave, 4130 University Way NE, Seattle, WA 98105'
    },
    participantCount: 5,
    creatorDetails: {
      _id: 'h5',
      name: 'UW Lambda Phi Epsilon',
      avatarUrl: Holiday,
      bio: 'UW Lambda Phi Epsilon fraternity.'
    }
  },
  {
    _id: '6',
    title: 'Study Group: CSE 143',
    description: 'Weekly study group for CSE 143. We\'ll review lecture material, work through practice problems, and help each other prepare for the midterm.',
    dateTime: createEventDate(1, 14), // +1 day at 2:00 PM
    distance: 450.5,
    tags: ['Academic', 'Study'],
    images: [BakeSale],
    status: 'published',
    location: {
      coordinates: [-122.307, 47.653],
      address: 'Odegaard Library, 4060 George Washington Ln NE, Seattle, WA 98195'
    },
    participantCount: 6,
    creatorDetails: {
      _id: 'u3',
      name: 'Charlie Kim',
      avatarUrl: BakeSale,
      bio: 'Foodie and photographer.'
    }
  },
  {
    _id: '7',
    title: 'Coffee & Code Meetup',
    description: 'Casual meetup for developers to chat about tech, projects, and opportunities. Bring your laptop and ideas!',
    dateTime: createEventDate(3, 16), // +3 days at 4:00 PM
    distance: 1100.0,
    tags: ['Social', 'Tech'],
    images: [Showcase],
    status: 'published',
    location: {
      coordinates: [-122.312, 47.656],
      address: 'Cafe Allegro, 4214 University Way NE, Seattle, WA 98105'
    },
    participantCount: 12,
    creatorDetails: {
      _id: 'u2',
      name: 'Bob Smith',
      avatarUrl: Showcase,
      bio: 'Architecture student.'
    }
  },
  {
    _id: '8',
    title: 'Open Mic Night',
    description: 'Showcase your talent! Poetry, music, comedy - all performers welcome. Sign up starts at 7pm, show starts at 8pm.',
    dateTime: createEventDate(7, 20), // +7 days at 8:00 PM
    distance: 780.2,
    tags: ['Arts', 'Music', 'Social'],
    images: [Holiday],
    status: 'published',
    location: {
      coordinates: [-122.311, 47.654],
      address: 'HUB Ballroom, 4001 E Stevens Way NE, Seattle, WA 98195'
    },
    participantCount: 25,
    creatorDetails: {
      _id: 'u8',
      name: 'Hannah Lee',
      avatarUrl: Holiday,
      bio: 'Art enthusiast.'
    }
  },
  {
    _id: '9',
    title: 'Basketball Pickup Games',
    description: 'Weekly pickup basketball. All skill levels welcome! Just bring your game face and good sportsmanship.',
    dateTime: createEventDate(4, 17), // +4 days at 5:00 PM
    distance: 550.8,
    tags: ['Sports', 'Outdoors'],
    images: [Soccer],
    status: 'published',
    location: {
      coordinates: [-122.302, 47.654],
      address: 'IMA Basketball Courts, 3924 Montlake Blvd NE, Seattle, WA 98195'
    },
    participantCount: 10,
    creatorDetails: {
      _id: 'u7',
      name: 'George Miller',
      avatarUrl: Soccer,
      bio: 'Sports fanatic.'
    }
  },
  {
    _id: '10',
    title: 'Resume Workshop',
    description: 'Get your resume ready for career fair! Career counselors will review resumes and provide personalized feedback.',
    dateTime: createEventDate(6, 13), // +6 days at 1:00 PM
    distance: 920.4,
    tags: ['Career', 'Workshop'],
    images: [Showcase],
    status: 'published',
    location: {
      coordinates: [-122.306, 47.655],
      address: 'Mary Gates Hall, 3950 University Way NE, Seattle, WA 98105'
    },
    participantCount: 18,
    creatorDetails: {
      _id: 'u4',
      name: 'Diana Prince',
      avatarUrl: Soccer,
      bio: 'Just looking for fun events.'
    }
  },
  {
    _id: '11',
    title: 'Yoga in the Park',
    description: 'Free outdoor yoga session. Bring your own mat and enjoy an hour of relaxation and stretching in nature.',
    dateTime: createEventDate(8, 9), // +8 days at 9:00 AM
    distance: 1500.0,
    tags: ['Wellness', 'Outdoors'],
    images: [Trash],
    status: 'published',
    location: {
      coordinates: [-122.304, 47.658],
      address: 'Drumheller Fountain, Seattle, WA 98195'
    },
    participantCount: 14,
    creatorDetails: {
      _id: 'u6',
      name: 'Fiona Gallagher',
      avatarUrl: Holiday,
      bio: 'Always down for a party.'
    }
  },
  {
    _id: '12',
    title: 'Game Night: Board Games & Pizza',
    description: 'Unwind with board games and pizza! We have classics and new games. BYOB (Bring Your Own Beverage).',
    dateTime: createEventDate(12, 19), // +12 days at 7:00 PM
    distance: 400.0,
    tags: ['Social', 'Gaming', 'Food'],
    images: [BakeSale],
    status: 'published',
    location: {
      coordinates: [-122.309, 47.655],
      address: 'McMahon Hall Lounge, 4000 Whitman Ct NE, Seattle, WA 98195'
    },
    participantCount: 8,
    creatorDetails: {
      _id: 'u5',
      name: 'Evan Wright',
      avatarUrl: BakeSale,
      bio: 'Music lover.'
    }
  },
  {
    _id: '13',
    title: 'Spring Hiking Trip',
    description: 'Planning a group hike to Rattlesnake Ledge! Beautiful views and moderate difficulty. Still working out the final details.',
    dateTime: createEventDate(20, 8), // +20 days at 8:00 AM
    distance: 1200.0,
    tags: ['Outdoors', 'Social'],
    images: [Trash],
    status: 'draft',
    location: {
      coordinates: [-122.308, 47.656],
      address: 'Rattlesnake Ledge Trailhead, North Bend, WA 98045'
    },
    participantCount: 0,
    creatorDetails: {
      _id: 'u1', // Alice Chen - the main user/logged in user
      name: 'Alice Chen',
      avatarUrl: Holiday,
      bio: 'CS major, loves hiking and organizing community events!'
    }
  },
  {
    _id: '14',
    title: 'Past Hiking Trip',
    description: 'A great hike we did last month!',
    dateTime: createEventDate(-30, 9), // -30 days
    distance: 1200.0,
    tags: ['Outdoors'],
    images: [Trash],
    status: 'published', // Published past event
    location: {
      coordinates: [-122.308, 47.656],
      address: 'Rattlesnake Ledge'
    },
    participantCount: 5,
    creatorDetails: {
      _id: 'u1',
      name: 'Alice Chen',
      avatarUrl: Holiday,
      bio: 'CS major...'
    }
  },
  {
    _id: '15',
    title: 'Past Concert',
    description: 'An amazing concert I went to.',
    dateTime: createEventDate(-10, 20), // -10 days
    distance: 50.0,
    tags: ['Music'],
    images: [Soccer],
    status: 'published',
    location: {
      coordinates: [-122.3, 47.6],
      address: 'Downtown'
    },
    participantCount: 100,
    creatorDetails: {
      _id: 'u5',
      name: 'Evan Wright',
      avatarUrl: BakeSale,
      bio: 'Music lover.'
    }
  }
];

// --- Mock Data Helpers ---

export const getEventById = (id: string): EventFeedItem | undefined => {
  return MOCK_EVENTS.find(e => e._id === id);
};

export const getEventAttendees = (eventId: string): (User & { status: string })[] => {
  const rsvps = MOCK_RSVPS.filter(r => r.eventId === eventId);
  return rsvps.map(r => {
    const user = MOCK_USERS.find(u => u._id === r.userId);
    return user ? { ...user, status: r.status as string } : null;
  }).filter((u): u is User & { status: string } => u !== null);
};

export const getEventsByHost = (hostId: string): EventFeedItem[] => {
  return MOCK_EVENTS.filter(e => e.creatorDetails?._id === hostId);
};

export const getSimilarEvents = (eventId: string): EventFeedItem[] => {
  // Simple mock implementation: return all other events to ensure we have data
  return MOCK_EVENTS.filter(e => e._id !== eventId).slice(0, 3);
};

export const getUserById = (userId: string): User | undefined => {
  return MOCK_USERS.find(u => u._id === userId);
};

export const getMutualFollowers = (currentUserId: string, targetUserId: string): User[] => {
  // Mock logic: 
  // 1. "Connections" -> Everyone is connected to everyone for now in mock data?
  // 2. "Mutual Followers" -> People current user follows AND who follow target user.
  // For mock simplicity: Return a random subset of MOCK_USERS excluding self and target.
  return MOCK_USERS.filter(u => u._id !== currentUserId && u._id !== targetUserId).slice(0, 5);
};

export const getUserEvents = (userId: string): EventFeedItem[] => {
  // Return events hosted by user OR events user is attending
  const hosted = MOCK_EVENTS.filter(e => e.creatorDetails?._id === userId);
  const rsvped = MOCK_RSVPS
    .filter(r => r.userId === userId && ['going', 'interested'].includes(r.status))
    .map(r => MOCK_EVENTS.find(e => e._id === r.eventId))
    .filter((e): e is EventFeedItem => !!e);

  // Deduplicate and return
  const all = [...hosted, ...rsvped];
  return Array.from(new Map(all.map(item => [item._id, item])).values());
};
