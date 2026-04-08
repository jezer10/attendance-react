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
  const [showValidation, setShowValidation] = useState(false);
  const [errors, setErrors] = useState<{
    companyId?: string;
    userId?: string;
    password?: string;
  } | null>(null);

  const [metadata, setMetadata] = useState<AttendanceCredentialsMetadata | null>(
    initialCredentials
  );

  const validate = () => {
    const newErrors: {
      companyId?: string;
      userId?: string;
      password?: string;
    } = {};

    const companyIdValue = Number(companyId);
    if (
      !companyId.trim() ||
      Number.isNaN(companyIdValue) ||
      !Number.isInteger(companyIdValue) ||
      companyIdValue <= 0
    ) {
      newErrors.companyId = "Ingresa un ID de empresa válido.";
    }

    const userIdValue = Number(userId);
    if (
      !userId.trim() ||
      Number.isNaN(userIdValue) ||
      !Number.isInteger(userIdValue) ||
      userIdValue <= 0
    ) {
      newErrors.userId = "Ingresa un ID de usuario válido.";
    }

    const passwordValue = password.trim();
    if (!passwordValue) {
      newErrors.password = "Ingresa la contraseña.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setShowValidation(true);
    if (!validate()) return;

    try {
      await onSave({
        companyId: Number(companyId),
        userId: Number(userId),
        password: password,
      });
      setPassword("");
      setMetadata({
        companyId: Number(companyId),
        userId: Number(userId),
        hasPassword: true,
      });
      setShowValidation(false);
    } catch {
      // Error is handled in parent via saveStatus
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Credenciales de marcación
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Se guardan de forma segura y se usan para realizar la marcación
          automática.
        </p>
      </div>

      {metadata?.hasPassword ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Credenciales guardadas para este usuario.
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Aún no has guardado credenciales para este usuario.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            ID de empresa
          </label>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              if (showValidation) {
                setErrors((prev) => (prev ? { ...prev, companyId: undefined } : null));
              }
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
            placeholder="Ej. 7040"
          />
          {showValidation && errors?.companyId ? (
            <p className="text-sm text-rose-600">{errors.companyId}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            ID de usuario
          </label>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              if (showValidation) {
                setErrors((prev) => (prev ? { ...prev, userId: undefined } : null));
              }
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
            placeholder="Ej. 77668171"
          />
          {showValidation && errors?.userId ? (
            <p className="text-sm text-rose-600">{errors.userId}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Contraseña</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (showValidation) {
                setErrors((prev) => (prev ? { ...prev, password: undefined } : null));
              }
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-12 text-sm text-slate-700 shadow-sm"
            placeholder="Ingresa la contraseña"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {showValidation && errors?.password ? (
          <p className="text-sm text-rose-600">{errors.password}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSaving ? "Guardando…" : "Guardar credenciales"}
      </button>
    </section>
  );
};

export default memo(CredentialsSection);
