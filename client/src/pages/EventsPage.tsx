import EventFeedList from '../components/EventFeedList'

const EventsPage = () => (
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

export default EventsPage
