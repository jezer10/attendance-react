import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { logout } from "./services/auth";

const App = () => (
  <Layout />
);

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const showHeader = location.pathname !== "/login";

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.warn("Error al cerrar sesión:", error);
    } finally {
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {showHeader && (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <span className="text-sm font-semibold">AM</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Automatización de Marcación
              </p>
              <p className="text-xs text-slate-500">
                Configura horarios, ubicaciones y estado general
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </header>
      )}
      <main className={showHeader ? "pt-4" : ""}>
        <Outlet />
      </main>
    </div>
  );
};

export default App;
