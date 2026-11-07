import {
  Institution,
  UserProfile,
  BiomedicalEquipment,
  MaintenanceRecord,
  AuditLog,
  CompanyProfile,
  IncidentReport,
} from '../types/biomedical';

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
  id: 'company-main',
  nombre: '',
  nit: '',
  eslogan: '',
  logoUrl: '',
  direccion: '',
  ciudad: '',
  correo: '',
  telefonos: '',
  colorPrincipal: '#0f2942', // Azul oscuro por defecto
};

export const INITIAL_INSTITUTIONS: Institution[] = [];
export const INITIAL_USERS: UserProfile[] = [];
export const INITIAL_EQUIPMENT: BiomedicalEquipment[] = [];
export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_INCIDENTS: IncidentReport[] = [];
