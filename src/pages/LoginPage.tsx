import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { useAuth } from "../features/auth/hooks/useAuth";
import { getStoredTokens } from "../features/auth/services/authService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    login(
      {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      },
      {
        onSuccess: () => {
          reset();
        },
      }
    );
  };

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary selection:text-on-primary">
      {/* Background Abstract Shapes (Intensified) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-white">
        <div className="absolute -top-48 -right-48 w-[800px] h-[800px] bg-surface-dim rounded-full blur-[140px] opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-[1000px] h-[600px] bg-outline-variant/20 -rotate-12 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 left-1/3 w-[600px] h-[600px] bg-secondary-fixed/15 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none" />
      </div>

      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 flex justify-center items-center px-12 py-12 md:py-16">
        <h1 className="text-3xl font-display font-semibold tracking-tighter text-on-surface cursor-pointer">
          Mark
        </h1>
      </header>

      <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-32">
        {/* Centered Glass Card (Intensified Glassmorphism) */}
        <div className="w-full max-w-md bg-white/30 backdrop-blur-[60px] rounded-2xl p-10 md:p-12 border border-white/50 relative overflow-hidden">
          {/* Card Header */}
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-display font-bold text-on-surface tracking-tight mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-on-surface-variant font-body text-sm leading-relaxed">
              Ingresa tus credenciales para continuar.
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div className="group">
              <label
                className="block text-[10px] font-medium uppercase tracking-[0.2em] text-on-surface-variant mb-2 ml-1"
                htmlFor="email"
              >
                CORREO ELECTRÓNICO
              </label>
              <input
                id="email"
                type="email"
                placeholder="ejemplo@milagros.com"
                {...register("email", {
                  required: "Ingresa tu correo electrónico.",
                  pattern: {
                    value: emailRegex,
                    message: "Ingresa un correo electrónico válido.",
                  },
                })}
                className="w-full bg-white/10 backdrop-blur-[20px] border-b border-outline-variant/30 focus:border-primary focus:ring-0 outline-none transition-all duration-300 py-3 px-4 rounded-t-md text-on-surface placeholder:text-outline-variant/60 font-body text-sm"
              />
              {errors.email && <p className="mt-2 text-xs text-error">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="group">
              <div className="flex justify-between items-center mb-2 ml-1">
                <label
                  className="block text-[10px] font-medium uppercase tracking-[0.2em] text-on-surface-variant"
                  htmlFor="password"
                >
                  CONTRASEÑA
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-medium uppercase tracking-[0.1em] text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? "OCULTAR" : "MOSTRAR"}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password", {
                  required: "Ingresa tu contraseña.",
                  minLength: {
                    value: 8,
                    message: "La contraseña debe tener al menos 8 caracteres.",
                  },
                })}
                className="w-full bg-white/10 backdrop-blur-[20px] border-b border-outline-variant/30 focus:border-primary focus:ring-0 outline-none transition-all duration-300 py-3 px-4 rounded-t-md text-on-surface placeholder:text-outline-variant/60 font-body text-sm"
              />
              {errors.password && (
                <p className="mt-2 text-xs text-error">{errors.password.message}</p>
              )}
              <div className="mt-4 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors duration-200 underline decoration-1 underline-offset-4 decoration-outline-variant/40"
                >
                  Olvidé mi contraseña
                </Link>
              </div>
            </div>

            {loginError && (
              <div className="rounded-lg border border-error bg-error/5 px-4 py-3 text-sm text-error">
                {loginError instanceof Error ? loginError.message : "Error al iniciar sesión"}
              </div>
            )}

            {/* Primary Action */}
            <button
              className="w-full bg-primary hover:bg-zinc-800 disabled:bg-zinc-400 text-on-primary font-display font-medium py-4 px-6 rounded-lg transition-all duration-300 flex justify-center items-center group border border-white/10 active:scale-[0.98] cursor-pointer"
              type="submit"
              disabled={!isValid || isLoggingIn}
            >
              <span>{isLoggingIn ? "Ingresando..." : "Ingresar"}</span>
              {!isLoggingIn && (
                <span className="material-symbols-outlined ml-2 text-lg transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          {/* Architectural Decoration */}
          <div className="absolute -bottom-1 -right-1 w-24 h-24 bg-surface-dim/30 rounded-tl-full -z-10 blur-2xl" />
        </div>
      </main>

      {/* Footer Component */}
      <footer className="fixed bottom-0 w-full flex flex-col md:flex-row justify-end items-center px-12 py-10 bg-transparent z-50">
        <div className="font-body text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400">
          V2.4.0 • <span className="text-neutral-900">ARCHITECTURAL INTEGRITY</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
