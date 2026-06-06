import { Suspense, lazy, useMemo, useState } from 'react'
import { DEFAULT_POSITION } from './constants'

const LocationMap = lazy(() => import('./LocationMap'))

interface LocationSectionProps {
  address: string;
  lat: number | null;
  lng: number | null;
  radius: number | null;
  onLocationChange: (values: { address: string; lat: number | null; lng: number | null; radius: number | null }) => void;
}

const LocationSection = ({
  address,
  lat,
  lng,
  radius,
  onLocationChange,
}: LocationSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("No soportado");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
          address,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius,
        });
        setLoading(false);
      },
      () => {
        setError("Denegado");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const effectiveLat = lat ?? DEFAULT_POSITION[0];
  const effectiveLng = lng ?? DEFAULT_POSITION[1];
  const effectivePosition = useMemo<[number, number]>(
    () => [effectiveLat, effectiveLng],
    [effectiveLat, effectiveLng]
  );

  return (
    <section className="glass-panel p-8 rounded-token space-y-6 border border-black/5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-black text-lg font-light">location_on</span>
          </div>
          <h2 className="font-display text-xs uppercase tracking-[0.1em] text-black font-light">Área de Trabajo</h2>
        </div>
        <button 
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-full text-[9px] uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all font-display font-light disabled:bg-zinc-400 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] font-light">my_location</span>
          {loading ? "Obteniendo..." : "Obtener ubicación"}
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="location-address" className="text-[8px] text-black/40 uppercase tracking-[0.25em] ml-1 font-display font-light">Referencia / Dirección</label>
          <input
            id="location-address"
            type="text"
            value={address}
            onChange={(e) => onLocationChange({ address: e.target.value, lat, lng, radius })}
            className="w-full bg-white/60 border border-black/5 rounded-token px-6 py-3 focus:ring-2 focus:ring-black outline-none text-sm text-black placeholder:text-black/20 font-light"
            placeholder="Ej. Oficina Central"
          />
        </div>

        <div className="relative h-[220px] rounded-token overflow-hidden border border-black/5">
          <Suspense fallback={<div className="w-full h-full bg-neutral animate-pulse" />}>
            <LocationMap
              position={effectivePosition}
              radius={radius}
              onPositionChange={(coords) => onLocationChange({ address, lat: coords.lat, lng: coords.lng, radius })}
            />
          </Suspense>
          {error && <div className="absolute top-2 right-2 px-3 py-1 bg-error text-white text-[9px] rounded-full z-[1000]">{error}</div>}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/40 rounded-token border border-black/5">
          <dt className="text-[8px] text-black/40 uppercase tracking-[0.2em] block mb-1 font-display font-light">Latitud</dt>
          <dd className="font-mono text-xs text-black font-light">{lat?.toFixed(6) ?? "---"}</dd>
        </div>
        <div className="p-4 bg-white/40 rounded-token border border-black/5">
          <dt className="text-[8px] text-black/40 uppercase tracking-[0.2em] block mb-1 font-display font-light">Longitud</dt>
          <dd className="font-mono text-xs text-black font-light">{lng?.toFixed(6) ?? "---"}</dd>
        </div>
      </dl>

      <div className="space-y-3 p-5 bg-black/5 rounded-token">
        <div className="flex justify-between text-[9px] font-black text-black uppercase tracking-[0.2em] font-display">
          <label htmlFor="location-radius" className="font-light">Radio de marcación</label>
          <span className="text-black font-mono font-light" aria-hidden="true">{radius}m</span>
        </div>
        <input
          id="location-radius"
          type="range"
          min="50"
          max="1000"
          step="50"
          value={radius ?? 100}
          onChange={(e) => onLocationChange({ address, lat, lng, radius: Number(e.target.value) })}
          className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer accent-black transition-all"
        />
      </div>
    </section>
  );
}

export default LocationSection
