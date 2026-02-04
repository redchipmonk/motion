import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { type ReactNode, useEffect } from 'react'
import L from 'leaflet'

// Fix for default marker icons in React Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// UW Seattle coordinates
const UW_COORDS: [number, number] = [47.6558, -122.3268]

type MapProps = {
  children?: ReactNode
  className?: string
  center?: [number, number]
  zoom?: number
}

const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5
    })
  }, [center, zoom, map])

  return null
}

const Map = ({ children, className, center = UW_COORDS, zoom = 15.1 }: MapProps) => {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} zoomControl={false} className={className} style={{ height: '100%', width: '100%' }}>
      <MapController center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <ZoomControl position="bottomright" />
      {children}
    </MapContainer>
  )
}

export default Map
