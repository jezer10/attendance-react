import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ActionsPanel from "./automation/ActionsPanel";
import LocationSection from "./automation/LocationSection";
import ScheduleBlock from "./automation/ScheduleBlock";
import SummaryCard from "./automation/SummaryCard";
import TimezoneSection from "./automation/TimezoneSection";
import Toggle from "./automation/Toggle";
import { DAYS, DEFAULT_POSITION } from "./automation/constants";
import type {
  AutomationBlock,
  AutomationPayload,
  AutomationRule,
  DayKey,
  IsoDay,
  PersistedAutomationPayload,
} from "./automation/types";
import {
  extractOffsetMinutes,
  formatDays,
  isValidTime,
  toUtcTime,
} from "./automation/utils";

const ISO_DAY_MAP: Record<DayKey, IsoDay> = {
  Lun: "monday",
  Mar: "tuesday",
  Mie: "wednesday",
  Jue: "thursday",
  Vie: "friday",
  Sab: "saturday",
  Dom: "sunday",
};

interface AutomationSchedulerProps {
  initialRule: AutomationRule;
  availableTimezones: string[];
  onSave?: (payload: PersistedAutomationPayload) => Promise<void>;
  onImmediateMark?: (action: "entrada" | "salida") => Promise<void>;
}

const AutomationScheduler = ({
  initialRule,
  availableTimezones,
  onSave,
  onImmediateMark,
}: AutomationSchedulerProps) => {
  const [isActive, setIsActive] = useState(initialRule.activo);
  const [entry, setEntry] = useState<AutomationBlock>({
    ...initialRule.entrada,
  });
  const [exit, setExit] = useState<AutomationBlock>({ ...initialRule.salida });
  const [address, setAddress] = useState(initialRule.ubicacion.direccion ?? "");
  const [lat, setLat] = useState<number | null>(
    initialRule.ubicacion.lat ?? DEFAULT_POSITION[0]
  );
  const [lng, setLng] = useState<number | null>(
    initialRule.ubicacion.lng ?? DEFAULT_POSITION[1]
  );
  const [radius, setRadius] = useState<number | null>(
    initialRule.ubicacion.radio_metros ?? 100
  );
  const [timezone, setTimezone] = useState(initialRule.zona_horaria);

  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarking, setIsMarking] = useState<"entrada" | "salida" | null>(null);
  const [markFeedback, setMarkFeedback] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);
  const [showValidation, setShowValidation] = useState(false);

  const initialSnapshot = useRef<AutomationRule>(initialRule);

  useEffect(() => {
    setIsActive(initialRule.activo);
    setEntry({ ...initialRule.entrada });
    setExit({ ...initialRule.salida });
    setAddress(initialRule.ubicacion.direccion ?? "");
    setLat(initialRule.ubicacion.lat ?? DEFAULT_POSITION[0]);
    setLng(initialRule.ubicacion.lng ?? DEFAULT_POSITION[1]);
    setRadius(initialRule.ubicacion.radio_metros ?? 100);
    setTimezone(initialRule.zona_horaria);
    initialSnapshot.current = initialRule;
  }, [initialRule]);

  const offsetMinutes = useMemo(
    () => extractOffsetMinutes(timezone),
    [timezone]
  );

  const entryErrors = useMemo(() => {
    const errors: string[] = [];
    if (!entry.habilitado) return errors;
    if (!entry.hora_local || !entry.hora_local.trim()) {
      errors.push("Ingresa una hora de entrada.");
    } else if (!isValidTime(entry.hora_local)) {
      errors.push("Usa el formato HH:MM (24 horas).");
    }
    if (!entry.dias.length) {
      errors.push("Selecciona al menos un día.");
    }
    return errors;
  }, [entry]);

  const exitErrors = useMemo(() => {
    const errors: string[] = [];
    if (!exit.habilitado) return errors;
    if (!exit.hora_local || !exit.hora_local.trim()) {
      errors.push("Ingresa una hora de salida.");
    } else if (!isValidTime(exit.hora_local)) {
      errors.push("Usa el formato HH:MM (24 horas).");
    }
    if (!exit.dias.length) {
      errors.push("Selecciona al menos un día.");
    }
    return errors;
  }, [exit]);

  const locationErrors = useMemo(() => {
    const errors: string[] = [];
    if (lat === null || lng === null) {
      errors.push("Selecciona una ubicación en el mapa.");
    }
    if (radius === null || Number.isNaN(radius)) {
      errors.push("Indica un radio válido.");
    } else if (radius <= 0) {
      errors.push("El radio debe ser mayor a 0 metros.");
    }
    return errors;
  }, [lat, lng, radius]);

  const canSave =
    (!entry.habilitado || entryErrors.length === 0) &&
    (!exit.habilitado || exitErrors.length === 0) &&
    locationErrors.length === 0 &&
    !isSaving;

  const summary = useMemo(
    () => [
      {
        label: "Entrada",
        value: entry.habilitado
          ? `${formatDays(entry.dias)} a las ${entry.hora_local || "--:--"}`
          : "Automática: desactivada",
      },
      {
        label: "Salida",
        value: exit.habilitado
          ? `${formatDays(exit.dias)} a las ${exit.hora_local || "--:--"}`
          : "Automática: desactivada",
      },
      {
        label: "Ubicación",
        value:
          lat !== null && lng !== null && radius !== null
            ? `${address || "Sin dirección"}, radio ${radius} m`
            : "Pendiente de configuración",
      },
      {
        label: "Zona horaria",
        value: timezone,
      },
      {
        label: "Estado",
        value: isActive ? "Activo" : "Inactivo",
      },
    ],
    [address, entry, exit, isActive, lat, lng, radius, timezone]
  );

  const handleToggleDay = useCallback(
    (type: "entrada" | "salida", day: DayKey) => {
      const toggle = (block: AutomationBlock) => {
        const exists = block.dias.includes(day);
        return {
          ...block,
          dias: exists
            ? block.dias.filter((d) => d !== day)
            : [...block.dias, day].sort(
                (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
              ),
        };
      };

      if (type === "entrada") {
        setEntry((prev) => toggle(prev));
      } else {
        setExit((prev) => toggle(prev));
      }
    },
    []
  );

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeolocationError("Tu navegador no admite geolocalización.");
      return;
    }

    setGeolocationLoading(true);
    setGeolocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        setGeolocationLoading(false);
      },
      (error) => {
        setGeolocationLoading(false);
        setGeolocationError(
          error.message || "No se pudo obtener tu ubicación actual."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const normalizeBlock = (
    block: AutomationBlock
  ): AutomationPayload["entrada"] => {
    const horaLocal = block.habilitado ? block.hora_local.trim() : "";
    const dias = block.habilitado
      ? [...block.dias].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
      : [];

    return {
      habilitado: block.habilitado,
      hora_local: horaLocal,
      dias,
      hora_utc:
        block.habilitado && horaLocal
          ? toUtcTime(horaLocal, offsetMinutes)
          : null,
    };
  };

  const toPersistedBlock = (
    normalized: AutomationPayload["entrada"]
  ): PersistedAutomationPayload["schedule"]["entry"] => ({
    enabled: normalized.habilitado,
    localTime:
      normalized.habilitado && normalized.hora_local
        ? normalized.hora_local
        : null,
    utcTime: normalized.hora_utc ?? null,
    days: normalized.habilitado
      ? normalized.dias.map((day) => ISO_DAY_MAP[day])
      : [],
  });

  const handleSave = async () => {
    setShowValidation(true);
    setSaveStatus(null);

    if (!canSave) return;

    const normalizedEntry = normalizeBlock(entry);
    const normalizedExit = normalizeBlock(exit);

    const persistPayload: PersistedAutomationPayload = {
      isActive: isActive,
      schedule: {
        entry: toPersistedBlock(normalizedEntry),
        exit: toPersistedBlock(normalizedExit),
      },
      location: {
        address: address.trim(),
        latitude: lat ?? null,
        longitude: lng ?? null,
        radiusMeters: radius ?? null,
      },
      timezone,
    };

    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(persistPayload);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        // eslint-disable-next-line no-console
        console.info("Guardar payload", persistPayload);
      }
      setSaveStatus({
        type: "success",
        message: "Configuración guardada correctamente.",
      });
      initialSnapshot.current = {
        activo: isActive,
        entrada: {
          habilitado: normalizedEntry.habilitado,
          hora_local: normalizedEntry.hora_local,
          dias: normalizedEntry.dias,
        },
        salida: {
          habilitado: normalizedExit.habilitado,
          hora_local: normalizedExit.hora_local,
          dias: normalizedExit.dias,
        },
        ubicacion: {
          direccion: address.trim(),
          lat: lat ?? null,
          lng: lng ?? null,
          radio_metros: radius ?? null,
        },
        zona_horaria: timezone,
      };
    } catch (error) {
      setSaveStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al guardar. Intenta nuevamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const snapshot = initialSnapshot.current;
    setIsActive(snapshot.activo);
    setEntry({ ...snapshot.entrada });
    setExit({ ...snapshot.salida });
    setAddress(snapshot.ubicacion.direccion ?? "");
    setLat(snapshot.ubicacion.lat ?? DEFAULT_POSITION[0]);
    setLng(snapshot.ubicacion.lng ?? DEFAULT_POSITION[1]);
    setRadius(snapshot.ubicacion.radio_metros ?? 100);
    setTimezone(snapshot.zona_horaria);
    setSaveStatus(null);
    setShowValidation(false);
  };

  const handleImmediateMark = async (action: "entrada" | "salida") => {
    setMarkFeedback(null);
    setIsMarking(action);

    try {
      if (onImmediateMark) {
        await onImmediateMark(action);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
        console.info(`Marcación manual ${action}`);
      }

      setMarkFeedback({
        type: "success",
        message: `Marcación de ${
          action === "entrada" ? "entrada" : "salida"
        } realizada.`,
      });
    } catch (error) {
      setMarkFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo completar la marcación. Intenta nuevamente.",
      });
    } finally {
      setIsMarking(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      {saveStatus && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            saveStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {saveStatus.message}
        </div>
      )}

      {markFeedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            markFeedback.type === "success"
              ? "border-sky-200 bg-sky-50 text-sky-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {markFeedback.message}
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Automatización de Marcación
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Configura los días, horarios y ubicación desde los que se realizará
            la marcación automática de entrada y salida.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isActive ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {isActive ? "Activo" : "Inactivo"}
        </span>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Estado de la regla
            </h2>
            <div className="flex flex-col gap-2">
              <Toggle
                checked={isActive}
                onChange={setIsActive}
                label={isActive ? "Activado" : "Desactivado"}
              />
              <p className="text-sm text-slate-500">
                Si está desactivado, no se realizará ninguna marcación
                automática.
              </p>
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Horario programado
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <ScheduleBlock
                title="Marcación de ENTRADA"
                description="La marcación de entrada se enviará automáticamente a la hora indicada, sólo en los días seleccionados."
                block={entry}
                timeInputId="entrada-time"
                timeLabel="Hora de entrada"
                onToggleEnabled={(value) =>
                  setEntry((prev) => ({ ...prev, habilitado: value }))
                }
                onTimeChange={(value) =>
                  setEntry((prev) => ({ ...prev, hora_local: value }))
                }
                onToggleDay={(day) => handleToggleDay("entrada", day)}
                validationErrors={entryErrors}
                showValidation={showValidation}
              />

              <ScheduleBlock
                title="Marcación de SALIDA"
                description="La marcación de salida se enviará automáticamente a la hora indicada, sólo en los días seleccionados."
                block={exit}
                timeInputId="salida-time"
                timeLabel="Hora de salida"
                onToggleEnabled={(value) =>
                  setExit((prev) => ({ ...prev, habilitado: value }))
                }
                onTimeChange={(value) =>
                  setExit((prev) => ({ ...prev, hora_local: value }))
                }
                onToggleDay={(day) => handleToggleDay("salida", day)}
                validationErrors={exitErrors}
                showValidation={showValidation}
              />
            </div>
          </section>

          <LocationSection
            address={address}
            onAddressChange={setAddress}
            lat={lat}
            lng={lng}
            radius={radius}
            onPositionChange={({ lat: newLat, lng: newLng }) => {
              setLat(newLat);
              setLng(newLng);
            }}
            onRadiusChange={setRadius}
            onUseCurrentLocation={handleUseCurrentLocation}
            geolocationLoading={geolocationLoading}
            geolocationError={geolocationError}
            validationErrors={locationErrors}
            showValidation={showValidation}
          />

          <TimezoneSection
            timezone={timezone}
            availableTimezones={availableTimezones}
            onTimezoneChange={setTimezone}
          />
        </div>

        <div className="space-y-6">
          <SummaryCard summary={summary} />

          <ActionsPanel
            canSave={canSave}
            isSaving={isSaving}
            onSave={handleSave}
            onReset={handleReset}
            onImmediateMark={handleImmediateMark}
            isMarking={isMarking}
          />
        </div>
      </div>
    </div>
  );
};

export type { AutomationRule, AutomationPayload, PersistedAutomationPayload };
export default AutomationScheduler;
