import { memo, useCallback, useEffect, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { AutomationRule, PersistedAutomationPayload } from "./types";
import type {
  AttendanceCredentialsPayload,
  AttendanceCredentialsMetadata,
  AutomationFormValues,
  SubmitState,
} from "./useAutomationForm";
import { useAutomationForm, FormProvider } from "./useAutomationForm";

import SchedulerHeader from "./SchedulerHeader";
import HeroSection from "./HeroSection";
import TimezonePicker from "./TimezonePicker";
import ScheduleBlock from "./ScheduleBlock";
import ActionBar from "./ActionBar";
import SaveToast from "./SaveToast";
import LocationSection from "./LocationSection";
import PhoneNumberSection from "./PhoneNumberSection";
import CredentialsSection from "./CredentialsSection";

interface AutomationSchedulerProps {
  initialRule: AutomationRule;
  availableTimezones: string[];
  onSave?: (payload: PersistedAutomationPayload) => Promise<void>;
  onImmediateMark?: (action: "entrada" | "salida") => Promise<void>;
  onSaveCredentials?: (payload: AttendanceCredentialsPayload) => Promise<void>;
  initialCredentials?: AttendanceCredentialsMetadata | null;
}

type InnerProps = AutomationSchedulerProps & {
  methods: UseFormReturn<AutomationFormValues>;
  handleSubmit: () => void;
  submit: SubmitState;
  dismissSubmit: () => void;
  isSaving: boolean;
  isValid: boolean;
};

const AutomationSchedulerInner = ({
  availableTimezones,
  onImmediateMark,
  onSaveCredentials,
  initialCredentials,
  methods,
  handleSubmit,
  submit,
  dismissSubmit,
  isSaving,
  isValid,
}: InnerProps) => {
  const [isMarking, setIsMarking] = useState<"entrada" | "salida" | null>(null);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  useEffect(() => {
    if (submit.kind === "done") {
      const timer = setTimeout(dismissSubmit, 3000);
      return () => clearTimeout(timer);
    }
  }, [submit, dismissSubmit]);

  const handleManualMark = useCallback(
    async (type: "entrada" | "salida") => {
      if (isMarking) return;
      setIsMarking(type);
      try {
        if (onImmediateMark) await onImmediateMark(type);
      } finally {
        setIsMarking(null);
      }
    },
    [isMarking, onImmediateMark]
  );

  const { control } = methods;
  const location = useWatch({ control, name: "location" });
  const phoneCountry = useWatch({ control, name: "phoneCountry" });
  const phoneNumber = useWatch({ control, name: "phoneNumber" });

  const setLocation = useCallback(
    (loc: AutomationFormValues["location"]) => {
      methods.setValue("location", loc, { shouldValidate: true });
    },
    [methods]
  );

  return (
    <div className="font-body text-black pb-40 bg-[#fafafa] font-light min-h-screen">
      <SchedulerHeader />

      <main className="max-w-7xl mx-auto pt-32 px-6 space-y-10">
        <HeroSection />

        <TimezonePicker timezones={availableTimezones} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8">
            <ScheduleBlock
              type="entry"
              icon="login"
              title="Horario de Entrada"
              timeInputId="entry-time"
              daysGroupId="entry-days"
              timeLabel="Hora para entrar"
              withRandomWindow
            />
            <ScheduleBlock
              type="exit"
              icon="logout"
              title="Horario de Salida"
              timeInputId="exit-time"
              daysGroupId="exit-days"
              timeLabel="Hora para salir"
            />
          </div>

          <div className="lg:col-span-5 space-y-8">
            <LocationSection
              address={location.address}
              lat={location.lat}
              lng={location.lng}
              radius={location.radius}
              onLocationChange={setLocation}
            />
            <PhoneNumberSection
              selectedCountry={phoneCountry}
              phoneNumber={phoneNumber}
              onCountryChange={(val) => methods.setValue("phoneCountry", val, { shouldValidate: true })}
              onNumberChange={(val) => methods.setValue("phoneNumber", val, { shouldValidate: true })}
            />
            <CredentialsSection
              initialCredentials={initialCredentials ?? null}
              isSaving={isSavingCredentials}
              onSave={async (payload) => {
                setIsSavingCredentials(true);
                try {
                  if (onSaveCredentials) await onSaveCredentials(payload);
                } finally {
                  setIsSavingCredentials(false);
                }
              }}
            />
          </div>
        </div>

        <SaveToast status={submit.kind === "done" ? submit.status : null} />
      </main>

      <ActionBar
        isSaving={isSaving}
        isValid={isValid}
        isMarking={isMarking}
        onManualMark={handleManualMark}
        onSave={handleSubmit}
      />
    </div>
  );
};

const AutomationScheduler = (props: AutomationSchedulerProps) => {
  const { methods, handleSubmit, submit, dismissSubmit } = useAutomationForm({
    initialRule: props.initialRule,
    onSave: props.onSave,
  });

  const isSaving = submit.kind === "saving";
  const isValid = methods.formState.isValid;

  return (
    <FormProvider {...methods}>
      <AutomationSchedulerInner
        {...props}
        methods={methods}
        handleSubmit={handleSubmit}
        submit={submit}
        dismissSubmit={dismissSubmit}
        isSaving={isSaving}
        isValid={isValid}
      />
    </FormProvider>
  );
};

export default memo(AutomationScheduler);
