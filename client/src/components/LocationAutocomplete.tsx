import { useState, useEffect, useRef } from 'react'

interface Location {
  display_name: string
  lat: string
  lon: string
}

interface LocationAutocompleteProps {
  onSelect: (address: string, lat: number, lng: number) => void
}

const LocationAutocomplete = ({ onSelect }: LocationAutocompleteProps) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const searchNominatim = async (value: string) => {
    if (!value || value.length < 3) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`
      )
      const data = await response.json()
      setSuggestions(data)
      setIsOpen(true)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    // Debounce to respect Nominatim usage policy (1 request per sec roughly)
    debounceTimer.current = setTimeout(() => {
      searchNominatim(value)
    }, 1000)
  }

  const handleSelect = (location: Location) => {
    setQuery(location.display_name)
    setIsOpen(false)
    setSuggestions([])
    onSelect(location.display_name, parseFloat(location.lat), parseFloat(location.lon))
  }

  return (
    <div className="relative w-full group">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search for a venue or address..."
        className="w-full rounded-sm border border-transparent bg-white px-4 py-3 text-black placeholder-black/50 outline-none transition focus:placeholder-transparent focus:shadow-[0_0_0_2px_#5F0589] sm:text-sm"
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="cursor-pointer px-4 py-3 hover:bg-gray-50 text-gray-700 border-b border-gray-50 last:border-0"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
      <div className="text-[10px] text-gray-400 mt-1 pl-1">
        Powered by OpenStreetMap
      </div>
    </div>
  )
}

export default LocationAutocomplete
