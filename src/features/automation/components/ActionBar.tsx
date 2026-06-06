import { memo } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import type { AutomationFormValues } from "./useAutomationForm";

interface ActionBarProps {
  isSaving: boolean;
  isValid: boolean;
  isMarking: "entrada" | "salida" | null;
  onManualMark: (action: "entrada" | "salida") => void;
  onSave: () => void;
}

const ActionBar = ({ isSaving, isValid, isMarking, onManualMark, onSave }: ActionBarProps) => {
  const { control } = useFormContext<AutomationFormValues>();
  const isActive = useWatch({ control, name: "isActive" });

  return (
    <div className="fixed bottom-0 left-0 right-0 p-8 z-[60] flex justify-center pointer-events-none mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel max-w-3xl w-full px-10 py-5 rounded-full flex items-center justify-between pointer-events-auto border-t border-white/60">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => onManualMark("entrada")}
            disabled={!!isMarking}
            className="px-8 py-3 rounded-full font-display text-[10px] uppercase tracking-[0.2em] bg-white border border-black/10 hover:bg-black hover:text-white hover:border-black transition-all text-black font-light disabled:opacity-50 cursor-pointer"
          >
            {isMarking === "entrada" ? "Marcando..." : "Registrar Entrada"}
          </button>
          <button
            type="button"
            onClick={() => onManualMark("salida")}
            disabled={!!isMarking}
            className="px-8 py-3 rounded-full font-display text-[10px] uppercase tracking-[0.2em] bg-white border border-black/10 hover:bg-black hover:text-white hover:border-black transition-all text-black font-light disabled:opacity-50 cursor-pointer"
          >
            {isMarking === "salida" ? "Marcando..." : "Registrar Salida"}
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="h-8 w-[1px] bg-black/10"></div>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !isValid}
            className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-all active:scale-95 border border-white/10 font-light disabled:bg-zinc-400 cursor-pointer"
            title="Guardar cambios"
            aria-label="Guardar cambios"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-2xl font-light">save</span>
            )}
          </button>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {isActive ? "Sistema funcionando" : "Sistema pausado"}
      </div>
    </div>
  );
};

export default memo(ActionBar);
