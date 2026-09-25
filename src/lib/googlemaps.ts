import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

setOptions({
  key: apiKey,
  v: 'weekly',
})

export async function loadPlaces() {
  return await importLibrary('places')
}