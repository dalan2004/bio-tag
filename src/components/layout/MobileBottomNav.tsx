import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Home,
  FileText,
  FileCheck2,
  Cpu,
  MoreHorizontal,
  CalendarDays,
  Settings,
  Bell,
  Radio,
  LogOut,
  LogIn,
  Sun,
  Moon,
  X,
  Building,
  KeyRound,
} from 'lucide-react';
import { ActiveTab } from '../../types/biomedical';

interface MobileBottomNavProps {
  onOpenLoginModal?: () => void;
  onOpenNfcScanner: () => void;
  onOpenChangePassword?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenLoginModal,
  onOpenNfcScanner,
  onOpenChangePassword,
}) => {
  const {
    activeTab,
    setActiveTab,
    currentUserProfile,
    selectedInstitution,
    isAuthenticated,
    darkMode,
    toggleDarkMode,
    logout,
    companyProfile,
  } = useBiomedical();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* "Más" Sheet/Drawer on Mobile */}
      {isMoreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  Más Opciones
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedInstitution?.name || 'BIO-TAG'}
                </span>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Additional Navigation Links */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleSelectTab('fechas_rh')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                  activeTab === 'fechas_rh'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CalendarDays className="w-5 h-5 text-teal-600" />
                <span>Fechas y RH</span>
              </button>

              <button
                onClick={() => handleSelectTab('alertas_ingenieria')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                  activeTab === 'alertas_ingenieria'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Bell className="w-5 h-5 text-amber-600" />
                <span>Alertas Técnicas</span>
              </button>

              <button
                onClick={() => handleSelectTab('configuracion')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                  activeTab === 'configuracion'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span>Configuración</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenNfcScanner();
                }}
                className="p-3 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 flex flex-col items-center gap-1.5"
              >
                <Radio className="w-5 h-5 text-teal-600 animate-pulse" />
                <span>Simulador NFC / QR</span>
              </button>
            </div>

            {/* Quick Auth Info & Controls */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {onOpenChangePassword && (
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenChangePassword();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-teal-600 dark:text-teal-400 font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Cambiar clave</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              ) : (
                onOpenLoginModal && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenLoginModal();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl font-semibold"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar sesión</span>
                  </button>
                )
              )}
            </div>

            <div className="text-center pt-2 text-[11px] text-slate-400">
              Con tecnología <span className="font-semibold text-slate-600 dark:text-slate-300">BIO-TAG</span>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar on Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors min-w-[56px] ${
            activeTab === 'inicio'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab('ultimo_mantenimiento')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors min-w-[56px] ${
            activeTab === 'ultimo_mantenimiento'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Reporte</span>
        </button>

        <button
          onClick={() => setActiveTab('hoja_de_vida')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors min-w-[56px] ${
            activeTab === 'hoja_de_vida'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Ficha</span>
        </button>

        <button
          onClick={() => setActiveTab('todos_los_equipos')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors min-w-[56px] ${
            activeTab === 'todos_los_equipos'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Equipos</span>
        </button>

        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className="flex flex-col items-center py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-w-[56px]"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Más</span>
        </button>
      </div>
    </>
  );
};
