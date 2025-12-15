import { useEffect, useRef } from 'react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'

const UW_CENTER: [number, number] = [-122.3035, 47.6553] // [lng, lat]

export default function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: UW_CENTER,
      zoom: 12.8,
      attributionControl: true,
    })

    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    const resize = () => map.resize()
    window.addEventListener('resize', resize)
    requestAnimationFrame(() => map.resize())

    return () => {
      window.removeEventListener('resize', resize)
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}
