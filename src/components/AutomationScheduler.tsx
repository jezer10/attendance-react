import { useEffect, useMemo, useRef, useState } from "react";
import { useController, useForm } from "react-hook-form";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import countries from "i18n-iso-countries";
import esCountries from "i18n-iso-countries/langs/es.json";
import enCountries from "i18n-iso-countries/langs/en.json";
import examples from "libphonenumber-js/examples.mobile.json";

import ActionsPanel from "./automation/ActionsPanel";
import LocationSection from "./automation/LocationSection";
import ScheduleBlock from "./automation/ScheduleBlock";
import SummaryCard from "./automation/SummaryCard";
import TimezoneSection from "./automation/TimezoneSection";
import Toggle from "./automation/Toggle";
import { DAYS } from "./automation/constants";
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

type PhoneCountry = {
  id: string;
  label: string;
  dialCode: string;
};

countries.registerLocale(esCountries);
countries.registerLocale(enCountries);

const buildPhoneCountries = (): PhoneCountry[] => {
  const regions = getCountries();
  return regions
    .map((region) => {
      const label =
        countries.getName(region, "es") ||
        countries.getName(region, "en") ||
        region;
      let dialCode = "";
      try {
        dialCode = String(getCountryCallingCode(region));
      } catch {
        dialCode = "";
      }
      return { id: region, label, dialCode };
    })
    .filter((country) => country.dialCode)
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
};

const FALLBACK_COUNTRY: PhoneCountry = {
  id: "PE",
  label: "Perú",
  dialCode: "51",
};

const PHONE_COUNTRIES = buildPhoneCountries();
const PHONE_COUNTRIES_WITH_FALLBACK =
  PHONE_COUNTRIES.length > 0 ? PHONE_COUNTRIES : [FALLBACK_COUNTRY];
const DEFAULT_PHONE_COUNTRY =
  PHONE_COUNTRIES_WITH_FALLBACK.find((country) => country.id === "PE") ??
  PHONE_COUNTRIES_WITH_FALLBACK[0];
const MAX_NATIONAL_LENGTH = 15;

interface AutomationSchedulerProps {
  initialRule: AutomationRule;
  availableTimezones: string[];
  onSave?: (payload: PersistedAutomationPayload) => Promise<void>;
  onImmediateMark?: (action: "entrada" | "salida") => Promise<void>;
}

interface AutomationFormValues {
  isActive: boolean;
  randomWindowMinutes: number | null;
  phoneCountry: string;
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

const findPhoneCountry = (id?: string | null) =>
  PHONE_COUNTRIES_WITH_FALLBACK.find((country) => country.id === id);

const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");

const toFormValues = (rule: AutomationRule): AutomationFormValues => {
  const rawPhone = rule.telefono ?? "";
  const digits = normalizePhoneDigits(rawPhone);
  let country = DEFAULT_PHONE_COUNTRY;
  let number = digits;

  if (rawPhone.startsWith("+") && digits) {
    try {
      const parsed = parsePhoneNumberFromString(rawPhone);
      if (parsed?.country) {
        const matchedCountry = findPhoneCountry(parsed.country);
        if (matchedCountry) {
          country = matchedCountry;
          number = parsed.nationalNumber;
        }
      }
    } catch {
      // Keep fallback defaults if parsing fails.
    }
  }

  return {
    isActive: rule.activo,
    randomWindowMinutes: rule.ventana_aleatoria_minutos ?? null,
    phoneCountry: country.id,
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

const AutomationScheduler = ({
  initialRule,
  availableTimezones,
  onSave,
  onImmediateMark,
}: AutomationSchedulerProps) => {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { isValid },
  } = useForm<AutomationFormValues>({
    mode: "onChange",
    defaultValues: toFormValues(initialRule),
  });

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
    reset(toFormValues(initialRule));
    initialSnapshot.current = initialRule;
    setShowValidation(false);
    setSaveStatus(null);
    void trigger();
  }, [initialRule, reset, trigger]);

  const isActive = watch("isActive");
  const entry = watch("entry");
  const exit = watch("exit");
  const location = watch("location");
  const timezone = watch("timezone");
  const randomWindowMinutes = watch("randomWindowMinutes");
  const phoneCountry = watch("phoneCountry");
  const phoneNumber = watch("phoneNumber");
  const { address, lat, lng, radius } = location;

  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  useEffect(() => {
    if (!exit.habilitado) return;
    void trigger("exit.hora_local");
  }, [
    entry.habilitado,
    entry.hora_local,
    entry.dias,
    exit.habilitado,
    trigger,
  ]);
  const { field: addressField } = useController({
    control,
    name: "location.address",
  });
  const {
    field: latField,
    fieldState: { error: latFieldError },
  } = useController({
    control,
    name: "location.lat",
    rules: {
      validate: (value) =>
        value === null ? "Selecciona una ubicación en el mapa." : true,
    },
  });
  const {
    field: lngField,
    fieldState: { error: lngFieldError },
  } = useController({
    control,
    name: "location.lng",
    rules: {
      validate: (value) =>
        value === null ? "Selecciona una ubicación en el mapa." : true,
    },
  });
  const {
    field: radiusField,
    fieldState: { error: radiusFieldError },
  } = useController({
    control,
    name: "location.radius",
    rules: {
      validate: (value) => {
        if (value === null || Number.isNaN(value)) {
          return "Indica un radio válido.";
        }
        if (value <= 0) {
          return "El radio debe ser mayor a 0 metros.";
        }
        return true;
      },
    },
  });
  const {
    field: randomWindowField,
    fieldState: { error: randomWindowError },
  } = useController({
    control,
    name: "randomWindowMinutes",
    rules: {
      validate: (value) => {
        if (value === null || Number.isNaN(value)) return true;
        if (value < 0) {
          return "La ventana aleatoria no puede ser negativa.";
        }
        return true;
      },
    },
  });
  const {
    field: phoneNumberField,
    fieldState: { error: phoneNumberError },
  } = useController({
    control,
    name: "phoneNumber",
    rules: {
      validate: (value) => {
        if (!value || !value.trim()) return true;
        const digits = normalizePhoneDigits(value);
        const country = findPhoneCountry(phoneCountry) ?? DEFAULT_PHONE_COUNTRY;
        try {
          const parsed = parsePhoneNumberFromString(digits, country.id);
          if (parsed?.isValid()) {
            return true;
          }
        } catch {
          // Fall through to error.
        }
        return "Ingresa un teléfono válido para el país seleccionado.";
      },
    },
  });
  const { field: phoneCountryField } = useController({
    control,
    name: "phoneCountry",
  });
  const {
    field: timezoneField,
    fieldState: { error: timezoneError },
  } = useController({
    control,
    name: "timezone",
    rules: {
      validate: (value) =>
        value && value.trim().length > 0
          ? true
          : "Selecciona una zona horaria.",
    },
  });
  const { field: entryEnabledField } = useController({
    control,
    name: "entry.habilitado",
  });
  const {
    field: entryTimeField,
    fieldState: { error: entryTimeError },
  } = useController({
    control,
    name: "entry.hora_local",
    rules: {
      validate: (value) => {
        if (!entry.habilitado) return true;
        if (!value || !value.trim()) {
          return "Ingresa una hora de entrada.";
        }
        if (!isValidTime(value)) {
          return "Usa el formato HH:MM (24 horas).";
        }
        return true;
      },
    },
  });
  const {
    field: entryDaysField,
    fieldState: { error: entryDaysError },
  } = useController({
    control,
    name: "entry.dias",
  });
  const { field: exitEnabledField } = useController({
    control,
    name: "exit.habilitado",
  });
  const {
    field: exitTimeField,
    fieldState: { error: exitTimeError },
  } = useController({
    control,
    name: "exit.hora_local",
    rules: {
      validate: (value) => {
        if (!exit.habilitado) return true;
        if (!value || !value.trim()) {
          return "Ingresa una hora de salida.";
        }
        if (!isValidTime(value)) {
          return "Usa el formato HH:MM (24 horas).";
        }
        if (entry.habilitado) {
          const entryTime = entry.hora_local;
          if (entryTime && isValidTime(entryTime)) {
            const sharedDays = entry.dias.some((day) =>
              exit.dias.includes(day)
            );
            if (sharedDays && toMinutes(value) <= toMinutes(entryTime)) {
              return "La hora de salida debe ser posterior a la de entrada en el mismo día.";
            }
          }
        }
        return true;
      },
    },
  });
  const {
    field: exitDaysField,
    fieldState: { error: exitDaysError },
  } = useController({
    control,
    name: "exit.dias",
  });

  const offsetMinutes = useMemo(
    () => extractOffsetMinutes(timezone),
    [timezone]
  );

  const entryUtcTime = useMemo(() => {
    if (!entry.habilitado) return null;
    if (entry.hora_local && isValidTime(entry.hora_local)) {
      return toUtcTime(entry.hora_local, offsetMinutes);
    }
    return entry.hora_utc ?? null;
  }, [entry.habilitado, entry.hora_local, entry.hora_utc, offsetMinutes]);

  const exitUtcTime = useMemo(() => {
    if (!exit.habilitado) return null;
    if (exit.hora_local && isValidTime(exit.hora_local)) {
      return toUtcTime(exit.hora_local, offsetMinutes);
    }
    return exit.hora_utc ?? null;
  }, [exit.habilitado, exit.hora_local, exit.hora_utc, offsetMinutes]);

  const randomWindowErrorMessage =
    typeof randomWindowError?.message === "string"
      ? randomWindowError.message
      : undefined;

  const phoneNumberErrorMessage =
    typeof phoneNumberError?.message === "string"
      ? phoneNumberError.message
      : undefined;

  const formattedPhoneNumber = useMemo(() => {
    const country = findPhoneCountry(phoneCountry) ?? DEFAULT_PHONE_COUNTRY;
    if (!phoneNumber) return "";
    return new AsYouType(country.id).input(phoneNumber) || phoneNumber;
  }, [phoneCountry, phoneNumber]);

  const phonePlaceholder = useMemo(() => {
    const country = findPhoneCountry(phoneCountry) ?? DEFAULT_PHONE_COUNTRY;
    try {
      const example = getExampleNumber(country.id, examples);
      if (example) {
        return example.formatNational();
      }
    } catch {
      // Keep fallback placeholder.
    }
    return "123 456 789";
  }, [phoneCountry]);

  const phoneDisplay = useMemo(() => {
    if (!phoneNumber.trim()) return "";
    const country = findPhoneCountry(phoneCountry) ?? DEFAULT_PHONE_COUNTRY;
    try {
      const parsed = parsePhoneNumberFromString(phoneNumber, country.id);
      return parsed?.formatInternational() ?? phoneNumber;
    } catch {
      return `+${country.dialCode} ${formattedPhoneNumber}`.trim();
    }
  }, [formattedPhoneNumber, phoneCountry, phoneNumber]);

  const timezoneErrorMessage =
    typeof timezoneError?.message === "string"
      ? timezoneError.message
      : undefined;

  const locationErrors: string[] = useMemo(() => {
    const messages = new Set<string>();
    if (typeof latFieldError?.message === "string") {
      messages.add(latFieldError.message);
    }
    if (typeof lngFieldError?.message === "string") {
      messages.add(lngFieldError.message);
    }
    if (typeof radiusFieldError?.message === "string") {
      messages.add(radiusFieldError.message);
    }
    return Array.from(messages);
  }, [
    latFieldError?.message,
    lngFieldError?.message,
    radiusFieldError?.message,
  ]);

  const entryErrors = useMemo(() => {
    const errorsList: string[] = [];
    if (typeof entryTimeError?.message === "string") {
      errorsList.push(entryTimeError.message);
    }
    if (typeof entryDaysError?.message === "string") {
      errorsList.push(entryDaysError.message);
    }
    return errorsList;
  }, [entryTimeError?.message, entryDaysError?.message]);

  const exitErrors = useMemo(() => {
    const errorsList: string[] = [];
    if (typeof exitTimeError?.message === "string") {
      errorsList.push(exitTimeError.message);
    }
    if (typeof exitDaysError?.message === "string") {
      errorsList.push(exitDaysError.message);
    }
    return errorsList;
  }, [exitTimeError?.message, exitDaysError?.message]);

  const blockingReasons = useMemo(() => {
    const reasons: string[] = [];
    reasons.push(...entryErrors, ...exitErrors, ...locationErrors);
    if (randomWindowErrorMessage) {
      reasons.push(randomWindowErrorMessage);
    }
    if (phoneNumberErrorMessage) {
      reasons.push(phoneNumberErrorMessage);
    }
    if (timezoneErrorMessage) {
      reasons.push(timezoneErrorMessage);
    }
    return Array.from(new Set(reasons));
  }, [
    entryErrors,
    exitErrors,
    locationErrors,
    phoneNumberErrorMessage,
    randomWindowErrorMessage,
    timezoneErrorMessage,
  ]);

  const canSave = isValid && !isSaving;

  const summary = useMemo(
    () => [
      {
        label: "Entrada",
        value: entry.habilitado
          ? `${formatDays(entry.dias)} a las ${entry.hora_local || "--:--"}`
          : "Automática: desactivada",
      },
      {
        label: "Entrada (UTC)",
        value: entry.habilitado
          ? entryUtcTime
            ? `a las ${entryUtcTime}`
            : "Sin hora UTC"
          : "Automática: desactivada",
      },
      {
        label: "Salida",
        value: exit.habilitado
          ? `${formatDays(exit.dias)} a las ${exit.hora_local || "--:--"}`
          : "Automática: desactivada",
      },
      {
        label: "Salida (UTC)",
        value: exit.habilitado
          ? exitUtcTime
            ? `a las ${exitUtcTime}`
            : "Sin hora UTC"
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
        label: "Ventana aleatoria",
        value:
          randomWindowMinutes === null
            ? "Sin ventana"
            : `${randomWindowMinutes} min`,
      },
      {
        label: "Teléfono",
        value: phoneNumber.trim() ? phoneDisplay : "Sin teléfono",
      },
      {
        label: "Estado",
        value: isActive ? "Activo" : "Inactivo",
      },
    ],
    [
      address,
      entry,
      entryUtcTime,
      exit,
      exitUtcTime,
      isActive,
      lat,
      lng,
      phoneDisplay,
      radius,
      randomWindowMinutes,
      timezone,
    ]
  );

  const toggleDay = (current: DayKey[], day: DayKey) => {
    const exists = current.includes(day);
    return exists
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  };

  const handleEntryDayToggle = (day: DayKey) => {
    entryDaysField.onChange(toggleDay(entry.dias, day));
  };

  const handleExitDayToggle = (day: DayKey) => {
    exitDaysField.onChange(toggleDay(exit.dias, day));
  };

  const handleEntryEnabledChange = (value: boolean) => {
    entryEnabledField.onChange(value);
    void trigger(["entry.hora_local", "entry.dias"]);
  };

  const handleExitEnabledChange = (value: boolean) => {
    exitEnabledField.onChange(value);
    void trigger(["exit.hora_local", "exit.dias"]);
  };

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
        latField.onChange(latitude);
        lngField.onChange(longitude);
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

  const submitForm = handleSubmit(async (values) => {
    const normalizedEntry = normalizeBlock(values.entry);
    const normalizedExit = normalizeBlock(values.exit);

    const normalizedPhoneNumber = (() => {
      const trimmed = values.phoneNumber.trim();
      if (!trimmed) return null;
      const digits = normalizePhoneDigits(trimmed);
      const country =
        findPhoneCountry(values.phoneCountry) ?? DEFAULT_PHONE_COUNTRY;
      try {
        const parsed = parsePhoneNumberFromString(digits, country.id);
        return parsed?.format("E.164") ?? `+${country.dialCode}${digits}`;
      } catch {
        return `+${country.dialCode}${digits}`;
      }
    })();

    const persistPayload: PersistedAutomationPayload = {
      isActive: values.isActive,
      randomWindowMinutes: values.randomWindowMinutes ?? null,
      phoneNumber: normalizedPhoneNumber,
      schedule: {
        entry: toPersistedBlock(normalizedEntry),
        exit: toPersistedBlock(normalizedExit),
      },
      location: {
        address: values.location.address.trim(),
        latitude: values.location.lat ?? null,
        longitude: values.location.lng ?? null,
        radiusMeters: values.location.radius ?? null,
      },
      timezone: values.timezone,
    };

    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(persistPayload);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        console.info("Guardar payload", persistPayload);
      }
      setSaveStatus({
        type: "success",
        message: "Configuración guardada correctamente.",
      });
      initialSnapshot.current = {
        activo: values.isActive,
        ventana_aleatoria_minutos: values.randomWindowMinutes ?? null,
        telefono: normalizedPhoneNumber,
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
          direccion: values.location.address.trim(),
          lat: values.location.lat ?? null,
          lng: values.location.lng ?? null,
          radio_metros: values.location.radius ?? null,
        },
        zona_horaria: values.timezone,
      };
      reset(toFormValues(initialSnapshot.current));
      setShowValidation(false);
      await trigger();
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
  });

  const handleSave = () => {
    setShowValidation(true);
    setSaveStatus(null);
    void submitForm();
  };

  const handleReset = () => {
    reset(toFormValues(initialSnapshot.current));
    setSaveStatus(null);
    setShowValidation(false);
    void trigger();
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
                onChange={(value) =>
                  setValue("isActive", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
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
                onToggleEnabled={handleEntryEnabledChange}
                onTimeChange={(value) => entryTimeField.onChange(value)}
                onToggleDay={handleEntryDayToggle}
                validationErrors={entryErrors}
                showValidation={showValidation}
              />

              <ScheduleBlock
                title="Marcación de SALIDA"
                description="La marcación de salida se enviará automáticamente a la hora indicada, sólo en los días seleccionados."
                block={exit}
                timeInputId="salida-time"
                timeLabel="Hora de salida"
                onToggleEnabled={handleExitEnabledChange}
                onTimeChange={(value) => exitTimeField.onChange(value)}
                onToggleDay={handleExitDayToggle}
                validationErrors={exitErrors}
                showValidation={showValidation}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Ventana aleatoria
            </h2>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Minutos de variación
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={
                  randomWindowField.value === null
                    ? ""
                    : randomWindowField.value
                }
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (!nextValue.trim()) {
                    randomWindowField.onChange(null);
                    return;
                  }
                  const parsed = Number(nextValue);
                  randomWindowField.onChange(
                    Number.isNaN(parsed) ? null : parsed
                  );
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
                placeholder="0"
              />
              <p className="text-sm text-slate-500">
                Define un rango aleatorio en minutos para adelantar o atrasar la
                marcación.
              </p>
              {showValidation && randomWindowErrorMessage && (
                <p className="text-sm text-rose-600">
                  {randomWindowErrorMessage}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Teléfono de contacto
            </h2>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                País y número
              </label>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
                <select
                  value={phoneCountryField.value}
                  onChange={(event) => {
                    const nextCountry = event.target.value;
                    phoneCountryField.onChange(nextCountry);
                    const digits = normalizePhoneDigits(phoneNumberField.value);
                    phoneNumberField.onChange(
                      digits.slice(0, MAX_NATIONAL_LENGTH)
                    );
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
                >
                  {PHONE_COUNTRIES_WITH_FALLBACK.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.label} (+{country.dialCode})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formattedPhoneNumber}
                  onChange={(event) => {
                    const digits = normalizePhoneDigits(event.target.value);
                    phoneNumberField.onChange(
                      digits.slice(0, MAX_NATIONAL_LENGTH)
                    );
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
                  placeholder={phonePlaceholder}
                />
              </div>
              <p className="text-sm text-slate-500">
                Ingresa el número local y selecciona el país.
              </p>
              {showValidation && phoneNumberErrorMessage && (
                <p className="text-sm text-rose-600">
                  {phoneNumberErrorMessage}
                </p>
              )}
            </div>
          </section>

          <LocationSection
            address={addressField.value}
            onAddressChange={(value) => addressField.onChange(value)}
            lat={latField.value}
            lng={lngField.value}
            radius={radiusField.value}
            onPositionChange={({ lat: newLat, lng: newLng }) => {
              latField.onChange(newLat);
              lngField.onChange(newLng);
            }}
            onRadiusChange={(value) => radiusField.onChange(value)}
            onUseCurrentLocation={handleUseCurrentLocation}
            geolocationLoading={geolocationLoading}
            geolocationError={geolocationError}
            validationErrors={locationErrors}
            showValidation={showValidation}
          />

          <TimezoneSection
            timezone={timezoneField.value}
            availableTimezones={availableTimezones}
            onTimezoneChange={(value) => timezoneField.onChange(value)}
            showValidation={showValidation}
            error={timezoneErrorMessage}
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
            blockingReasons={!canSave ? blockingReasons : []}
          />
        </div>
      </div>
    </div>
  );
};

export type { AutomationRule, AutomationPayload, PersistedAutomationPayload };
export default AutomationScheduler;
