import { Suspense, lazy } from 'react'
import { DEFAULT_POSITION } from './constants'

const LocationMap = lazy(() => import('./LocationMap'))

interface LocationSectionProps {
  address: string;
  onAddressChange: (value: string) => void;
  lat: number | null;
  lng: number | null;
  radius: number | null;
  onPositionChange: (coords: { lat: number; lng: number }) => void;
  onRadiusChange: (value: number | null) => void;
  validationErrors: string[];
  showValidation: boolean;
}

import { useState } from "react";

const LocationSection = ({
  address,
  onAddressChange,
  lat,
  lng,
  radius,
  onPositionChange,
  onRadiusChange,
  validationErrors,
  showValidation,
}: LocationSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onPositionChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let msg = "No se pudo obtener la ubicación.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Permiso de ubicación denegado.";
        }
        setError(msg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const effectiveLat = lat ?? DEFAULT_POSITION[0];
  const effectiveLng = lng ?? DEFAULT_POSITION[1];

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Ubicación permitida</h2>
      <p className="text-sm text-slate-500">
        Selecciona desde qué ubicación se permite la marcación automática. Si estás
        fuera de este rango, no se enviará la marcación.
      </p>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700" htmlFor="address">
          Dirección / Referencia
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="Ej. Av. Example 123"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-slate-700">
            Ubicación en el mapa
          </span>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Obteniendo ubicación…" : "Usar mi ubicación actual"}
          </button>
        </div>

        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-50" />}>
          <LocationMap
            position={[effectiveLat, effectiveLng]}
            radius={radius}
            onPositionChange={onPositionChange}
          />
        </Suspense>

        {error ? (
          <p className="text-sm text-amber-600">{error}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Coordenadas actuales</span>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div>Latitud: {lat?.toFixed(6) ?? '—'}</div>
            <div>Longitud: {lng?.toFixed(6) ?? '—'}</div>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="radius" className="text-sm font-medium text-slate-700">
            Radio permitido (metros)
          </label>
          <input
            id="radius"
            type="number"
            min={1}
            value={radius ?? ''}
            onChange={(event) => {
              const value = event.target.value
              onRadiusChange(value ? Number(value) : null)
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
          />
        </div>
      </div>

      {showValidation && validationErrors.length > 0 ? (
        <ul className="space-y-1 text-sm text-rose-600">
          {validationErrors.map((error) => (
            <li key={error}>• {error}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default LocationSection
