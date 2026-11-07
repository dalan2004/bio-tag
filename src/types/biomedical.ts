export type UserRole =
  | 'ingeniero'
  | 'admin_hospital'
  | 'enfermeria'
  | 'consulta';

export type ActiveTab =
  | 'inicio'
  | 'ultimo_mantenimiento'
  | 'hoja_de_vida'
  | 'todos_los_equipos'
  | 'fechas_rh'
  | 'alertas_ingenieria'
  | 'configuracion';

export interface CompanyProfile {
  id: string;
  nombre: string;
  nit: string;
  eslogan?: string;
  logoUrl?: string;
  direccion: string;
  ciudad: string;
  correo: string;
  telefonos: string;
  colorPrincipal: string; // Default '#0f2942'
  updatedAt?: string;
}

export interface Institution {
  id: string;
  name: string;
  city: string;
  department: string;
  address: string;
  phone: string;
  requireLoginForScan: boolean;
  nextConsecutive: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  institutionId: string;
  rh?: string; // Tarjeta Profesional colombiana (obligatoria para ingenieros, ej: "TP 4521-18")
  cargo: string;
  active: boolean;
  createdAt: string;
}

export interface MaintenanceProtocol {
  p1_ubicacionDesconexion: boolean;
  p2_verificacionElectrico: boolean;
  p3_verificacionElectronico: boolean;
  p4_verificacionNeumatico: boolean;
  p5_verificacionMecanico: boolean;
  p6_verificacionHidraulico: boolean;
  p7_lubricacionPartes: boolean;
  p8_limpiezaPistas: boolean;
  p9_limpiezaElectrico: boolean;
  p10_montajeTarjetas: boolean;
  p11_pruebaInicial: boolean;
  p12_limpiezaIntegral: boolean;
  p13_pruebaFinalOperador: boolean;
}

export type TipoServicio =
  | 'preventivo'
  | 'correctivo'
  | 'garantia'
  | 'capacitacion'
  | 'otro';

export type EstadoFisico =
  | 'buen_estado'
  | 'regular_estado'
  | 'mal_estado'
  | 'deterioro_fisico'
  | 'mal_funcionamiento'
  | 'fuera_de_servicio';

export type EstadoAccesorios =
  | 'buen_estado'
  | 'regular_estado'
  | 'mal_estado';

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  institutionId: string;
  numeroReporte: string; // ej: "No. 0001", "No. 0088"
  consecutivo: number;
  fecha: string; // YYYY-MM-DD
  cliente: string;
  ciudadDpto: string;
  servicioUbicacion: string;
  tipoServicio: TipoServicio;
  tipoServicioOtro?: string;
  inspeccionInicial: {
    estado: EstadoFisico;
    accesorios: EstadoAccesorios;
  };
  protocolo: MaintenanceProtocol;
  observacionesRepuestos: string;
  trabajoRealizadoPor: string;
  cargo: string;
  rh: string; // Tarjeta Profesional del ingeniero (no editable en el formulario)
  recibidoSatisfaccion: string;
  proximaFechaCalculada: string; // YYYY-MM-DD
  duracionHoras?: number;
  createdBy?: string;
  createdAt?: string;
}

export interface EquipmentAccessory {
  id: string;
  tipo: string;
  modelo: string;
  serie: string;
}

export interface BiomedicalEquipment {
  id: string;
  codigoActivo: string;
  institutionId: string;
  servicioUbicacion: string;
  nombre: string;
  marca: string;
  modelo: string;
  serie: string;
  registroInvima: string;
  anioFabricacion: number;
  fotoUrl: string;

  tipoAdquisicion: 'compra' | 'comodato' | 'leasing' | 'otros';
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'na';
  regimenMantenimiento: 'propio' | 'contratado';
  frecuenciaMantenimientoMeses: 3 | 4 | 6 | 12;

  documentacion: {
    servicioTecnico: boolean;
    manualUsuario: boolean;
    docImportacion: boolean;
    docLimpieza: boolean;
    listadoPartes: boolean;
    guiaRapida: boolean;
  };

  clasificacionBiomedica:
    | 'diagnostico'
    | 'tratamiento_soporte'
    | 'prevencion'
    | 'odontologia'
    | 'rehabilitacion'
    | 'analisis_laboratorio'
    | 'esterilizacion'
    | 'otros';

  clasificacionUso: 'medico' | 'basico' | 'apoyo';
  clasificacionRiesgo: 'I' | 'IIa' | 'IIb' | 'III';
  movilidad: 'fijo' | 'movil';

  tecnologiaPredominante: {
    mecanico: boolean;
    electrico: boolean;
    electronico: boolean;
    hidraulico: boolean;
    neumatico: boolean;
  };

  caracteristicasTecnicas: {
    voltaje: string;
    amperaje: string;
    potencia: string;
    frecuencia: string;
    capacidad: string;
    presionPsi: string;
    velocidadRpm: string;
    temperatura: string;
    pesoKg: string;
    vidaUtil: string;
  };

  fuentesAlimentacion: {
    agua: boolean;
    aire: boolean;
    electricidad: boolean;
    gas: boolean;
    vapor: boolean;
    bateria: boolean;
    otro: string;
  };

  accesorios: EquipmentAccessory[];
  observaciones: string;
  recomendacionesFabricante: string;

  // NFC & QR Security token (>= 16 caracteres aleatorios no consecutivos)
  tagToken: string;
  tagActive: boolean; // Si se pierde o daña se desactiva
  fechaCreacion: string;
  updatedAt?: string;
  lastUpdatedBy?: string;
}

export interface IncidentReport {
  id: string;
  equipmentId: string;
  institutionId: string;
  fecha: string;
  reportadoPor: string;
  cargo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'pendiente' | 'en_revision' | 'resuelto';
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  equipmentId: string;
  institutionId: string;
  entityType: 'equipment' | 'maintenance' | 'tag';
  action: 'create' | 'update' | 'deactivate_tag' | 'new_tag';
  timestamp: string;
  changedBy: string;
  changedByRh?: string;
  summary: string;
}

export interface EmailNotification {
  id: string;
  equipmentId: string;
  institutionId: string;
  recipientEmail: string;
  recipientRole: string;
  subject: string;
  body: string;
  sentAt: string;
}
