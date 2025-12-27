import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import EventCard, { type EventSummary } from '../EventCard'

type EventMarkerProps = {
  event: EventSummary
  position: [number, number]
}

const createCustomIcon = () => {
  const html = renderToStaticMarkup(
    <div className="box-content h-6 w-6 rounded-full bg-motion-orange border-[3px] border-white shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:scale-110 transition-transform duration-200" />
  )

  return L.divIcon({
    html,
    className: 'bg-transparent',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    tooltipAnchor: [0, -15],
  })
}

const createTodayIcon = (title: string) => {
  const html = renderToStaticMarkup(
    <div className="flex h-full w-full items-center justify-center font-sans hover:scale-105 transition-transform duration-200">
      {/* Group Wrapper */}
      <div className="relative flex items-center justify-center">

        {/* Pointer */}
        <div
          className="absolute left-1/2 bottom-[-9px] -translate-x-1/2 w-5 h-5 bg-[#EC6504] border-[3px] border-white rotate-45 z-0"
        />

        {/* Event Title Bubble */}
        <div className="relative z-10 flex max-w-[200px] items-center justify-center rounded-full border-[3px] border-white bg-[#EC6504] px-6 py-3 shadow-none">

          {/* Today Badge */}
          <div
            className="absolute -top-[22px] -right-[2px] z-30 whitespace-nowrap bg-white border-2 border-[#EC6504] px-4 py-1 shadow-sm"
            style={{
              borderRadius: '20px 20px 0px 20px'
            }}
          >
            <span className="text-black font-bold text-[14px]">Today</span>
          </div>

          <span
            className="line-clamp-2 text-center text-white leading-tight"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            {title}
          </span>
        </div>
      </div>
    </div>
  )

  return L.divIcon({
    html,
    className: 'bg-transparent',
    iconSize: [220, 100],
    iconAnchor: [110, 80],
    popupAnchor: [0, -80],
    tooltipAnchor: [0, -65],
  })
}

const defaultIcon = createCustomIcon()

const EventMarker = ({ event, position }: EventMarkerProps) => {
  const isToday = (() => {
    if (!event.startsAt) return false
    const date = new Date(event.startsAt)
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  })()

  const icon = isToday ? createTodayIcon(event.title) : defaultIcon

  return (
    <Marker position={position} icon={icon}>
      <Tooltip
        className="!bg-transparent !border-none !shadow-none !p-0"
        direction="top"
        offset={[0, -10]}
        opacity={1}
      >
        <div className="w-[200px]">
          <EventCard event={event} variant="preview" isActive={false} />
        </div>
      </Tooltip>
    </Marker>
  )
}

export default EventMarker
