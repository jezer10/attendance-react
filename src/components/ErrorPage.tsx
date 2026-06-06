import { useRouteError, isRouteErrorResponse, Link } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();
  
  let errorMessage = "Ocurrió un error inesperado al procesar tu solicitud.";
  let errorTitle = "Algo salió mal";

  if (isRouteErrorResponse(error)) {
    errorTitle = `${error.status}`;
    errorMessage = typeof error.data === "string" 
      ? error.data 
      : (error.data?.message || error.statusText || "No se pudo encontrar la página solicitada.");
  } else if (error instanceof Error) {
    errorMessage = error.message;
    if (error.name === "NetworkError") {
      errorTitle = "Error de Conexión";
    }
  }

  // Desplegar error en consola para debugging en desarrollo
  if (import.meta.env.DEV) {
    console.error("Router Error:", error);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 selection:bg-primary selection:text-white">
      {/* Abstract Background Element */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full glass-panel-dark p-10 md:p-14 rounded-card text-center flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        {/* Error Icon Bubble */}
        <div className="w-20 h-20 rounded-full bg-white border border-outline-variant flex items-center justify-center mb-10 shadow-sm">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-display font-bold text-primary mb-6 tracking-tight">
          {errorTitle}
        </h1>
        
        <p className="text-on-surface-variant font-body mb-12 text-lg leading-relaxed max-w-[280px] mx-auto opacity-80">
          {errorMessage}
        </p>

        <div className="flex flex-col gap-4 w-full pt-4 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-on-primary px-8 py-4 rounded-token font-body font-medium transition-all hover:bg-zinc-800 active:scale-[0.98] cursor-pointer shadow-lg shadow-black/5"
          >
            Intentar de nuevo
          </button>
          
          <Link
            to="/"
            className="w-full bg-transparent text-primary/60 hover:text-primary px-8 py-3 rounded-token font-body font-medium transition-all active:scale-[0.98] text-center cursor-pointer text-sm"
          >
            Volver al inicio
          </Link>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute top-4 right-4 w-12 h-12 pointer-events-none opacity-5">
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-primary">
             <path d="M4 4H44V44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
