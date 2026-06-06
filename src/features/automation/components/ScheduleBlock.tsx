import { memo } from "react";
import { Field, Label } from "@headlessui/react";
import { useWatch, useFormContext } from "react-hook-form";

import { DAYS } from "./constants";
import { toggleDay, type AutomationFormValues } from "./useAutomationForm";
import Toggle from "./Toggle";
import RandomWindowSection from "./RandomWindowSection";

interface ScheduleBlockProps {
  type: "entry" | "exit";
  icon: string;
  title: string;
  timeInputId: string;
  daysGroupId: string;
  timeLabel: string;
  withRandomWindow?: boolean;
}

const ScheduleBlock = ({
  type,
  icon,
  title,
  timeInputId,
  daysGroupId,
  timeLabel,
  withRandomWindow = false,
}: ScheduleBlockProps) => {
  const { control, setValue } = useFormContext<AutomationFormValues>();
  const block = useWatch({ control, name: type });
  const randomWindowMinutes = useWatch({ control, name: "randomWindowMinutes" });

  return (
    <div className="glass-panel p-8 rounded-token space-y-6 relative overflow-hidden border-l-4 border-l-black group transition-all border border-black/5">
      <Field className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-lg font-light">{icon}</span>
          </div>
          <Label className="font-display text-xl uppercase tracking-[0.1em] text-black font-light cursor-pointer">
            {title}
          </Label>
        </div>
        <Toggle
          checked={block.habilitado}
          onChange={(val) => setValue(`${type}.habilitado`, val, { shouldValidate: true })}
        />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-3">
          <label
            htmlFor={timeInputId}
            className="block text-[10px] text-black/40 uppercase tracking-[0.2em] font-display font-light ml-1"
          >
            {timeLabel}
          </label>
          <input
            id={timeInputId}
            type="time"
            value={block.hora_local}
            onChange={(e) =>
              setValue(`${type}.hora_local`, e.target.value, { shouldValidate: true })
            }
            className="w-full bg-black/5 border-none rounded-token font-display focus:ring-2 focus:ring-black text-black font-light text-2xl py-6 px-8 outline-none"
          />
        </div>
        {withRandomWindow && (
          <div className="space-y-3">
            <RandomWindowSection
              value={randomWindowMinutes}
              onChange={(val) => setValue("randomWindowMinutes", val, { shouldValidate: true })}
            />
          </div>
        )}
      </div>
      <fieldset
        className="space-y-4 pt-4 border-t border-black/5 border-0 p-0 m-0"
        aria-labelledby={`${daysGroupId}-label`}
      >
        <legend
          id={`${daysGroupId}-label`}
          className="block text-[10px] text-black/40 uppercase tracking-[0.2em] font-display font-light"
        >
          Días de trabajo
        </legend>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((day) => {
            const isSelected = block.dias.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${day} (${type === "entry" ? "entrada" : "salida"})`}
                onClick={() =>
                  setValue(`${type}.dias`, toggleDay(block.dias, day), { shouldValidate: true })
                }
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
      </fieldset>
    </div>
  );
};

export default memo(ScheduleBlock);
