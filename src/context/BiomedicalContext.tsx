import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  BiomedicalEquipment,
  MaintenanceRecord,
  Institution,
  UserProfile,
  IncidentReport,
  AuditLog,
  UserRole,
  EmailNotification,
  CompanyProfile,
  ActiveTab,
} from '../types/biomedical';

export type { ActiveTab };
import {
  INITIAL_COMPANY_PROFILE,
  INITIAL_INSTITUTIONS,
  INITIAL_USERS,
  INITIAL_EQUIPMENT,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INCIDENTS,
} from '../data/initialData';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
} from 'firebase/firestore';

interface BiomedicalContextType {
  // Company & White-Label
  companyProfile: CompanyProfile;
  updateCompanyProfile: (data: Partial<CompanyProfile>) => void;

  // Auth
  fbUser: FirebaseUser | null;
  currentUserProfile: UserProfile | null;
  isAuthenticated: boolean;
  authRole: UserRole | null;
  isIngeniero: boolean;
  isAdminHospital: boolean;
  isEnfermeria: boolean;
  isConsulta: boolean;
  loginError: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  quickLoginAs: (profileId: string) => void;
  logout: () => void;

  // Multi-Institution & Data
  institutions: Institution[];
  equipments: BiomedicalEquipment[];
  maintenances: MaintenanceRecord[];
  users: UserProfile[];
  incidents: IncidentReport[];
  auditLogs: AuditLog[];
  emailNotifications: EmailNotification[];
  selectedInstitution: Institution | undefined;
  activeEquipmentId: string;
  selectedEquipment: BiomedicalEquipment | undefined;
  activeTab: ActiveTab;
  darkMode: boolean;
  scanFeedback: string | null;
  globalSearchQuery: string;

  // Onboarding Wizard
  isSetupWizardOpen: boolean;
  setIsSetupWizardOpen: (open: boolean) => void;
  completeOnboardingSetup: (
    company: Partial<CompanyProfile>,
    institution: { name: string; city: string; department: string; address: string; phone: string; nextConsecutive: number },
    engineer: { fullName: string; email: string; cargo: string; rh: string; pass: string }
  ) => void;

  // Direct Mobile Scan Mode (/e/[TOKEN])
  isDirectScanMode: boolean;
  scannedToken: string | null;
  scannedEquipment: BiomedicalEquipment | null;
  isTagInvalidOrDeactivated: boolean;
  requiresLoginToScan: boolean;
  exitDirectScanMode: () => void;
  enterDirectScanByToken: (token: string) => void;

  // Actions
  setActiveEquipmentId: (id: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  toggleDarkMode: () => void;
  setScanFeedback: (msg: string | null) => void;
  setGlobalSearchQuery: (query: string) => void;

  // CRUD & Operations (Protected by Role)
  addEquipment: (eq: BiomedicalEquipment) => void;
  updateEquipment: (eq: BiomedicalEquipment, changeSummary?: string) => void;
  addMaintenance: (record: Omit<MaintenanceRecord, 'id' | 'consecutivo' | 'numeroReporte'>) => string;
  addIncident: (incident: Omit<IncidentReport, 'id' | 'createdAt'>) => void;
  bindNewTag: (equipmentId: string) => string;
  deactivateTag: (equipmentId: string) => void;

  // Hospital & Company Admin Actions
  createHospitalUser: (userData: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  toggleUserActive: (userId: string) => void;
  createInstitution: (inst: Omit<Institution, 'id'>) => string;
  updateHospitalSettings: (institutionId: string, settings: { requireLoginForScan?: boolean }) => void;

  // Alerts & Notifications
  getOverdueOrUpcomingEquipments: () => {
    overdue: BiomedicalEquipment[];
    upcoming: BiomedicalEquipment[];
  };
  triggerOverdueEmailAlert: (equipmentId: string) => void;

  // Calculations & Utilities
  getMaintenancesForEquipment: (eqId: string) => MaintenanceRecord[];
  getLatestMaintenance: (eqId: string) => MaintenanceRecord | undefined;
  calculateNextDate: (dateStr: string, months: number) => string;
  getMaintenanceStatus: (nextDateStr: string) => {
    status: 'vencido' | 'proximo' | 'al_dia';
    label: string;
    daysDiff: number;
  };
  resetToInitialData: () => void;
}

const BiomedicalContext = createContext<BiomedicalContextType | undefined>(undefined);

// Storage keys for BIO-TAG
const STORAGE_KEY_COMPANY = 'custodiamed_company';
const STORAGE_KEY_INSTITUTIONS = 'custodiamed_institutions';
const STORAGE_KEY_USERS = 'custodiamed_users';
const STORAGE_KEY_EQUIPMENT = 'custodiamed_equipments';
const STORAGE_KEY_MAINTENANCE = 'custodiamed_maintenances';
const STORAGE_KEY_INCIDENTS = 'custodiamed_incidents';
const STORAGE_KEY_AUDIT = 'custodiamed_audit';
const STORAGE_KEY_ACTIVE_USER = 'custodiamed_active_profile_id';
const STORAGE_KEY_THEME = 'custodiamed_theme';
const STORAGE_KEY_VERSION = 'custodiamed_v1_clean';

export const BiomedicalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge any old sample data from legacy versions on first launch
  useEffect(() => {
    const isCleaned = localStorage.getItem(STORAGE_KEY_VERSION);
    if (!isCleaned) {
      localStorage.removeItem('biomed_v2_equipments');
      localStorage.removeItem('biomed_v2_maintenances');
      localStorage.removeItem('biomed_v2_users');
      localStorage.removeItem('biomed_v2_institutions');
      localStorage.removeItem('biomed_v2_incidents');
      localStorage.removeItem('biomed_v2_audit');
      localStorage.removeItem('biomed_v2_active_profile_id');
      localStorage.setItem(STORAGE_KEY_VERSION, 'true');
    }
  }, []);

  // Company Profile (White Label)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const s = localStorage.getItem(STORAGE_KEY_COMPANY);
    return s ? JSON.parse(s) : INITIAL_COMPANY_PROFILE;
  });

  // Data State
  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY_INSTITUTIONS);
    return s ? JSON.parse(s) : INITIAL_INSTITUTIONS;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY_USERS);
    return s ? JSON.parse(s) : INITIAL_USERS;
  });

  const [equipments, setEquipments] = useState<BiomedicalEquipment[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY_EQUIPMENT);
    return s ? JSON.parse(s) : INITIAL_EQUIPMENT;
  });

  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY_MAINTENANCE);
    return s ? JSON.parse(s) : INITIAL_MAINTENANCE_RECORDS;
  });

  const [incidents, setIncidents] = useState<IncidentReport[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY_INCIDENTS);
    return s ? JSON.parse(s) : INITIAL_INCIDENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY_AUDIT);
    return s ? JSON.parse(s) : INITIAL_AUDIT_LOGS;
  });

  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([]);

  // Auth State
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (savedId) {
      const match = users.find((u) => u.id === savedId);
      if (match) return match;
    }
    return users.length > 0 ? users[0] : null;
  });
  const [loginError, setLoginError] = useState<string | null>(null);

  // UI Navigation
  const [activeEquipmentId, setActiveEquipmentId] = useState<string>(() => {
    return equipments.length > 0 ? equipments[0].id : '';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Setup Wizard State
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(() => {
    // If company has no name or there are no institutions/users, open wizard automatically
    const savedCompany = localStorage.getItem(STORAGE_KEY_COMPANY);
    const parsedComp = savedCompany ? JSON.parse(savedCompany) : null;
    const hasCompany = Boolean(parsedComp?.nombre?.trim());
    const savedInsts = localStorage.getItem(STORAGE_KEY_INSTITUTIONS);
    const hasInsts = savedInsts ? JSON.parse(savedInsts).length > 0 : false;
    return !hasCompany || !hasInsts;
  });

  // Direct Mobile Scan State (/e/[TOKEN])
  const [isDirectScanMode, setIsDirectScanMode] = useState(false);
  const [scannedToken, setScannedToken] = useState<string | null>(null);

  // Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply Theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  // Persist State
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INSTITUTIONS, JSON.stringify(institutions));
  }, [institutions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(equipments));
  }, [equipments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(maintenances));
  }, [maintenances]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (currentUserProfile) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, currentUserProfile.id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
    }
  }, [currentUserProfile]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      if (user && user.email) {
        const found = users.find((u) => u.email.toLowerCase() === user.email?.toLowerCase());
        if (found) {
          setCurrentUserProfile(found);
        }
      }
    });
    return () => unsubscribe();
  }, [users]);

  // Sync activeEquipmentId when equipment list changes
  useEffect(() => {
    if (equipments.length > 0) {
      const exists = equipments.some((e) => e.id === activeEquipmentId);
      if (!exists) {
        setActiveEquipmentId(equipments[0].id);
      }
    } else {
      setActiveEquipmentId('');
    }
  }, [equipments, activeEquipmentId]);

  // URL Router Detection for /e/[TOKEN] or ?token=... or #token=...
  useEffect(() => {
    const detectTokenInUrl = () => {
      const pathname = window.location.pathname;
      let token: string | null = null;

      if (pathname.startsWith('/e/')) {
        token = pathname.replace('/e/', '').trim();
      }

      if (!token) {
        const params = new URLSearchParams(window.location.search);
        token = params.get('token');
      }

      if (!token && window.location.hash) {
        if (window.location.hash.includes('token=')) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
          token = hashParams.get('token');
        } else if (window.location.hash.includes('/e/')) {
          const parts = window.location.hash.split('/e/');
          if (parts[1]) token = parts[1].split('?')[0].trim();
        }
      }

      if (token) {
        setScannedToken(token);
        setIsDirectScanMode(true);
        const match = equipments.find((e) => e.tagToken.toLowerCase() === token?.toLowerCase());
        if (match) {
          setActiveEquipmentId(match.id);
        }
      }
    };

    detectTokenInUrl();
    window.addEventListener('popstate', detectTokenInUrl);
    window.addEventListener('hashchange', detectTokenInUrl);
    return () => {
      window.removeEventListener('popstate', detectTokenInUrl);
      window.removeEventListener('hashchange', detectTokenInUrl);
    };
  }, [equipments]);

  // Derived Auth Checks
  const isAuthenticated = Boolean(currentUserProfile);
  const authRole = currentUserProfile?.role || null;
  const isIngeniero = currentUserProfile?.active === true && authRole === 'ingeniero';
  const isAdminHospital = currentUserProfile?.active === true && authRole === 'admin_hospital';
  const isEnfermeria = currentUserProfile?.active === true && authRole === 'enfermeria';
  const isConsulta = currentUserProfile?.active === true && authRole === 'consulta';

  // Selected Hospital for authenticated user or default first
  const selectedInstitution = useMemo(() => {
    if (currentUserProfile?.institutionId) {
      return institutions.find((i) => i.id === currentUserProfile.institutionId);
    }
    return institutions[0];
  }, [institutions, currentUserProfile]);

  // Scanned Equipment Logic
  const scannedEquipment = scannedToken
    ? equipments.find((e) => e.tagToken.toLowerCase() === scannedToken.toLowerCase()) || null
    : null;

  const isTagInvalidOrDeactivated =
    Boolean(scannedToken) && (!scannedEquipment || scannedEquipment.tagActive === false);

  const scannedInstitution = scannedEquipment
    ? institutions.find((i) => i.id === scannedEquipment.institutionId)
    : undefined;

  const requiresLoginToScan =
    Boolean(scannedInstitution?.requireLoginForScan) && !isAuthenticated;

  // Selected equipment in app
  const selectedEquipment = useMemo(() => {
    if (!activeEquipmentId) {
      return equipments.length > 0 ? equipments[0] : undefined;
    }
    return equipments.find((e) => e.id === activeEquipmentId) || equipments[0];
  }, [equipments, activeEquipmentId]);

  const toggleDarkMode = () => setDarkMode((p) => !p);

  // Update Company Profile (Only Admin)
  const updateCompanyProfile = (data: Partial<CompanyProfile>) => {
    setCompanyProfile((prev) => {
      const updated = {
        ...prev,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      try {
        setDoc(doc(db, 'company_profile', 'main'), updated).catch(() => {});
      } catch {}
      return updated;
    });
    setScanFeedback('Datos corporativos de la empresa actualizados.');
    setTimeout(() => setScanFeedback(null), 3500);
  };

  // Login handler
  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setLoginError(null);
    try {
      const profile = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!profile) {
        setLoginError('No existe ningún usuario registrado con ese correo institucional.');
        return false;
      }
      if (!profile.active) {
        setLoginError('Esta cuenta ha sido desactivada por el Administrador del Hospital.');
        return false;
      }

      try {
        await signInWithEmailAndPassword(auth, email.trim(), pass);
      } catch (fbErr) {
        console.warn('Firebase Auth sign in fallback to profile verification:', fbErr);
      }

      setCurrentUserProfile(profile);
      setScanFeedback(`Sesión iniciada: ${profile.fullName} (${profile.role.toUpperCase()})`);
      setTimeout(() => setScanFeedback(null), 4000);
      return true;
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      return false;
    }
  };

  const quickLoginAs = (profileId: string) => {
    const profile = users.find((u) => u.id === profileId);
    if (profile) {
      setCurrentUserProfile(profile);
      setLoginError(null);
      setScanFeedback(`Sesión iniciada como: ${profile.fullName} (${profile.role.toUpperCase()})`);
      setTimeout(() => setScanFeedback(null), 3500);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {}
    setCurrentUserProfile(null);
    setScanFeedback('Sesión cerrada.');
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const enterDirectScanByToken = (token: string) => {
    setScannedToken(token);
    setIsDirectScanMode(true);
    const found = equipments.find((e) => e.tagToken.toLowerCase() === token.toLowerCase());
    if (found) {
      setActiveEquipmentId(found.id);
    }
  };

  const exitDirectScanMode = () => {
    setIsDirectScanMode(false);
    setScannedToken(null);
    if (window.location.pathname.startsWith('/e/')) {
      window.history.pushState({}, '', '/');
    }
  };

  // Helper date calculations
  const calculateNextDate = (dateStr: string, months: number): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      date.setMonth(date.getMonth() + months);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return dateStr;
    }
  };

  const getMaintenanceStatus = (nextDateStr: string) => {
    if (!nextDateStr) {
      return { status: 'al_dia' as const, label: 'Sin registros', daysDiff: 0 };
    }
    const [y, m, d] = nextDateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'vencido' as const,
        label: `Vencido (${Math.abs(diffDays)}d)`,
        daysDiff: diffDays,
      };
    } else if (diffDays <= 30) {
      return {
        status: 'proximo' as const,
        label: `Próximo (${diffDays}d)`,
        daysDiff: diffDays,
      };
    } else {
      return {
        status: 'al_dia' as const,
        label: `Al día (${diffDays}d)`,
        daysDiff: diffDays,
      };
    }
  };

  const getMaintenancesForEquipment = (eqId: string): MaintenanceRecord[] => {
    return maintenances
      .filter((m) => m.equipmentId === eqId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const getLatestMaintenance = (eqId: string): MaintenanceRecord | undefined => {
    const list = getMaintenancesForEquipment(eqId);
    return list[0];
  };

  // Add Equipment (Only Ingeniero)
  const addEquipment = (eq: BiomedicalEquipment) => {
    if (!isIngeniero && users.length > 0) {
      alert('Solo los usuarios con rol de Ingeniero Biomédico pueden registrar equipos.');
      return;
    }

    setEquipments((prev) => [eq, ...prev]);
    setActiveEquipmentId(eq.id);

    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      equipmentId: eq.id,
      institutionId: eq.institutionId,
      entityType: 'equipment',
      action: 'create',
      timestamp: new Date().toLocaleString('es-CO'),
      changedBy: currentUserProfile?.fullName || 'Ingeniero Biomédico',
      changedByRh: currentUserProfile?.rh || 'TP N/A',
      summary: `Creación de equipo ${eq.nombre} (${eq.codigoActivo}) Serie: ${eq.serie}.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    try {
      setDoc(doc(db, 'equipments', eq.id), eq).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `equipments/${eq.id}`)
      );
      setDoc(doc(db, 'audit_logs', log.id), log).catch(() => {});
    } catch {}

    setScanFeedback(`Equipo ${eq.nombre} registrado con éxito.`);
    setTimeout(() => setScanFeedback(null), 3500);
  };

  // Update Equipment (Only Ingeniero)
  const updateEquipment = (eq: BiomedicalEquipment, changeSummary?: string) => {
    if (!isIngeniero && users.length > 0) {
      alert('Solo los usuarios con rol de Ingeniero Biomédico pueden editar equipos.');
      return;
    }

    const updatedEq: BiomedicalEquipment = {
      ...eq,
      updatedAt: new Date().toISOString().slice(0, 10),
      lastUpdatedBy: `${currentUserProfile?.fullName || 'Ingeniero'} (${currentUserProfile?.rh || ''})`,
    };

    setEquipments((prev) => prev.map((item) => (item.id === eq.id ? updatedEq : item)));

    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      equipmentId: eq.id,
      institutionId: eq.institutionId,
      entityType: 'equipment',
      action: 'update',
      timestamp: new Date().toLocaleString('es-CO'),
      changedBy: currentUserProfile?.fullName || 'Ingeniero Biomédico',
      changedByRh: currentUserProfile?.rh || 'TP N/A',
      summary: changeSummary || `Actualización de ficha técnica / hoja de vida del equipo ${eq.codigoActivo}.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    try {
      setDoc(doc(db, 'equipments', eq.id), updatedEq).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `equipments/${eq.id}`)
      );
      setDoc(doc(db, 'audit_logs', log.id), log).catch(() => {});
    } catch {}

    setScanFeedback(`Hoja de vida actualizada para ${eq.nombre}.`);
    setTimeout(() => setScanFeedback(null), 3500);
  };

  // Bind New NFC / QR Tag (Only Ingeniero)
  const bindNewTag = (equipmentId: string): string => {
    if (!isIngeniero && users.length > 0) {
      alert('Solo los ingenieros biomédicos pueden vincular etiquetas NFC / QR.');
      return '';
    }

    const randomBytes = new Uint8Array(12);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const newToken = `bio_tag_${hex}`;

    const target = equipments.find((e) => e.id === equipmentId);
    if (!target) return '';

    const updated: BiomedicalEquipment = {
      ...target,
      tagToken: newToken,
      tagActive: true,
      updatedAt: new Date().toISOString().slice(0, 10),
      lastUpdatedBy: `${currentUserProfile?.fullName || 'Ingeniero'} (${currentUserProfile?.rh || ''})`,
    };

    setEquipments((prev) => prev.map((e) => (e.id === equipmentId ? updated : e)));

    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      equipmentId,
      institutionId: target.institutionId,
      entityType: 'tag',
      action: 'new_tag',
      timestamp: new Date().toLocaleString('es-CO'),
      changedBy: currentUserProfile?.fullName || 'Ingeniero Biomédico',
      changedByRh: currentUserProfile?.rh || 'TP N/A',
      summary: `Generación y vinculación de nueva etiqueta NFC/QR con token seguro: ${newToken}.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    try {
      setDoc(doc(db, 'equipments', equipmentId), updated).catch(() => {});
      setDoc(doc(db, 'audit_logs', log.id), log).catch(() => {});
    } catch {}

    setScanFeedback('Nueva etiqueta vinculada con token de 24 caracteres.');
    setTimeout(() => setScanFeedback(null), 3500);
    return newToken;
  };

  // Deactivate Tag (Only Ingeniero)
  const deactivateTag = (equipmentId: string) => {
    if (!isIngeniero && users.length > 0) {
      alert('Solo los ingenieros biomédicos pueden desactivar etiquetas.');
      return;
    }

    const target = equipments.find((e) => e.id === equipmentId);
    if (!target) return;

    const updated: BiomedicalEquipment = {
      ...target,
      tagActive: false,
      updatedAt: new Date().toISOString().slice(0, 10),
      lastUpdatedBy: `${currentUserProfile?.fullName || 'Ingeniero'} (${currentUserProfile?.rh || ''})`,
    };

    setEquipments((prev) => prev.map((e) => (e.id === equipmentId ? updated : e)));

    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      equipmentId,
      institutionId: target.institutionId,
      entityType: 'tag',
      action: 'deactivate_tag',
      timestamp: new Date().toLocaleString('es-CO'),
      changedBy: currentUserProfile?.fullName || 'Ingeniero Biomédico',
      changedByRh: currentUserProfile?.rh || 'TP N/A',
      summary: `Etiqueta NFC/QR (${target.tagToken}) desactivada por pérdida o daño físico.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    try {
      setDoc(doc(db, 'equipments', equipmentId), updated).catch(() => {});
      setDoc(doc(db, 'audit_logs', log.id), log).catch(() => {});
    } catch {}

    setScanFeedback('Etiqueta desactivada por seguridad. Se preserva todo el historial.');
    setTimeout(() => setScanFeedback(null), 3500);
  };

  // Add Maintenance Report (Only Ingeniero)
  const addMaintenance = (
    record: Omit<MaintenanceRecord, 'id' | 'consecutivo' | 'numeroReporte'>
  ): string => {
    if (!isIngeniero && users.length > 0) {
      alert('Solo los ingenieros biomédicos están autorizados para radicar reportes de servicio técnico.');
      return '';
    }

    const inst = institutions.find((i) => i.id === record.institutionId);
    const consecutivo = inst ? inst.nextConsecutive : 1;
    const formattedNum = `No. ${String(consecutivo).padStart(4, '0')}`;

    // Increment institution consecutive
    setInstitutions((prev) =>
      prev.map((i) =>
        i.id === record.institutionId ? { ...i, nextConsecutive: i.nextConsecutive + 1 } : i
      )
    );

    const id = `maint-${Date.now()}`;
    const newRecord: MaintenanceRecord = {
      ...record,
      id,
      consecutivo,
      numeroReporte: formattedNum,
      // Name, RH and role strictly bound to the authenticated engineer
      trabajoRealizadoPor: currentUserProfile?.fullName || record.trabajoRealizadoPor,
      rh: currentUserProfile?.rh || record.rh,
      cargo: currentUserProfile?.cargo || record.cargo,
      createdBy: currentUserProfile?.id,
      createdAt: new Date().toISOString(),
    };

    setMaintenances((prev) => [newRecord, ...prev]);

    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      equipmentId: record.equipmentId,
      institutionId: record.institutionId,
      entityType: 'maintenance',
      action: 'create',
      timestamp: new Date().toLocaleString('es-CO'),
      changedBy: currentUserProfile?.fullName || 'Ingeniero Biomédico',
      changedByRh: currentUserProfile?.rh || 'TP N/A',
      summary: `Reporte de servicio técnico ${formattedNum} radicado. Próximo mant.: ${record.proximaFechaCalculada}.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    try {
      setDoc(doc(db, 'maintenances', id), newRecord).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `maintenances/${id}`)
      );
      setDoc(doc(db, 'audit_logs', log.id), log).catch(() => {});
    } catch {}

    setScanFeedback(`Reporte ${formattedNum} guardado con éxito. Próximo mantenimiento reprogramado.`);
    setTimeout(() => setScanFeedback(null), 4000);
    return id;
  };

  // Add Incident (Nursing / Clinical staff)
  const addIncident = (incident: Omit<IncidentReport, 'id' | 'createdAt'>) => {
    const id = `inc-${Date.now()}`;
    const newInc: IncidentReport = {
      ...incident,
      id,
      createdAt: new Date().toISOString(),
    };

    setIncidents((prev) => [newInc, ...prev]);

    try {
      setDoc(doc(db, 'incidents', id), newInc).catch(() => {});
    } catch {}

    setScanFeedback('Reporte de falla remitido a Ingeniería Biomédica.');
    setTimeout(() => setScanFeedback(null), 4000);
  };

  // Hospital & Company Admin Actions
  const createHospitalUser = (userData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newId = `user-${Date.now()}`;
    const newUser: UserProfile = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setUsers((prev) => [...prev, newUser]);

    try {
      setDoc(doc(db, 'users', newId), newUser).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${newId}`)
      );
    } catch {}

    setScanFeedback(`Usuario ${newUser.fullName} (${newUser.role}) creado.`);
    setTimeout(() => setScanFeedback(null), 3500);
  };

  const toggleUserActive = (userId: string) => {
    if (!isAdminHospital && users.length > 0) {
      alert('Solo el Administrador del Hospital puede modificar el estado de las cuentas.');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
    );
    setScanFeedback('Estado de cuenta actualizado.');
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const createInstitution = (instData: Omit<Institution, 'id'>): string => {
    const newId = `inst-${Date.now()}`;
    const newInst: Institution = {
      ...instData,
      id: newId,
    };
    setInstitutions((prev) => [...prev, newInst]);
    return newId;
  };

  const updateHospitalSettings = (
    institutionId: string,
    settings: { requireLoginForScan?: boolean }
  ) => {
    setInstitutions((prev) =>
      prev.map((i) => (i.id === institutionId ? { ...i, ...settings } : i))
    );
    setScanFeedback('Configuración del hospital actualizada.');
    setTimeout(() => setScanFeedback(null), 3000);
  };

  // 3-Step Onboarding Setup Completion
  const completeOnboardingSetup = (
    companyData: Partial<CompanyProfile>,
    instData: { name: string; city: string; department: string; address: string; phone: string; nextConsecutive: number },
    engineerData: { fullName: string; email: string; cargo: string; rh: string; pass: string }
  ) => {
    // 1. Company
    const newCompany: CompanyProfile = {
      ...INITIAL_COMPANY_PROFILE,
      ...companyData,
      id: 'company-main',
      colorPrincipal: companyData.colorPrincipal || '#0f2942',
      updatedAt: new Date().toISOString(),
    };
    setCompanyProfile(newCompany);

    // 2. Institution
    const newInstId = `inst-${Date.now()}`;
    const newInst: Institution = {
      id: newInstId,
      name: instData.name.trim(),
      city: instData.city.trim(),
      department: instData.department.trim(),
      address: instData.address.trim(),
      phone: instData.phone.trim(),
      requireLoginForScan: false,
      nextConsecutive: instData.nextConsecutive || 1,
    };
    setInstitutions([newInst]);

    // 3. Engineer User
    const engId = `user-eng-${Date.now()}`;
    const engUser: UserProfile = {
      id: engId,
      fullName: engineerData.fullName.trim(),
      email: engineerData.email.trim(),
      cargo: engineerData.cargo.trim() || 'Ingeniero Biomédico',
      rh: engineerData.rh.trim(),
      role: 'ingeniero',
      institutionId: newInstId,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    // Also auto-create hospital admin account
    const adminUser: UserProfile = {
      id: `user-admin-${Date.now()}`,
      fullName: `Admin ${instData.name}`,
      email: `admin@${engineerData.email.split('@')[1] || 'hospital.com'}`,
      cargo: 'Administrador Hospitalario',
      role: 'admin_hospital',
      institutionId: newInstId,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setUsers([engUser, adminUser]);
    setCurrentUserProfile(engUser);
    setIsSetupWizardOpen(false);
    setActiveTab('inicio');

    try {
      setDoc(doc(db, 'company_profile', 'main'), newCompany).catch(() => {});
      setDoc(doc(db, 'institutions', newInstId), newInst).catch(() => {});
      setDoc(doc(db, 'users', engId), engUser).catch(() => {});
      setDoc(doc(db, 'users', adminUser.id), adminUser).catch(() => {});
    } catch {}

    setScanFeedback(`¡Configuración inicial completada! Bienvenido a BIO-TAG.`);
    setTimeout(() => setScanFeedback(null), 5000);
  };

  // Alerts & Notifications
  const getOverdueOrUpcomingEquipments = () => {
    const hospitalId = currentUserProfile?.institutionId;
    const targetEquipments = equipments.filter((eq) => {
      if (!hospitalId) return true;
      return eq.institutionId === hospitalId;
    });

    const overdue: BiomedicalEquipment[] = [];
    const upcoming: BiomedicalEquipment[] = [];

    targetEquipments.forEach((eq) => {
      const latest = getLatestMaintenance(eq.id);
      const nextDate = latest?.proximaFechaCalculada || '';
      const st = getMaintenanceStatus(nextDate);
      if (st.status === 'vencido') {
        overdue.push(eq);
      } else if (st.status === 'proximo') {
        upcoming.push(eq);
      }
    });

    return { overdue, upcoming };
  };

  const triggerOverdueEmailAlert = (equipmentId: string) => {
    const eq = equipments.find((e) => e.id === equipmentId);
    if (!eq) return;
    const inst = institutions.find((i) => i.id === eq.institutionId);
    const latest = getLatestMaintenance(eq.id);

    const newNotification: EmailNotification = {
      id: `notif-${Date.now()}`,
      equipmentId,
      institutionId: eq.institutionId,
      recipientEmail: currentUserProfile?.email || 'ingenieria@hospital.com',
      recipientRole: 'Ingeniero Biomédico & Dirección Médica',
      subject: `🚨 ALERTA CRÍTICA: Mantenimiento Vencido - ${eq.nombre} (${eq.codigoActivo})`,
      body: `El equipo ${eq.nombre} (${eq.marca} ${eq.modelo}, Serie: ${eq.serie}) ubicado en ${eq.servicioUbicacion} presenta mantenimiento vencido desde el ${latest?.proximaFechaCalculada}. Requiere intervención inmediata para garantizar bioseguridad del paciente.`,
      sentAt: new Date().toLocaleString('es-CO'),
    };

    setEmailNotifications((prev) => [newNotification, ...prev]);
    setScanFeedback(`Alerta enviada por correo a ${currentUserProfile?.email || 'Ingeniería'}.`);
    setTimeout(() => setScanFeedback(null), 4000);
  };

  const resetToInitialData = () => {
    setCompanyProfile(INITIAL_COMPANY_PROFILE);
    setInstitutions(INITIAL_INSTITUTIONS);
    setUsers(INITIAL_USERS);
    setEquipments(INITIAL_EQUIPMENT);
    setMaintenances(INITIAL_MAINTENANCE_RECORDS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setIncidents(INITIAL_INCIDENTS);
    setCurrentUserProfile(null);
    setActiveEquipmentId('');
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY_VERSION, 'true');
    setIsSetupWizardOpen(true);
    setActiveTab('inicio');
    setScanFeedback('Sistema restablecido. Asistente de configuración abierto.');
    setTimeout(() => setScanFeedback(null), 4000);
  };

  return (
    <BiomedicalContext.Provider
      value={{
        companyProfile,
        updateCompanyProfile,
        fbUser,
        currentUserProfile,
        isAuthenticated,
        authRole,
        isIngeniero,
        isAdminHospital,
        isEnfermeria,
        isConsulta,
        loginError,
        loginWithEmail,
        quickLoginAs,
        logout,
        institutions,
        equipments,
        maintenances,
        users,
        incidents,
        auditLogs,
        emailNotifications,
        selectedInstitution,
        activeEquipmentId,
        selectedEquipment,
        activeTab,
        darkMode,
        scanFeedback,
        globalSearchQuery,
        isSetupWizardOpen,
        setIsSetupWizardOpen,
        completeOnboardingSetup,
        isDirectScanMode,
        scannedToken,
        scannedEquipment,
        isTagInvalidOrDeactivated,
        requiresLoginToScan,
        exitDirectScanMode,
        enterDirectScanByToken,
        setActiveEquipmentId,
        setActiveTab,
        toggleDarkMode,
        setScanFeedback,
        setGlobalSearchQuery,
        addEquipment,
        updateEquipment,
        addMaintenance,
        addIncident,
        bindNewTag,
        deactivateTag,
        createHospitalUser,
        toggleUserActive,
        createInstitution,
        updateHospitalSettings,
        getOverdueOrUpcomingEquipments,
        triggerOverdueEmailAlert,
        getMaintenancesForEquipment,
        getLatestMaintenance,
        calculateNextDate,
        getMaintenanceStatus,
        resetToInitialData,
      }}
    >
      {children}
    </BiomedicalContext.Provider>
  );
};

export const useBiomedical = () => {
  const context = useContext(BiomedicalContext);
  if (!context) {
    throw new Error('useBiomedical must be used within a BiomedicalProvider');
  }
  return context;
};
