import React from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Home,
  FileText,
  FileCheck2,
  Cpu,
  CalendarDays,
  Settings,
  Bell,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Building,
  Radio,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab } from '../../types/biomedical';

interface AppSidebarProps {
  onOpenLoginModal: () => void;
  onOpenNfcScanner: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  onOpenLoginModal,
  onOpenNfcScanner,
}) => {
  const {
    companyProfile,
    activeTab,
    setActiveTab,
    currentUserProfile,
    selectedInstitution,
    institutions,
    isAuthenticated,
    isIngeniero,
    isAdminHospital,
    darkMode,
    toggleDarkMode,
    logout,
  } = useBiomedical();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'ultimo_mantenimiento', label: 'Último Mantenimiento', icon: FileText },
    { id: 'hoja_de_vida', label: 'Hoja de Vida', icon: FileCheck2 },
    { id: 'todos_los_equipos', label: 'Equipos', icon: Cpu },
    { id: 'fechas_rh', label: 'Fechas y RH', icon: CalendarDays },
    { id: 'alertas_ingenieria', label: 'Alertas Técnicas', icon: Bell },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const getCompanyInitials = (nameStr: string) => {
    if (!nameStr.trim()) return 'CM';
    return nameStr
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  };

  const roleLabels: Record<string, string> = {
    ingeniero: 'Ingeniero Biomédico',
    admin_hospital: 'Administrador Hospital',
    enfermeria: 'Enfermería Clínica',
    consulta: 'Solo Lectura',
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 transition-colors z-30 select-none">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0 overflow-hidden"
          style={{ backgroundColor: companyProfile.colorPrincipal || '#0f2942' }}
        >
          {companyProfile.logoUrl ? (
            <img src={companyProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            getCompanyInitials(companyProfile.nombre)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white uppercase truncate">
            {companyProfile.nombre.trim() ? companyProfile.nombre : 'BIO-TAG'}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {companyProfile.eslogan || 'Gestión Biomédica Hospitalaria'}
          </p>
        </div>
      </div>

      {/* Hospital Context Pill */}
      {selectedInstitution && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-0.5">
            Hospital Asignado
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
            {selectedInstitution.name}
          </span>
          <span className="text-[11px] text-slate-500 block truncate">
            {selectedInstitution.city}
          </span>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-teal-400 dark:text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Simulator Button for NFC / QR */}
      <div className="pt-2 mb-3">
        <button
          onClick={onOpenNfcScanner}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-600 animate-pulse" />
            <span>Simulador NFC / QR</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
        </button>
      </div>

      {/* User Card & Auth Controls */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
        {isAuthenticated && currentUserProfile ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 mb-2">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                {currentUserProfile.fullName}
              </span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium block truncate">
                {roleLabels[currentUserProfile.role] || currentUserProfile.role}
              </span>
              {currentUserProfile.rh && (
                <span className="text-[10px] font-mono text-slate-500 block">
                  {currentUserProfile.rh}
                </span>
              )}
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-semibold transition-colors mb-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión Hospital</span>
          </button>
        )}

        {/* Footer info & Dark Mode */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1 rounded-lg"
            title="Cambiar tema"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            <span className="text-[11px]">{darkMode ? 'Claro' : 'Oscuro'}</span>
          </button>

          <span className="text-[11px] text-slate-400">
            Con tecnología <strong className="text-slate-600 dark:text-slate-300 font-semibold">BIO-TAG</strong>
          </span>
        </div>
      </div>

    </aside>
  );
};
