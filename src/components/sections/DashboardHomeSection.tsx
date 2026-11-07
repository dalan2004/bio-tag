import React, { useMemo } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Cpu,
  AlertTriangle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  Radio,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { BiomedicalEquipment } from '../../types/biomedical';

interface DashboardHomeSectionProps {
  onOpenNewEquipment: () => void;
  onOpenNewMaintenance: (eqId?: string) => void;
  onOpenReportIncident: () => void;
  onOpenNfcScanner: () => void;
}

export const DashboardHomeSection: React.FC<DashboardHomeSectionProps> = ({
  onOpenNewEquipment,
  onOpenNewMaintenance,
  onOpenReportIncident,
  onOpenNfcScanner,
}) => {
  const {
    equipments,
    maintenances,
    incidents,
    institutions,
    selectedInstitution,
    currentUserProfile,
    isIngeniero,
    setActiveEquipmentId,
    setActiveTab,
    getLatestMaintenance,
    getMaintenanceStatus,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = useBiomedical();

  const userHospitalId = currentUserProfile?.institutionId;

  // Filter equipment strictly by active hospital
  const hospitalEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      if (!userHospitalId) return true;
      return eq.institutionId === userHospitalId;
    });
  }, [equipments, userHospitalId]);

  // Overall metric counts & urgent items
  const { stats, attentionEquipments } = useMemo(() => {
    let vencidos = 0;
    let proximos = 0;
    let operativos = 0;
    const attentionList: { eq: BiomedicalEquipment; status: 'vencido' | 'proximo'; days: number; nextDate: string }[] = [];

    hospitalEquipments.forEach((eq) => {
      const latest = getLatestMaintenance(eq.id);
      const nextDate = latest?.proximaFechaCalculada || '';
      const st = getMaintenanceStatus(nextDate);

      if (st.status === 'vencido') {
        vencidos++;
        attentionList.push({ eq, status: 'vencido', days: Math.abs(st.daysDiff), nextDate });
      } else if (st.status === 'proximo') {
        proximos++;
        attentionList.push({ eq, status: 'proximo', days: st.daysDiff, nextDate });
      } else {
        operativos++;
      }
    });

    const openIncidents = incidents.filter(
      (inc) => inc.institutionId === userHospitalId && inc.estado === 'pendiente'
    ).length;

    return {
      stats: {
        total: hospitalEquipments.length,
        vencidos,
        proximos,
        operativos,
        fallasAbiertas: openIncidents,
      },
      attentionEquipments: attentionList.sort((a, b) => {
        if (a.status === 'vencido' && b.status !== 'vencido') return -1;
        if (b.status === 'vencido' && a.status !== 'vencido') return 1;
        return a.days - b.days;
      }),
    };
  }, [hospitalEquipments, incidents, userHospitalId, getLatestMaintenance, getMaintenanceStatus]);

  // Global search match
  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return hospitalEquipments.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.serie.toLowerCase().includes(q) ||
        e.marca.toLowerCase().includes(q) ||
        e.modelo.toLowerCase().includes(q) ||
        e.codigoActivo.toLowerCase().includes(q) ||
        e.servicioUbicacion.toLowerCase().includes(q)
    );
  }, [hospitalEquipments, globalSearchQuery]);

  const handleSelectEquipment = (eqId: string, tab: 'ultimo_mantenimiento' | 'hoja_de_vida' = 'ultimo_mantenimiento') => {
    setActiveEquipmentId(eqId);
    setActiveTab(tab);
    setGlobalSearchQuery('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Panel de Inicio y Control Biomédico
          </h2>
          <p className="text-[15px] text-slate-500 mt-1">
            {selectedInstitution?.name || 'BIO-TAG'} · {selectedInstitution?.city || 'Sede'} — Vista general del parque biomédico.
          </p>
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            placeholder="Buscar por serie, código, marca o nombre..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>
      </div>

      {/* Global Search Popup Results */}
      {globalSearchQuery.trim().length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resultados de Búsqueda ({searchResults.length})
            </span>
            <button
              onClick={() => setGlobalSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cerrar
            </button>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-[15px] text-slate-500 py-4 text-center">
              No se encontraron equipos que coincidan con "{globalSearchQuery}".
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.map((eq) => (
                <div
                  key={eq.id}
                  onClick={() => handleSelectEquipment(eq.id)}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-[15px] font-bold text-slate-900 dark:text-white block truncate">
                      {eq.nombre} — <span className="font-mono text-teal-600 dark:text-teal-400">{eq.codigoActivo}</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      Serie: {eq.serie} · Marca: {eq.marca} {eq.modelo} · Ubicación: {eq.servicioUbicacion}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE: When no equipments exist */}
      {hospitalEquipments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
            <Cpu className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Aún no hay equipos registrados. Crea el primero.
          </h3>
          <p className="text-[15px] text-slate-500 max-w-md mx-auto mt-2 mb-6">
            Comienza vinculando los equipos biomédicos de {selectedInstitution?.name || 'tu hospital'}. Podrás emitir etiquetas NFC/QR, registrar reportes técnicos y gestionar sus hojas de vida.
          </p>
          {isIngeniero ? (
            <button
              onClick={onOpenNewEquipment}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[15px] inline-flex items-center gap-2 transition-colors shadow-sm shadow-teal-700/20"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar equipo</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Inicia sesión como Ingeniero Biomédico para registrar equipos en este hospital.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Summary Metric Cards (Anti-identical design: prominent emphasis on overdue) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Equipments */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Equipos</span>
                <Cpu className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.total}
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                {stats.operativos} Operativos al día
              </span>
            </div>

            {/* Mantenimientos Vencidos — MAXIMUM PROMINENCE & ACTIONABLE */}
            <div className={`rounded-2xl p-5 shadow-sm transition-all border-2 ${
              stats.vencidos > 0
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  stats.vencidos > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500'
                }`}>
                  Mantenimientos Vencidos
                </span>
                <AlertTriangle className={`w-5 h-5 ${
                  stats.vencidos > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'
                }`} />
              </div>
              <div className={`text-3xl font-extrabold ${
                stats.vencidos > 0 ? 'text-rose-700 dark:text-rose-200' : 'text-slate-900 dark:text-white'
              }`}>
                {stats.vencidos}
              </div>
              <span className={`text-xs font-semibold mt-1 block ${
                stats.vencidos > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-400'
              }`}>
                {stats.vencidos > 0 ? 'Requieren intervención inmediata' : 'Ningún equipo vencido'}
              </span>
            </div>

            {/* Próximos a Vencer (30 días) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Próximos (30 días)</span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.proximos}
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
                Agendar mantenimiento preventivo
              </span>
            </div>

            {/* Fallas Abiertas (Enfermería) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Fallas Abiertas</span>
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.fallasAbiertas}
              </div>
              <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1 block">
                Reportes clínicos en espera
              </span>
            </div>

          </div>

          {/* Actionable Section: Equipos que requieren atención */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Equipos que Requieren Atención Prioritaria
                </h3>
                <p className="text-xs text-slate-500">
                  Equipos con fechas de mantenimiento vencidas o en ventana de vencimiento de 30 días.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('todos_los_equipos')}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <span>Ver todos los equipos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {attentionEquipments.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  ¡Excelente! Todos los equipos están al día.
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  No hay mantenimientos vencidos ni pendientes en los próximos 30 días.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attentionEquipments.map(({ eq, status, days, nextDate }) => (
                  <div
                    key={eq.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[15px] text-slate-900 dark:text-white truncate">
                          {eq.nombre}
                        </span>
                        <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                          {eq.codigoActivo}
                        </span>
                        {/* Status with Color and Text */}
                        {status === 'vencido' ? (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                            Vencido ({days}d)
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Próximo ({days}d)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Marca: {eq.marca} {eq.modelo}</span>
                        <span>Serie: {eq.serie}</span>
                        <span>Ubicación: {eq.servicioUbicacion}</span>
                        <span>Fecha límite: {nextDate ? nextDate.split('-').reverse().join('/') : 'Sin fecha'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleSelectEquipment(eq.id, 'ultimo_mantenimiento')}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Ver Reporte
                      </button>
                      {isIngeniero && (
                        <button
                          onClick={() => {
                            setActiveEquipmentId(eq.id);
                            onOpenNewMaintenance(eq.id);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs"
                        >
                          Registrar Mantenimiento
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
