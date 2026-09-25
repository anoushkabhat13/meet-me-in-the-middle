import { useState, useEffect, useRef, useCallback } from 'react'
import { loadPlaces } from './lib/googlemaps'
import {getMidpoint} from './find_midpoint'

interface Result {
  name: string
  type: string
  address: string
  distance: string
  rating: number
  note: string
}



async function generateResults(
  latA: number, lngA: number,
  latB: number, lngB: number,
  interest: string
): Promise<Result[]> {
  const midpoint = getMidpoint(latA, lngA, latB, lngB)
  console.log('Midpoint:', midpoint)

  async function fetchPlaces() {
    await loadPlaces()
    const { Place } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary

    const { places } = await Place.searchByText({
      textQuery: interest,
      fields: ['displayName', 'formattedAddress', 'location', 'rating', 'types'],
      locationBias: {
        center: { lat: midpoint.lat, lng: midpoint.lng },
        radius: 5000,
      },
      rankPreference: 'DISTANCE',
      maxResultCount: 10,
    })

    return places
  }

  const places = await fetchPlaces()

  return places.map((place) => ({
    name: place.displayName ?? 'Unknown place',
    type: interest.trim() || 'Place',
    address: place.formattedAddress ?? '',
    distance: place.location
  ? `${(
      google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(midpoint.lat, midpoint.lng),
        place.location
      ) / 1609.34
    ).toFixed(2)} mi`
  : '',
    rating: place.rating ?? 0,
    note: place.types?.[0]?.replace(/_/g, ' ') ?? '',
  }))
}

export default function App() {
  const [locationA, setLocationA] = useState('')
  const [locationB, setLocationB] = useState('')
  const [latA, setLatA] = useState<number | null>(null)
  const [lngA, setLngA] = useState<number | null>(null)
  const [latB, setLatB] = useState<number | null>(null)
  const [lngB, setLngB] = useState<number | null>(null) 
  const [interest, setInterest] = useState('')
  const [screen, setScreen] = useState<'input' | 'results'>('input')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)

  async function handleFind() {
    if (
      !locationA.trim() || !locationB.trim() || !interest.trim() ||
      latA == null || lngA == null || latB == null || lngB == null
    ) return

    setLoading(true)
    try {
      const newResults = await generateResults(latA, lngA, latB, lngB, interest)
      setResults(newResults)
      setScreen('results')
    } catch (err) {
      console.error('Failed to fetch results:', err)
    } finally {
      setLoading(false)
    }
  }


  const handleLocationAChange = useCallback(
    (address: string, lat: number, lng: number) => {
      setLocationA(address)
      setLatA(lat)
      setLngA(lng)
    },
    []
  )

  const handleLocationBChange = useCallback(
    (address: string, lat: number, lng: number) => {
      setLocationB(address)
      setLatB(lat)
      setLngB(lng)
    },
    []
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-canvas)', fontFamily: 'var(--font-body)' }}>
      {screen === 'input' ? (
        <InputScreen
          locationA={locationA}
          locationB={locationB}
          interest={interest}
          loading={loading}
          onChangeA={handleLocationAChange}
          onChangeB={handleLocationBChange}
          onChangeInterest={setInterest}
          onFind={handleFind}
        />
      ) : (
        <ResultsScreen
          locationA={locationA}
          locationB={locationB}
          interest={interest}
          results={results}
          onBack={() => setScreen('input')}
        />
      )}
    </div>
  )
}

function InputScreen({
  locationA, locationB, interest, loading,
  onChangeA, onChangeB, onChangeInterest, onFind
}: {
  locationA: string
  locationB: string
  interest: string
  loading: boolean
  onChangeA: (address: string, lat: number, lng: number) => void
  onChangeB: (address: string, lat: number, lng: number) => void
  onChangeInterest: (v: string) => void
  onFind: () => void
}) {
  const canSubmit =
  locationA.trim() &&
  locationB.trim() &&
  interest.trim() &&
  !loading

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl leading-tight mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)', fontStyle: 'italic' }}>
            Meet Me<br />in the Middle
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-cream-dim)' }}>
            Enter two locations and a place of interest. We'll find the perfect spot between you.
          </p>
        </div>

        {/* Location inputs */}

        <div className="space-y-3 mb-8">
          <LocationInput
            label="Your location"
            placeholder="e.g. Brooklyn, NY"
            value={locationA}
            onChange={onChangeA}
          />

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <div className="text-xs" style={{ color: 'var(--color-moss)' }}>↕</div>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          <LocationInput
            label="Their location"
            placeholder="e.g. Hoboken, NJ"
            value={locationB}
            onChange={onChangeB}
          />
        </div>

       
        {/* Place of interest */}
        <div className="mb-10">
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div className="flex-1">
              <div
                className="text-xs mb-0.5"
                style={{ color: 'var(--color-moss)' }}
              >
                Place of interest
              </div>

              <input
                type="text"
                placeholder="e.g. coffee shop, park, sushi restaurant"
                value={interest}
                onChange={(e) => onChangeInterest(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: 'var(--color-cream)' }}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onFind}
          disabled={!canSubmit}
          className="w-full py-4 rounded-xl text-base font-semibold tracking-wide transition-all duration-200"
          style={{
            background: canSubmit ? 'var(--color-amber)' : 'var(--color-surface-2)',
            color: canSubmit ? '#1a2318' : 'var(--color-moss)',
            fontFamily: 'var(--font-body)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Finding your midpoint…' : 'Find Meeting Spots'}
        </button>
      </div>
    </div>
  )
}

function LocationInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (address: string, lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let element: google.maps.places.PlaceAutocompleteElement
    let cancelled = false

    async function setup() {
      await loadPlaces()
      const { PlaceAutocompleteElement } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary
      //print to console the text inputted in PlaceAutocompleteElement to see what it is
      

      if (cancelled || !containerRef.current) return // <-- bail if this run is stale

      element = new PlaceAutocompleteElement()
      element.placeholder = placeholder
      element.value = value
      containerRef.current!.appendChild(element)

      element.addEventListener('gmp-select', async (e: any) => {
        const place = e.placePrediction.toPlace()
        await place.fetchFields({ fields: ['formattedAddress', 'location'] })
        console.log('Selected place:', place.formattedAddress) // Log the selected place's formatted address
        //find latitude and longitude of place and log it to console
        const location = place.location

        if (location) {
          console.log('Latitude:', location.lat())
          console.log('Longitude:', location.lng())
        }
        
        if (place.formattedAddress && place.location) {
          const lat = place.location.lat()
          const lng = place.location.lng()

          onChange(
            place.formattedAddress,
            lat,
            lng
          )
        }
              
      })
    }

    setup()
    return () => {
    cancelled = true
    element?.remove()
  }
  }, [placeholder, onChange])

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex-1">
        <div className="text-xs mb-0.5" style={{ color: 'var(--color-moss)' }}>{label}</div>
        <div ref={containerRef} />
      </div>
    </div>
  )
}



function ResultsScreen({ locationA, locationB, interest, results, onBack }: {
  locationA: string
  locationB: string
  interest: string
  results: Result[]
  onBack: () => void
}) {
  const typeLabel = interest.trim() || 'Places'

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-10 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs tracking-widest uppercase mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-body)' }}
        >
          ← Back
        </button>
        <h2 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)' }}>
          {typeLabel} spots<br /><em>between you both</em>
        </h2>
        <div className="flex items-center gap-2 text-xs mt-3" style={{ color: 'var(--color-cream-dim)' }}>
          <span
            className="px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
          >
            {locationA}
          </span>
          <span style={{ color: 'var(--color-moss)' }}>↔</span>
          <span
            className="px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
          >
            {locationB}
          </span>
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {results.map((r, i) => (
          <ResultCard key={i} result={r} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}

function ResultCard({ result, rank }: { result: Result; rank: number }) {
  const stars = '★'.repeat(Math.round(result.rating)) + '☆'.repeat(5 - Math.round(result.rating))

  return (
    <div
      className="rounded-xl p-4 transition-all duration-150 hover:scale-[1.01] cursor-pointer"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
          style={{
            background: rank === 1 ? 'var(--color-amber)' : 'var(--color-surface-2)',
            color: rank === 1 ? '#1a2318' : 'var(--color-moss)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="text-base font-semibold truncate" style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-body)' }}>
              {result.name}
            </h3>
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-amber)' }}>
              {result.rating}
            </span>
          </div>
          <div className="text-xs mb-2" style={{ color: 'var(--color-amber)', letterSpacing: '0.05em' }}>
            {stars}
          </div>
          <div className="text-xs mb-2" style={{ color: 'var(--color-cream-dim)' }}>
            {result.address} · {result.distance}
          </div>
          <div
            className="inline-flex items-center text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-moss)', border: '1px solid var(--color-border)' }}
          >
            {result.note}
          </div>
        </div>
      </div>
    </div>
  )
}
