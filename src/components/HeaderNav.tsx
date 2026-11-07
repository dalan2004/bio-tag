import React from 'react';
import { useBiomedical, ActiveTab } from '../context/BiomedicalContext';
import {
  Activity,
  Sun,
  Moon,
  Radio,
  Building2,
  UserCheck,
  Plus,
  AlertTriangle,
  Lock,
  LogOut,
  Bell,
  ShieldCheck,
  User,
} from 'lucide-react';

interface HeaderNavProps {
  onOpenNfcScanner: () => void;
  onOpenNewEquipment: () => void;
  onOpenReportIncident: () => void;
  onOpenLoginModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onOpenNfcScanner,
  onOpenNewEquipment,
  onOpenReportIncident,
  onOpenLoginModal,
}) => {
  const {
    activeTab,
    setActiveTab,
    selectedInstitution,
    currentUserProfile,
    isAuthenticated,
    isIngeniero,
    isAdminHospital,
    isEnfermeria,
    logout,
    darkMode,
    toggleDarkMode,
    getOverdueOrUpcomingEquipments,
  } = useBiomedical();

  const { overdue } = getOverdueOrUpcomingEquipments();

  const baseTabs: { id: ActiveTab; label: string; shortLabel: string; badge?: number }[] = [
    { id: 'ultimo_mantenimiento', label: '1. Último mantenimiento', shortLabel: 'Mantenimiento' },
    { id: 'hoja_de_vida', label: '2. Hoja de vida del equipo', shortLabel: 'Hoja de Vida' },
    { id: 'todos_los_equipos', label: '3. Todos los equipos', shortLabel: 'Equipos' },
    { id: 'fechas_rh', label: '4. Fechas y RH', shortLabel: 'Fechas y RH' },
  ];

  if (isIngeniero) {
    baseTabs.push({
      id: 'alertas_ingenieria',
      label: '5. Alertas Técnicas',
      shortLabel: 'Alertas',
      badge: overdue.length > 0 ? overdue.length : undefined,
    });
  }

  if (isAdminHospital) {
    baseTabs.push({
      id: 'configuracion',
      label: '5. Configuración',
      shortLabel: 'Configuración',
    });
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Zone 1: Wordmark & Hospital Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight whitespace-nowrap block leading-tight">
                Trazabilidad Biomédica
              </span>
              <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold block truncate max-w-[190px]">
                {selectedInstitution ? `${selectedInstitution.name} (${selectedInstitution.city})` : 'Acceso Hospitalario'}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Tabs (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {baseTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions, Auth & Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* NFC & QR Simulator / Reader Button */}
            <button
              onClick={onOpenNfcScanner}
              title="Escanear o Simular Toque NFC / Código QR"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors whitespace-nowrap"
            >
              <Radio className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
              <span className="hidden sm:inline">Probar NFC / QR</span>
              <span className="sm:hidden">NFC</span>
            </button>

            {/* Engineer quick new equipment button */}
            {isIngeniero && (
              <button
                onClick={onOpenNewEquipment}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors whitespace-nowrap shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Equipo</span>
              </button>
            )}

            {/* Nursing quick report button */}
            {isEnfermeria && (
              <button
                onClick={onOpenReportIncident}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors whitespace-nowrap shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reportar Falla</span>
              </button>
            )}

            {/* User Session Button / Login trigger */}
            {isAuthenticated && currentUserProfile ? (
              <div className="flex items-center gap-1.5 pl-1">
                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors"
                  title="Detalles de usuario y cambio de cuenta"
                >
                  <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {currentUserProfile.fullName.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase hidden lg:inline ${
                      currentUserProfile.role === 'ingeniero'
                        ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200'
                        : currentUserProfile.role === 'admin_hospital'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    {currentUserProfile.role.replace('_', ' ')}
                  </span>
                </button>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Alternar modo oscuro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Tab Strip */}
        <div className="flex xl:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {baseTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>{tab.shortLabel}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
