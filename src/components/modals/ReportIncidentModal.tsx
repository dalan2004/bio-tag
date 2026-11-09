import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  X,
  AlertTriangle,
  Send,
  Building,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    equipments,
    activeEquipmentId,
    selectedEquipment,
    institutions,
    addIncident,
    setScanFeedback,
  } = useBiomedical();

  const [equipmentId, setEquipmentId] = useState(activeEquipmentId);
  const [reportadoPor, setReportadoPor] = useState('Enf. Jefe de Turno');
  const [cargo, setCargo] = useState('Enfermería Clínica');
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta' | 'critica'>('alta');
  const [descripcion, setDescripcion] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentEq = equipments.find((e) => e.id === equipmentId) || selectedEquipment;
  const inst = institutions.find((i) => i.id === currentEq?.institutionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || !currentEq) return;

    setSaveError(null);
    setIsSubmitting(true);

    try {
      await addIncident({
        equipmentId: currentEq.id,
        institutionId: currentEq.institutionId,
        fecha: new Date().toISOString().slice(0, 10),
        reportadoPor: reportadoPor.trim() || 'Personal Clínico',
        cargo: cargo.trim() || 'Enfermería',
        prioridad,
        descripcion: descripcion.trim(),
        estado: 'pendiente',
      });

      onClose();
    } catch (err: any) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar la falla en Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-amber-500 text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm sm:text-base leading-tight">
              Reportar Falla o Novedad Técnica
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-amber-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Equipo con Novedad:
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full py-2 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
            >
              {equipments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigoActivo} · {e.nombre} ({e.serie})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 block mt-1">
              Ubicación: {currentEq?.servicioUbicacion} — {inst?.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Reportado Por:
              </label>
              <input
                type="text"
                value={reportadoPor}
                onChange={(e) => setReportadoPor(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Cargo / Rol:
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nivel de Prioridad:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'baja', label: 'Baja', color: 'text-blue-600' },
                { id: 'media', label: 'Media', color: 'text-amber-600' },
                { id: 'alta', label: 'Alta', color: 'text-orange-600' },
                { id: 'critica', label: 'Crítica', color: 'text-red-600 font-bold' },
              ].map((p) => (
                <label
                  key={p.id}
                  className={`border rounded-lg p-2 text-center cursor-pointer transition-colors ${
                    prioridad === p.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="prioridad"
                    className="hidden"
                    checked={prioridad === p.id}
                    onChange={() => setPrioridad(p.id as any)}
                  />
                  <span className={`block capitalize ${p.color}`}>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Descripción Detallada de la Falla:
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describa el comportamiento anómalo, código de error en pantalla, accesorio dañado o condición de riesgo..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          {saveError && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span>
              <span>{saveError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Guardando en Firestore...' : 'Enviar a Ingeniería'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
