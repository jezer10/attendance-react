import { memo } from "react";
import { Field, Label } from "@headlessui/react";
import { useWatch, useFormContext } from "react-hook-form";
import Toggle from "./Toggle";
import type { AutomationFormValues } from "./useAutomationForm";

const HeroSection = () => {
  const { control, setValue } = useFormContext<AutomationFormValues>();
  const isActive = useWatch({ control, name: "isActive" });

  return (
    <section className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
      <div className="space-y-2">
        <h1 className="text-5xl font-display tracking-tight text-black leading-tight font-light transition-all duration-700 animate-in fade-in slide-in-from-left-4">
          Control de <br />Entradas y Salidas
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
  );
};

export default memo(HeroSection);
