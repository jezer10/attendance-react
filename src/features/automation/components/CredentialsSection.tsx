import { memo, useState } from "react";

interface AttendanceCredentialsMetadata {
  companyId: number;
  userId: number;
  hasPassword: boolean;
}

interface CredentialsSectionProps {
  initialCredentials: AttendanceCredentialsMetadata | null;
  onSave: (payload: {
    companyId: number;
    userId: number;
    password: string;
  }) => Promise<void>;
  isSaving: boolean;
}

const CredentialsSection = ({
  initialCredentials,
  onSave,
  isSaving,
}: CredentialsSectionProps) => {
  const [companyId, setCompanyId] = useState(
    initialCredentials?.companyId?.toString() ?? ""
  );
  const [userId, setUserId] = useState(
    initialCredentials?.userId?.toString() ?? ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!companyId || !userId || !password) return;
    try {
      await onSave({
        companyId: Number(companyId),
        userId: Number(userId),
        password: password,
      });
      setPassword("");
    } catch {
      // handled elsewhere
    }
  };

  return (
    <section className="glass-panel p-8 rounded-token space-y-6 border border-black/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-black text-lg font-light">security</span>
        </div>
        <h2 className="font-display text-sm uppercase tracking-[0.1em] text-black font-light">Seguridad de Acceso</h2>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[8px] text-black/40 uppercase tracking-[0.25em] ml-1 font-display font-light">ID Empresa</label>
          <input 
            type="number"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full bg-white/60 border border-black/5 rounded-token px-6 py-3 focus:ring-2 focus:ring-black outline-none text-sm text-black placeholder:text-black/20 font-light" 
            placeholder="ALPHA-ID" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[8px] text-black/40 uppercase tracking-[0.25em] ml-1 font-display font-light">ID Usuario</label>
          <input 
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-white/60 border border-black/5 rounded-token px-6 py-3 focus:ring-2 focus:ring-black outline-none text-sm text-black placeholder:text-black/20 font-light" 
            placeholder="USER-ID" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[8px] text-black/40 uppercase tracking-[0.25em] ml-1 font-display font-light">Contraseña</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/60 border border-black/5 rounded-token px-6 py-3 focus:ring-2 focus:ring-black outline-none text-sm text-black font-light" 
              placeholder="••••••••"
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black cursor-pointer text-base font-light select-none"
            >
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !companyId || !userId || !password}
          className="w-full bg-black hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-display text-[10px] uppercase tracking-[0.2em] py-4 rounded-token transition-all font-light active:scale-[0.98] cursor-pointer"
        >
          {isSaving ? "Guardando..." : "Actualizar Credenciales"}
        </button>
      </div>

      {initialCredentials?.hasPassword && (
        <div className="flex items-center gap-2 px-3 py-2 bg-black/5 rounded-lg">
          <span className="material-symbols-outlined text-[14px] text-black/40">verified_user</span>
          <span className="text-[9px] uppercase tracking-widest text-black/40 font-display">Credenciales activas</span>
        </div>
      )}
    </section>
  );
};

export default memo(CredentialsSection);
