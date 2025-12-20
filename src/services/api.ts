import type {
  AutomationRule,
  PersistedAutomationPayload,
} from "../components/automation/types";
import { authorizedFetch } from "./auth";

type RawScheduleEntry = {
  enabled?: boolean;
  local_time?: string;
  localTime?: string;
  utc_time?: string;
  utcTime?: string;
  days?: Array<string | null>;
};

type RawInput = {
  isActive?: boolean;
  is_active?: boolean;
  randomWindowMinutes?: number;
  random_window_minutes?: number;
  phoneNumber?: string | null;
  phone_number?: string | null;
  schedule?: {
    entry?: RawScheduleEntry;
    exit?: RawScheduleEntry;
  };
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
    radiusMeters?: number;
  };
  timezone?: string;
};

type ParsedOutput = {
  activo: boolean;
  ventana_aleatoria_minutos?: number | null;
  telefono?: string | null;
  entrada: {
    habilitado: boolean;
    hora_local: string | null;
    hora_utc: string | null;
    dias: string[];
  };
  salida: {
    habilitado: boolean;
    hora_local: string | null;
    hora_utc: string | null;
    dias: string[];
  };
  ubicacion: {
    direccion: string | null;
    lat: number | null;
    lng: number | null;
    radio_metros: number | null;
  };
  zona_horaria: string | null;
};

const ISO_TO_DAY_KEY: Record<string, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mie",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sab",
  sunday: "Dom",
};

const normalizePhoneNumber = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  const withoutCountry = digits.startsWith("51") ? digits.slice(2) : digits;
  if (withoutCountry.length === 8 || withoutCountry.length === 9) {
    return `+51${withoutCountry}`;
  }

  return trimmed;
};

const normalizeTime = (value?: string) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (!match) return trimmed;
  return `${match[1]}:${match[2]}`;
};

const normalizeDays = (days?: Array<string | null>) => {
  if (!Array.isArray(days)) return [];
  const mapped = days
    .filter((day): day is string => typeof day === "string" && day.trim() !== "")
    .map((day) => ISO_TO_DAY_KEY[day] ?? day);
  return Array.from(new Set(mapped));
};

function _parseRule(data: RawInput): ParsedOutput {
  const entry = data.schedule?.entry ?? {};
  const exit = data.schedule?.exit ?? {};
  const location = data.location ?? {};

  // normalizar entrada
  const normalizedEntry = {
    habilitado: entry.enabled ?? false,
    hora_local: normalizeTime(entry.localTime ?? entry.local_time) ?? null,
    hora_utc: normalizeTime(entry.utcTime ?? entry.utc_time) ?? null,
    dias: normalizeDays(entry.days),
  };

  // normalizar salida
  const normalizedExit = {
    habilitado: exit.enabled ?? false,
    hora_local: normalizeTime(exit.localTime ?? exit.local_time) ?? null,
    hora_utc: normalizeTime(exit.utcTime ?? exit.utc_time) ?? null,
    dias: normalizeDays(exit.days),
  };

  const address =
    typeof location.address === "string" ? location.address.trim() : null;
  const radiusMeters =
    location.radiusMeters ?? location.radius_meters ?? null;

  return {
    activo: data.isActive ?? data.is_active ?? false,
    ventana_aleatoria_minutos:
      data.randomWindowMinutes ?? data.random_window_minutes ?? null,
    telefono: normalizePhoneNumber(data.phoneNumber ?? data.phone_number) ?? null,
    entrada: {
      habilitado: normalizedEntry.habilitado,
      hora_local: normalizedEntry.hora_local,
      hora_utc: normalizedEntry.hora_utc,
      dias: normalizedEntry.dias,
    },
    salida: {
      habilitado: normalizedExit.habilitado,
      hora_local: normalizedExit.hora_local,
      hora_utc: normalizedExit.hora_utc,
      dias: normalizedExit.dias,
    },
    ubicacion: {
      direccion: address,
      lat: location.latitude ?? null,
      lng: location.longitude ?? null,
      radio_metros: radiusMeters,
    },
    zona_horaria: data.timezone ?? null,
  };
}

const API_BASE = import.meta.env.VITE_API_URL || "";
const fallbackTimezones = [
  "UTC-05:00 America/Lima",
  "UTC-03:00 America/Sao_Paulo",
  "UTC-06:00 America/Bogota",
  "UTC-08:00 America/Los_Angeles",
  "UTC+00:00 UTC",
  "UTC+01:00 Europe/Madrid",
];

const fallbackAutomationRule: AutomationRule = {
  activo: true,
  ventana_aleatoria_minutos: 10,
  telefono: null,
  entrada: {
    habilitado: true,
    hora_local: "08:05",
    dias: ["Lun", "Mar", "Mie", "Jue", "Vie"],
  },
  salida: {
    habilitado: true,
    hora_local: "17:30",
    dias: ["Lun", "Mar", "Mie", "Jue", "Vie"],
  },
  ubicacion: {
    direccion: "Av. Example 123",
    lat: -12.04318,
    lng: -77.02824,
    radio_metros: 150,
  },
  zona_horaria: "UTC-05:00 America/Lima",
};

const handleJson = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error en la solicitud");
  }
  return response.json();
};

export const fetchAutomationRule = async (): Promise<AutomationRule> => {
  if (!API_BASE) {
    return fallbackAutomationRule;
  }

  try {
    const response = await authorizedFetch(`${API_BASE}/api/v1/attendance`, {
      method: "GET",
    });
    const data = await handleJson(response);
    console.log(data);

    return _parseRule(data);
  } catch {
    return fallbackAutomationRule;
  }
};

export const fetchAvailableTimezones = async (): Promise<string[]> => {
  if (!API_BASE) {
    return fallbackTimezones;
  }

  try {
    const response = await authorizedFetch(`${API_BASE}/api/v1/timezones`, {
      method: "GET",
    });
    return await handleJson(response);
  } catch {
    return fallbackTimezones;
  }
};

export const saveAutomationRule = async (
  payload: PersistedAutomationPayload
) => {
  if (!API_BASE) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.info("Guardar automatización (mock)", payload);
    return;
  }

  const response = await authorizedFetch(`${API_BASE}/api/v1/attendance`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await handleJson(response);
};

export const markAutomationNow = async (action: "entrada" | "salida") => {
  if (!API_BASE) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    console.info("Marcación manual (mock)", action);
    return;
  }

  const response = await authorizedFetch(
    `${API_BASE}/api/v1/automation/manual`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    }
  );

  await handleJson(response);
};
