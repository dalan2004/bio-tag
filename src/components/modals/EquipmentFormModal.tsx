import React, { useState, useEffect, useMemo } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import { BiomedicalEquipment, EquipmentAccessory } from '../../types/biomedical';
import {
  X,
  Cpu,
  Plus,
  Trash2,
  Save,
  Tag,
  Shield,
  Layers,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
  Camera,
  Upload,
  Loader2,
} from 'lucide-react';
import { uploadFileToStorage } from '../../firebase';

interface EquipmentFormModalProps {
  isOpen: boolean;
  equipmentToEdit?: BiomedicalEquipment;
  onClose: () => void;
}

const STORAGE_DRAFT_EQ_KEY = 'custodiamed_draft_equipment';

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  equipmentToEdit,
  onClose,
}) => {
  const {
    institutions,
    currentUserProfile,
    addEquipment,
    updateEquipment,
    setActiveEquipmentId,
    setActiveTab,
  } = useBiomedical();

  const isEditing = Boolean(equipmentToEdit);
  const userHospitalId = currentUserProfile?.institutionId || institutions[0]?.id || '';

  // Form State - Starts completely blank when creating new
  const [institutionId, setInstitutionId] = useState(userHospitalId);
  const [codigoActivo, setCodigoActivo] = useState('');
  const [servicioUbicacion, setServicioUbicacion] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [serie, setSerie] = useState('');
  const [registroInvima, setRegistroInvima] = useState('');
  const [anioFabricacion, setAnioFabricacion] = useState<number | ''>('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tipoAdquisicion, setTipoAdquisicion] = useState<'compra' | 'comodato' | 'leasing' | 'otros' | ''>('');
  const [tipoMantenimiento, setTipoMantenimiento] = useState<'preventivo' | 'correctivo' | 'na' | ''>('');
  const [regimenMantenimiento, setRegimenMantenimiento] = useState<'propio' | 'contratado' | ''>('');
  const [frecuenciaMeses, setFrecuenciaMeses] = useState<3 | 4 | 6 | 12 | ''>('');

  const [documentacion, setDocumentacion] = useState({
    servicioTecnico: false,
    manualUsuario: false,
    docImportacion: false,
    docLimpieza: false,
    listadoPartes: false,
    guiaRapida: false,
  });

  const [clasificacionBiomedica, setClasificacionBiomedica] = useState<string>('');
  const [clasificacionUso, setClasificacionUso] = useState<string>('');
  const [clasificacionRiesgo, setClasificacionRiesgo] = useState<string>('');
  const [movilidad, setMovilidad] = useState<string>('');

  const [tecnologia, setTecnologia] = useState({
    mecanico: false,
    electrico: false,
    electronico: false,
    hidraulico: false,
    neumatico: false,
  });

  const [caracteristicas, setCaracteristicas] = useState({
    voltaje: '',
    amperaje: '',
    potencia: '',
    frecuencia: '',
    capacidad: '',
    presionPsi: '',
    velocidadRpm: '',
    temperatura: '',
    pesoKg: '',
    vidaUtil: '',
  });

  const [fuentes, setFuentes] = useState({
    agua: false,
    aire: false,
    electricidad: false,
    gas: false,
    vapor: false,
    bateria: false,
    otro: '',
  });

  const [accesorios, setAccesorios] = useState<EquipmentAccessory[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');

  // Collapsible Accordion Sections
  const [openSections, setOpenSections] = useState({
    sec1: true,
    sec2: true,
    sec3: false,
    sec4: false,
  });

  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Populate if editing, or restore draft if creating
  useEffect(() => {
    if (!isOpen) return;

    if (equipmentToEdit) {
      setInstitutionId(equipmentToEdit.institutionId);
      setCodigoActivo(equipmentToEdit.codigoActivo);
      setServicioUbicacion(equipmentToEdit.servicioUbicacion);
      setNombre(equipmentToEdit.nombre);
      setMarca(equipmentToEdit.marca);
      setModelo(equipmentToEdit.modelo);
      setSerie(equipmentToEdit.serie);
      setRegistroInvima(equipmentToEdit.registroInvima);
      setAnioFabricacion(equipmentToEdit.anioFabricacion);
      setFotoUrl(equipmentToEdit.fotoUrl);
      setTipoAdquisicion(equipmentToEdit.tipoAdquisicion);
      setTipoMantenimiento(equipmentToEdit.tipoMantenimiento);
      setRegimenMantenimiento(equipmentToEdit.regimenMantenimiento);
      setFrecuenciaMeses(equipmentToEdit.frecuenciaMantenimientoMeses);
      setDocumentacion(equipmentToEdit.documentacion || {});
      setClasificacionBiomedica(equipmentToEdit.clasificacionBiomedica);
      setClasificacionUso(equipmentToEdit.clasificacionUso);
      setClasificacionRiesgo(equipmentToEdit.clasificacionRiesgo);
      setMovilidad(equipmentToEdit.movilidad);
      setTecnologia(equipmentToEdit.tecnologiaPredominante || {});
      setCaracteristicas(equipmentToEdit.caracteristicasTecnicas || {});
      setFuentes(equipmentToEdit.fuentesAlimentacion || {});
      setAccesorios(equipmentToEdit.accesorios || []);
      setObservaciones(equipmentToEdit.observaciones || '');
      setRecomendaciones(equipmentToEdit.recomendacionesFabricante || '');
    } else {
      // Check saved draft for new equipment
      const saved = localStorage.getItem(STORAGE_DRAFT_EQ_KEY);
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.nombre) setNombre(d.nombre);
          if (d.codigoActivo) setCodigoActivo(d.codigoActivo);
          if (d.marca) setMarca(d.marca);
          if (d.modelo) setModelo(d.modelo);
          if (d.serie) setSerie(d.serie);
          if (d.servicioUbicacion) setServicioUbicacion(d.servicioUbicacion);
          setDraftSavedAt('Borrador restaurado');
        } catch {}
      }
    }
  }, [isOpen, equipmentToEdit]);

  // Auto-save draft when creating new
  useEffect(() => {
    if (!isOpen || isEditing) return;
    const timer = setTimeout(() => {
      const draft = {
        nombre,
        codigoActivo,
        marca,
        modelo,
        serie,
        servicioUbicacion,
      };
      localStorage.setItem(STORAGE_DRAFT_EQ_KEY, JSON.stringify(draft));
      const now = new Date();
      setDraftSavedAt(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOpen, isEditing, nombre, codigoActivo, marca, modelo, serie, servicioUbicacion]);

  // Progress Percent
  const progressPercent = useMemo(() => {
    let score = 0;
    const total = 6;
    if (nombre.trim()) score++;
    if (serie.trim()) score++;
    if (servicioUbicacion.trim()) score++;
    if (tipoAdquisicion) score++;
    if (frecuenciaMeses) score++;
    if (clasificacionBiomedica) score++;
    return Math.round((score / total) * 100);
  }, [nombre, serie, servicioUbicacion, tipoAdquisicion, frecuenciaMeses, clasificacionBiomedica]);

  if (!isOpen) return null;

  const toggleSection = (sec: 'sec1' | 'sec2' | 'sec3' | 'sec4') => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      try {
        const downloadUrl = await uploadFileToStorage(file, 'equipment_photos');
        setFotoUrl(downloadUrl);
      } catch (err) {
        console.error('Error subiendo foto de equipo a Firebase Storage:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!nombre.trim() || !serie.trim() || !servicioUbicacion.trim()) {
      setSaveError('Por favor complete los campos obligatorios: Nombre, Serie y Ubicación.');
      return;
    }

    // Auto-generate code if empty
    const code = codigoActivo.trim() || `EQ-${nombre.slice(0, 3).toUpperCase()}-${serie.slice(-4)}`;
    setIsSubmitting(true);

    try {
      if (isEditing && equipmentToEdit) {
        await updateEquipment({
          ...equipmentToEdit,
          institutionId: institutionId || equipmentToEdit.institutionId,
          codigoActivo: code,
          servicioUbicacion: servicioUbicacion.trim(),
          nombre: nombre.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          serie: serie.trim(),
          registroInvima: registroInvima.trim(),
          anioFabricacion: typeof anioFabricacion === 'number' ? anioFabricacion : 2024,
          fotoUrl,
          tipoAdquisicion: (tipoAdquisicion as any) || 'compra',
          tipoMantenimiento: (tipoMantenimiento as any) || 'preventivo',
          regimenMantenimiento: (regimenMantenimiento as any) || 'propio',
          frecuenciaMantenimientoMeses: (frecuenciaMeses as any) || 6,
          documentacion,
          clasificacionBiomedica: (clasificacionBiomedica as any) || 'tratamiento_soporte',
          clasificacionUso: (clasificacionUso as any) || 'medico',
          clasificacionRiesgo: (clasificacionRiesgo as any) || 'IIb',
          movilidad: (movilidad as any) || 'movil',
          tecnologiaPredominante: tecnologia,
          caracteristicasTecnicas: caracteristicas,
          fuentesAlimentacion: fuentes,
          accesorios,
          observaciones: observaciones.trim(),
          recomendacionesFabricante: recomendaciones.trim(),
        });
      } else {
        // Cryptographically random 24-character token
        const randomBytes = new Uint8Array(12);
        crypto.getRandomValues(randomBytes);
        const hex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        const newToken = `bio_tag_${hex}`;

        const newId = `eq-${Date.now()}`;
        await addEquipment({
          id: newId,
          institutionId: institutionId || userHospitalId,
          codigoActivo: code,
          servicioUbicacion: servicioUbicacion.trim(),
          nombre: nombre.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          serie: serie.trim(),
          registroInvima: registroInvima.trim(),
          anioFabricacion: typeof anioFabricacion === 'number' ? anioFabricacion : 2024,
          fotoUrl,
          tipoAdquisicion: (tipoAdquisicion as any) || 'compra',
          tipoMantenimiento: (tipoMantenimiento as any) || 'preventivo',
          regimenMantenimiento: (regimenMantenimiento as any) || 'propio',
          frecuenciaMantenimientoMeses: (frecuenciaMeses as any) || 6,
          documentacion,
          clasificacionBiomedica: (clasificacionBiomedica as any) || 'tratamiento_soporte',
          clasificacionUso: (clasificacionUso as any) || 'medico',
          clasificacionRiesgo: (clasificacionRiesgo as any) || 'IIb',
          movilidad: (movilidad as any) || 'movil',
          tecnologiaPredominante: tecnologia,
          caracteristicasTecnicas: caracteristicas,
          fuentesAlimentacion: fuentes,
          accesorios,
          observaciones: observaciones.trim(),
          recomendacionesFabricante: recomendaciones.trim(),
          tagToken: newToken,
          tagActive: true,
          fechaCreacion: new Date().toISOString().slice(0, 10),
        });

        localStorage.removeItem(STORAGE_DRAFT_EQ_KEY);
        setActiveEquipmentId(newId);
        setActiveTab('hoja_de_vida');
      }

      onClose();
    } catch (err: any) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el equipo en Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-sans overflow-hidden">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                {isEditing ? 'Editar Ficha y Hoja de Vida' : 'Registrar Nuevo Equipo Biomédico'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                BIO-TAG · Formato normativo de hoja de vida y trazabilidad
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

        {/* Progress Bar & Draft State */}
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

        {/* Form Body with Collapsible Accordion */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* SECCIÓN 1: Identificación Principal y Ubicación */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sec1')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  1. Identificación y Ubicación del Equipo
                </span>
              </div>
              {openSections.sec1 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.sec1 && (
              <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Nombre del Equipo Biomédico *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Monitor de Signos Vitales, Desfibrilador..."
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Código de Activo Fijo (opcional, autogenerable)
                    </label>
                    <input
                      type="text"
                      value={codigoActivo}
                      onChange={(e) => setCodigoActivo(e.target.value)}
                      placeholder="Ej. BIO-UCI-001"
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      placeholder="Ej. Mindray, Philips, GE..."
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      placeholder="Ej. ePM 12M"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Serie o Lote *
                    </label>
                    <input
                      type="text"
                      value={serie}
                      onChange={(e) => setSerie(e.target.value)}
                      placeholder="Ej. SN20268841"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Servicio / Ubicación *
                    </label>
                    <input
                      type="text"
                      value={servicioUbicacion}
                      onChange={(e) => setServicioUbicacion(e.target.value)}
                      placeholder="Ej. Urgencias Reanimación"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Registro INVIMA
                    </label>
                    <input
                      type="text"
                      value={registroInvima}
                      onChange={(e) => setRegistroInvima(e.target.value)}
                      placeholder="Ej. INVIMA 2020EBC-0012017"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Año de Fabricación
                    </label>
                    <input
                      type="number"
                      value={anioFabricacion}
                      onChange={(e) => setAnioFabricacion(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="Ej. 2023"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: Adquisición, Frecuencia y Mantenimiento */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sec2')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  2. Régimen y Frecuencia de Mantenimiento
                </span>
              </div>
              {openSections.sec2 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.sec2 && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Frecuencia de Mantenimiento */}
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Frecuencia de Mantenimiento Preventivo:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 4, 6, 12].map((meses) => (
                        <label
                          key={meses}
                          className={`min-h-[44px] flex items-center justify-center p-2 rounded-xl border cursor-pointer font-bold transition-colors ${
                            frecuenciaMeses === meses
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="frecuenciaMeses"
                            value={meses}
                            checked={frecuenciaMeses === meses}
                            onChange={() => setFrecuenciaMeses(meses as any)}
                            className="hidden"
                          />
                          <span>{meses} Meses</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tipo de Adquisición */}
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tipo de Adquisición:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['compra', 'comodato', 'leasing', 'otros'].map((t) => (
                        <label
                          key={t}
                          className={`min-h-[44px] flex items-center justify-center p-1 rounded-xl border cursor-pointer capitalize font-semibold transition-colors text-center text-[11px] ${
                            tipoAdquisicion === t
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="tipoAdquisicion"
                            value={t}
                            checked={tipoAdquisicion === t}
                            onChange={() => setTipoAdquisicion(t as any)}
                            className="hidden"
                          />
                          <span>{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Régimen */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Régimen de Mantenimiento:
                    </label>
                    <div className="flex gap-3">
                      {['propio', 'contratado'].map((r) => (
                        <label key={r} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="regimenMantenimiento"
                            checked={regimenMantenimiento === r}
                            onChange={() => setRegimenMantenimiento(r as any)}
                          />
                          <span className="capitalize">{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Movilidad:
                    </label>
                    <div className="flex gap-3">
                      {['fijo', 'movil'].map((m) => (
                        <label key={m} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="movilidad"
                            checked={movilidad === m}
                            onChange={() => setMovilidad(m)}
                          />
                          <span className="capitalize">{m === 'movil' ? 'Móvil' : 'Fijo'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: Clasificaciones Normativas */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sec3')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  3. Clasificación Biomédica y Nivel de Riesgo
                </span>
              </div>
              {openSections.sec3 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.sec3 && (
              <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Clasificación Biomédica:
                    </label>
                    <select
                      value={clasificacionBiomedica}
                      onChange={(e) => setClasificacionBiomedica(e.target.value)}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    >
                      <option value="">Seleccione clasificación...</option>
                      <option value="diagnostico">Diagnóstico</option>
                      <option value="tratamiento_soporte">Tratamiento y Soporte Vital</option>
                      <option value="prevencion">Prevención</option>
                      <option value="rehabilitacion">Rehabilitación</option>
                      <option value="analisis_laboratorio">Análisis de Laboratorio</option>
                      <option value="esterilizacion">Esterilización</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Clasificación del Riesgo (INVIMA):
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['I', 'IIa', 'IIb', 'III'].map((r) => (
                        <label
                          key={r}
                          className={`min-h-[40px] flex items-center justify-center p-1 rounded-lg border cursor-pointer font-bold ${
                            clasificacionRiesgo === r
                              ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="clasificacionRiesgo"
                            checked={clasificacionRiesgo === r}
                            onChange={() => setClasificacionRiesgo(r)}
                            className="hidden"
                          />
                          <span>Clase {r}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 4: Foto y Observaciones */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sec4')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  4. Fotografía y Observaciones
                </span>
              </div>
              {openSections.sec4 ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.sec4 && (
              <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Fotografía del Equipo:
                  </label>
                  <div className="flex items-center gap-3">
                    {fotoUrl && (
                      <img src={fotoUrl} alt="Foto" className="w-16 h-16 rounded-xl object-contain border p-1" />
                    )}
                    <label className="py-2 px-3 border border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-xs">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        {isUploadingPhoto
                          ? 'Guardando en Firebase Storage...'
                          : fotoUrl
                          ? 'Cambiar fotografía'
                          : 'Subir imagen del equipo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Observaciones y Recomendaciones del Fabricante:
                  </label>
                  <textarea
                    rows={3}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Condiciones ambientales de operación, advertencias del manual, etc..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
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

        {/* Sticky Save Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingPhoto}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm shadow-teal-700/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? 'Guardando en Firestore...'
                : isEditing
                ? 'Guardar Cambios'
                : 'Registrar Equipo Biomédico'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
