import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import { ServiceReportSection } from '../sections/ServiceReportSection';
import { EquipmentLifeSheetSection } from '../sections/EquipmentLifeSheetSection';
import { MaintenanceDatesRhSection } from '../sections/MaintenanceDatesRhSection';
import {
  AlertTriangle,
  Radio,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ClipboardList,
  History,
  Lock,
  Edit,
  PlusCircle,
  Smartphone,
  LogOut,
  User,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

interface DirectMobileScanViewProps {
  onOpenEditEquipment: () => void;
  onOpenNewMaintenance: () => void;
  onOpenReportIncident: () => void;
  onOpenLoginModal?: () => void;
}

export const DirectMobileScanView: React.FC<DirectMobileScanViewProps> = ({
  onOpenEditEquipment,
  onOpenNewMaintenance,
  onOpenReportIncident,
  onOpenLoginModal,
}) => {
  const {
    scannedToken,
    scannedEquipment,
    isTagInvalidOrDeactivated,
    requiresLoginToScan,
    institutions,
    isAuthenticated,
    currentUserProfile,
    isIngeniero,
    getMaintenanceStatus,
    getLatestMaintenance,
    exitDirectScanMode,
  } = useBiomedical();

  const [subTab, setSubTab] = useState<'ultimo_mantenimiento' | 'hoja_de_vida' | 'historial_fechas_rh' | 'reportar_falla'>('ultimo_mantenimiento');

  // Case 1: Tag is invalid or deactivated
  if (isTagInvalidOrDeactivated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border-2 border-red-500 rounded-3xl p-6 sm:p-8 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 mx-auto flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Etiqueta No Disponible
          </h2>

          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-xs sm:text-sm font-medium leading-relaxed">
            Esta etiqueta no está registrada. Contacta al área de ingeniería biomédica.
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Token consultado: <span className="font-bold text-slate-700 dark:text-slate-300">{scannedToken}</span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={exitDirectScanMode}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Ir a la plataforma general
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Hospital policy requires login to view scan
  if (requiresLoginToScan) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Acceso Institucional Restringido
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            La política de este hospital exige iniciar sesión institucional antes de consultar la ficha técnica y trazabilidad de este equipo.
          </p>

          <button
            onClick={onOpenLoginModal}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Iniciar Sesión en el Hospital</span>
          </button>

          <button
            onClick={exitDirectScanMode}
            className="w-full py-2 px-4 rounded-xl text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Volver a la vista general
          </button>
        </div>
      </div>
    );
  }

  if (!scannedEquipment) return null;

  const institution = institutions.find((i) => i.id === scannedEquipment.institutionId);
  const latestMaint = getLatestMaintenance(scannedEquipment.id);
  const nextDate = latestMaint?.proximaFechaCalculada || '';
  const statusInfo = getMaintenanceStatus(nextDate);

  // Engineer verification: Must be an authenticated engineer OF THIS SPECIFIC HOSPITAL
  const isEngineerOfThisHospital =
    isAuthenticated &&
    isIngeniero &&
    currentUserProfile?.institutionId === scannedEquipment.institutionId;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors">
      {/* Mobile Top App Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight truncate">
                {institution?.name}
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-medium block">
                Lectura NFC / QR directa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium truncate max-w-[120px]">
                {currentUserProfile?.fullName.split(' ')[0]} ({currentUserProfile?.role})
              </span>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline"
              >
                Ingreso personal
              </button>
            )}

            <button
              onClick={exitDirectScanMode}
              className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white p-1"
              title="Volver a la vista general del sistema"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* 1. TOP BANNER: Nombre, Marca, Modelo, Serie, Servicio, Estado y AVISO EN ROJO SI VENCIDO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          {/* Overdue Warning Alert */}
          {statusInfo.status === 'vencido' && (
            <div className="bg-red-600 text-white rounded-xl p-3 flex items-center gap-2.5 shadow-md animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                ¡MANTENIMIENTO VENCIDO! — Requiere inspección técnica inmediata
              </div>
            </div>
          )}

          {statusInfo.status === 'proximo' && (
            <div className="bg-amber-500 text-white rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Mantenimiento próximo a vencer en {Math.abs(statusInfo.daysDiff)} días</span>
            </div>
          )}

          {/* Equipment identity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 font-mono block">
                {scannedEquipment.codigoActivo} · RIESGO CLASE {scannedEquipment.clasificacionRiesgo}
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {scannedEquipment.nombre}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {scannedEquipment.marca} — Modelo: {scannedEquipment.modelo}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs">
              <span className="font-mono font-bold text-slate-900 dark:text-white block">
                Serie: {scannedEquipment.serie}
              </span>
              <span className="text-[11px] text-slate-500 block">
                INVIMA: {scannedEquipment.registroInvima}
              </span>
            </div>
          </div>

          {/* Location & Tag Status Bar */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{scannedEquipment.servicioUbicacion}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                NFC: {scannedEquipment.tagToken.slice(0, 18)}...
              </span>
            </div>
          </div>

          {/* Engineer Action Buttons: Appear ONLY if viewer is logged in as Engineer of this Hospital */}
          {isEngineerOfThisHospital && (
            <div className="pt-3 border-t-2 border-teal-500/30 flex flex-wrap items-center gap-2 bg-teal-50/50 dark:bg-teal-950/40 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wide block w-full mb-1">
                Acciones de Ingeniero Autorizado ({currentUserProfile?.rh}):
              </span>

              <button
                onClick={onOpenNewMaintenance}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar Mantenimiento Nuevo</span>
              </button>

              <button
                onClick={onOpenEditEquipment}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Actualizar Hoja de Vida</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. NAVIGATION TABS UNDERNEATH */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-xl text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setSubTab('ultimo_mantenimiento')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${
              subTab === 'ultimo_mantenimiento'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Último Mantenimiento (Reporte)</span>
          </button>

          <button
            onClick={() => setSubTab('hoja_de_vida')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${
              subTab === 'hoja_de_vida'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/50'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>2. Hoja de Vida</span>
          </button>

          <button
            onClick={() => setSubTab('historial_fechas_rh')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${
              subTab === 'historial_fechas_rh'
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>3. Historial (Fecha + RH)</span>
          </button>

          <button
            onClick={() => setSubTab('reportar_falla')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${
              subTab === 'reportar_falla'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>4. Reportar Falla</span>
          </button>
        </div>

        {/* 3. TAB VIEWS */}
        {subTab === 'ultimo_mantenimiento' && (
          <ServiceReportSection onOpenNewMaintenance={onOpenNewMaintenance} />
        )}

        {subTab === 'hoja_de_vida' && (
          <EquipmentLifeSheetSection
            onOpenEditModal={onOpenEditEquipment}
            onOpenNfcQrModal={() => {}}
          />
        )}

        {subTab === 'historial_fechas_rh' && <MaintenanceDatesRhSection />}

        {subTab === 'reportar_falla' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 max-w-xl mx-auto text-xs">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm border-b pb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Reportar Novedad o Falla en el Equipo</span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              El personal de enfermería y operarios clínicos pueden registrar directamente cualquier anomalía, alarma persistente o accesorio en mal estado.
            </p>

            <button
              onClick={onOpenReportIncident}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Diligenciar Reporte de Falla</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
