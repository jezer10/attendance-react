import { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { DEFAULT_POSITION } from './constants'

interface LocationMapProps {
  position: [number, number]
  radius: number | null
  onPositionChange: (coords: { lat: number; lng: number }) => void
}

// const markerIconUrls = {
//   iconRetinaUrl: new URL(
//     'leaflet/dist/images/marker-icon-2x.png',
//     import.meta.url,
//   ).toString(),
//   iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
//   shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
// }

// L.Icon.Default.mergeOptions(markerIconUrls)

const MapViewUpdater = ({ position }: { position: [number, number] }) => {
  const map = useMap()

  useEffect(() => {
    map.setView(position)
  }, [map, position])

  return null
}

const LocationMap = ({ position, radius, onPositionChange }: LocationMapProps) => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  if (!isReady) {
    return <div className="h-64 w-full rounded-xl border border-slate-200 bg-slate-100" />
  }

  const [lat, lng] = position ?? DEFAULT_POSITION

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={true}
      className="h-64 w-full rounded-xl border border-slate-200"
    >
      <MapViewUpdater position={[lat, lng]} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        draggable
        position={[lat, lng]}
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target as L.Marker
            const nextPosition = marker.getLatLng()
            onPositionChange({ lat: nextPosition.lat, lng: nextPosition.lng })
          },
        }}
      />
      {radius && radius > 0 && (
        <Circle
          center={[lat, lng]}
          radius={radius}
          pathOptions={{
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.15,
          }}
        />
      )}
    </MapContainer>
  )
}

export default LocationMap
