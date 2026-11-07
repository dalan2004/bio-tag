import React from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Calendar,
  Award,
  Info,
  FileText,
  Building,
  CheckCircle2,
  Clock,
  PlusCircle,
  Cpu,
} from 'lucide-react';

export const MaintenanceDatesRhSection: React.FC = () => {
  const {
    selectedEquipment,
    equipments,
    getMaintenancesForEquipment,
    institutions,
    setActiveTab,
    isIngeniero,
  } = useBiomedical();

  if (equipments.length === 0 || !selectedEquipment) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs max-w-xl mx-auto my-6 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Aún no hay equipos registrados. Crea el primero.
        </h3>
        <p className="text-[15px] text-slate-500 mb-6">
          Para consultar la trazabilidad cronológica de fechas y tarjetas profesionales (RH), selecciona o agrega un equipo biomédico.
        </p>
        <button
          onClick={() => setActiveTab('todos_los_equipos')}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors"
        >
          Ir al catálogo de equipos
        </button>
      </div>
    );
  }

  const institution = institutions.find((i) => i.id === selectedEquipment.institutionId);
  const records = getMaintenancesForEquipment(selectedEquipment.id);

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans">
      {/* Notice / Regulatory Clarification Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
        <Info className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-blue-950 dark:text-blue-200 text-sm">
            Definición Técnica de RH en Mantenimiento Biomédico
          </h4>
          <p className="text-blue-800 dark:text-blue-300 leading-relaxed text-[13px]">
            En los formatos y auditorías de ingeniería biomédica hospitalaria (conforme a la Resolución 3100 de 2019 y Ley 842 de 2003 en Colombia), 
            el campo <strong>RH</strong> representa el número de <strong>Tarjeta Profesional</strong> del ingeniero o técnico que ejecutó y avaló el mantenimiento técnico, <strong>no a grupo sanguíneo</strong>.
          </p>
        </div>
      </div>

      {/* Equipment Identification Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
            Registro Histórico de Intervenciones
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {selectedEquipment.nombre} · <span className="font-mono text-teal-600 dark:text-teal-400">{selectedEquipment.codigoActivo}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedEquipment.marca} {selectedEquipment.modelo} · Serie: {selectedEquipment.serie} · {selectedEquipment.servicioUbicacion} ({institution?.name})
          </p>
        </div>

        <button
          onClick={() => setActiveTab('ultimo_mantenimiento')}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 self-start sm:self-center"
        >
          <FileText className="w-3.5 h-3.5 text-teal-600" />
          <span>Ver reporte completo</span>
        </button>
      </div>

      {/* Clean 2-Column Table: Fecha del Mantenimiento & RH (Tarjeta Profesional) */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-900 dark:bg-slate-800 text-white font-bold py-3 px-4 text-center text-xs tracking-wider uppercase border-b-2 border-slate-900 dark:border-slate-700">
          TRAZABILIDAD DE MANTENIMIENTO: FECHAS Y TARJETA PROFESIONAL (RH)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b-2 border-slate-900 dark:border-slate-700 text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200">
                <th className="py-3 px-5 border-r border-slate-300 dark:border-slate-700 w-1/2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>Fecha del mantenimiento</span>
                  </div>
                </th>
                <th className="py-3 px-5 w-1/2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>RH (tarjeta profesional)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:border-slate-800 text-sm">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-10 text-center text-slate-500 italic text-[15px]">
                    Este equipo todavía no tiene mantenimientos registrados.
                  </td>
                </tr>
              ) : (
                records.map((rec, index) => (
                  <tr
                    key={rec.id}
                    className={`hover:bg-teal-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                      index === 0 ? 'bg-teal-50/20 dark:bg-teal-950/20' : ''
                    }`}
                  >
                    {/* Column 1: Fecha del mantenimiento */}
                    <td className="py-4 px-5 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[15px]">
                          {rec.fecha.split('-').reverse().join('/')}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-semibold uppercase">
                            Más reciente
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-sans text-slate-500 block mt-0.5 font-normal">
                        Reporte: {rec.numeroReporte} · Tipo: {rec.tipoServicio.toUpperCase()}
                      </span>
                    </td>

                    {/* Column 2: RH (tarjeta profesional) */}
                    <td className="py-4 px-5 font-mono font-bold text-teal-800 dark:text-teal-300 text-[15px]">
                      {rec.rh || 'TP N/A'}
                      <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">
                        {rec.trabajoRealizadoPor} ({rec.cargo})
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrete footer */}
      <div className="text-center pt-2 text-xs text-slate-400">
        Con tecnología <strong className="text-slate-600 dark:text-slate-300">BIO-TAG</strong>
      </div>
    </div>
  );
};
