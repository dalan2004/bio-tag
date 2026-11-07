import React, { useState } from 'react';
import { useBiomedical } from '../../context/BiomedicalContext';
import { UserRole } from '../../types/biomedical';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Building,
  ToggleLeft,
  ToggleRight,
  Lock,
  Mail,
  Award,
  CheckCircle2,
  XCircle,
  Settings,
  History,
} from 'lucide-react';

export const HospitalAdminSection: React.FC = () => {
  const {
    users,
    institutions,
    currentUserProfile,
    isAdminHospital,
    createHospitalUser,
    toggleUserActive,
    updateHospitalSettings,
    auditLogs,
  } = useBiomedical();

  // Create User Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ingeniero');
  const [cargo, setCargo] = useState('Ingeniero Biomédico de Planta');
  const [rh, setRh] = useState('TP ');
  const [password, setPassword] = useState('Hospital2026!');

  const activeHospitalId = currentUserProfile?.institutionId;
  const hospital = institutions.find((i) => i.id === activeHospitalId);
  const hospitalUsers = users.filter((u) => u.institutionId === activeHospitalId);
  const hospitalAudit = auditLogs.filter((a) => a.institutionId === activeHospitalId);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !activeHospitalId) return;

    createHospitalUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      institutionId: activeHospitalId,
      cargo: cargo.trim() || 'Personal Hospitalario',
      rh: role === 'ingeniero' ? rh.trim() : undefined,
      active: true,
    });

    setFullName('');
    setEmail('');
    setCargo('Ingeniero Biomédico de Planta');
    setRh('TP ');
    setShowCreateForm(false);
  };

  const handleToggleRequireLogin = () => {
    if (!hospital) return;
    updateHospitalSettings(hospital.id, {
      requireLoginForScan: !hospital.requireLoginForScan,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Panel de Administración Institucional
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
            {hospital?.name} ({hospital?.city})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de usuarios del hospital, control de roles, credenciales RH y políticas de lectura NFC/QR.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showCreateForm ? 'Ocultar Formulario' : 'Nuevo Usuario'}</span>
        </button>
      </div>

      {/* Hospital Policy Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-purple-600" />
          <span>Configuración de Seguridad de Etiquetas NFC / QR</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Exigir login institucional al leer la etiqueta NFC / QR
            </span>
            <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
              {hospital?.requireLoginForScan
                ? 'Activo: Toda persona que acerque el celular a un equipo deberá iniciar sesión institucional con correo y contraseña para ver la ficha.'
                : 'Inactivo: Cualquier personal de salud puede consultar la ficha técnica y último mantenimiento sin exigir login, manteniendo protegidos los costos y datos privados.'}
            </p>
          </div>

          <button
            onClick={handleToggleRequireLogin}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              hospital?.requireLoginForScan
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {hospital?.requireLoginForScan ? (
              <>
                <ToggleRight className="w-5 h-5" />
                <span>EXIGIR LOGIN ACTIVO</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-slate-400" />
                <span>ACCESO DIRECTO ABIERTO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-slate-900 border-2 border-purple-500/40 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>Registrar Nueva Cuenta de Usuario para {hospital?.name}</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Sin registro público — Solo creado por el administrador
            </span>
          </div>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nombre y Apellidos:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Ing. Jorge Eduardo Rincón"
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Correo Institucional:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jorge.rincon@hospital.salud.gov.co"
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Rol del Usuario:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
                <option value="ingeniero">Ingeniero (Único rol que edita equipos y mantenimientos)</option>
                <option value="enfermeria">Enfermería (Reporte de fallas y consulta)</option>
                <option value="consulta">Consulta (Solo lectura)</option>
                <option value="admin_hospital">Administrador del Hospital</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Cargo / Área Clínica:
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ej: Ingeniero Biomédico, Enfermera UCI"
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            {role === 'ingeniero' && (
              <div>
                <label className="font-semibold text-teal-800 dark:text-teal-400 block mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  RH (Número de Tarjeta Profesional):
                </label>
                <input
                  type="text"
                  value={rh}
                  onChange={(e) => setRh(e.target.value)}
                  placeholder="Ej: TP 9912-22"
                  className="w-full py-2 px-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700 font-mono font-bold text-teal-900 dark:text-teal-200"
                  required
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Contraseña Inicial:
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs"
              >
                Crear y Habilitar Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hospital Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Usuarios de este Hospital ({hospitalUsers.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Aislamiento multi-institución estricto
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <th className="py-2.5 px-4">Usuario</th>
                <th className="py-2.5 px-4">Correo</th>
                <th className="py-2.5 px-4">Rol</th>
                <th className="py-2.5 px-4">RH (Tarjeta Profesional)</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {hospitalUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {u.fullName}
                    <span className="text-[10px] text-slate-400 block font-normal">{u.cargo}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        u.role === 'ingeniero'
                          ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200'
                          : u.role === 'admin_hospital'
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                          : u.role === 'enfermeria'
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                    {u.rh || '—'}
                  </td>
                  <td className="py-3 px-4">
                    {u.active ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Activo
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold flex items-center gap-1 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        Desactivado
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => toggleUserActive(u.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        u.active
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {u.active ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hospital Audit Trail */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-purple-600" />
          <span>Historial de Auditoría de este Hospital ({hospitalAudit.length})</span>
        </h3>

        <div className="space-y-2">
          {hospitalAudit.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {log.summary}
                </span>
                <span className="text-[11px] text-slate-500">
                  Responsable: {log.changedBy} ({log.changedByRh})
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
