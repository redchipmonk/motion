import { BrowserRouter, Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import { useAuth } from './hooks/useAuth'

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

const PrimaryHeader = () => {
  const { user, loading, logout } = useAuth()

  return (
    <header className="grid gap-4 bg-[#470085] px-6 py-4 text-white md:grid-cols-[auto,minmax(220px,1fr),auto,auto] md:items-center md:px-12">
      {/* Logo */}
      <div className="text-xl font-bold">Motion</div>

      {/* Search */}
      <div>
        <input
          type="search"
          placeholder="Search for users/events..."
          aria-label="Search"
          className="w-full rounded-full border-none px-4 py-2 text-motion-plum outline-none"
        />
      </div>

      {/* Nav Links */}
      <nav className="flex gap-3 text-sm font-medium">
        {NAV_LINKS.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `rounded-full px-3 py-1 transition ${isActive ? 'bg-white/25' : 'text-white/80 hover:text-white'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Right side: Sign In / Logout */}
      <div className="flex items-center justify-end">
        {loading ? (
          // Optional: tiny loading state
          <div className="h-9 w-20 animate-pulse rounded-full bg-white/20" />
        ) : user ? (
          // Logged in → show name + logout
          <div className="flex items-center gap-3">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="h-8 w-8 rounded-full border-2 border-white/30"
              />
            )}
            <span className="hidden text-sm md:block">
              Hi, {user.name.split(' ')[0]}
            </span>
            <button
              onClick={logout}
              className="rounded-full bg-white/20 px-4 py-1.5 text-xs hover:bg-white/30 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          // Not logged in → Sign In button
          <a
            href="/login"
            className="rounded-full bg-motion-yellow px-5 py-2 text-sm font-semibold text-motion-plum hover:opacity-90"
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  )
}

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
