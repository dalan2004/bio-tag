import React, { useState, useMemo } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import { BiomedicalEquipment } from '../../types/biomedical';
import {
  Search,
  Filter,
  Plus,
  QrCode,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building,
  Download,
  Tag,
  ArrowRight,
  Cpu,
} from 'lucide-react';

interface AllEquipmentSectionProps {
  onOpenNewEquipment: () => void;
  onOpenNfcQrModal: (eq: BiomedicalEquipment) => void;
}

export const AllEquipmentSection: React.FC<AllEquipmentSectionProps> = ({
  onOpenNewEquipment,
  onOpenNfcQrModal,
}) => {
  const {
    equipments,
    setActiveEquipmentId,
    setActiveTab,
    institutions,
    currentUserProfile,
    isIngeniero,
    getLatestMaintenance,
    getMaintenanceStatus,
  } = useBiomedical();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'vencido' | 'proximo' | 'al_dia'>('all');

  const userHospitalId = currentUserProfile?.institutionId;

  // Filtered equipment list — Each user only sees their own hospital's equipment
  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      if (userHospitalId && eq.institutionId !== userHospitalId) {
        return false;
      }

      const latest = getLatestMaintenance(eq.id);
      const nextDate = latest?.proximaFechaCalculada || '';
      const statusInfo = getMaintenanceStatus(nextDate);

      if (statusFilter !== 'all' && statusInfo.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inst = institutions.find((i) => i.id === eq.institutionId);
        const match =
          eq.nombre.toLowerCase().includes(q) ||
          eq.marca.toLowerCase().includes(q) ||
          eq.modelo.toLowerCase().includes(q) ||
          eq.serie.toLowerCase().includes(q) ||
          eq.codigoActivo.toLowerCase().includes(q) ||
          eq.servicioUbicacion.toLowerCase().includes(q) ||
          (inst?.name.toLowerCase().includes(q) ?? false) ||
          (inst?.city.toLowerCase().includes(q) ?? false) ||
          eq.tagToken.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    equipments,
    userHospitalId,
    searchQuery,
    statusFilter,
    institutions,
    getLatestMaintenance,
    getMaintenanceStatus,
  ]);

  // Overall metric counts
  const stats = useMemo(() => {
    let vencidos = 0;
    let proximos = 0;
    let alDia = 0;

    const baseList = userHospitalId
      ? equipments.filter((e) => e.institutionId === userHospitalId)
      : equipments;

    baseList.forEach((eq) => {
      const latest = getLatestMaintenance(eq.id);
      const nextDate = latest?.proximaFechaCalculada || '';
      const st = getMaintenanceStatus(nextDate);
      if (st.status === 'vencido') vencidos++;
      else if (st.status === 'proximo') proximos++;
      else alDia++;
    });

    return { total: baseList.length, vencidos, proximos, alDia };
  }, [equipments, userHospitalId, getLatestMaintenance, getMaintenanceStatus]);

  const handleSelectRow = (equipmentId: string, targetTab: 'hoja_de_vida' | 'ultimo_mantenimiento' = 'hoja_de_vida') => {
    setActiveEquipmentId(equipmentId);
    setActiveTab(targetTab);
  };

  const handleExportCsv = () => {
    if (filteredEquipments.length === 0) return;
    const csvCell = (value: unknown) => {
      const raw = String(value ?? '');
      // Prevent spreadsheet formula execution when a CSV is opened in Excel.
      const neutralized = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
      return `"${neutralized.replace(/"/g, '""')}"`;
    };
    const headers = [
      'Código Activo',
      'Nombre',
      'Marca',
      'Modelo',
      'Serie',
      'Ubicación',
      'Hospital',
      'Frecuencia (Meses)',
      'Último Mantenimiento',
      'Próximo Mantenimiento',
    ];

    const rows = filteredEquipments.map((eq) => {
      const inst = institutions.find((i) => i.id === eq.institutionId);
      const latest = getLatestMaintenance(eq.id);
      return [
        csvCell(eq.codigoActivo),
        csvCell(eq.nombre),
        csvCell(eq.marca),
        csvCell(eq.modelo),
        csvCell(eq.serie),
        csvCell(eq.servicioUbicacion),
        csvCell(inst?.name || ''),
        csvCell(eq.frecuenciaMantenimientoMeses),
        csvCell(latest?.fecha || 'Sin registro'),
        csvCell(latest?.proximaFechaCalculada || 'Sin programar'),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(csvCell).join(','), ...rows].join('\n');
    const objectUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.setAttribute('href', objectUrl);
    link.setAttribute('download', `inventario_biomedico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  const hospitalTotalEquipments = userHospitalId
    ? equipments.filter((e) => e.institutionId === userHospitalId).length
    : equipments.length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Inventario y Catálogo de Equipos
          </h2>
          <p className="text-[15px] text-slate-500 mt-1">
            Gestión y trazabilidad de los equipos biomédicos asignados a tu institución.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, serie..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            disabled={filteredEquipments.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50"
            title="Exportar inventario a archivo CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* New equipment button */}
          {isIngeniero && (
            <button
              onClick={onOpenNewEquipment}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Equipo</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric badges / Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          }`}
        >
          <span>Todos ({stats.total})</span>
        </button>

        <button
          onClick={() => setStatusFilter('vencido')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'vencido'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Vencidos ({stats.vencidos})</span>
        </button>

        <button
          onClick={() => setStatusFilter('proximo')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'proximo'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Próximos 30d ({stats.proximos})</span>
        </button>

        <button
          onClick={() => setStatusFilter('al_dia')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'al_dia'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Al día ({stats.alDia})</span>
        </button>
      </div>

      {/* Main Table View OR Empty State */}
      {hospitalTotalEquipments === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
            <Cpu className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Aún no hay equipos registrados. Crea el primero.
          </h3>
          <p className="text-[15px] text-slate-500 max-w-md mx-auto mb-6">
            Registra los monitores, desfibriladores y demás equipos para llevar el control de mantenimientos y trazabilidad con etiquetas NFC.
          </p>
          {isIngeniero ? (
            <button
              onClick={onOpenNewEquipment}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[15px] inline-flex items-center gap-2 transition-colors shadow-xs"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar equipo</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Inicia sesión como Ingeniero Biomédico para registrar equipos.
            </p>
          )}
        </div>
      ) : filteredEquipments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
          <p className="text-[15px] text-slate-500 mb-3">
            No se encontraron equipos con el filtro o término de búsqueda "{searchQuery}".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Equipo</th>
                  <th className="py-3 px-4">Marca / Modelo</th>
                  <th className="py-3 px-4">Serie</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4">Último Mantenimiento</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredEquipments.map((eq) => {
                  const inst = institutions.find((i) => i.id === eq.institutionId);
                  const latest = getLatestMaintenance(eq.id);
                  const nextDate = latest?.proximaFechaCalculada || '';
                  const statusInfo = getMaintenanceStatus(nextDate);

                  return (
                    <tr
                      key={eq.id}
                      onClick={() => handleSelectRow(eq.id, 'hoja_de_vida')}
                      className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Código Activo */}
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800 dark:text-teal-400 whitespace-nowrap">
                        {eq.codigoActivo}
                      </td>

                      {/* Equipo */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-[200px]">
                        <span className="block truncate">{eq.nombre}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Riesgo {eq.clasificacionRiesgo} · {eq.movilidad === 'movil' ? 'Móvil' : 'Fijo'}
                        </span>
                      </td>

                      {/* Marca / Modelo */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="font-medium">{eq.marca}</span>
                        <span className="text-slate-400 text-[11px] block">{eq.modelo}</span>
                      </td>

                      {/* Serie */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {eq.serie}
                      </td>

                      {/* Servicio y Hospital */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {eq.servicioUbicacion}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{inst?.name}</span>
                        </div>
                      </td>

                      {/* Último Mantenimiento */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        {latest ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {latest.fecha.split('-').reverse().join('/')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {latest.numeroReporte}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin registros</span>
                        )}
                      </td>

                      {/* Estado con Color y Texto explícito */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {statusInfo.status === 'vencido' ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                            Vencido ({Math.abs(statusInfo.daysDiff)}d)
                          </span>
                        ) : statusInfo.status === 'proximo' ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Próximo ({statusInfo.daysDiff}d)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Operativo al día
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenNfcQrModal(eq)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Ver token y código QR"
                          >
                            <QrCode className="w-4 h-4 text-teal-600" />
                          </button>
                          <button
                            onClick={() => handleSelectRow(eq.id, 'ultimo_mantenimiento')}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Ver Reporte de Mantenimiento"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
