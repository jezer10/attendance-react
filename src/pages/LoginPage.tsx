import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { authenticate, clearTokens, ensureAuthTokens } from "../services/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    ensureAuthTokens()
      .then(() => {
        if (isMounted) {
          navigate("/", { replace: true });
        }
      })
      .catch(() => {
        // Ignoramos si no hay sesión válida
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setAuthError(null);

    try {
      await authenticate(values.email.trim().toLowerCase(), values.password);
      reset();
      navigate("/", { replace: true });
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión. Intenta nuevamente."
      );
      clearTokens();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col overflow-hidden rounded-none bg-white shadow-none lg:my-10 lg:flex-row lg:rounded-3xl lg:shadow-xl">
        <section className="relative hidden w-full flex-col justify-between bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 p-10 text-white lg:flex lg:max-w-md">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              Automatización inteligente
            </span>
            <h1 className="text-3xl font-semibold leading-tight">
              Gestiona tus marcaciones automáticas con confianza.
            </h1>
            <p className="text-sm text-emerald-100/80">
              Controla horarios, ubicaciones y estado de la automatización en un
              solo lugar. Mantén a tu equipo sincronizado sin perder la
              trazabilidad.
            </p>
          </div>
          <div className="space-y-3 text-sm text-emerald-100/80">
            <p className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              Seguridad basada en tokens JWT con refresco automático
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              Vista previa en tiempo real de las automatizaciones
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              Configura ubicaciones, radios y horarios con precisión
            </p>
          </div>
        </section>

        <section className="flex w-full flex-1 flex-col justify-center p-6 sm:p-10 lg:px-16">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl font-semibold text-slate-900">
                Iniciar sesión
              </h2>
              <p className="text-sm text-slate-500">
                Ingresa con tu correo y contraseña registrados para administrar
                la automatización de marcaciones.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@empresa.com"
                  {...register("email", {
                    required: "Ingresa tu correo electrónico.",
                    pattern: {
                      value: emailRegex,
                      message: "Ingresa un correo electrónico válido.",
                    },
                  })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="********"
                    {...register("password", {
                      required: "Ingresa tu contraseña.",
                      minLength: {
                        value: 8,
                        message:
                          "La contraseña debe tener al menos 8 caracteres.",
                      },
                    })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-12 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {authError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? "Ingresando…" : "Ingresar"}
              </button>
            </form>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              <p>
                Este sistema utiliza autenticación basada en{" "}
                <strong>JWT</strong>. Tras iniciar sesión, se almacenará un{" "}
                <strong>access token</strong> para las solicitudes y un{" "}
                <strong>refresh token</strong> para renovar tu sesión
                automáticamente.
              </p>
              <p>
                Si perdiste el acceso, comunícate con el administrador de
                Milagros para restablecer tu contraseña.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
