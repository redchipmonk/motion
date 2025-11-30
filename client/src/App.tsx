import { BrowserRouter, Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom'
import AuthPage from './pages/AuthPage'

const NAV_LINKS = [
  { label: 'All Events', path: '/events' },
  { label: 'My Events', path: '/my-events' },
  { label: 'Profile', path: '/profile' },
]

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/events" element={<EventFeedPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/add-event" element={<AddEventPage />} />
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
)

const AppLayout = () => (
  <div className="flex min-h-screen flex-col bg-motion-lavender text-motion-plum">
    <PrimaryHeader />
    <main className="flex-1 px-6 py-6 md:px-12 md:py-10">
      <Outlet />
    </main>
  </div>
)

const PrimaryHeader = () => (
  <header className="grid gap-4 bg-[#470085] px-6 py-4 text-white md:grid-cols-[auto,minmax(220px,1fr),auto,auto] md:items-center md:px-12">
    <div className="text-xl font-bold">Motion</div>
    <div>
      <input
        type="search"
        placeholder="Search for users/events..."
        aria-label="Search"
        className="w-full rounded-full border-none px-4 py-2 text-motion-plum outline-none"
      />
    </div>
    <nav className="flex gap-3 text-sm font-medium">
      {NAV_LINKS.map(({ label, path }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `rounded-full px-3 py-1 transition ${isActive ? 'bg-white/25 text-white' : 'text-white/80 hover:text-white'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
    <a className="rounded-full bg-motion-yellow px-5 py-2 text-sm font-semibold text-motion-plum" href="/login">
      Sign In
    </a>
  </header>
)

const EventFeedPage = () => (
  <section className="grid gap-6 rounded-3xl bg-white p-8 shadow-card md:grid-cols-[minmax(320px,420px)_minmax(260px,1fr)]">
    <div className="rounded-3xl border border-dashed border-motion-plum/20 bg-motion-lavender p-6">
      <h2 className="text-2xl font-semibold">Upcoming Events</h2>
      <p className="text-motion-plum/70">Render event cards here.</p>
    </div>
    <div className="rounded-3xl border border-dashed border-motion-plum/20 bg-motion-lavender p-6 text-motion-plum/70">
      Map component placeholder
    </div>
  </section>
)

const EventDetailPage = () => (
  <section className="space-y-4 rounded-3xl bg-white p-8 shadow-card">
    <h1 className="text-3xl font-bold">Event Detail</h1>
    <p className="text-motion-plum/70">Show event hero, description, RSVP actions, gallery, etc.</p>
  </section>
)

const AddEventPage = () => (
  <section className="space-y-4 rounded-3xl bg-white p-8 shadow-card">
    <h1 className="text-3xl font-bold">Add / Edit Event</h1>
    <p className="text-motion-plum/70">Build the multi-field event form here.</p>
  </section>
)

const MyEventsPage = () => (
  <section className="space-y-4 rounded-3xl bg-white p-8 shadow-card">
    <h1 className="text-3xl font-bold">My Events</h1>
    <p className="text-motion-plum/70">Filter/paginate the user’s hosted + RSVP’d events.</p>
  </section>
)

const ProfilePage = () => (
  <section className="space-y-4 rounded-3xl bg-white p-8 shadow-card">
    <h1 className="text-3xl font-bold">Profile</h1>
    <p className="text-motion-plum/70">Display and edit organization details, connections, highlighted events.</p>
  </section>
)

const NotFoundPage = () => (
  <section className="space-y-4 rounded-3xl bg-white p-8 text-center shadow-card">
    <h1 className="text-4xl font-bold">404</h1>
    <p className="text-motion-plum/70">We couldn’t find that route. Use the nav to get back on track.</p>
  </section>
)

export default App
