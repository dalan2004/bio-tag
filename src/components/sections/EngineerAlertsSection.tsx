import React from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  AlertTriangle,
  Clock,
  Mail,
  Wrench,
  CheckCircle2,
  Building,
  Send,
  Calendar,
  ShieldCheck,
  History,
} from 'lucide-react';

interface EngineerAlertsSectionProps {
  onOpenNewMaintenanceFor: (equipmentId: string) => void;
}

export const EngineerAlertsSection: React.FC<EngineerAlertsSectionProps> = ({
  onOpenNewMaintenanceFor,
}) => {
  const {
    getOverdueOrUpcomingEquipments,
    getLatestMaintenance,
    getMaintenanceStatus,
    triggerOverdueEmailAlert,
    emailNotifications,
    selectedInstitution,
    isIngeniero,
  } = useBiomedical();

  const { overdue, upcoming } = getOverdueOrUpcomingEquipments();

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Panel de Control de Alertas Técnicas
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
            Vigilancia de Mantenimientos Preventivos — {selectedInstitution?.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Equipos con periodicidad vencida o próximos a vencer en los siguientes 30 días calendario.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800">
            <span className="text-[10px] font-bold text-red-600 uppercase block">Vencidos</span>
            <span className="text-xl font-bold font-mono text-red-700 dark:text-red-400">{overdue.length}</span>
          </div>

          <div className="text-center px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
            <span className="text-[10px] font-bold text-amber-600 uppercase block">Próximos</span>
            <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">{upcoming.length}</span>
          </div>
        </div>
      </div>

      {/* OVERDUE EQUIPMENT LIST */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>Equipos con Mantenimiento Vencido ({overdue.length})</span>
        </h3>

        {overdue.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span>Excelente. No hay equipos con mantenimiento vencido en este hospital.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overdue.map((eq) => {
              const latest = getLatestMaintenance(eq.id);
              const nextDate = latest?.proximaFechaCalculada || '';
              const statusInfo = getMaintenanceStatus(nextDate);

              return (
                <div
                  key={eq.id}
                  className="bg-white dark:bg-slate-900 border-2 border-red-500/80 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-red-600 uppercase block">
                        {eq.codigoActivo} · RIESGO CLASE {eq.clasificacionRiesgo}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {eq.nombre}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {eq.marca} {eq.modelo} — S/N: <span className="font-mono">{eq.serie}</span>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider shrink-0 animate-pulse">
                      ¡Vencido {Math.abs(statusInfo.daysDiff)}d!
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-red-50/40 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200/50 dark:border-red-800/40">
                    <div className="flex justify-between">
                      <span className="font-semibold">Ubicación:</span>
                      <span>{eq.servicioUbicacion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Frecuencia:</span>
                      <span>Cada {eq.frecuenciaMantenimientoMeses} meses</span>
                    </div>
                    <div className="flex justify-between font-mono font-bold text-red-700 dark:text-red-300">
                      <span>Debió ejecutarse el:</span>
                      <span>{nextDate.split('-').reverse().join('/')}</span>
                    </div>
                  </div>

                  {/* Actions for Engineer */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      onClick={() => triggerOverdueEmailAlert(eq.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                      title="Enviar notificación automática por correo a dirección médica y administración"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Notificar por Correo</span>
                    </button>

                    {isIngeniero && (
                      <button
                        onClick={() => onOpenNewMaintenanceFor(eq.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Diligenciar Reporte MMC</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPCOMING EQUIPMENT LIST (Within 30 Days) */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>Equipos con Mantenimiento Próximo en 30 Días ({upcoming.length})</span>
        </h3>

        {upcoming.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <span>No hay equipos en la ventana de aviso de 30 días.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((eq) => {
              const latest = getLatestMaintenance(eq.id);
              const nextDate = latest?.proximaFechaCalculada || '';
              const statusInfo = getMaintenanceStatus(nextDate);

              return (
                <div
                  key={eq.id}
                  className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-600 uppercase block">
                        {eq.codigoActivo}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {eq.nombre}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {eq.marca} {eq.modelo} — S/N: <span className="font-mono">{eq.serie}</span>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider shrink-0">
                      Vence en {statusInfo.daysDiff} días
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-amber-50/40 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50">
                    <div className="flex justify-between">
                      <span className="font-semibold">Servicio:</span>
                      <span>{eq.servicioUbicacion}</span>
                    </div>
                    <div className="flex justify-between font-mono font-bold text-amber-800 dark:text-amber-300">
                      <span>Programado para:</span>
                      <span>{nextDate.split('-').reverse().join('/')}</span>
                    </div>
                  </div>

                  {isIngeniero && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onOpenNewMaintenanceFor(eq.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Adelantar Mantenimiento</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log of Triggered Email Notifications */}
      {emailNotifications.length > 0 && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Registro de Notificaciones por Correo Emitidas ({emailNotifications.length})</span>
            </h4>
          </div>

          <div className="space-y-2">
            {emailNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-slate-800 dark:text-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-blue-900 dark:text-blue-300">{notif.subject}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{notif.sentAt}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Destinatario: <span className="font-mono text-slate-700 dark:text-slate-300">{notif.recipientEmail}</span> ({notif.recipientRole})
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-1 border-t border-blue-100 dark:border-blue-900">
                  "{notif.body}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
