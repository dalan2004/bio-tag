import React, { useState, useEffect } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  Loader2,
  ShieldAlert,
  ArrowRight,
  Send,
  CheckCircle2,
  Building2,
  HelpCircle,
} from 'lucide-react';

interface AuthScreenProps {
  onOpenSetupWizard?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenSetupWizard }) => {
  const {
    loginWithEmail,
    loginError,
    sessionExpiredMessage,
    setSessionExpiredMessage,
    hasAnyAdmin,
    companyProfile,
    sendUserPasswordReset,
    failedLoginAttempts,
    isLockedOut,
    lockoutRemainingSeconds,
  } = useBiomedical();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset dialog state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Clear session expired message on unmount
  useEffect(() => {
    return () => {
      setSessionExpiredMessage(null);
    };
  }, [setSessionExpiredMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || isLockedOut) return;

    setIsSubmitting(true);
    await loginWithEmail(email.trim(), password);
    setIsSubmitting(false);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetSubmitting(true);
    setResetError(null);
    setResetSent(false);

    try {
      await sendUserPasswordReset(resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      setResetError(
        err instanceof Error ? err.message : 'Error al enviar el correo de restablecimiento.'
      );
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const companyInitials = companyProfile?.nombre
    ? companyProfile.nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : 'BT';

  const brandColor = companyProfile?.colorPrincipal || '#0f2942';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-900 text-slate-100 font-sans relative overflow-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative z-10 transition-all text-slate-900 dark:text-slate-100">
        
        {/* Brand Banner */}
        <div className="p-6 sm:p-8 bg-slate-950 text-white text-center border-b border-slate-800 relative">
          <div className="flex justify-center mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-teal-500/10 overflow-hidden border border-white/10"
              style={{ backgroundColor: brandColor }}
            >
              {companyProfile?.logoUrl ? (
                <img
                  src={companyProfile.logoUrl}
                  alt={companyProfile.nombre || 'BIO-TAG'}
                  className="w-full h-full object-cover"
                />
              ) : (
                companyInitials
              )}
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {companyProfile?.nombre || 'BIO-TAG'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {companyProfile?.eslogan ||
              'Sistema de Trazabilidad y Gestión de Equipos Biomédicos'}
          </p>

          {companyProfile?.nit && (
            <p className="text-[11px] font-mono text-teal-400/90 mt-1">
              NIT: {companyProfile.nit}
            </p>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5">
          
          {/* Invalidation / Expired Session Notification */}
          {sessionExpiredMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{sessionExpiredMessage}</span>
            </div>
          )}

          {/* Lockout Notification (5 failed attempts) */}
          {isLockedOut ? (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-bold">Acceso bloqueado temporalmente</p>
                <p className="text-[11px] text-red-500/80 mt-0.5">
                  Por seguridad, tras 5 intentos fallidos el acceso ha sido suspendido. Espera{' '}
                  <strong className="font-mono text-red-600 dark:text-red-300">
                    {lockoutRemainingSeconds} segundos
                  </strong>{' '}
                  antes de intentar nuevamente.
                </p>
              </div>
            </div>
          ) : (
            loginError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Correo Electrónico Institucional:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@institucion.com"
                  disabled={isLockedOut || isSubmitting}
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contraseña:
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLockedOut || isSubmitting}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLockedOut || isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLockedOut || isSubmitting || !email.trim() || !password}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales en Firebase...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* First-Time Company Setup Notice (Only active if no admin exists) */}
          {!hasAnyAdmin ? (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                ¿Es la primera vez que configuras tu empresa en BIO-TAG?
              </p>
              <button
                type="button"
                onClick={onOpenSetupWizard}
                className="w-full py-2.5 px-4 rounded-xl border border-teal-500/50 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Crear Cuenta de Empresa y Administrador</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center text-[11px] text-slate-400 dark:text-slate-500">
              <p>Acceso restringido a personal biomédico y clínico autorizado.</p>
              <p className="mt-0.5">
                Las cuentas son creadas de forma privada por el Administrador institucional.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Con tecnología <strong className="text-slate-600 dark:text-slate-300 font-semibold">BIO-TAG</strong> · Firebase Secure Auth
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4 text-xs text-slate-900 dark:text-white">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-500" />
                <h3 className="font-bold text-sm">Recuperar Contraseña</h3>
              </div>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetSent(false);
                  setResetError(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {resetSent ? (
              <div className="space-y-3 py-2 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  ¡Correo enviado!
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hemos enviado un enlace seguro a{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">{resetEmail}</strong>{' '}
                  para que configures una nueva contraseña. Revisa también tu carpeta de spam.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetSent(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-teal-600 text-white font-semibold text-xs mt-2"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ingresa tu correo institucional registrado. Te enviaremos un enlace de Firebase para que establezcas tu nueva contraseña de forma segura.
                </p>

                {resetError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Correo Institucional:</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="usuario@institucion.com"
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isResetSubmitting || !resetEmail.trim()}
                    className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
                  >
                    {isResetSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar Correo</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
