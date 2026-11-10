import React, { useRef } from 'react';
import { uploadFileToStorage } from '../../firebase';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Printer,
  Edit,
  QrCode,
  Upload,
  Camera,
  ShieldCheck,
  Zap,
  Tag,
  Building,
  MapPin,
  Cpu,
  Download,
  PlusCircle,
} from 'lucide-react';

interface EquipmentLifeSheetSectionProps {
  onOpenEditModal: () => void;
  onOpenNfcQrModal: () => void;
  onOpenNewEquipment?: () => void;
}

export const EquipmentLifeSheetSection: React.FC<EquipmentLifeSheetSectionProps> = ({
  onOpenEditModal,
  onOpenNfcQrModal,
  onOpenNewEquipment,
}) => {
  const {
    companyProfile,
    selectedEquipment,
    equipments,
    updateEquipment,
    institutions,
    isIngeniero,
    setActiveTab,
  } = useBiomedical();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCompanyInitials = (nameStr: string) => {
    if (!nameStr.trim()) return 'CM';
    return nameStr
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  };

  // EMPTY STATE: If no equipments exist at all
  if (equipments.length === 0 || !selectedEquipment) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs max-w-2xl mx-auto my-6 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
          <Cpu className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Aún no hay equipos registrados. Crea el primero.
        </h3>
        <p className="text-[15px] text-slate-500 mb-6 max-w-md mx-auto">
          Para visualizar la hoja de vida técnica oficial, primero debes agregar un equipo biomédico al inventario.
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
  const colorTheme = companyProfile.colorPrincipal || '#0f2942';

  const handleDownloadPdf = () => {
    window.print();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const downloadUrl = await uploadFileToStorage(
        file,
        `institutions/${selectedEquipment.institutionId}/equipment_photos`
      );
      await updateEquipment({ ...selectedEquipment, fotoUrl: downloadUrl });
    }
  };

  // Helper checkbox with X
  const renderBox = (checked: boolean, label: string) => (
    <div className="flex items-center gap-1.5 min-w-0">
      <div
        className={`w-4 h-4 border border-slate-800 dark:border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 ${
          checked ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-transparent'
        }`}
      >
        {checked ? 'X' : ''}
      </div>
      <span className="text-[11px] font-medium text-slate-900 dark:text-slate-200 truncate">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Top action toolbar (Hidden when printing PDF) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ficha técnica oficial de control biomédico
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono font-bold">
            {selectedEquipment.codigoActivo}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNfcQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-100 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-600" />
            <span>Ver Etiqueta NFC / QR</span>
          </button>

          {isIngeniero && (
            <button
              onClick={onOpenEditModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar Hoja de Vida</span>
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors shadow-xs"
            title="Descargar hoja de vida oficial en PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Official Biomedical Equipment Resume Sheet */}
      <div className="print-sheet bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 shadow-xl rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto transition-colors font-sans text-xs">
        
        {/* Document Header Table */}
        <div className="border border-slate-900 dark:border-slate-600 grid grid-cols-12 divide-x divide-slate-900 dark:divide-slate-600 mb-4 rounded-xl overflow-hidden">
          {/* Logo Column */}
          <div className="col-span-12 sm:col-span-3 p-3 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-800/60 text-center">
            {companyProfile.logoUrl ? (
              <img src={companyProfile.logoUrl} alt="Logo" className="h-10 w-auto object-contain mb-1" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-xs mb-1"
                style={{ backgroundColor: colorTheme }}
              >
                {getCompanyInitials(companyProfile.nombre)}
              </div>
            )}
            <span className="font-extrabold text-xs tracking-wider uppercase truncate max-w-full" style={{ color: colorTheme }}>
              {companyProfile.nombre || 'Nombre de la empresa'}
            </span>
            <span className="text-[8px] text-slate-500 uppercase tracking-tighter truncate max-w-full">
              {companyProfile.eslogan || 'SERVICIOS BIOMÉDICOS'}
            </span>
            <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate max-w-full">
              {institution?.name}
            </span>
          </div>

          {/* Title Column */}
          <div className="col-span-12 sm:col-span-6 p-3 flex flex-col justify-center items-center text-center">
            <h1 className="font-extrabold text-sm sm:text-base uppercase text-slate-900 dark:text-white leading-tight">
              HOJA DE VIDA DE EQUIPOS BIOMEDICOS
            </h1>
            <span className="text-[10px] text-slate-500 mt-0.5">
              Dirección de Ingeniería Hospitalaria & Gestión Tecnológica
            </span>
          </div>

          {/* Version & Date Column */}
          <div className="col-span-12 sm:col-span-3 p-2 divide-y divide-slate-900 dark:divide-slate-600 bg-slate-50 dark:bg-slate-800/40 text-[11px]">
            <div className="py-1 px-2 font-medium">
              <span className="font-bold">Versión:</span> 01
            </div>
            <div className="py-1 px-2 font-medium">
              <span className="font-bold">Fecha:</span> {new Date().toLocaleDateString('es-CO')}
            </div>
            <div className="py-1 px-2 font-mono text-[10px] font-bold truncate text-teal-700 dark:text-teal-400">
              {selectedEquipment.codigoActivo}
            </div>
          </div>
        </div>

        {/* Top Split: Photo on Left & DATOS DEL EQUIPO on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          {/* Photo Slot */}
          <div className="md:col-span-5 border border-slate-900 dark:border-slate-600 rounded-xl p-2 flex flex-col items-center justify-between bg-slate-50 dark:bg-slate-800/30">
            <div className="w-full h-56 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center relative group">
              {selectedEquipment.fotoUrl ? (
                <img
                  src={selectedEquipment.fotoUrl}
                  alt={selectedEquipment.nombre}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs text-slate-500 block">Sin fotografía adjunta</span>
                </div>
              )}
            </div>

            {/* Photo upload trigger */}
            {isIngeniero && (
              <div className="w-full mt-2 no-print">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-3 text-[11px] font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>{selectedEquipment.fotoUrl ? 'Actualizar foto' : 'Subir foto del equipo'}</span>
                </button>
              </div>
            )}
          </div>

          {/* DATOS DEL EQUIPO */}
          <div className="md:col-span-7 flex flex-col border border-slate-900 dark:border-slate-600 rounded-xl overflow-hidden">
            <div className="bg-teal-800 dark:bg-teal-700 text-white font-bold text-center text-xs py-1 uppercase tracking-wider">
              DATOS DEL EQUIPO
            </div>
            <div className="p-2 space-y-2 flex-1 flex flex-col justify-between text-[11px]">
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">SERVICIO / UBICACIÓN:</span>
                <span className="font-semibold text-right text-slate-900 dark:text-white truncate max-w-[200px]">
                  {selectedEquipment.servicioUbicacion}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">NOMBRE DEL EQUIPO:</span>
                <span className="font-bold text-right text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                  {selectedEquipment.nombre}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">MARCA:</span>
                <span className="font-semibold text-right text-slate-900 dark:text-white uppercase">
                  {selectedEquipment.marca}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">MODELO:</span>
                <span className="font-semibold text-right text-slate-900 dark:text-white">
                  {selectedEquipment.modelo}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">SERIE O LOTE:</span>
                <span className="font-mono font-bold text-right text-slate-900 dark:text-white">
                  {selectedEquipment.serie}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">REGISTRO INVIMA:</span>
                <span className="font-mono text-right text-slate-800 dark:text-slate-200">
                  {selectedEquipment.registroInvima || 'NO APLICA / EN TRÁMITE'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">AÑO DE FABRICACIÓN:</span>
                <span className="font-mono font-bold text-right text-slate-900 dark:text-white">
                  {selectedEquipment.anioFabricacion || 'N/A'}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Section: Adquisición, Mantenimiento, Frecuencia, Documentación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4 border border-slate-900 dark:border-slate-600 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-800/30">
          
          {/* Tipo de Adquisición */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase block border-b border-slate-300 dark:border-slate-700 pb-0.5">
              Tipo de Adquisición
            </span>
            {renderBox(selectedEquipment.tipoAdquisicion === 'compra', 'Compra')}
            {renderBox(selectedEquipment.tipoAdquisicion === 'comodato', 'Comodato')}
            {renderBox(selectedEquipment.tipoAdquisicion === 'leasing', 'Leasing')}
            {renderBox(selectedEquipment.tipoAdquisicion === 'otros', 'Otros')}
          </div>

          {/* Tipo de Mantenimiento */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase block border-b border-slate-300 dark:border-slate-700 pb-0.5">
              Régimen Mantenimiento
            </span>
            {renderBox(selectedEquipment.tipoMantenimiento === 'preventivo', 'Preventivo')}
            {renderBox(selectedEquipment.tipoMantenimiento === 'correctivo', 'Correctivo')}
            <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-700">
              {renderBox(selectedEquipment.regimenMantenimiento === 'propio', 'Propio')}
              {renderBox(selectedEquipment.regimenMantenimiento === 'contratado', 'Contratado')}
            </div>
          </div>

          {/* Frecuencia de Mantenimiento */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase block border-b border-slate-300 dark:border-slate-700 pb-0.5">
              Frecuencia Mantenimiento
            </span>
            {renderBox(selectedEquipment.frecuenciaMantenimientoMeses === 3, '3 meses')}
            {renderBox(selectedEquipment.frecuenciaMantenimientoMeses === 4, '4 meses')}
            {renderBox(selectedEquipment.frecuenciaMantenimientoMeses === 6, '6 meses')}
            {renderBox(selectedEquipment.frecuenciaMantenimientoMeses === 12, '12 meses')}
          </div>

          {/* Documentación */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase block border-b border-slate-300 dark:border-slate-700 pb-0.5">
              Documentación
            </span>
            {renderBox(Boolean(selectedEquipment.documentacion?.servicioTecnico), 'Servicio Técnico')}
            {renderBox(Boolean(selectedEquipment.documentacion?.manualUsuario), 'Manual de Usuario')}
            {renderBox(Boolean(selectedEquipment.documentacion?.docImportacion), 'Doc. Importación')}
            {renderBox(Boolean(selectedEquipment.documentacion?.docLimpieza), 'Doc. Limpieza')}
            {renderBox(Boolean(selectedEquipment.documentacion?.listadoPartes), 'Listado Partes')}
            {renderBox(Boolean(selectedEquipment.documentacion?.guiaRapida), 'Guía Rápida')}
          </div>
        </div>

        {/* Section: Clasificaciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4 border border-slate-900 dark:border-slate-600 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase block border-b border-slate-300 dark:border-slate-700 pb-0.5">
              Clasificación Biomédica
            </span>
            {renderBox(selectedEquipment.clasificacionBiomedica === 'diagnostico', 'Diagnóstico')}
            {renderBox(selectedEquipment.clasificacionBiomedica === 'tratamiento_soporte', 'Tratamiento y soporte')}
            {renderBox(selectedEquipment.clasificacionBiomedica === 'prevencion', 'Prevención')}
            {renderBox(selectedEquipment.clasificacionBiomedica === 'rehabilitacion', 'Rehabilitación')}
            {renderBox(selectedEquipment.clasificacionBiomedica === 'analisis_laboratorio', 'Análisis Laboratorio')}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase block border-b border-slate-300 dark:border-slate-700 pb-0.5">
              Clasificación por Uso
            </span>
            {renderBox(selectedEquipment.clasificacionUso === 'medico', 'Médico')}
            {renderBox(selectedEquipment.clasificacionUso === 'basico', 'Básico')}
            {renderBox(selectedEquipment.clasificacionUso === 'apoyo', 'Apoyo')}
            <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Movilidad</span>
              {renderBox(selectedEquipment.movilidad === 'fijo', 'Fijo')}
              {renderBox(selectedEquipment.movilidad === 'movil', 'Móvil')}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase block border-b border-slate-300 dark:border-slate-700 pb-0.5">
              Clasificación del Riesgo
            </span>
            {renderBox(selectedEquipment.clasificacionRiesgo === 'III', 'Muy Alto III')}
            {renderBox(selectedEquipment.clasificacionRiesgo === 'IIb', 'Alto IIb')}
            {renderBox(selectedEquipment.clasificacionRiesgo === 'IIa', 'Moderado IIa')}
            {renderBox(selectedEquipment.clasificacionRiesgo === 'I', 'Bajo I')}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase block border-b border-slate-300 dark:border-slate-700 pb-0.5">
              Tecnología Predominante
            </span>
            {renderBox(Boolean(selectedEquipment.tecnologiaPredominante?.mecanico), 'Mecánico')}
            {renderBox(Boolean(selectedEquipment.tecnologiaPredominante?.electrico), 'Eléctrico')}
            {renderBox(Boolean(selectedEquipment.tecnologiaPredominante?.electronico), 'Electrónico')}
            {renderBox(Boolean(selectedEquipment.tecnologiaPredominante?.hidraulico), 'Hidráulico')}
            {renderBox(Boolean(selectedEquipment.tecnologiaPredominante?.neumatico), 'Neumático')}
          </div>
        </div>

        {/* Section: Características Técnicas & Fuentes de Alimentación */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          {/* Características Técnicas */}
          <div className="md:col-span-8 border border-slate-900 dark:border-slate-600 rounded-xl overflow-hidden">
            <div className="bg-teal-800 dark:bg-teal-700 text-white font-bold text-center text-xs py-1 uppercase tracking-wider">
              CARACTERÍSTICAS TÉCNICAS
            </div>
            <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">VOLTAJE:</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.voltaje || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">PRESIÓN (PSI):</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.presionPsi || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">AMPERAJE:</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.amperaje || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">VELOCIDAD (RPM):</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.velocidadRpm || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">POTENCIA:</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.potencia || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">TEMPERATURA:</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.temperatura || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">FRECUENCIA:</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.frecuencia || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">PESO (KG):</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.pesoKg || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">CAPACIDAD:</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.capacidad || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">VIDA ÚTIL:</span>
                <span className="font-mono font-bold">{selectedEquipment.caracteristicasTecnicas?.vidaUtil || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Fuentes de Alimentación */}
          <div className="md:col-span-4 border border-slate-900 dark:border-slate-600 rounded-xl overflow-hidden">
            <div className="bg-teal-800 dark:bg-teal-700 text-white font-bold text-center text-xs py-1 uppercase tracking-wider">
              FUENTES DE ALIMENTACIÓN
            </div>
            <div className="p-2 space-y-1.5 text-[11px]">
              {renderBox(Boolean(selectedEquipment.fuentesAlimentacion?.agua), 'Agua')}
              {renderBox(Boolean(selectedEquipment.fuentesAlimentacion?.aire), 'Aire medicinal')}
              {renderBox(Boolean(selectedEquipment.fuentesAlimentacion?.electricidad), 'Electricidad')}
              {renderBox(Boolean(selectedEquipment.fuentesAlimentacion?.gas), 'Gas medicinal')}
              {renderBox(Boolean(selectedEquipment.fuentesAlimentacion?.vapor), 'Vapor')}
              {renderBox(Boolean(selectedEquipment.fuentesAlimentacion?.bateria), 'Batería interna')}
            </div>
          </div>
        </div>

        {/* Section: Observaciones y Recomendaciones */}
        <div className="border border-slate-900 dark:border-slate-600 rounded-xl p-3 bg-slate-50/40 dark:bg-slate-800/20 text-xs mb-3">
          <span className="font-bold text-[11px] uppercase block mb-1 text-slate-800 dark:text-slate-200">
            OBSERVACIONES Y RECOMENDACIONES DEL FABRICANTE:
          </span>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-line">
            {selectedEquipment.observaciones || selectedEquipment.recomendacionesFabricante || 'Equipo en óptimas condiciones de operabilidad y bioseguridad.'}
          </p>
        </div>

        {/* Discrete BIO-TAG footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
          <span>Registro institucional de trazabilidad biomédica</span>
          <span>
            Con tecnología <strong className="text-slate-600 dark:text-slate-300">BIO-TAG</strong>
          </span>
        </div>

      </div>
    </div>
  );
};
