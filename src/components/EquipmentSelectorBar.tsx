import React from 'react';
import { useBiomedical } from '../context/BiomedicalContext';
import {
  Cpu,
  QrCode,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Building,
  MapPin,
  Tag,
  AlertTriangle,
  Radio,
  ShieldAlert,
} from 'lucide-react';

interface EquipmentSelectorBarProps {
  onOpenNfcQrModal: () => void;
  onOpenNewMaintenanceModal: () => void;
  onOpenReportIncidentModal: () => void;
}

export const EquipmentSelectorBar: React.FC<EquipmentSelectorBarProps> = ({
  onOpenNfcQrModal,
  onOpenNewMaintenanceModal,
  onOpenReportIncidentModal,
}) => {
  const {
    equipments,
    activeEquipmentId,
    setActiveEquipmentId,
    selectedEquipment,
    institutions,
    currentUserProfile,
    getMaintenanceStatus,
    getLatestMaintenance,
    isIngeniero,
    isEnfermeria,
  } = useBiomedical();

  // Filter equipment based on user's hospital
  const userHospitalId = currentUserProfile?.institutionId;
  const filteredEquipments = equipments.filter((eq) => {
    if (!userHospitalId) return true;
    return eq.institutionId === userHospitalId;
  });

  if (!selectedEquipment || filteredEquipments.length === 0) {
    return null;
  }

  const latestMaint = getLatestMaintenance(selectedEquipment.id);
  const nextDate = latestMaint?.proximaFechaCalculada || '';
  const statusInfo = getMaintenanceStatus(nextDate);
  const institution = institutions.find((i) => i.id === selectedEquipment.institutionId);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors mb-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Selector Dropdown & Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Equipo Biomédico Activo — {institution?.name}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <select
                value={activeEquipmentId}
                onChange={(e) => setActiveEquipmentId(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer truncate"
              >
                {filteredEquipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.codigoActivo} · {eq.nombre} — {eq.marca} ({eq.serie})
                  </option>
                ))}
              </select>
            </div>

            {/* Serial & Tag Token pills */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                S/N: {selectedEquipment.serie}
              </span>

              <span
                className={`px-2.5 py-1 rounded-md font-mono flex items-center gap-1 border ${
                  selectedEquipment.tagActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                    : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>
                  Token: {selectedEquipment.tagToken.slice(0, 16)}...
                  {!selectedEquipment.tagActive && ' (DESACTIVADA)'}
                </span>
              </span>
            </div>
          </div>

          {/* Location & Status Bar */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{institution?.name}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{selectedEquipment.servicioUbicacion}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Próximo mant.:</span>
              {nextDate ? (
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    statusInfo.status === 'vencido'
                      ? 'text-red-600 dark:text-red-400 font-bold'
                      : statusInfo.status === 'proximo'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {statusInfo.status === 'vencido' ? (
                    <AlertCircle className="w-3.5 h-3.5 inline" />
                  ) : statusInfo.status === 'proximo' ? (
                    <Clock className="w-3.5 h-3.5 inline" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 inline" />
                  )}
                  {nextDate.split('-').reverse().join('/')} ({statusInfo.label})
                </span>
              ) : (
                <span className="italic text-slate-400">Sin programar</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
          <button
            onClick={onOpenNfcQrModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
            title="Ver o Vincular Etiqueta NFC / QR"
          >
            <QrCode className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{isIngeniero ? 'Vincular / Ver Etiqueta' : 'Ver Etiqueta'}</span>
          </button>

          {isIngeniero && (
            <button
              onClick={onOpenNewMaintenanceModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Mantenimiento</span>
            </button>
          )}

          {isEnfermeria && (
            <button
              onClick={onOpenReportIncidentModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs whitespace-nowrap"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Reportar Falla</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
