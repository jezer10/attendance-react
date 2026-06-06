import { memo } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import type { AutomationFormValues } from "./useAutomationForm";

interface TimezonePickerProps {
  timezones: string[];
}

const TimezonePicker = ({ timezones }: TimezonePickerProps) => {
  const { control, setValue } = useFormContext<AutomationFormValues>();
  const timezone = useWatch({ control, name: "timezone" });

  return (
    <div className="glass-panel p-6 rounded-token flex flex-col md:flex-row items-center gap-8 transition-all border border-black/5">
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-black font-light">public</span>
        </div>
        <label
          htmlFor="timezone-select"
          className="text-black uppercase tracking-widest text-xs font-light"
        >
          Ubicación horaria:
        </label>
      </div>
      <select
        id="timezone-select"
        value={timezone}
        onChange={(e) => setValue("timezone", e.target.value, { shouldValidate: true })}
        className="bg-white/40 border border-black/5 rounded-token px-6 py-3 flex-grow focus:ring-2 focus:ring-black appearance-none font-body text-black cursor-pointer font-light outline-none"
      >
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
    </div>
  );
};

export default memo(TimezonePicker);
