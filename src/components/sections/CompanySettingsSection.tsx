import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import {
  Building2,
  Upload,
  Palette,
  Shield,
  Users,
  CheckCircle2,
  Save,
  RotateCcw,
  Eye,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { HospitalAdminSection } from './HospitalAdminSection';

export const CompanySettingsSection: React.FC = () => {
  const {
    companyProfile,
    updateCompanyProfile,
    currentUserProfile,
    isAdminHospital,
    resetToInitialData,
    setIsSetupWizardOpen,
  } = useBiomedical();

  const [activeTab, setActiveTab] = useState<'empresa' | 'usuarios' | 'sistema'>('empresa');

  // Form State
  const [nombre, setNombre] = useState(companyProfile.nombre);
  const [nit, setNit] = useState(companyProfile.nit);
  const [eslogan, setEslogan] = useState(companyProfile.eslogan || '');
  const [logoUrl, setLogoUrl] = useState(companyProfile.logoUrl || '');
  const [direccion, setDireccion] = useState(companyProfile.direccion);
  const [ciudad, setCiudad] = useState(companyProfile.ciudad);
  const [correo, setCorreo] = useState(companyProfile.correo);
  const [telefonos, setTelefonos] = useState(companyProfile.telefonos);
  const [colorPrincipal, setColorPrincipal] = useState(companyProfile.colorPrincipal || '#0f2942');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyProfile({
      nombre: nombre.trim(),
      nit: nit.trim(),
      eslogan: eslogan.trim(),
      logoUrl,
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      correo: correo.trim(),
      telefonos: telefonos.trim(),
      colorPrincipal,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getCompanyInitials = (nameStr: string) => {
    if (!nameStr.trim()) return 'CM';
    return nameStr
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Configuración del Sistema
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personaliza la marca blanca corporativa, administra usuarios hospitalarios y políticas institucionales.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('empresa')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'empresa'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Datos Empresa (Marca Blanca)</span>
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'usuarios'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuarios & Hospitales</span>
          </button>
          <button
            onClick={() => setActiveTab('sistema')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'sistema'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {activeTab === 'empresa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Identidad Corporativa de la Empresa
                </h3>
                <span className="text-xs text-slate-500">
                  Visible y editable por el Administrador. Estos datos se imprimen en los reportes y hojas de vida.
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre oficial de la empresa"
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    NIT (formato libre) *
                  </label>
                  <input
                    type="text"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="Ej. 901857106 - 9"
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
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
                  value={eslogan}
                  onChange={(e) => setEslogan(e.target.value)}
                  placeholder="Ej. Tu aliado de confianza en auditorías hospitalarias"
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              {/* Logo and Color Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Logo de la Empresa (PNG, JPG, SVG)
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0 overflow-hidden"
                      style={{ backgroundColor: colorPrincipal }}
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        getCompanyInitials(nombre)
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-400 transition-colors">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="truncate">
                          {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-[11px] text-rose-600 hover:underline mt-1 block"
                        >
                          Eliminar y usar iniciales
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Color Principal (Encabezados y Acentos)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorPrincipal}
                      onChange={(e) => setColorPrincipal(e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {['#0f2942', '#1e3a8a', '#0f766e', '#15803d', '#7c2d12', '#334155'].map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setColorPrincipal(c)}
                          className={`w-6 h-6 rounded-lg border ${
                            colorPrincipal === c ? 'ring-2 ring-teal-500 scale-110' : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej. Calle 13B # 68 - 85"
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej. Cali, Colombia"
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Correo de Contacto
                  </label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Teléfonos
                  </label>
                  <input
                    type="text"
                    value={telefonos}
                    onChange={(e) => setTelefonos(e.target.value)}
                    placeholder="300 266 2280 - 300 514 6159"
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">
                  {savedSuccess ? '¡Cambios guardados con éxito!' : 'Guarda para actualizar tus encabezados.'}
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Datos de la Empresa</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview of the Header */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-teal-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Vista Previa del Encabezado Oficial
                </h4>
              </div>

              {/* Exact Report Header Preview per instructions */}
              <div className="bg-[#FCFDFF] dark:bg-slate-800/80 border-2 rounded-xl p-4 transition-all" style={{ borderColor: colorPrincipal }}>
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Logo + Name in UPPERCASE + Slogan in blue italic + NIT in monospace */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center font-extrabold text-white text-sm shrink-0 overflow-hidden"
                      style={{ backgroundColor: colorPrincipal }}
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        getCompanyInitials(nombre)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white truncate">
                        {nombre.trim() ? nombre.toUpperCase() : <span className="text-slate-400 font-normal">NOMBRE DE LA EMPRESA</span>}
                      </h4>
                      {eslogan && (
                        <p className="text-[10px] italic text-blue-600 dark:text-blue-400 leading-tight">
                          {eslogan}
                        </p>
                      )}
                      <p className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                        NIT: {nit.trim() ? nit : <span className="text-slate-400">000000000 - 0</span>}
                      </p>
                    </div>
                  </div>

                  {/* Right: Title + No. in red + Date Box */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      REPORTE SERVICIO TÉCNICO
                    </span>
                    <span className="text-xs font-black text-rose-600 font-mono block">
                      No. 0001
                    </span>
                    <div className="mt-1 border border-slate-300 dark:border-slate-600 rounded text-[9px] grid grid-cols-3 divide-x divide-slate-300 dark:divide-slate-600 bg-white dark:bg-slate-900 text-center px-1 py-0.5">
                      <div><span className="text-[8px] text-slate-400 block">DÍA</span>--</div>
                      <div><span className="text-[8px] text-slate-400 block">MES</span>--</div>
                      <div><span className="text-[8px] text-slate-400 block">AÑO</span>--</div>
                    </div>
                  </div>
                </div>

                {/* Sub-bar: Address, Email, Phone with icons */}
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {direccion || ciudad ? `${direccion} ${ciudad}` : 'Dirección y Ciudad'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {correo || 'contacto@empresa.com'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {telefonos || 'Teléfonos'}
                  </span>
                </div>

                {/* Main Color Separation Line */}
                <div className="mt-2.5 h-1 rounded-full w-full" style={{ backgroundColor: colorPrincipal }} />
              </div>

              {!nombre.trim() && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Completa los datos de tu empresa en Configuración para que aparezcan en tus reportes.
                  </span>
                </div>
              )}
            </div>

            {/* BIO-TAG Tech Notice */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Garantía de Marca Blanca:
              </span>
              Los reportes descargables en PDF y formatos en papel adoptarán la identidad visual de tu empresa, manteniendo un pie discreto: <span className="font-semibold text-teal-700 dark:text-teal-400">"Con tecnología BIO-TAG"</span>.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && <HospitalAdminSection />}

      {activeTab === 'sistema' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs max-w-xl">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
            Restablecer Sistema o Abrir Asistente
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Si deseas volver a ejecutar el asistente de configuración inicial o limpiar los datos almacenados localmente para iniciar una nueva empresa, puedes hacerlo aquí.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setIsSetupWizardOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-teal-500 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Abrir Asistente de Configuración (3 Pasos)</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('¿Está seguro de reiniciar todos los datos locales y volver a iniciar el asistente?')) {
                  resetToInitialData();
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restablecer Todo a Valores Vacíos</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
