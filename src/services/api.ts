import type {
  AutomationRule,
  PersistedAutomationPayload,
} from "../components/automation/types";
import { authorizedFetch } from "./auth";

type RawScheduleEntry = {
  enabled?: boolean;
  local_time?: string;
  utc_time?: string;
  days?: string[];
};

type RawInput = {
  is_active?: boolean;
  schedule?: {
    entry?: RawScheduleEntry;
    exit?: RawScheduleEntry;
  };
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
  };
  timezone?: string;
};

type ParsedOutput = {
  activo: boolean;
  entrada: {
    habilitado: boolean;
    hora_local: string | null;
    dias: string[];
  };
  salida: {
    habilitado: boolean;
    hora_local: string | null;
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

function _parseRule(data: RawInput): ParsedOutput {
  const entry = data.schedule?.entry ?? {};
  const exit = data.schedule?.exit ?? {};
  const location = data.location ?? {};

  // normalizar entrada
  const normalizedEntry = {
    habilitado: entry.enabled ?? false,
    hora_local: entry.local_time ?? null,
    dias: Array.isArray(entry.days) ? entry.days : [],
  };

  // normalizar salida
  const normalizedExit = {
    habilitado: exit.enabled ?? false,
    hora_local: exit.local_time ?? null,
    dias: Array.isArray(exit.days) ? exit.days : [],
  };

  const address =
    typeof location.address === "string" ? location.address.trim() : null;

  return {
    activo: data.is_active ?? false,
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
      direccion: address,
      lat: location.latitude ?? null,
      lng: location.longitude ?? null,
      radio_metros: location.radius_meters ?? null,
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
    // eslint-disable-next-line no-console
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
