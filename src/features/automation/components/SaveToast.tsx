import { memo } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import type { SaveStatus, AutomationFormValues } from "./useAutomationForm";

interface SaveToastProps {
  status: SaveStatus | null;
}

const SaveToast = ({ status }: SaveToastProps) => {
  const { control } = useFormContext<AutomationFormValues>();
  const address = useWatch({ control, name: "location.address" });

  if (!status) {
    return (
      <section className="p-8 bg-black/5 rounded-token border border-black/10 flex flex-col md:flex-row items-center justify-between gap-6" aria-label="Estado del sistema">
        <div className="flex items-center gap-6 max-w-3xl">
          <div className="w-12 h-12 bg-black text-white rounded-full flex-shrink-0 flex items-center justify-center" aria-hidden="true">
            <span className="material-symbols-outlined text-lg font-light">verified</span>
          </div>
          <p className="text-xs text-black/70 leading-relaxed font-body tracking-wide font-light">
            Estado actual: el registro se hará solo los días configurados.
            El sistema verificará que los usuarios estén dentro del radio permitido respecto a {address || "la ubicación"}.
          </p>
        </div>
      </section>
    );
  }

  return (
    <output
      aria-live="polite"
      className={`fixed top-24 right-8 z-[100] px-6 py-4 rounded-token border border-white/20 backdrop-blur-md animate-in slide-in-from-right-4 duration-300 ${
        status.type === "success" ? "bg-black text-white" : "bg-error text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-lg">
          {status.type === "success" ? "check_circle" : "error"}
        </span>
        <span className="text-xs uppercase tracking-widest">{status.message}</span>
      </div>
    </output>
  );
};

export default memo(SaveToast);
