import { memo } from "react";

interface RandomWindowSectionProps {
  value: number | null;
  onChange: (value: number | null) => void;
  showValidation: boolean;
  error?: string;
}

const RandomWindowSection = ({
  value,
  onChange,
  showValidation,
  error,
}: RandomWindowSectionProps) => {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Ventana aleatoria</h2>
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">
          Minutos de variación
        </label>
        <input
          type="number"
          min={0}
          step={1}
          value={value === null ? "" : value}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (!nextValue.trim()) {
              onChange(null);
              return;
            }
            const parsed = Number(nextValue);
            onChange(Number.isNaN(parsed) ? null : parsed);
          }}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
          placeholder="0"
        />
        <p className="text-sm text-slate-500">
          Define un rango aleatorio en minutos para adelantar o atrasar la
          marcación.
        </p>
        {showValidation && error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : null}
      </div>
    </section>
  );
};

export default memo(RandomWindowSection);
