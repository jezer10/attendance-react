import { useEffect, useReducer } from "react";
import { useForm, FormProvider, type UseFormReturn } from "react-hook-form";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

import { DAYS } from "./constants";
import { getDialCode } from "./countries";
import { extractOffsetMinutes, toUtcTime } from "./utils";
import type {
  AutomationBlock,
  AutomationRule,
  DayKey,
  IsoDay,
  PersistedAutomationPayload,
} from "./types";

export interface AttendanceCredentialsPayload {
  companyId: number;
  userId: number;
  password: string;
}

export interface AttendanceCredentialsMetadata {
  companyId: number;
  userId: number;
  hasPassword: boolean;
}

export interface AutomationFormValues {
  isActive: boolean;
  randomWindowMinutes: number | null;
  phoneCountry: CountryCode;
  phoneNumber: string;
  entry: AutomationBlock;
  exit: AutomationBlock;
  location: {
    address: string;
    lat: number | null;
    lng: number | null;
    radius: number | null;
  };
  timezone: string;
}

const DEFAULT_PHONE_COUNTRY: CountryCode = "PE";

const ISO_DAY_MAP: Record<DayKey, IsoDay> = {
  Lun: "monday",
  Mar: "tuesday",
  Mie: "wednesday",
  Jue: "thursday",
  Vie: "friday",
  Sab: "saturday",
  Dom: "sunday",
};

const toFormValues = (rule: AutomationRule): AutomationFormValues => {
  const rawPhone = rule.telefono ?? "";
  let country: CountryCode = DEFAULT_PHONE_COUNTRY;
  let number = rawPhone;

  if (rawPhone.startsWith("+")) {
    try {
      const parsed = parsePhoneNumberFromString(rawPhone);
      if (parsed?.country) {
        country = parsed.country;
        number = parsed.nationalNumber;
      }
    } catch {
      // fallback to defaults
    }
  }

  return {
    isActive: rule.activo,
    randomWindowMinutes: rule.ventana_aleatoria_minutos ?? null,
    phoneCountry: country,
    phoneNumber: number,
    entry: {
      habilitado: rule.entrada.habilitado,
      hora_local: rule.entrada.hora_local ?? "",
      hora_utc: rule.entrada.hora_utc ?? null,
      dias: [...rule.entrada.dias],
    },
    exit: {
      habilitado: rule.salida.habilitado,
      hora_local: rule.salida.hora_local ?? "",
      hora_utc: rule.salida.hora_utc ?? null,
      dias: [...rule.salida.dias],
    },
    location: {
      address: rule.ubicacion.direccion ?? "",
      lat: rule.ubicacion.lat ?? null,
      lng: rule.ubicacion.lng ?? null,
      radius: rule.ubicacion.radio_metros ?? 100,
    },
    timezone: rule.zona_horaria ?? "",
  };
};

export const toggleDay = (current: DayKey[], day: DayKey): DayKey[] => {
  const exists = current.includes(day);
  return exists
    ? current.filter((d) => d !== day)
    : [...current, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
};

const buildPersistPayload = (
  values: AutomationFormValues,
  offsetMinutes: number
): PersistedAutomationPayload => {
  const normalizedEntry = {
    ...values.entry,
    hora_utc: values.entry.habilitado ? toUtcTime(values.entry.hora_local, offsetMinutes) : null,
  };
  const normalizedExit = {
    ...values.exit,
    hora_utc: values.exit.habilitado ? toUtcTime(values.exit.hora_local, offsetMinutes) : null,
  };

  const dialCode = getDialCode(values.phoneCountry);
  const fullPhoneNumber = values.phoneNumber ? `+${dialCode}${values.phoneNumber}` : null;

  return {
    isActive: values.isActive,
    randomWindowMinutes: values.randomWindowMinutes,
    phoneNumber: fullPhoneNumber,
    schedule: {
      entry: {
        enabled: normalizedEntry.habilitado,
        localTime: normalizedEntry.habilitado ? normalizedEntry.hora_local || null : null,
        utcTime: normalizedEntry.hora_utc,
        days: normalizedEntry.habilitado ? normalizedEntry.dias.map((d) => ISO_DAY_MAP[d]) : [],
      },
      exit: {
        enabled: normalizedExit.habilitado,
        localTime: normalizedExit.habilitado ? normalizedExit.hora_local || null : null,
        utcTime: normalizedExit.hora_utc,
        days: normalizedExit.habilitado ? normalizedExit.dias.map((d) => ISO_DAY_MAP[d]) : [],
      },
    },
    location: {
      address: values.location.address,
      latitude: values.location.lat,
      longitude: values.location.lng,
      radiusMeters: values.location.radius,
    },
    timezone: values.timezone,
  };
};

export interface SaveStatus {
  type: "success" | "error";
  message: string;
}

export type SubmitState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "done"; status: SaveStatus };

const submitReducer = (_state: SubmitState, action: SubmitAction): SubmitState => {
  switch (action.type) {
    case "begin":
      return { kind: "saving" };
    case "success":
      return { kind: "done", status: { type: "success", message: action.message } };
    case "error":
      return { kind: "done", status: { type: "error", message: action.message } };
    case "dismiss":
      return { kind: "idle" };
  }
};

type SubmitAction =
  | { type: "begin" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | { type: "dismiss" };

export interface UseAutomationFormArgs {
  initialRule: AutomationRule;
  onSave?: (payload: PersistedAutomationPayload) => Promise<void>;
}

export const useAutomationForm = ({ initialRule, onSave }: UseAutomationFormArgs) => {
  const methods = useForm<AutomationFormValues>({
    mode: "onChange",
    defaultValues: toFormValues(initialRule),
  });

  const [submit, dispatchSubmit] = useReducer(submitReducer, { kind: "idle" });

  useEffect(() => {
    methods.reset(toFormValues(initialRule));
  }, [initialRule, methods]);

  const handleSubmit = methods.handleSubmit(async (values) => {
    if (!onSave) {
      dispatchSubmit({ type: "success", message: "Configuración guardada." });
      return;
    }
    dispatchSubmit({ type: "begin" });
    try {
      const offsetMinutes = extractOffsetMinutes(values.timezone);
      const payload = buildPersistPayload(values, offsetMinutes);
      await onSave(payload);
      dispatchSubmit({ type: "success", message: "Configuración guardada." });
    } catch {
      dispatchSubmit({ type: "error", message: "Error al guardar." });
    }
  });

  const dismissSubmit = () => dispatchSubmit({ type: "dismiss" });

  return {
    methods,
    handleSubmit,
    submit,
    dismissSubmit,
  };
};

export { FormProvider };
export type { UseFormReturn };
