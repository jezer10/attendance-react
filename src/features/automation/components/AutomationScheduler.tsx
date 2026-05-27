import { memo, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, Label } from "@headlessui/react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

import LocationSection from "./LocationSection";
import Toggle from "./Toggle";
import CredentialsSection from "./CredentialsSection";
import RandomWindowSection from "./RandomWindowSection";
import PhoneNumberSection from "./PhoneNumberSection";
import { DAYS } from "./constants";
import { getDialCode } from "./countries";
import type {
  AutomationBlock,
  AutomationRule,
  DayKey,
  IsoDay,
  PersistedAutomationPayload,
} from "./types";
import {
  extractOffsetMinutes,
  toUtcTime,
} from "./utils";

import { useAuth } from "../../auth";

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
  onSaveCredentials?: (payload: AttendanceCredentialsPayload) => Promise<void>;
  initialCredentials?: AttendanceCredentialsMetadata | null;
}

interface AttendanceCredentialsPayload {
  companyId: number;
  userId: number;
  password: string;
}

interface AttendanceCredentialsMetadata {
  companyId: number;
  userId: number;
  hasPassword: boolean;
}

interface AutomationFormValues {
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
      // fallback
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

const AutomationScheduler = ({
  initialRule,
  availableTimezones,
  onSave,
  onImmediateMark,
  onSaveCredentials,
  initialCredentials,
}: AutomationSchedulerProps) => {
  const { logout, isLoggingOut } = useAuth();
  const {
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isValid },
  } = useForm<AutomationFormValues>({
    mode: "onChange",
    defaultValues: toFormValues(initialRule),
  });

  const [saveStatus, setSaveStatus] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarking, setIsMarking] = useState<"entrada" | "salida" | null>(null);

  const [credentialsMetadata, setCredentialsMetadata] = useState<
    AttendanceCredentialsMetadata | null
  >(initialCredentials ?? null);

  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  useEffect(() => {
    reset(toFormValues(initialRule));
  }, [initialRule, reset]);

  useEffect(() => {
    if (initialCredentials) setCredentialsMetadata(initialCredentials);
  }, [initialCredentials]);

  const isActive = watch("isActive");
  const entry = watch("entry");
  const exit = watch("exit");
  const timezone = watch("timezone");
  const randomWindowMinutes = watch("randomWindowMinutes");
  const location = watch("location");
  const phoneCountry = watch("phoneCountry");
  const phoneNumber = watch("phoneNumber");

  const offsetMinutes = useMemo(() => extractOffsetMinutes(timezone), [timezone]);

  const toggleDay = (current: DayKey[], day: DayKey) => {
    const exists = current.includes(day);
    return exists
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  };

  const handleManualMark = async (type: "entrada" | "salida") => {
    if (isMarking) return;
    setIsMarking(type);
    try {
      if (onImmediateMark) await onImmediateMark(type);
    } finally {
      setIsMarking(null);
    }
  };

  const submitForm = handleSubmit(async (values) => {
    const normalizedEntry = {
      ...values.entry,
      hora_utc: values.entry.habilitado ? toUtcTime(values.entry.hora_local, offsetMinutes) : null,
    };
    const normalizedExit = {
      ...values.exit,
      hora_utc: values.exit.habilitado ? toUtcTime(values.exit.hora_local, offsetMinutes) : null,
    };

    const dialCode = getDialCode(values.phoneCountry);
    const fullPhoneNumber = values.phoneNumber 
      ? `+${dialCode}${values.phoneNumber}`
      : null;

    const persistPayload: PersistedAutomationPayload = {
      isActive: values.isActive,
      randomWindowMinutes: values.randomWindowMinutes,
      phoneNumber: fullPhoneNumber,
      schedule: {
        entry: {
          enabled: normalizedEntry.habilitado,
          localTime: normalizedEntry.habilitado ? (normalizedEntry.hora_local || null) : null,
          utcTime: normalizedEntry.hora_utc,
          days: normalizedEntry.habilitado ? normalizedEntry.dias.map(d => ISO_DAY_MAP[d]) : [],
        },
        exit: {
          enabled: normalizedExit.habilitado,
          localTime: normalizedExit.habilitado ? (normalizedExit.hora_local || null) : null,
          utcTime: normalizedExit.hora_utc,
          days: normalizedExit.habilitado ? normalizedExit.dias.map(d => ISO_DAY_MAP[d]) : [],
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

    setIsSaving(true);
    setSaveStatus(null);
    try {
      if (onSave) await onSave(persistPayload);
      setSaveStatus({ type: "success", message: "Configuración guardada." });
    } catch {
      setSaveStatus({ type: "error", message: "Error al guardar." });
    } finally {
      setIsSaving(false);
    }
  });

  const handleSave = submitForm;

  return (
    <div className="font-body text-black pb-40 bg-[#fafafa] font-light min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md flex justify-between items-center h-20 px-8 border-b border-black/5">
        <div className="text-xl font-extrabold text-black uppercase tracking-[0.2em] font-display cursor-pointer">MARK</div>
        <div className="flex gap-8 items-center">
          <button 
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white hover:bg-zinc-800 transition-all font-light cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px] font-light">logout</span>
            )}
            <span className="text-[10px] uppercase tracking-widest font-display font-light">
              {isLoggingOut ? "Saliendo..." : "Salir"}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pt-32 px-6 space-y-10">
        <section className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-display tracking-tight text-black leading-tight font-light transition-all duration-700 animate-in fade-in slide-in-from-left-4">
              Control de <br/>Entradas y Salidas
            </h1>
            <p className="text-on-surface-variant font-medium text-lg max-w-xl font-light">
              Configura fácilmente el horario y el lugar de trabajo de tu equipo.
            </p>
          </div>
          <Field className="glass-panel px-8 py-5 rounded-token flex items-center gap-6 border border-black/5">
            <Label className="font-display text-xs uppercase tracking-[0.15em] text-black/60 font-light cursor-pointer">
              Asistencia Automática
            </Label>
            <Toggle
              checked={isActive}
              onChange={(val) => setValue("isActive", val, { shouldValidate: true })}
              className="peer-checked:bg-black"
            />
          </Field>
        </section>

        {/* Timezone Section */}
        <div className="glass-panel p-6 rounded-token flex flex-col md:flex-row items-center gap-8 transition-all border border-black/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-black font-light">public</span>
            </div>
            <span className="text-black uppercase tracking-widest text-xs font-light">Ubicación horaria:</span>
          </div>
          <select 
            value={timezone}
            onChange={(e) => setValue("timezone", e.target.value, { shouldValidate: true })}
            className="bg-white/40 border border-black/5 rounded-token px-6 py-3 flex-grow focus:ring-2 focus:ring-black appearance-none font-body text-black cursor-pointer font-light outline-none"
          >
            {availableTimezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8">
            {/* Horario de Entrada */}
            <div className="glass-panel p-8 rounded-token space-y-6 relative overflow-hidden border-l-4 border-l-black group transition-all border border-black/5">
              <Field className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg font-light">login</span>
                  </div>
                  <Label className="font-display text-xl uppercase tracking-[0.1em] text-black font-light cursor-pointer">Horario de Entrada</Label>
                </div>
                <Toggle
                  checked={entry.habilitado}
                  onChange={(val) => setValue("entry.habilitado", val, { shouldValidate: true })}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-3">
                  <label className="block text-[10px] text-black/40 uppercase tracking-[0.2em] font-display font-light ml-1">Hora para entrar</label>
                  <input 
                    type="time"
                    value={entry.hora_local}
                    onChange={(e) => setValue("entry.hora_local", e.target.value, { shouldValidate: true })}
                    className="w-full bg-black/5 border-none rounded-token font-display focus:ring-2 focus:ring-black text-black font-light text-2xl py-6 px-8 outline-none" 
                  />
                </div>
                {/* Random Window Section integration here if needed, or separate */}
                <div className="space-y-3">
                  <RandomWindowSection
                    value={randomWindowMinutes}
                    onChange={(val) => setValue("randomWindowMinutes", val, { shouldValidate: true })}
                  />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-black/5">
                <label className="block text-[10px] text-black/40 uppercase tracking-[0.2em] font-display font-light">Días de trabajo</label>
                <div className="flex flex-wrap gap-3">
                  {DAYS.map((day) => {
                    const isSelected = entry.dias.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => setValue("entry.dias", toggleDay(entry.dias, day), { shouldValidate: true })}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-xs font-display font-light cursor-pointer ${
                          isSelected 
                            ? "bg-black text-white" 
                            : "bg-transparent text-black/30 border border-black/10 hover:border-black/30"
                        }`}
                      >
                        {day[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Horario de Salida */}
            <div className="glass-panel p-8 rounded-token space-y-6 relative overflow-hidden border-l-4 border-l-black group transition-all border border-black/5">
              <Field className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg font-light">logout</span>
                  </div>
                  <Label className="font-display text-xl uppercase tracking-[0.1em] text-black font-light cursor-pointer">Horario de Salida</Label>
                </div>
                <Toggle
                  checked={exit.habilitado}
                  onChange={(val) => setValue("exit.habilitado", val, { shouldValidate: true })}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-3">
                  <label className="block text-[10px] text-black/40 uppercase tracking-[0.2em] font-display font-light ml-1">Hora para salir</label>
                  <input 
                    type="time" 
                    value={exit.hora_local}
                    onChange={(e) => setValue("exit.hora_local", e.target.value, { shouldValidate: true })}
                    className="w-full bg-black/5 border-none rounded-token font-display focus:ring-2 focus:ring-black text-black font-light text-2xl py-6 px-8 outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-black/5">
                <label className="block text-[10px] text-black/40 uppercase tracking-[0.2em] font-display font-light">Días de trabajo</label>
                <div className="flex flex-wrap gap-3">
                  {DAYS.map((day) => {
                    const isSelected = exit.dias.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => setValue("exit.dias", toggleDay(exit.dias, day), { shouldValidate: true })}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-xs font-display font-light cursor-pointer ${
                          isSelected 
                            ? "bg-black text-white" 
                            : "bg-transparent text-black/30 border border-black/10 hover:border-black/30"
                        }`}
                      >
                        {day[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <LocationSection
              address={location.address}
              lat={location.lat}
              lng={location.lng}
              radius={location.radius}
              onLocationChange={(loc) => setValue("location", loc, { shouldValidate: true })}
            />

            <PhoneNumberSection
              selectedCountry={phoneCountry}
              phoneNumber={phoneNumber}
              onCountryChange={(val) => setValue("phoneCountry", val, { shouldValidate: true })}
              onNumberChange={(val) => setValue("phoneNumber", val, { shouldValidate: true })}
            />

            <CredentialsSection
              initialCredentials={credentialsMetadata}
              onSave={async (payload) => {
                setIsSavingCredentials(true);
                try {
                  if (onSaveCredentials) await onSaveCredentials(payload);
                  setCredentialsMetadata({ ...payload, hasPassword: true });
                } finally {
                  setIsSavingCredentials(false);
                }
              }}
              isSaving={isSavingCredentials}
            />
          </div>
        </div>

        {/* Global Summary & Status Bar */}
        <div className="p-8 bg-black/5 rounded-token border border-black/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 max-w-3xl">
            <div className="w-12 h-12 bg-black text-white rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg font-light">verified</span>
            </div>
            <p className="text-xs text-black/70 leading-relaxed font-body tracking-wide font-light">
              Estado actual: el registro se hará solo los días configurados. 
              El sistema verificará que los usuarios estén dentro del radio permitido respecto a {location.address || "la ubicación"}.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full border border-black/5">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-black animate-pulse' : 'bg-zinc-300'}`}></span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black font-display font-light">
              {isActive ? "Sistema Funcionando" : "Sistema Pausado"}
            </span>
          </div>
        </div>
      </main>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-8 z-[60] flex justify-center pointer-events-none mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass-panel max-w-3xl w-full px-10 py-5 rounded-full flex items-center justify-between pointer-events-auto border-t border-white/60">
          <div className="flex gap-4">
            <button 
              onClick={() => handleManualMark("entrada")}
              disabled={!!isMarking}
              className="px-8 py-3 rounded-full font-display text-[10px] uppercase tracking-[0.2em] bg-white border border-black/10 hover:bg-black hover:text-white hover:border-black transition-all text-black font-light disabled:opacity-50 cursor-pointer"
            >
              {isMarking === "entrada" ? "Marcando..." : "Registrar Entrada"}
            </button>
            <button 
              onClick={() => handleManualMark("salida")}
              disabled={!!isMarking}
              className="px-8 py-3 rounded-full font-display text-[10px] uppercase tracking-[0.2em] bg-white border border-black/10 hover:bg-black hover:text-white hover:border-black transition-all text-black font-light disabled:opacity-50 cursor-pointer"
            >
              {isMarking === "salida" ? "Marcando..." : "Registrar Salida"}
            </button>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-black/10"></div>
            <button 
              onClick={handleSave}
              disabled={isSaving || !isValid}
              className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-all active:scale-95 border border-white/10 font-light disabled:bg-zinc-400 cursor-pointer"
              title="Guardar cambios"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-2xl font-light">save</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className={`fixed top-24 right-8 z-[100] px-6 py-4 rounded-token border border-white/20 backdrop-blur-md animate-in slide-in-from-right-4 duration-300 ${
          saveStatus.type === "success" ? "bg-black text-white" : "bg-error text-white"
        }`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">
              {saveStatus.type === "success" ? "check_circle" : "error"}
            </span>
            <span className="text-xs uppercase tracking-widest">{saveStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AutomationScheduler);
