/**
 * LocationPicker.jsx
 * Interactive pin-drop map for selecting "Last Seen Location".
 *
 * Stack: react-leaflet + OpenStreetMap tiles + Nominatim (free, no API key)
 * Props:
 *   value   : { lat, lng, address } | null
 *   onChange: (loc: { lat, lng, address }) => void
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { MapPin, Locate, Search, X, Loader2, AlertCircle } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Fix Leaflet's broken default icon path in Vite ──────────────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Custom red pin icon
const PIN_ICON = new L.Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 36'%3E%3Cpath d='M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z' fill='%231E3A8A'/%3E%3Ccircle cx='12' cy='12' r='5' fill='white'/%3E%3C/svg%3E",
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
})

const DEFAULT_CENTER = { lat: 17.385, lng: 78.4867 } // Hyderabad
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

// ── Nominatim helpers ────────────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
  if (!res.ok) throw new Error('Reverse geocoding failed')
  const data = await res.json()
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

async function searchPlaces(query) {
  if (!query.trim()) return []
  const res = await fetch(
    `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
  if (!res.ok) return []
  return res.json()
}

// ── Inner components ─────────────────────────────────────────────────────────

/** Listens for map click events and calls onMove */
function ClickHandler({ onMove }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Imperatively flies the map to a new center */
function MapFlyTo({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], 15, { duration: 1 })
  }, [center, map])
  return null
}

// ── Main component ───────────────────────────────────────────────────────────
export default function LocationPicker({ value, onChange }) {
  const [pin, setPin] = useState(
    value?.lat ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER
  )
  const [address, setAddress] = useState(value?.address || '')
  const [flyTarget, setFlyTarget] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geoError, setGeoError] = useState(null)

  // Search state
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchDebounce = useRef(null)
  const searchRef = useRef(null)

  // ── Emit value upward whenever pin or address changes
  useEffect(() => {
    onChange({ lat: pin.lat, lng: pin.lng, address })
  }, [pin, address]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reverse geocode whenever pin moves
  const handleMove = useCallback(async (lat, lng) => {
    setPin({ lat, lng })
    setGeocoding(true)
    setGeoError(null)
    try {
      const addr = await reverseGeocode(lat, lng)
      setAddress(addr)
    } catch {
      setGeoError('Could not fetch address. You can type it manually.')
    } finally {
      setGeocoding(false)
    }
  }, [])

  // ── Use current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setGeocoding(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        setFlyTarget({ lat, lng })
        handleMove(lat, lng)
      },
      () => {
        setGeocoding(false)
        setGeoError('Location access denied. Please allow location permissions.')
      },
      { timeout: 10000 }
    )
  }

  // ── Search with debounce
  const handleSearchInput = (val) => {
    setQuery(val)
    clearTimeout(searchDebounce.current)
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    setSearching(true)
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(val)
        setSuggestions(results)
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const handleSuggestionClick = (place) => {
    const lat = parseFloat(place.lat)
    const lng = parseFloat(place.lon)
    setQuery(place.display_name)
    setSuggestions([])
    setShowSuggestions(false)
    setFlyTarget({ lat, lng })
    handleMove(lat, lng)
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-3">
      {/* ── Search Box ── */}
      <div ref={searchRef} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for a place, area, landmark…"
            className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 shadow-sm"
          />
          {(searching || query) && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false) }}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[9999] top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((place, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleSuggestionClick(place)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] mt-0.5 shrink-0" />
                <span className="line-clamp-2 text-slate-700">{place.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 280 }}>
        <MapContainer
          center={[pin.lat, pin.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMove={handleMove} />
          {flyTarget && <MapFlyTo center={flyTarget} />}
          <Marker
            position={[pin.lat, pin.lng]}
            icon={PIN_ICON}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng()
                handleMove(lat, lng)
              },
            }}
          />
        </MapContainer>

        {/* "Use Current Location" button — floats inside map */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={geocoding}
          className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 bg-white border border-slate-200 shadow-md rounded-xl px-3 py-2 text-xs font-semibold text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white hover:border-[#1E3A8A] transition-all disabled:opacity-60"
        >
          {geocoding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Locate className="w-3.5 h-3.5" />
          )}
          My Location
        </button>

        {/* Instruction chip */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 text-white text-[10px] font-medium px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
          Click map or drag pin to set location
        </div>
      </div>

      {/* ── Address field ── */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        {geocoding && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            onChange({ lat: pin.lat, lng: pin.lng, address: e.target.value })
          }}
          placeholder="Address will appear here — or type manually"
          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        />
      </div>

      {/* Coordinates badge */}
      <p className="text-[11px] text-slate-400 text-right">
        📍 {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
      </p>

      {/* Error message */}
      {geoError && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {geoError}
        </div>
      )}
    </div>
  )
}
