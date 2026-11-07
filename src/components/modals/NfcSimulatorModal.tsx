import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  X,
  Radio,
  Smartphone,
  QrCode,
  Tag,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface NfcSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NfcSimulatorModal: React.FC<NfcSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { equipments, institutions, enterDirectScanByToken } = useBiomedical();
  const [activeTab, setActiveTab] = useState<'tap_nfc' | 'qr_scan' | 'manual_token'>('tap_nfc');
  const [manualToken, setManualToken] = useState('');
  const [tapStatus, setTapStatus] = useState<string | null>(null);
  const [isScanningNfc, setIsScanningNfc] = useState(false);

  if (!isOpen) return null;

  const handleSimulateTap = (token: string, eqName: string) => {
    setTapStatus(`📲 Celular detectando antena NFC con URL: /e/${token}...`);
    setTimeout(() => {
      enterDirectScanByToken(token);
      setTapStatus(`✅ ¡Etiqueta leída! Abriendo ficha directa de ${eqName}...`);
      setTimeout(() => {
        setTapStatus(null);
        onClose();
      }, 700);
    }, 500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    enterDirectScanByToken(manualToken.trim());
    onClose();
  };

  // Web NFC physical read
  const handleStartRealNfcScan = async () => {
    const win = window as any;
    if (win.NDEFReader) {
      try {
        setIsScanningNfc(true);
        setTapStatus('📡 Escaneando... Acerque la etiqueta física NFC a la parte posterior de su smartphone.');
        const ndef = new win.NDEFReader();
        await ndef.scan();
        ndef.addEventListener('reading', ({ message }: { message: { records: Array<{ recordType: string; data: ArrayBuffer }> } }) => {
          for (const record of message.records) {
            if (record.recordType === 'url') {
              const textDecoder = new TextDecoder();
              const urlStr = textDecoder.decode(record.data);
              let token: string | null = null;
              if (urlStr.includes('/e/')) {
                token = urlStr.split('/e/')[1]?.split('?')[0];
              } else {
                const url = new URL(urlStr);
                token = url.searchParams.get('token');
              }
              if (token) {
                enterDirectScanByToken(token);
                setIsScanningNfc(false);
                onClose();
                return;
              }
            } else if (record.recordType === 'text') {
              const textDecoder = new TextDecoder();
              const token = textDecoder.decode(record.data);
              enterDirectScanByToken(token);
              setIsScanningNfc(false);
              onClose();
              return;
            }
          }
        });
      } catch (err) {
        setIsScanningNfc(false);
        setTapStatus(`Error Web NFC: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      setTapStatus('Web NFC no está soportado en este navegador. Utilice el simulador táctil o Google Chrome en Android.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-teal-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Simulador de Toque NFC / Lector QR
              </h3>
              <p className="text-[11px] text-teal-200">
                Abre la vista directa sin menús: /e/[TOKEN]
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

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tap_nfc')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'tap_nfc'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Toque NFC Celular</span>
          </button>

          <button
            onClick={() => setActiveTab('qr_scan')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'qr_scan'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Escanear QR</span>
          </button>

          <button
            onClick={() => setActiveTab('manual_token')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'manual_token'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Ingresar Token / Probar Inválido</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          {tapStatus && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-2 animate-pulse">
              <Radio className="w-4 h-4 shrink-0 text-teal-600" />
              <span>{tapStatus}</span>
            </div>
          )}

          {activeTab === 'tap_nfc' && (
            <div className="space-y-3">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-950/60 border-2 border-teal-500/40 mx-auto flex items-center justify-center text-teal-600 dark:text-teal-400 mb-2 relative">
                  <Smartphone className="w-7 h-7" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500"></span>
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Acerca tu teléfono a la etiqueta NFC del equipo
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                  Haz clic en cualquier equipo para simular la apertura inmediata de la URL: <span className="font-mono text-teal-700 dark:text-teal-400">/e/[TOKEN]</span>
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {equipments.map((eq) => {
                  const inst = institutions.find((i) => i.id === eq.institutionId);
                  return (
                    <button
                      key={eq.id}
                      onClick={() => handleSimulateTap(eq.tagToken, eq.nombre)}
                      className="w-full text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/30 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {eq.nombre}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                            {eq.codigoActivo}
                          </span>
                          {!eq.tagActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold">
                              DESACTIVADA
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{inst?.name}</span>
                          <span>·</span>
                          <span className="font-mono text-teal-700 dark:text-teal-400 truncate">
                            /e/{eq.tagToken.slice(0, 16)}...
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <Radio className="w-3.5 h-3.5" />
                        <span>Tocar NFC</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleStartRealNfcScan}
                  disabled={isScanningNfc}
                  className="w-full py-2.5 px-4 rounded-xl border border-teal-600 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>{isScanningNfc ? 'Escaneando hardware NFC...' : 'Usar Antena NFC Real del Teléfono (Web NFC)'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'qr_scan' && (
            <div className="space-y-3 text-center py-2">
              <div className="w-36 h-36 border-2 border-dashed border-teal-500 rounded-2xl mx-auto flex flex-col items-center justify-center bg-teal-50/20 dark:bg-slate-800/40 p-4">
                <QrCode className="w-14 h-14 text-teal-600 dark:text-teal-400" />
                <span className="text-[10px] text-teal-800 dark:text-teal-300 font-medium mt-1">
                  Enfocando QR impreso...
                </span>
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Seleccione el equipo cuyo código QR desea escanear:
              </p>

              <div className="space-y-2 text-left pt-1">
                {equipments.map((eq) => (
                  <button
                    key={eq.id}
                    onClick={() => handleSimulateTap(eq.tagToken, eq.nombre)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {eq.nombre} ({eq.marca})
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        S/N: {eq.serie} · Token: {eq.tagToken.slice(0, 16)}...
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 text-[11px]">
                      Escanear QR
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'manual_token' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Ingresar Token o probar token no registrado:
                </label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Ej: nfc_pm12_8a92f0c1e34b7910 o token_falso"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Si ingresas un token no registrado o de etiqueta desactivada, se verificará el mensaje de error solicitado.
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setManualToken('token_inexistente_999')}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Probar token inexistente
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Abrir Vista /e/[TOKEN]</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
