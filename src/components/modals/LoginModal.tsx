import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  X,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  Building,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    institutions,
    currentUserProfile,
    isAuthenticated,
    loginWithEmail,
    quickLoginAs,
    logout,
    loginError,
  } = useBiomedical();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Hospital2026!');
  const [selectedHospitalTab, setSelectedHospitalTab] = useState<'inst-barranquilla' | 'inst-cali'>('inst-barranquilla');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    const ok = await loginWithEmail(email.trim(), password);
    setIsSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  const handleQuickSelect = (profileId: string) => {
    quickLoginAs(profileId);
    onClose();
  };

  const hospitalUsers = users.filter((u) => u.institutionId === selectedHospitalTab);
  const activeInstitution = institutions.find((i) => i.id === currentUserProfile?.institutionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Acceso Institucional por Hospital
              </h3>
              <p className="text-[11px] text-slate-400">
                Firebase Authentication & Control de Acceso por Roles (RBAC)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {/* Active Session Status if logged in */}
          {isAuthenticated && currentUserProfile && (
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    Sesión iniciada: {currentUserProfile.fullName}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {currentUserProfile.cargo} · {activeInstitution?.name} ({currentUserProfile.role.toUpperCase()})
                  {currentUserProfile.rh && <span className="font-mono text-teal-800 dark:text-teal-300 ml-1 font-bold">RH: {currentUserProfile.rh}</span>}
                </div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Correo Institucional:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@barranquilla.salud.gov.co"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Contraseña:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Verificando credenciales...' : 'Ingresar a mi Hospital'}</span>
            </button>
          </form>

          {/* Quick Access Switcher for Evaluators and Auditors */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Cuentas de Prueba Preconfiguradas (1 Clic):
              </span>
            </div>

            {/* Hospital Tabs */}
            <div className="flex gap-1.5 mb-2.5">
              <button
                onClick={() => setSelectedHospitalTab('inst-barranquilla')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
                  selectedHospitalTab === 'inst-barranquilla'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Hospital Ejemplo (B/quilla)
              </button>

              <button
                onClick={() => setSelectedHospitalTab('inst-cali')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
                  selectedHospitalTab === 'inst-cali'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Clínica Ejemplo Norte (Cali)
              </button>
            </div>

            {/* Account Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hospitalUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickSelect(u.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all text-xs ${
                    currentUserProfile?.id === u.id
                      ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 ring-1 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {u.fullName.split(' ')[0]} {u.fullName.split(' ')[1] || ''}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                        u.role === 'ingeniero'
                          ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200'
                          : u.role === 'admin_hospital'
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                          : u.role === 'enfermeria'
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                    {u.cargo}
                  </span>
                  {u.rh && (
                    <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 font-semibold block">
                      RH: {u.rh}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
