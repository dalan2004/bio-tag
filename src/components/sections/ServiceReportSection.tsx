import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import { MaintenanceRecord } from '../../types/biomedical';
import {
  Printer,
  Calendar,
  History,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  PlusCircle,
  BadgeAlert,
  MapPin,
  Mail,
  Phone,
  Download,
  AlertTriangle,
  Building2,
  Cpu,
} from 'lucide-react';

interface ServiceReportSectionProps {
  onOpenNewMaintenance: () => void;
  onOpenNewEquipment?: () => void;
}

export const ServiceReportSection: React.FC<ServiceReportSectionProps> = ({
  onOpenNewMaintenance,
  onOpenNewEquipment,
}) => {
  const {
    companyProfile,
    selectedEquipment,
    equipments,
    getMaintenancesForEquipment,
    getMaintenanceStatus,
    institutions,
    isIngeniero,
    setActiveTab,
  } = useBiomedical();

  const maintenances = selectedEquipment
    ? getMaintenancesForEquipment(selectedEquipment.id)
    : [];

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const activeRecord: MaintenanceRecord | undefined =
    maintenances.find((m) => m.id === selectedRecordId) || maintenances[0];

  const getCompanyInitials = (nameStr: string) => {
    if (!nameStr.trim()) return 'CM';
    return nameStr
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  // EMPTY STATE 1: No equipments registered at all
  if (equipments.length === 0 || !selectedEquipment) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs max-w-2xl mx-auto my-6 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Aún no hay equipos registrados. Crea el primero.
        </h3>
        <p className="text-[15px] text-slate-500 mb-6 max-w-md mx-auto">
          Para emitir y consultar reportes técnicos de servicio, primero debes registrar un equipo biomédico en el sistema.
        </p>
        {isIngeniero && onOpenNewEquipment ? (
          <button
            onClick={onOpenNewEquipment}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[15px] inline-flex items-center gap-2 transition-colors shadow-xs"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Agregar equipo</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('configuracion')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Ir a Configuración
          </button>
        )}
      </div>
    );
  }

  const institution = institutions.find((i) => i.id === selectedEquipment.institutionId);

  // Parse date into day, month, year
  let dia = '--';
  let mes = '--';
  let anio = '----';
  if (activeRecord?.fecha) {
    const parts = activeRecord.fecha.split('-');
    if (parts.length === 3) {
      anio = parts[0];
      mes = parts[1];
      dia = parts[2];
    }
  }

  const nextDate = activeRecord?.proximaFechaCalculada || '';
  const statusInfo = getMaintenanceStatus(nextDate);
  const colorTheme = companyProfile.colorPrincipal || '#0f2942';
  const hasCompanyData = Boolean(companyProfile.nombre.trim());

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top action toolbar (Hidden when printing PDF) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Historial de reportes:
          </label>
          {maintenances.length > 0 ? (
            <select
              value={activeRecord?.id || ''}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {maintenances.map((m, idx) => (
                <option key={m.id} value={m.id}>
                  {m.numeroReporte} · {m.fecha.split('-').reverse().join('/')} ({m.tipoServicio.toUpperCase()}) {idx === 0 ? '— [Más Reciente]' : ''}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400 italic">Sin reportes registrados</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isIngeniero && (
            <button
              onClick={onOpenNewMaintenance}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar mantenimiento</span>
            </button>
          )}

          {activeRecord && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors shadow-xs"
              title="Descargar reporte oficial en formato PDF"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning if company branding has not been completed */}
      {!hasCompanyData && (
        <div className="no-print p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Completa los datos de tu empresa en Configuración para que aparezcan en tus reportes.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('configuracion')}
            className="px-3 py-1.5 rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-white font-semibold shrink-0 hover:bg-amber-300 transition-colors"
          >
            Ir a Configuración
          </button>
        </div>
      )}

      {/* EMPTY STATE 2: Equipment has no maintenance records yet */}
      {!activeRecord ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto my-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-center mx-auto mb-3 text-amber-600">
            <BadgeAlert className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            Este equipo todavía no tiene mantenimientos.
          </h3>
          <p className="text-[15px] text-slate-500 mb-6">
            Diligencia el primer reporte de servicio técnico para este equipo biomédico ({selectedEquipment.nombre} — {selectedEquipment.codigoActivo}).
          </p>
          {isIngeniero ? (
            <button
              onClick={onOpenNewMaintenance}
              className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar mantenimiento</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 italic">
              Se requiere rol de Ingeniero Biomédico para registrar mantenimientos.
            </span>
          )}
        </div>
      ) : (
        /* OFFICIAL PHYSICAL SERVICE REPORT FORMAT (White Label) */
        <div className="print-sheet bg-[#FCFDFF] dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border-2 rounded-2xl p-5 sm:p-7 shadow-lg max-w-4xl mx-auto transition-colors font-sans relative" style={{ borderColor: colorTheme }}>
          
          {/* HEADER BLOCK (Dynamic White Label Design) */}
          <div className="pb-3 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              
              {/* Left: Logo + Name in UPPERCASE + Slogan in blue italic + NIT in monospace */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-sm shrink-0 overflow-hidden"
                  style={{ backgroundColor: colorTheme }}
                >
                  {companyProfile.logoUrl ? (
                    <img src={companyProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    getCompanyInitials(companyProfile.nombre)
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950 dark:text-white leading-tight">
                    {companyProfile.nombre.trim() ? (
                      companyProfile.nombre.toUpperCase()
                    ) : (
                      <span className="text-slate-400 font-normal">Nombre de la empresa</span>
                    )}
                  </h1>

                  {companyProfile.eslogan && (
                    <p className="text-xs font-bold italic text-blue-600 dark:text-blue-400 tracking-wide mt-0.5">
                      {companyProfile.eslogan}
                    </p>
                  )}

                  <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    NIT: {companyProfile.nit.trim() ? (
                      companyProfile.nit
                    ) : (
                      <span className="text-slate-400">NIT</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Right: Title + No. in red + Date Box */}
              <div className="sm:text-right w-full sm:w-auto shrink-0">
                <span className="text-xs font-extrabold tracking-wider uppercase block" style={{ color: colorTheme }}>
                  REPORTE SERVICIO TÉCNICO
                </span>
                <span className="text-xl sm:text-2xl font-mono font-black text-red-600 dark:text-red-500 block">
                  {activeRecord.numeroReporte}
                </span>

                {/* Date Grid Box */}
                <div className="inline-block mt-1 border-2 rounded overflow-hidden text-center text-xs" style={{ borderColor: colorTheme }}>
                  <div className="text-white font-bold text-[10px] uppercase py-0.5 px-3" style={{ backgroundColor: colorTheme }}>
                    FECHA
                  </div>
                  <div className="grid grid-cols-3 divide-x font-mono font-bold text-xs" style={{ borderColor: colorTheme }}>
                    <div className="px-2 py-0.5">
                      <span className="text-[8px] block text-slate-500 dark:text-slate-400">DÍA</span>
                      {dia}
                    </div>
                    <div className="px-2 py-0.5">
                      <span className="text-[8px] block text-slate-500 dark:text-slate-400">MES</span>
                      {mes}
                    </div>
                    <div className="px-2 py-0.5">
                      <span className="text-[8px] block text-slate-500 dark:text-slate-400">AÑO</span>
                      {anio}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-bar: Address, Email, Phone with small icons */}
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-y-1 border-t border-slate-200 dark:border-slate-800 pt-2 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {companyProfile.direccion || companyProfile.ciudad
                  ? `${companyProfile.direccion} ${companyProfile.ciudad}`
                  : 'Dirección y Ciudad'}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {companyProfile.correo || 'correo@contacto.com'}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {companyProfile.telefonos || 'Teléfonos'}
              </span>
            </div>

            {/* Line in Company's Primary Color separating Header from Content */}
            <div className="mt-2.5 h-1 rounded-full w-full" style={{ backgroundColor: colorTheme }} />
          </div>

          {/* Section: Datos del Cliente y Equipo */}
          <div className="border rounded-xl p-3 mb-4 bg-slate-50/50 dark:bg-slate-800/40 text-xs" style={{ borderColor: `${colorTheme}40` }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-baseline border-b border-dashed border-slate-300 dark:border-slate-700 pb-1">
                <span className="font-bold w-24 shrink-0" style={{ color: colorTheme }}>Cliente:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeRecord.cliente || institution?.name}</span>
              </div>
              <div className="flex items-baseline border-b border-dashed border-slate-300 dark:border-slate-700 pb-1">
                <span className="font-bold w-28 shrink-0" style={{ color: colorTheme }}>Ciudad / Dpto.:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{activeRecord.ciudadDpto || `${institution?.city || ''} / ${institution?.department || ''}`}</span>
              </div>
              <div className="flex items-baseline border-b border-dashed border-slate-300 dark:border-slate-700 pb-1">
                <span className="font-bold w-24 shrink-0" style={{ color: colorTheme }}>Equipo:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">{selectedEquipment.nombre}</span>
              </div>
              <div className="flex items-baseline border-b border-dashed border-slate-300 dark:border-slate-700 pb-1">
                <span className="font-bold w-28 shrink-0" style={{ color: colorTheme }}>Marca / Modelo:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedEquipment.marca} / {selectedEquipment.modelo}</span>
              </div>
              <div className="flex items-baseline border-b border-dashed border-slate-300 dark:border-slate-700 pb-1">
                <span className="font-bold w-24 shrink-0" style={{ color: colorTheme }}>Serie / Lote:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedEquipment.serie}</span>
              </div>
              <div className="flex items-baseline border-b border-dashed border-slate-300 dark:border-slate-700 pb-1">
                <span className="font-bold w-28 shrink-0" style={{ color: colorTheme }}>Servicio / Ubicación:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEquipment.servicioUbicacion}</span>
              </div>
            </div>
          </div>

          {/* Section: Tipo de Servicio */}
          <div className="mb-4 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: colorTheme }}>
              Tipo de Servicio Realizado:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {[
                { id: 'preventivo', label: 'Preventivo' },
                { id: 'correctivo', label: 'Correctivo' },
                { id: 'garantia', label: 'Garantía' },
                { id: 'capacitacion', label: 'Capacitación' },
                { id: 'otro', label: activeRecord.tipoServicioOtro ? `Otro: ${activeRecord.tipoServicioOtro}` : 'Otro' },
              ].map((s) => {
                const checked = activeRecord.tipoServicio === s.id;
                return (
                  <div key={s.id} className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`w-4 h-4 border border-slate-800 dark:border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 ${
                        checked ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-transparent'
                      }`}
                    >
                      {checked ? 'X' : ''}
                    </div>
                    <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Inspección Inicial del Equipo & Accesorios */}
          <div className="mb-4 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: colorTheme }}>
              Inspección Inicial del Equipo y Accesorios:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Equipo general */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Estado Físico del Equipo</span>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
                  {[
                    { id: 'buen_estado', label: 'Buen estado' },
                    { id: 'regular_estado', label: 'Regular estado' },
                    { id: 'mal_estado', label: 'Mal estado' },
                    { id: 'deterioro_fisico', label: 'Deterioro físico' },
                    { id: 'mal_funcionamiento', label: 'Mal funcionamiento' },
                    { id: 'fuera_de_servicio', label: 'Fuera de servicio' },
                  ].map((e) => {
                    const checked = activeRecord.inspeccionInicial?.estado === e.id;
                    return (
                      <div key={e.id} className="flex items-center gap-1.5">
                        <div
                          className={`w-3.5 h-3.5 border border-slate-800 dark:border-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            checked ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-transparent'
                          }`}
                        >
                          {checked ? 'X' : ''}
                        </div>
                        <span className="truncate">{e.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Accesorios */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Estado de los Accesorios</span>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  {[
                    { id: 'buen_estado', label: 'Buen estado' },
                    { id: 'regular_estado', label: 'Regular estado' },
                    { id: 'mal_estado', label: 'Mal estado' },
                  ].map((a) => {
                    const checked = activeRecord.inspeccionInicial?.accesorios === a.id;
                    return (
                      <div key={a.id} className="flex items-center gap-1.5">
                        <div
                          className={`w-3.5 h-3.5 border border-slate-800 dark:border-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            checked ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-transparent'
                          }`}
                        >
                          {checked ? 'X' : ''}
                        </div>
                        <span className="truncate">{a.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Protocolo de Mantenimiento (13 Casillas Marcables) */}
          <div className="mb-4 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: colorTheme }}>
              Protocolo de Mantenimiento Técnico (13 Pasos Normativos):
            </span>
            <div className="bg-white dark:bg-slate-800 border rounded-xl divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden" style={{ borderColor: `${colorTheme}40` }}>
              {[
                { k: 'p1_ubicacionDesconexion', num: '1', text: 'Ubicación y desconexión de cables, conectores y/o módulos' },
                { k: 'p2_verificacionElectrico', num: '2', text: 'Verificación del sistema eléctrico (Batería, fuente de voltaje, adaptador, switch On/Off, otros)' },
                { k: 'p3_verificacionElectronico', num: '3', text: 'Verificación del sistema electrónico (Plataformas conductivas, componentes, conectores, otros)' },
                { k: 'p4_verificacionNeumatico', num: '4', text: 'Verificación del sistema neumático (Válvulas, mangueras, tanques, otros)' },
                { k: 'p5_verificacionMecanico', num: '5', text: 'Verificación del sistema mecánico (Ruedas, soportes, barandas, otros)' },
                { k: 'p6_verificacionHidraulico', num: '6', text: 'Verificación del sistema hidráulico (Gatos, piñones, otros)' },
                { k: 'p7_lubricacionPartes', num: '7', text: 'Lubricación de partes y/o accesorios mecánicos e hidráulicos' },
                { k: 'p8_limpiezaPistas', num: '8', text: 'Limpieza de pistas conductivas, componentes electrónicos y conectores' },
                { k: 'p9_limpiezaElectrico', num: '9', text: 'Limpieza de partes y/o accesorios eléctricos' },
                { k: 'p10_montajeTarjetas', num: '10', text: 'Montaje de tarjetas, partes, módulos y conexiones eléctricas' },
                { k: 'p11_pruebaInicial', num: '11', text: 'Prueba de funcionamiento inicial' },
                { k: 'p12_limpiezaIntegral', num: '12', text: 'Limpieza integral externa del equipo y/o accesorios' },
                { k: 'p13_pruebaFinalOperador', num: '13', text: 'Prueba de funcionamiento final en presencia del operador' },
              ].map((step) => {
                const isChecked = Boolean(activeRecord.protocolo?.[step.k as keyof typeof activeRecord.protocolo]);
                return (
                  <div key={step.k} className="p-2 flex items-center justify-between gap-3 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <span className="text-slate-800 dark:text-slate-200">
                      <strong className="text-slate-500 mr-2 font-mono">{step.num}.</strong>
                      {step.text}
                    </span>
                    <div
                      className={`w-4 h-4 border border-slate-800 dark:border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 ${
                        isChecked ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-transparent'
                      }`}
                    >
                      {isChecked ? 'X' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Observaciones y Repuestos */}
          <div className="mb-4 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider block mb-1" style={{ color: colorTheme }}>
              Observaciones y Repuestos / Accesorios:
            </span>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[60px] text-slate-800 dark:text-slate-200 whitespace-pre-line text-xs font-mono">
              {activeRecord.observacionesRepuestos || 'Sin observaciones adicionales registradas.'}
            </div>
          </div>

          {/* Section: Firmas y Responsables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 pt-4 text-xs" style={{ borderColor: `${colorTheme}60` }}>
            <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="font-bold text-[11px] block uppercase mb-1" style={{ color: colorTheme }}>
                Trabajo Realizado Por (Ingeniero Responsable):
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {activeRecord.trabajoRealizadoPor}
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                {activeRecord.cargo}
              </p>
              <p className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 mt-0.5">
                Tarjeta Profesional (RH): {activeRecord.rh || 'TP N/A'}
              </p>
            </div>

            <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="font-bold text-[11px] block uppercase mb-1" style={{ color: colorTheme }}>
                Recibido a Satisfacción (Cliente / Hospital):
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {activeRecord.recibidoSatisfaccion || 'Personal Autorizado del Servicio'}
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Servicio: {selectedEquipment.servicioUbicacion}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                ✓ Conforme y Operativo
              </p>
            </div>
          </div>

          {/* Footer Next Maintenance Calculation */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Próximo mantenimiento preventivo programado:
              </span>
              <span className="font-bold font-mono text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                {activeRecord.proximaFechaCalculada ? activeRecord.proximaFechaCalculada.split('-').reverse().join('/') : 'Sin programar'}
              </span>
            </div>

            {/* Discrete BIO-TAG technology footer */}
            <span className="text-[11px] text-slate-400">
              Con tecnología <strong className="text-slate-600 dark:text-slate-300">BIO-TAG</strong>
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
