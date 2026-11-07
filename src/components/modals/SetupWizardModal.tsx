import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Building2,
  Stethoscope,
  UserCheck,
  Check,
  ArrowRight,
  Upload,
  Sparkles,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Palette,
} from 'lucide-react';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ isOpen }) => {
  const { completeOnboardingSetup } = useBiomedical();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Company
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaNit, setEmpresaNit] = useState('');
  const [empresaEslogan, setEmpresaEslogan] = useState('');
  const [empresaLogoUrl, setEmpresaLogoUrl] = useState('');
  const [empresaDireccion, setEmpresaDireccion] = useState('');
  const [empresaCiudad, setEmpresaCiudad] = useState('');
  const [empresaCorreo, setEmpresaCorreo] = useState('');
  const [empresaTelefonos, setEmpresaTelefonos] = useState('');
  const [empresaColor, setEmpresaColor] = useState('#0f2942');

  // Step 2: Hospital / Client
  const [hospitalNombre, setHospitalNombre] = useState('');
  const [hospitalCiudad, setHospitalCiudad] = useState('');
  const [hospitalDpto, setHospitalDpto] = useState('');
  const [hospitalDireccion, setHospitalDireccion] = useState('');
  const [hospitalTelefono, setHospitalTelefono] = useState('');
  const [hospitalConsecutivo, setHospitalConsecutivo] = useState(1);

  // Step 3: Engineer User
  const [ingenieroNombre, setIngenieroNombre] = useState('');
  const [ingenieroEmail, setIngenieroEmail] = useState('');
  const [ingenieroCargo, setIngenieroCargo] = useState('Ingeniero Biomédico Especialista');
  const [ingenieroRh, setIngenieroRh] = useState('');
  const [ingenieroPass, setIngenieroPass] = useState('Hospital2026!');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEmpresaLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCompanyInitials = (name: string) => {
    if (!name.trim()) return 'CM';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaNombre.trim()) {
      setErrorMsg('Por favor ingrese el nombre de la empresa.');
      return;
    }
    if (!empresaNit.trim()) {
      setErrorMsg('Por favor ingrese el NIT de la empresa.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalNombre.trim()) {
      setErrorMsg('Por favor ingrese el nombre del primer hospital o cliente.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingenieroNombre.trim()) {
      setErrorMsg('Por favor ingrese el nombre completo del ingeniero.');
      return;
    }
    if (!ingenieroEmail.trim()) {
      setErrorMsg('Por favor ingrese el correo institucional del ingeniero.');
      return;
    }
    if (!ingenieroRh.trim()) {
      setErrorMsg('Por favor ingrese la tarjeta profesional (RH) del ingeniero.');
      return;
    }

    completeOnboardingSetup(
      {
        nombre: empresaNombre.trim(),
        nit: empresaNit.trim(),
        eslogan: empresaEslogan.trim(),
        logoUrl: empresaLogoUrl,
        direccion: empresaDireccion.trim(),
        ciudad: empresaCiudad.trim(),
        correo: empresaCorreo.trim(),
        telefonos: empresaTelefonos.trim(),
        colorPrincipal: empresaColor,
      },
      {
        name: hospitalNombre.trim(),
        city: hospitalCiudad.trim() || 'Ciudad Principal',
        department: hospitalDpto.trim() || 'Departamento',
        address: hospitalDireccion.trim() || 'Sede Principal',
        phone: hospitalTelefono.trim() || '(601) 000-0000',
        nextConsecutive: hospitalConsecutivo || 1,
      },
      {
        fullName: ingenieroNombre.trim(),
        email: ingenieroEmail.trim(),
        cargo: ingenieroCargo.trim() || 'Ingeniero Biomédico',
        rh: ingenieroRh.trim(),
        pass: ingenieroPass,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Top Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-teal-400">
              Asistente de Configuración Inicial
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Bienvenido a BIO-TAG
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Configura en 3 pasos los datos de tu empresa, tu primer cliente hospitalario y el usuario de ingeniería biomédica.
          </p>

          {/* Stepper Bar */}
          <div className="flex items-center gap-2 mt-6">
            {[
              { num: 1, label: 'Datos Empresa', icon: Building2 },
              { num: 2, label: 'Primer Hospital', icon: Stethoscope },
              { num: 3, label: 'Ingeniero Biomédico', icon: UserCheck },
            ].map((s) => {
              const Icon = s.icon;
              const isDone = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex-1 flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-teal-400 text-slate-900 ring-2 ring-teal-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:inline ${
                      isCurrent ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.num < 3 && <div className="flex-1 h-0.5 bg-slate-800 hidden sm:block" />}
                </div>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Company Profile (White Label) */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Paso 1: Datos de tu Empresa de Mantenimiento
              </span>
              <span className="text-[11px] text-slate-400">Marca blanca oficial</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  value={empresaNombre}
                  onChange={(e) => setEmpresaNombre(e.target.value)}
                  placeholder="Ej. BioMedical Tech del Norte S.A.S."
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  NIT (formato libre) *
                </label>
                <input
                  type="text"
                  value={empresaNit}
                  onChange={(e) => setEmpresaNit(e.target.value)}
                  placeholder="Ej. 901857106 - 9"
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Eslogan Corporativo (opcional)
              </label>
              <input
                type="text"
                value={empresaEslogan}
                onChange={(e) => setEmpresaEslogan(e.target.value)}
                placeholder="Ej. Tu aliado de confianza en auditorías y bioseguridad"
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Logo and Color Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Logo de la Empresa (PNG, JPG, SVG)
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0 overflow-hidden"
                    style={{ backgroundColor: empresaColor }}
                  >
                    {empresaLogoUrl ? (
                      <img src={empresaLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      getCompanyInitials(empresaNombre)
                    )}
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-400 transition-colors">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="truncate">
                      {empresaLogoUrl ? 'Cambiar imagen' : 'Subir archivo de logo'}
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Color Principal (Marca)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={empresaColor}
                    onChange={(e) => setEmpresaColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {['#0f2942', '#1e3a8a', '#0f766e', '#15803d', '#334155'].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setEmpresaColor(c)}
                        className={`w-6 h-6 rounded-lg border ${
                          empresaColor === c ? 'ring-2 ring-teal-500 scale-110' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Dirección y Ciudad
                </label>
                <input
                  type="text"
                  value={empresaDireccion}
                  onChange={(e) => setEmpresaDireccion(e.target.value)}
                  placeholder="Calle 100 # 15-20, Bogotá"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Correo de Contacto
                </label>
                <input
                  type="email"
                  value={empresaCorreo}
                  onChange={(e) => setEmpresaCorreo(e.target.value)}
                  placeholder="contacto@miempresa.com"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Teléfonos
                </label>
                <input
                  type="text"
                  value={empresaTelefonos}
                  onChange={(e) => setEmpresaTelefonos(e.target.value)}
                  placeholder="(601) 300 0000 - 310 000 0000"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold flex items-center gap-2 transition-colors text-xs"
              >
                <span>Siguiente: Primer Hospital</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Hospital / Client */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Paso 2: Registrar tu Primer Hospital o Cliente
              </span>
              <span className="text-[11px] text-slate-400">Institución prestadora</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nombre del Hospital o Clínica *
              </label>
              <input
                type="text"
                value={hospitalNombre}
                onChange={(e) => setHospitalNombre(e.target.value)}
                placeholder="Ej. Clínica Universitaria San Rafael"
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={hospitalCiudad}
                  onChange={(e) => setHospitalCiudad(e.target.value)}
                  placeholder="Ej. Medellín"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={hospitalDpto}
                  onChange={(e) => setHospitalDpto(e.target.value)}
                  placeholder="Ej. Antioquia"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Dirección de la Sede
                </label>
                <input
                  type="text"
                  value={hospitalDireccion}
                  onChange={(e) => setHospitalDireccion(e.target.value)}
                  placeholder="Ej. Carrera 43A # 1-50"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={hospitalTelefono}
                  onChange={(e) => setHospitalTelefono(e.target.value)}
                  placeholder="Ej. (604) 444-0000"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Número Consecutivo Inicial para Reportes de Servicio
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={hospitalConsecutivo}
                  onChange={(e) => setHospitalConsecutivo(parseInt(e.target.value) || 1)}
                  className="w-32 py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                />
                <span className="text-slate-500">
                  El primer reporte será: <span className="text-rose-600 font-bold font-mono">No. {String(hospitalConsecutivo).padStart(4, '0')}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold flex items-center gap-2 transition-colors text-xs"
              >
                <span>Siguiente: Usuario Ingeniero</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Engineer User Profile */}
        {step === 3 && (
          <form onSubmit={handleFinish} className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Paso 3: Primer Usuario Ingeniero Biomédico
              </span>
              <span className="text-[11px] text-slate-400">Firma técnica y RH</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre Completo del Ingeniero *
                </label>
                <input
                  type="text"
                  value={ingenieroNombre}
                  onChange={(e) => setIngenieroNombre(e.target.value)}
                  placeholder="Ej. Ing. Laura Marcela Rivas"
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tarjeta Profesional (RH) *
                </label>
                <input
                  type="text"
                  value={ingenieroRh}
                  onChange={(e) => setIngenieroRh(e.target.value)}
                  placeholder="Ej. TP 8904-20"
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-slate-900 dark:text-white"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Aparecerá en el pie de los reportes técnicos oficiales.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Correo Electrónico Institucional *
                </label>
                <input
                  type="email"
                  value={ingenieroEmail}
                  onChange={(e) => setIngenieroEmail(e.target.value)}
                  placeholder="ingeniero@miempresa.com"
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={ingenieroCargo}
                  onChange={(e) => setIngenieroCargo(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Contraseña de Acceso
              </label>
              <input
                type="text"
                value={ingenieroPass}
                onChange={(e) => setIngenieroPass(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
              />
            </div>

            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-xl text-teal-900 dark:text-teal-200 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Seguridad y aislamiento:</p>
                <p className="text-[11px] text-teal-800 dark:text-teal-300 mt-0.5">
                  El rol de Ingeniero es el único autorizado para crear equipos, editar hojas de vida y radicar reportes. También se creará una cuenta administradora para gestión de usuarios.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2 transition-colors text-xs shadow-md shadow-teal-700/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Finalizar y Entrar a BIO-TAG</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
