import React from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Radio,
  Sun,
  Moon,
  Building,
  User,
  Plus,
} from 'lucide-react';

interface MobileTopBarProps {
  onOpenNfcScanner: () => void;
  onOpenLoginModal: () => void;
  onOpenNewEquipment: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  onOpenNfcScanner,
  onOpenLoginModal,
  onOpenNewEquipment,
}) => {
  const {
    companyProfile,
    selectedInstitution,
    currentUserProfile,
    isAuthenticated,
    isIngeniero,
    darkMode,
    toggleDarkMode,
  } = useBiomedical();

  const getCompanyInitials = (nameStr: string) => {
    if (!nameStr.trim()) return 'CM';
    return nameStr
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-xs font-sans">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0 overflow-hidden"
          style={{ backgroundColor: companyProfile.colorPrincipal || '#0f2942' }}
        >
          {companyProfile.logoUrl ? (
            <img src={companyProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            getCompanyInitials(companyProfile.nombre)
          )}
        </div>
        <div className="min-w-0">
          <span className="font-extrabold text-xs uppercase tracking-tight text-slate-900 dark:text-white block truncate">
            {companyProfile.nombre || 'BIO-TAG'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
            {selectedInstitution?.name || 'Sede'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isIngeniero && (
          <button
            onClick={onOpenNewEquipment}
            className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            title="Agregar equipo"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenNfcScanner}
          className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 transition-colors"
          title="Simulador NFC / QR"
        >
          <Radio className="w-4 h-4 animate-pulse" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
        </button>

        {!isAuthenticated && (
          <button
            onClick={onOpenLoginModal}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
};
