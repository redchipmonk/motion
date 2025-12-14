import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import NavBar from './components/NavBar'
import EventFeedList from './components/EventFeedList'

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
  <div className="flex h-screen flex-col overflow-hidden bg-motion-lavender text-motion-plum">
    <NavBar />
    <main className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </main>
  </div>
)

const EventFeedPage = () => (
  <section className="relative h-full min-h-0 overflow-hidden">
    <div className="absolute inset-0">
      <div className="h-full w-full bg-motion-lavender">
        <div className="flex h-full w-full items-start justify-start p-6 text-motion-plum/60">
          Map component placeholder
        </div>
      </div>
    </div>

    <div className="absolute inset-y-0 left-0 w-1/2 min-h-0">
      <EventFeedList />
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
