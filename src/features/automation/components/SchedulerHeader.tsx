import { memo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";

const SchedulerHeader = () => {
  const { logout, isLoggingOut } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md flex justify-between items-center h-20 px-8 border-b border-black/5">
      <div className="text-xl font-extrabold text-black uppercase tracking-[0.2em] font-display cursor-pointer">
        MARK
      </div>
      <div className="flex gap-8 items-center">
        <button
          type="button"
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
  );
};

export default memo(SchedulerHeader);
