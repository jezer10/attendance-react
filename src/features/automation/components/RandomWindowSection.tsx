import { memo } from "react";

interface RandomWindowSectionProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const PRESETS = [0, 5, 10, 15];

const RandomWindowSection = ({
  value,
  onChange,
}: RandomWindowSectionProps) => {
  const groupId = "random-window-section";
  const customInputId = `${groupId}-custom`;
  return (
    <fieldset className="space-y-3 border-0 p-0 m-0" aria-labelledby={`${groupId}-label`}>
      <legend
        id={`${groupId}-label`}
        className="block text-[10px] text-black/40 uppercase tracking-[0.2em] font-display font-light ml-1"
      >
        Minutos de tolerancia
      </legend>
      <div className="flex flex-wrap gap-2">
        <div className="flex overflow-hidden rounded-full border border-black/5 w-fit bg-white/40">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              aria-pressed={value === preset}
              aria-label={`${preset} minutos de tolerancia`}
              className={`px-4 py-2 text-[10px] font-medium uppercase tracking-wider transition-all border-r last:border-r-0 border-black/5 ${
                value === preset
                  ? "bg-black text-white cursor-pointer"
                  : "text-black/60 hover:bg-black/5 cursor-pointer"
              }`}
            >
              {preset} Min
            </button>
          ))}
        </div>

        {/* Manual Input for other values */}
        <div className="flex items-center gap-2">
          {!PRESETS.includes(value ?? -1) && value !== null && (
            <input
              id={customInputId}
              type="number"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              aria-label="Minutos de tolerancia personalizados"
              className="w-16 bg-white/40 border border-black/5 rounded-full px-3 py-1.5 text-[10px] font-medium focus:ring-1 focus:ring-black outline-none"
            />
          )}
          <button
            type="button"
            onClick={() => {
              if (PRESETS.includes(value ?? -1)) onChange(20);
              else onChange(0);
            }}
            className="text-[10px] font-medium uppercase tracking-wider text-black/40 hover:text-black transition-colors cursor-pointer"
          >
            {PRESETS.includes(value ?? -1) ? "OTRO" : "RESTABLECER"}
          </button>
        </div>
      </div>
    </fieldset>
  );
};

export default memo(RandomWindowSection);
