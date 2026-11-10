import React, { useState, useEffect, useMemo } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  TipoServicio,
  EstadoFisico,
  EstadoAccesorios,
  MaintenanceProtocol,
} from '../../types/biomedical';
import {
  X,
  FileCheck,
  CheckCircle,
  Calendar,
  AlertCircle,
  Wrench,
  User,
  Building,
  Award,
  Lock,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface NewMaintenanceModalProps {
  isOpen: boolean;
  preselectedEquipmentId?: string;
  onClose: () => void;
}

const STORAGE_DRAFT_KEY = 'custodiamed_draft_maintenance';

const BLANK_PROTOCOL: MaintenanceProtocol = {
  p1_ubicacionDesconexion: false,
  p2_verificacionElectrico: false,
  p3_verificacionElectronico: false,
  p4_verificacionNeumatico: false,
  p5_verificacionMecanico: false,
  p6_verificacionHidraulico: false,
  p7_lubricacionPartes: false,
  p8_limpiezaPistas: false,
  p9_limpiezaElectrico: false,
  p10_montajeTarjetas: false,
  p11_pruebaInicial: false,
  p12_limpiezaIntegral: false,
  p13_pruebaFinalOperador: false,
};

export const NewMaintenanceModal: React.FC<NewMaintenanceModalProps> = ({
  isOpen,
  preselectedEquipmentId,
  onClose,
}) => {
  const {
    equipments,
    activeEquipmentId,
    selectedEquipment,
    institutions,
    currentUserProfile,
    isIngeniero,
    addMaintenance,
    setActiveEquipmentId,
    setActiveTab,
    calculateNextDate,
  } = useBiomedical();

  const [equipmentId, setEquipmentId] = useState(preselectedEquipmentId || activeEquipmentId || (equipments[0]?.id ?? ''));
  const eq = equipments.find((item) => item.id === equipmentId) || selectedEquipment;
  const inst = institutions.find((i) => i.id === eq?.institutionId);

  // Consecutive number per hospital
  const hospitalConsecutive = inst?.nextConsecutive || 1;
  const autoReportNumber = `No. ${String(hospitalConsecutive).padStart(4, '0')}`;

  // Form Fields - starts completely blank except today's date
  const [fecha, setFecha] = useState(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
  });
  const [cliente, setCliente] = useState('');
  const [ciudadDpto, setCiudadDpto] = useState('');
  const [servicioUbicacion, setServicioUbicacion] = useState('');
  const [tipoServicio, setTipoServicio] = useState<TipoServicio | ''>('');
  const [tipoServicioOtro, setTipoServicioOtro] = useState('');

  const [estadoEquipo, setEstadoEquipo] = useState<EstadoFisico | ''>('');
  const [estadoAccesorios, setEstadoAccesorios] = useState<EstadoAccesorios | ''>('');

  const [protocolo, setProtocolo] = useState<MaintenanceProtocol>(BLANK_PROTOCOL);
  const [observaciones, setObservaciones] = useState('');
  const [recibidoSatisfaccion, setRecibidoSatisfaccion] = useState('');

  // Collapsible Accordion Sections
  const [openSections, setOpenSections] = useState<{
    sec1: boolean;
    sec2: boolean;
    sec3: boolean;
    sec4: boolean;
  }>({
    sec1: true,
    sec2: true,
    sec3: true,
    sec4: true,
  });

  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Populate equipment defaults if blank
  useEffect(() => {
    if (eq) {
      if (!cliente && inst) setCliente(inst.name);
      if (!ciudadDpto && inst) setCiudadDpto(`${inst.city} / ${inst.department}`);
      if (!servicioUbicacion) setServicioUbicacion(eq.servicioUbicacion);
    }
  }, [eq, inst]);

  // Load draft from localStorage on open
  useEffect(() => {
    if (isOpen) {
      const savedDraft = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (savedDraft) {
        try {
          const d = JSON.parse(savedDraft);
          if (d.equipmentId && equipments.some((e) => e.id === d.equipmentId)) setEquipmentId(d.equipmentId);
          if (d.tipoServicio) setTipoServicio(d.tipoServicio);
          if (d.tipoServicioOtro) setTipoServicioOtro(d.tipoServicioOtro);
          if (d.estadoEquipo) setEstadoEquipo(d.estadoEquipo);
          if (d.estadoAccesorios) setEstadoAccesorios(d.estadoAccesorios);
          if (d.protocolo) setProtocolo(d.protocolo);
          if (d.observaciones) setObservaciones(d.observaciones);
          if (d.recibidoSatisfaccion) setRecibidoSatisfaccion(d.recibidoSatisfaccion);
          setDraftSavedAt('Borrador restaurado');
        } catch {}
      }
    }
  }, [isOpen, equipments]);

  // Auto-save draft on every change
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const draftData = {
        equipmentId,
        fecha,
        cliente,
        ciudadDpto,
        servicioUbicacion,
        tipoServicio,
        tipoServicioOtro,
        estadoEquipo,
        estadoAccesorios,
        protocolo,
        observaciones,
        recibidoSatisfaccion,
      };
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draftData));
      const now = new Date();
      setDraftSavedAt(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, equipmentId, fecha, cliente, ciudadDpto, servicioUbicacion, tipoServicio, tipoServicioOtro, estadoEquipo, estadoAccesorios, protocolo, observaciones, recibidoSatisfaccion]);

  // Calculate Progress Percentage
  const progressPercent = useMemo(() => {
    let score = 0;
    const total = 7;
    if (equipmentId) score += 1;
    if (fecha) score += 1;
    if (tipoServicio) score += 1;
    if (estadoEquipo && estadoAccesorios) score += 1;
    const checkedSteps = Object.values(protocolo).filter(Boolean).length;
    if (checkedSteps >= 1) score += 1;
    if (checkedSteps >= 10) score += 1;
    if (recibidoSatisfaccion.trim()) score += 1;
    return Math.round((score / total) * 100);
  }, [equipmentId, fecha, tipoServicio, estadoEquipo, estadoAccesorios, protocolo, recibidoSatisfaccion]);

  if (!isOpen) return null;

  const toggleProtocol = (key: keyof MaintenanceProtocol) => {
    setProtocolo((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAllProtocol = (val: boolean) => {
    setProtocolo({
      p1_ubicacionDesconexion: val,
      p2_verificacionElectrico: val,
      p3_verificacionElectronico: val,
      p4_verificacionNeumatico: val,
      p5_verificacionMecanico: val,
      p6_verificacionHidraulico: val,
      p7_lubricacionPartes: val,
      p8_limpiezaPistas: val,
      p9_limpiezaElectrico: val,
      p10_montajeTarjetas: val,
      p11_pruebaInicial: val,
      p12_limpiezaIntegral: val,
      p13_pruebaFinalOperador: val,
    });
  };

  const toggleSection = (sec: 'sec1' | 'sec2' | 'sec3' | 'sec4') => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eq) return;

    if (!tipoServicio) {
      setSaveError('Por favor seleccione el tipo de servicio técnico realizado.');
      return;
    }

    setSaveError(null);
    setIsSubmitting(true);

    try {
      const freqMonths = eq.frecuenciaMantenimientoMeses || 6;
      const nextDate = calculateNextDate(fecha, freqMonths);

      await addMaintenance({
        equipmentId: eq.id,
        institutionId: eq.institutionId,
        fecha,
        cliente: cliente.trim() || inst?.name || 'Cliente Hospitalario',
        ciudadDpto: ciudadDpto.trim() || `${inst?.city || ''} / ${inst?.department || ''}`,
        servicioUbicacion: servicioUbicacion.trim() || eq.servicioUbicacion,
        tipoServicio: tipoServicio as TipoServicio,
        tipoServicioOtro: tipoServicio === 'otro' ? tipoServicioOtro.trim() : undefined,
        inspeccionInicial: {
          estado: (estadoEquipo as EstadoFisico) || 'buen_estado',
          accesorios: (estadoAccesorios as EstadoAccesorios) || 'buen_estado',
        },
        protocolo,
        observacionesRepuestos: observaciones.trim(),
        trabajoRealizadoPor: currentUserProfile?.fullName || 'Ingeniero Biomédico',
        cargo: currentUserProfile?.cargo || 'Ingeniero Biomédico',
        rh: currentUserProfile?.rh || 'TP N/A',
        recibidoSatisfaccion: recibidoSatisfaccion.trim() || 'Personal de Turno',
        proximaFechaCalculada: nextDate,
      });

      // Clear saved draft
      localStorage.removeItem(STORAGE_DRAFT_KEY);
      setActiveEquipmentId(eq.id);
      setActiveTab('ultimo_mantenimiento');
      onClose();
    } catch (err: any) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el reporte técnico en Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-sans overflow-hidden">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  Nuevo Reporte de Servicio Técnico
                </h3>
                <span className="font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded text-xs">
                  {autoReportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {inst?.name || 'Hospital Asignado'} · Registro normativo de mantenimiento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Draft Status */}
        <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3 flex-1 mr-4">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Progreso: {progressPercent}%
            </span>
            <div className="flex-1 max-w-xs h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>
              {draftSavedAt ? `Borrador guardado: ${draftSavedAt}` : 'Guardado automático activo'}
            </span>
          </div>
        </div>

        {/* Form Body with Collapsible Sections */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* SECCIÓN 1: Datos del Equipo y Ubicación */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sec1')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  1. Datos del Equipo y Ubicación Hospitalaria
                </span>
              </div>
              {openSections.sec1 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.sec1 && (
              <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Equipo Biomédico *
                    </label>
                    <select
                      value={equipmentId}
                      onChange={(e) => setEquipmentId(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                      required
                    >
                      {equipments.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.codigoActivo} · {item.nombre} ({item.serie})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Fecha del Servicio *
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Cliente / Hospital
                    </label>
                    <input
                      type="text"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      placeholder="Hospital o Clínica"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Ciudad / Departamento
                    </label>
                    <input
                      type="text"
                      value={ciudadDpto}
                      onChange={(e) => setCiudadDpto(e.target.value)}
                      placeholder="Ciudad / Dpto"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Servicio / Ubicación
                    </label>
                    <input
                      type="text"
                      value={servicioUbicacion}
                      onChange={(e) => setServicioUbicacion(e.target.value)}
                      placeholder="Ej. UCI Adultos Cama 4"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: Tipo de Servicio e Inspección Inicial */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sec2')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  2. Tipo de Servicio e Inspección Inicial
                </span>
              </div>
              {openSections.sec2 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.sec2 && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800">
                {/* Tipo de Servicio */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Tipo de Servicio Realizado:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'preventivo', label: 'Preventivo' },
                      { id: 'correctivo', label: 'Correctivo' },
                      { id: 'garantia', label: 'Garantía' },
                      { id: 'capacitacion', label: 'Capacitación' },
                      { id: 'otro', label: 'Otro' },
                    ].map((s) => (
                      <label
                        key={s.id}
                        className={`min-h-[44px] flex items-center justify-center p-2 rounded-xl border cursor-pointer font-semibold text-center transition-colors text-xs ${
                          tipoServicio === s.id
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipoServicio"
                          value={s.id}
                          checked={tipoServicio === s.id}
                          onChange={() => setTipoServicio(s.id as TipoServicio)}
                          className="hidden"
                        />
                        <span>{s.label}</span>
                      </label>
                    ))}
                  </div>
                  {tipoServicio === 'otro' && (
                    <input
                      type="text"
                      value={tipoServicioOtro}
                      onChange={(e) => setTipoServicioOtro(e.target.value)}
                      placeholder="Especifique el tipo de servicio..."
                      className="mt-2 w-full py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  )}
                </div>

                {/* Inspección Inicial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Inspección Inicial del Equipo:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'buen_estado', label: 'Buen estado' },
                        { id: 'regular_estado', label: 'Regular estado' },
                        { id: 'mal_estado', label: 'Mal estado' },
                        { id: 'deterioro_fisico', label: 'Deterioro físico' },
                        { id: 'mal_funcionamiento', label: 'Mal funcionamiento' },
                        { id: 'fuera_de_servicio', label: 'Fuera de servicio' },
                      ].map((st) => (
                        <label
                          key={st.id}
                          className={`min-h-[40px] flex items-center p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                            estadoEquipo === st.id
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-semibold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="estadoEquipo"
                            checked={estadoEquipo === st.id}
                            onChange={() => setEstadoEquipo(st.id as EstadoFisico)}
                            className="mr-2"
                          />
                          <span>{st.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Estado de Accesorios:
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id: 'buen_estado', label: 'Buen estado' },
                        { id: 'regular_estado', label: 'Regular estado' },
                        { id: 'mal_estado', label: 'Mal estado' },
                      ].map((acc) => (
                        <label
                          key={acc.id}
                          className={`min-h-[40px] flex items-center p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                            estadoAccesorios === acc.id
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-semibold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="estadoAccesorios"
                            checked={estadoAccesorios === acc.id}
                            onChange={() => setEstadoAccesorios(acc.id as EstadoAccesorios)}
                            className="mr-2"
                          />
                          <span>{acc.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: Protocolo Técnico (13 Pasos, casillas táctiles grandes >= 44px) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sec3')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  3. Protocolo de Mantenimiento Técnico (13 Pasos)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                  {Object.values(protocolo).filter(Boolean).length} / 13 marcados
                </span>
                {openSections.sec3 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {openSections.sec3 && (
              <div className="p-4 space-y-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">
                    Toque sobre cada paso para marcar como ejecutado conforme a la norma:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllProtocol(true)}
                      className="text-[11px] text-teal-600 hover:underline font-semibold"
                    >
                      Marcar todos
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllProtocol(false)}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Desmarcar todos
                    </button>
                  </div>
                </div>

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
                  const isChecked = Boolean(protocolo[step.k as keyof MaintenanceProtocol]);
                  return (
                    <div
                      key={step.k}
                      onClick={() => toggleProtocol(step.k as keyof MaintenanceProtocol)}
                      className={`min-h-[48px] p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-xs text-slate-500 shrink-0 w-5">
                          {step.num}.
                        </span>
                        <span className="text-xs font-medium leading-snug">
                          {step.text}
                        </span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent'
                        }`}
                      >
                        {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN 4: Observaciones, Repuestos y Firma */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sec4')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  4. Observaciones, Repuestos y Responsables
                </span>
              </div>
              {openSections.sec4 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.sec4 && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Observaciones y Repuestos / Accesorios Reemplazados:
                  </label>
                  <textarea
                    rows={3}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Detalle cambios de partes, mediciones técnicas, calibraciones o recomendaciones de uso..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Engineer Identity (Locked by rules) */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                        Trabajo Realizado Por:
                      </span>
                      <span className="text-[10px] text-teal-600 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Bloqueado al perfil
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white block text-sm">
                      {currentUserProfile?.fullName || 'Ingeniero Biomédico'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {currentUserProfile?.cargo || 'Ingeniero Especialista'}
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 block mt-0.5">
                      Tarjeta Profesional (RH): {currentUserProfile?.rh || 'TP N/A'}
                    </span>
                  </div>

                  {/* Recibido a Satisfacción */}
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Recibido a Satisfacción Por:
                    </label>
                    <input
                      type="text"
                      value={recibidoSatisfaccion}
                      onChange={(e) => setRecibidoSatisfaccion(e.target.value)}
                      placeholder="Nombre y cargo de quien recibe el equipo"
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Firma o recibido por parte del personal asistencial del hospital.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {saveError && (
            <div className="p-3 mx-4 mb-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span>
              <span>{saveError}</span>
            </div>
          )}

        </form>

        {/* Sticky Save Bar at the Bottom */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm shadow-teal-700/20"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Guardando en Firestore...' : 'Guardar Reporte Técnico'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
