import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getPublicAppUrl } from '../../firebase';
import { BiomedicalEquipment, Institution } from '../../types/biomedical';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  X,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Radio,
  QrCode as QrIcon,
  ShieldCheck,
  Building,
  Smartphone,
  Download,
  AlertTriangle,
  Slash,
} from 'lucide-react';

interface NfcQrModalProps {
  equipment: BiomedicalEquipment;
  institution?: Institution;
  isOpen: boolean;
  onClose: () => void;
  onRegenerateToken: (id: string) => void;
}

export const NfcQrModal: React.FC<NfcQrModalProps> = ({
  equipment,
  institution,
  isOpen,
  onClose,
  onRegenerateToken,
}) => {
  const { isIngeniero, deactivateTag, bindNewTag } = useBiomedical();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [nfcWriteStatus, setNfcWriteStatus] = useState<string | null>(null);

  // Exact target URL as required: https://[dominio-de-la-app]/e/[TOKEN]
  const finalScanUrl = `${getPublicAppUrl()}/e/${equipment.tagToken}`;

  useEffect(() => {
    if (isOpen && equipment.tagToken) {
      QRCode.toDataURL(finalScanUrl, {
        width: 340,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [isOpen, equipment.tagToken, finalScanUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalScanUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(equipment.tagToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${equipment.codigoActivo}_${equipment.serie}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  // Web NFC Write Implementation
  const handleWriteNfc = async () => {
    const win = window as any;
    if (win.NDEFReader) {
      try {
        setNfcWriteStatus('📡 Acerque la etiqueta física NFC (NTAG213 / NTAG215) a la parte posterior del teléfono...');
        const ndef = new win.NDEFReader();
        await ndef.write({
          records: [
            {
              recordType: 'url',
              data: finalScanUrl,
            },
          ],
        });
        setNfcWriteStatus('✅ ¡Etiqueta NFC grabada con éxito con la URL directa!');
        setTimeout(() => setNfcWriteStatus(null), 5000);
      } catch (err) {
        setNfcWriteStatus(`❌ Error al grabar NFC: ${err instanceof Error ? err.message : String(err)}`);
        setTimeout(() => setNfcWriteStatus(null), 5000);
      }
    } else {
      setNfcWriteStatus(
        'ℹ️ Web NFC no está disponible en este dispositivo. Para iPhone o navegadores sin soporte, copie la URL abajo y use la aplicación gratuita "NFC Tools" (Escribir > Añadir registro > URL).'
      );
      setTimeout(() => setNfcWriteStatus(null), 8000);
    }
  };

  const handleDeactivate = () => {
    if (confirm(`¿Está seguro de desactivar la etiqueta (${equipment.tagToken})? Si se perdió o dañó, se invalidará su acceso pero se conservará todo el historial del equipo.`)) {
      deactivateTag(equipment.id);
    }
  };

  const handleBindNew = () => {
    bindNewTag(equipment.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-teal-800 text-white">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-300 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Vincular Etiqueta NFC y QR de Respaldo
              </h3>
              <p className="text-[11px] text-teal-200">
                {institution?.name} · {equipment.codigoActivo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Active / Inactive Tag Warning Banner */}
          {!equipment.tagActive ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Esta etiqueta se encuentra actualmente DESACTIVADA.</span>
                <span className="text-[11px] text-red-700 dark:text-red-300 block mt-0.5">
                  Cualquier persona que acerque el celular verá el aviso de etiqueta no registrada. Como ingeniero, puedes generar y vincular una nueva etiqueta abajo.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-teal-900 dark:text-teal-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Normatividad de Privacidad y Seguridad</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                La etiqueta guarda <strong>únicamente la URL con token aleatorio</strong> (mínimo 16 caracteres).
                Nunca almacena datos del equipo ni del paciente. Al tocarla, la web resuelve la ficha de forma segura.
              </p>
            </div>
          )}

          {/* Printable Hospital Sticker */}
          <div className="print-sheet bg-white text-slate-950 border-2 border-slate-900 rounded-xl p-4 shadow-sm font-sans">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-teal-800 block">
                  TRAZABILIDAD BIOMÉDICA
                </span>
                <span className="text-xs font-bold leading-tight block">
                  {institution?.name}
                </span>
                <span className="text-[10px] text-slate-600 block">
                  {equipment.servicioUbicacion}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-extrabold text-slate-900 block">
                  {equipment.codigoActivo}
                </span>
                <span className="text-[9px] font-bold text-teal-700 uppercase block">
                  NFC + QR LINK
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center py-3">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Código QR del equipo"
                    className="w-32 h-32 border border-slate-300 rounded p-1"
                  />
                ) : (
                  <div className="w-32 h-32 bg-slate-100 flex items-center justify-center">
                    <QrIcon className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
                <span className="text-[8px] font-mono text-slate-500 mt-1">
                  QR DE RESPALDO
                </span>
              </div>

              {/* NFC & Equipment Info */}
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">
                    EQUIPO:
                  </span>
                  <span className="font-bold text-slate-900 block leading-tight text-xs">
                    {equipment.nombre}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">
                    MARCA / MODELO:
                  </span>
                  <span className="font-medium text-slate-800 block">
                    {equipment.marca} {equipment.modelo}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">
                    SERIE:
                  </span>
                  <span className="font-mono font-bold text-slate-900 block">
                    {equipment.serie}
                  </span>
                </div>

                <div className="pt-1 border-t border-slate-200">
                  <span className="text-[8px] font-bold text-teal-800 uppercase block flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5" />
                    TOKEN SEGURO ({equipment.tagToken.length} CARACTERES):
                  </span>
                  <span className="font-mono font-bold text-[9px] text-teal-900 block truncate">
                    {equipment.tagToken}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-slate-900 pt-1.5 flex items-center justify-between text-[9px] font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-teal-700" />
                ACERCA TU CELULAR (NFC) O ESCANEA EL QR
              </span>
              <span>RIESGO {equipment.clasificacionRiesgo}</span>
            </div>
          </div>

          {/* URL & Token Details */}
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  URL grabada en el chip NFC / código QR:
                </span>
                <span className="font-mono text-[11px] text-teal-700 dark:text-teal-300 truncate block font-bold">
                  {finalScanUrl}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-50 flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiada' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>

          {/* Engineer Privileged Tag Management */}
          {isIngeniero && (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                Gestión de Etiquetas para Ingenieros Biomédicos:
              </span>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBindNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Vincular Nueva Etiqueta (Token &gt;= 16c)</span>
                </button>

                {equipment.tagActive && (
                  <button
                    onClick={handleDeactivate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-semibold text-xs transition-colors"
                  >
                    <Slash className="w-3.5 h-3.5" />
                    <span>Desactivar Etiqueta Perdida/Dañada</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Status feedback message */}
          {nfcWriteStatus && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              {nfcWriteStatus}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleWriteNfc}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
          >
            <Radio className="w-4 h-4" />
            <span>Escribir en Etiqueta NFC (Web NFC)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQr}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar QR</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Sticker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
