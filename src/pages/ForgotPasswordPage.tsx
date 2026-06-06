import { Link } from "react-router";

const ForgotPasswordPage = () => {
  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary selection:text-on-primary">
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-white">
        <div className="absolute -top-48 -right-48 w-[800px] h-[800px] bg-surface-dim rounded-full blur-[140px] opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-[1000px] h-[600px] bg-outline-variant/20 -rotate-12 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 left-1/3 w-[600px] h-[600px] bg-secondary-fixed/15 rounded-full blur-[150px]" />
      </div>

      <header className="fixed top-0 w-full z-50 flex justify-center items-center px-12 py-12 md:py-16">
        <h1 className="text-3xl font-display font-semibold tracking-tighter text-on-surface">
          <Link to="/login">Mark</Link>
        </h1>
      </header>

      <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-32">
        <div className="w-full max-w-md bg-white/30 backdrop-blur-[60px] rounded-2xl p-10 md:p-12 border border-white/50 relative overflow-hidden">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-display font-bold text-on-surface tracking-tight mb-2">
              Recuperar contraseña
            </h2>
            <p className="text-on-surface-variant font-body text-sm leading-relaxed">
              Próximamente habilitaremos el flujo de recuperación por correo electrónico.
            </p>
          </div>

          <Link
            to="/login"
            className="block w-full text-center bg-primary text-on-primary py-4 px-6 rounded-lg font-display font-medium transition-all hover:bg-zinc-800"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
