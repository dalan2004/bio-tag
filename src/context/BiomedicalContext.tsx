import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
  createSecondaryUser,
  sendPasswordReset,
  changeUserPassword,
  logoutAndClearCache,
} from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

interface BiomedicalContextType {
  // Loading & Sync
  isAuthLoading: boolean;
  isInitialDataLoaded: boolean;
  hasAnyAdmin: boolean;

  // Session & Security
  sessionExpiredMessage: string | null;
  setSessionExpiredMessage: (msg: string | null) => void;
  failedLoginAttempts: number;
  isLockedOut: boolean;
  lockoutRemainingSeconds: number;

  // Company & White-Label
  companyProfile: CompanyProfile;
  updateCompanyProfile: (data: Partial<CompanyProfile>) => Promise<void>;

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
  logout: () => Promise<void>;
  sendUserPasswordReset: (email: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;

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

  // Onboarding Wizard (Only available if no admin exists)
  isSetupWizardOpen: boolean;
  setIsSetupWizardOpen: (open: boolean) => void;
  completeCompanyAndAdminRegistration: (
    company: Partial<CompanyProfile>,
    institution: { name: string; city: string; department: string; address: string; phone: string; nextConsecutive: number },
    adminData: { fullName: string; email: string; pass: string; cargo?: string; rh?: string }
  ) => Promise<void>;

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

  // CRUD & Operations (Persisted directly to Cloud Firestore)
  addEquipment: (eq: BiomedicalEquipment) => Promise<void>;
  updateEquipment: (eq: BiomedicalEquipment, changeSummary?: string) => Promise<void>;
  addMaintenance: (record: Omit<MaintenanceRecord, 'id' | 'consecutivo' | 'numeroReporte'>) => Promise<string>;
  addIncident: (incident: Omit<IncidentReport, 'id' | 'createdAt'>) => Promise<void>;
  bindNewTag: (equipmentId: string) => Promise<string>;
  deactivateTag: (equipmentId: string) => Promise<void>;

  // Hospital & Company Admin Actions
  createHospitalUser: (userData: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<void>;
  toggleUserActive: (userId: string) => Promise<void>;
  createInstitution: (inst: Omit<Institution, 'id'>) => Promise<string>;
  updateHospitalSettings: (institutionId: string, settings: { requireLoginForScan?: boolean }) => Promise<void>;

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

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 60;

export const BiomedicalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Loading & Initialization state
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState<boolean>(false);

  // Invalidation & Rate-Limiting State
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
  const [failedLoginAttempts, setFailedLoginAttempts] = useState<number>(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  // Core Data States - Populated exclusively from Firestore
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY_PROFILE);
  const [institutions, setInstitutions] = useState<Institution[]>(INITIAL_INSTITUTIONS);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [equipments, setEquipments] = useState<BiomedicalEquipment[]>(INITIAL_EQUIPMENT);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE_RECORDS);
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([]);

  // Auth State
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // UI Navigation
  const [activeEquipmentId, setActiveEquipmentId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Setup Wizard State (Only opens when there are no administrators registered)
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(false);

  // Direct Mobile Scan State (/e/[TOKEN])
  const [isDirectScanMode, setIsDirectScanMode] = useState(false);
  const [scannedToken, setScannedToken] = useState<string | null>(null);

  // Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Track initial collections loaded counter
  const loadedCollectionsCount = useRef(0);

  // Rate Limiting Countdown Timer
  useEffect(() => {
    if (!lockoutEndTime) {
      setLockoutRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((lockoutEndTime - now) / 1000));
      setLockoutRemainingSeconds(remaining);
      if (remaining <= 0) {
        setLockoutEndTime(null);
        setFailedLoginAttempts(0);
        setLoginError(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  const isLockedOut = lockoutRemainingSeconds > 0;

  // Check initial Firestore connection
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Theme handling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  // ==========================================
  // REAL-TIME FIRESTORE SYNCHRONIZATION
  // ==========================================
  useEffect(() => {
    const checkAllLoaded = () => {
      loadedCollectionsCount.current += 1;
      if (loadedCollectionsCount.current >= 4) {
        setIsInitialDataLoaded(true);
      }
    };

    // 1. Company Profile listener
    const unsubCompany = onSnapshot(
      doc(db, 'companies', 'main'),
      (snap) => {
        if (snap.exists()) {
          setCompanyProfile(snap.data() as CompanyProfile);
        }
        checkAllLoaded();
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'companies/main');
        checkAllLoaded();
      }
    );

    // 2. Institutions listener
    const unsubInstitutions = onSnapshot(
      collection(db, 'institutions'),
      (snapshot) => {
        const list: Institution[] = [];
        snapshot.forEach((d) => list.push(d.data() as Institution));
        setInstitutions(list);
        checkAllLoaded();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'institutions');
        checkAllLoaded();
      }
    );

    // 3. Users listener
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => list.push(d.data() as UserProfile));
        setUsers(list);
        checkAllLoaded();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
        checkAllLoaded();
      }
    );

    // 4. Equipment listener
    const unsubEquipments = onSnapshot(
      collection(db, 'equipments'),
      (snapshot) => {
        const list: BiomedicalEquipment[] = [];
        snapshot.forEach((d) => list.push(d.data() as BiomedicalEquipment));
        setEquipments(list);
        checkAllLoaded();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'equipments');
        checkAllLoaded();
      }
    );

    // 5. Maintenances listener
    const unsubMaintenances = onSnapshot(
      collection(db, 'maintenances'),
      (snapshot) => {
        const list: MaintenanceRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as MaintenanceRecord));
        setMaintenances(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'maintenances');
      }
    );

    // 6. Incidents listener
    const unsubIncidents = onSnapshot(
      collection(db, 'incidents'),
      (snapshot) => {
        const list: IncidentReport[] = [];
        snapshot.forEach((d) => list.push(d.data() as IncidentReport));
        setIncidents(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'incidents');
      }
    );

    // 7. Audit Logs listener
    const unsubAudit = onSnapshot(
      collection(db, 'audit_logs'),
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((d) => list.push(d.data() as AuditLog));
        setAuditLogs(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'audit_logs');
      }
    );

    return () => {
      unsubCompany();
      unsubInstitutions();
      unsubUsers();
      unsubEquipments();
      unsubMaintenances();
      unsubIncidents();
      unsubAudit();
    };
  }, []);

  // Determine if the system already has any administrator registered
  const hasAnyAdmin = useMemo(() => {
    return users.some((u) => (u.role === 'admin_hospital' || u.role === 'ingeniero') && u.active);
  }, [users]);

  // ==========================================
  // FIREBASE AUTH LISTENER (browserLocalPersistence)
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      if (user && user.email) {
        const normalizedEmail = user.email.toLowerCase();
        const found = users.find(
          (u) => u.id === user.uid || u.email.toLowerCase() === normalizedEmail
        );
        if (found) {
          if (!found.active) {
            // Deactivated user: forcibly terminate session
            logoutAndClearCache().catch(() => {});
            setCurrentUserProfile(null);
            setSessionExpiredMessage('Tu cuenta ha sido desactivada por el Administrador.');
          } else {
            setCurrentUserProfile(found);
          }
        }
      } else {
        if (!user) {
          setCurrentUserProfile(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [users]);

  // Live check: If the active user profile is deactivated while currently browsing, logout immediately
  useEffect(() => {
    if (currentUserProfile && users.length > 0) {
      const match = users.find((u) => u.id === currentUserProfile.id);
      if (match && !match.active) {
        logoutAndClearCache().catch(() => {});
        setCurrentUserProfile(null);
        setSessionExpiredMessage('Tu cuenta ha sido desactivada por el Administrador.');
      } else if (match) {
        setCurrentUserProfile(match);
      }
    }
  }, [users, currentUserProfile]);

  // Derived Auth Checks
  const isAuthenticated = Boolean(currentUserProfile && fbUser);
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

  // Update Company Profile (Only Admin) - Persisted to Firestore
  const updateCompanyProfile = async (data: Partial<CompanyProfile>) => {
    const updated: CompanyProfile = {
      ...companyProfile,
      ...data,
      id: 'main',
      updatedAt: new Date().toISOString(),
    };

    setCompanyProfile(updated);

    try {
      await setDoc(doc(db, 'companies', 'main'), updated);
      await setDoc(doc(db, 'company_profile', 'main'), updated).catch(() => {});
      setScanFeedback('Guardado: Datos corporativos de la empresa actualizados en Firestore.');
      setTimeout(() => setScanFeedback(null), 3500);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.WRITE, 'companies/main');
      setScanFeedback(`Error al guardar en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  // Login handler with Firebase Authentication, rate limiting, and zero credential leakage
  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setLoginError(null);
    setSessionExpiredMessage(null);

    // Check if lockout is active
    if (lockoutEndTime && Date.now() < lockoutEndTime) {
      const rem = Math.ceil((lockoutEndTime - Date.now()) / 1000);
      setLoginError(`Acceso bloqueado temporalmente por seguridad. Espera ${rem} segundos.`);
      return false;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Authenticate against Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      const user = userCredential.user;

      // Find user profile in Firestore
      const userProfile = users.find(
        (u) => u.id === user.uid || u.email.toLowerCase() === normalizedEmail
      );

      if (userProfile && !userProfile.active) {
        await logoutAndClearCache();
        setLoginError('Tu cuenta ha sido desactivada por el Administrador.');
        return false;
      }

      // Successful login resets rate-limiting counter
      setFailedLoginAttempts(0);
      setLockoutEndTime(null);

      if (userProfile) {
        setCurrentUserProfile(userProfile);
      }

      setScanFeedback('Sesión iniciada correctamente.');
      setTimeout(() => setScanFeedback(null), 3000);
      return true;
    } catch (authErr: any) {
      console.warn('Authentication attempt failed:', authErr?.code);

      // Increment failed attempts
      const newAttempts = failedLoginAttempts + 1;
      setFailedLoginAttempts(newAttempts);

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
        setLockoutEndTime(lockoutTime);
        setLoginError(
          `Has superado los ${MAX_FAILED_ATTEMPTS} intentos fallidos. Acceso bloqueado por ${LOCKOUT_DURATION_SECONDS} segundos.`
        );
      } else {
        // Enforce generic message without indicating whether email or password was wrong
        setLoginError('Correo o contraseña incorrectos.');
      }

      return false;
    }
  };

  // Complete sign out: clears auth, cleans state and memory, terminates Firestore and clears IndexedDb cache
  const logout = async () => {
    try {
      setScanFeedback('Cerrando sesión de forma segura...');
      await logoutAndClearCache();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setCurrentUserProfile(null);
      setFbUser(null);
      setEquipments([]);
      setMaintenances([]);
      setIncidents([]);
      setAuditLogs([]);
      setInstitutions([]);
      setUsers([]);
      setSessionExpiredMessage(null);
      // Clean reload to login screen
      window.location.href = '/';
    }
  };

  // Send password reset email
  const sendUserPasswordReset = async (email: string): Promise<void> => {
    try {
      await sendPasswordReset(email);
      setScanFeedback(`Correo de restablecimiento enviado a ${email}.`);
      setTimeout(() => setScanFeedback(null), 4000);
    } catch (err: any) {
      console.error('Password reset dispatch error:', err);
      throw err;
    }
  };

  // Change current user's password
  const changePassword = async (currentPass: string, newPass: string): Promise<void> => {
    try {
      await changeUserPassword(currentPass, newPass);
      setScanFeedback('Contraseña actualizada exitosamente.');
      setTimeout(() => setScanFeedback(null), 3500);
    } catch (err) {
      throw err;
    }
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

  // Add Equipment (Only Ingeniero) - Persisted directly to Firestore
  const addEquipment = async (eq: BiomedicalEquipment) => {
    if (!isIngeniero && users.length > 0) {
      throw new Error('Solo los usuarios con rol de Ingeniero Biomédico pueden registrar equipos.');
    }

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

    try {
      await setDoc(doc(db, 'equipments', eq.id), eq);
      await setDoc(doc(db, 'audit_logs', log.id), log);
      setActiveEquipmentId(eq.id);
      setScanFeedback(`Guardado: Equipo ${eq.nombre} registrado con éxito en Firestore.`);
      setTimeout(() => setScanFeedback(null), 3500);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.CREATE, `equipments/${eq.id}`);
      setScanFeedback(`Error al guardar en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  // Update Equipment (Only Ingeniero) - Persisted directly to Firestore
  const updateEquipment = async (eq: BiomedicalEquipment, changeSummary?: string) => {
    if (!isIngeniero && users.length > 0) {
      throw new Error('Solo los usuarios con rol de Ingeniero Biomédico pueden editar equipos.');
    }

    const updatedEq: BiomedicalEquipment = {
      ...eq,
      updatedAt: new Date().toISOString().slice(0, 10),
      lastUpdatedBy: `${currentUserProfile?.fullName || 'Ingeniero'} (${currentUserProfile?.rh || ''})`,
    };

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

    try {
      await setDoc(doc(db, 'equipments', eq.id), updatedEq);
      await setDoc(doc(db, 'audit_logs', log.id), log);
      setScanFeedback(`Guardado: Hoja de vida de ${eq.nombre} actualizada en Firestore.`);
      setTimeout(() => setScanFeedback(null), 3500);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.UPDATE, `equipments/${eq.id}`);
      setScanFeedback(`Error al guardar en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  // Bind New NFC / QR Tag (Only Ingeniero) - Persisted to Firestore
  const bindNewTag = async (equipmentId: string): Promise<string> => {
    if (!isIngeniero && users.length > 0) {
      throw new Error('Solo los ingenieros biomédicos pueden vincular etiquetas NFC / QR.');
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

    try {
      await setDoc(doc(db, 'equipments', equipmentId), updated);
      await setDoc(doc(db, 'audit_logs', log.id), log);
      setScanFeedback('Guardado: Nueva etiqueta vinculada con token de 24 caracteres en Firestore.');
      setTimeout(() => setScanFeedback(null), 3500);
      return newToken;
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.UPDATE, `equipments/${equipmentId}`);
      setScanFeedback(`Error al guardar etiqueta en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  // Deactivate Tag (Only Ingeniero) - Persisted to Firestore
  const deactivateTag = async (equipmentId: string): Promise<void> => {
    if (!isIngeniero && users.length > 0) {
      throw new Error('Solo los ingenieros biomédicos pueden desactivar etiquetas.');
    }

    const target = equipments.find((e) => e.id === equipmentId);
    if (!target) return;

    const updated: BiomedicalEquipment = {
      ...target,
      tagActive: false,
      updatedAt: new Date().toISOString().slice(0, 10),
      lastUpdatedBy: `${currentUserProfile?.fullName || 'Ingeniero'} (${currentUserProfile?.rh || ''})`,
    };

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

    try {
      await setDoc(doc(db, 'equipments', equipmentId), updated);
      await setDoc(doc(db, 'audit_logs', log.id), log);
      setScanFeedback('Guardado: Etiqueta desactivada por seguridad. Se preserva todo el historial en Firestore.');
      setTimeout(() => setScanFeedback(null), 3500);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.UPDATE, `equipments/${equipmentId}`);
      setScanFeedback(`Error al desactivar etiqueta en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  // Add Maintenance Report (Only Ingeniero) - Persisted to Firestore
  const addMaintenance = async (
    record: Omit<MaintenanceRecord, 'id' | 'consecutivo' | 'numeroReporte'>
  ): Promise<string> => {
    if (!isIngeniero && users.length > 0) {
      throw new Error('Solo los ingenieros biomédicos están autorizados para radicar reportes de servicio técnico.');
    }

    const inst = institutions.find((i) => i.id === record.institutionId);
    const consecutivo = inst ? inst.nextConsecutive : 1;
    const formattedNum = `No. ${String(consecutivo).padStart(4, '0')}`;

    const id = `maint-${Date.now()}`;
    const newRecord: MaintenanceRecord = {
      ...record,
      id,
      consecutivo,
      numeroReporte: formattedNum,
      trabajoRealizadoPor: currentUserProfile?.fullName || record.trabajoRealizadoPor,
      rh: currentUserProfile?.rh || record.rh,
      cargo: currentUserProfile?.cargo || record.cargo,
      createdBy: currentUserProfile?.id,
      createdAt: new Date().toISOString(),
    };

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

    try {
      await setDoc(doc(db, 'maintenances', id), newRecord);
      await setDoc(doc(db, 'audit_logs', log.id), log);

      // Increment institution consecutive in Firestore
      if (inst) {
        await updateDoc(doc(db, 'institutions', record.institutionId), {
          nextConsecutive: consecutivo + 1,
        });
      }

      setScanFeedback(`Guardado: Reporte ${formattedNum} registrado con éxito en Firestore.`);
      setTimeout(() => setScanFeedback(null), 4000);
      return id;
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.CREATE, `maintenances/${id}`);
      setScanFeedback(`Error al guardar reporte en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  // Add Incident (Nursing / Clinical staff) - Persisted to Firestore
  const addIncident = async (incident: Omit<IncidentReport, 'id' | 'createdAt'>): Promise<void> => {
    const id = `inc-${Date.now()}`;
    const newInc: IncidentReport = {
      ...incident,
      id,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'incidents', id), newInc);
      setScanFeedback('Guardado: Reporte de falla remitido a Ingeniería Biomédica en Firestore.');
      setTimeout(() => setScanFeedback(null), 4000);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.CREATE, `incidents/${id}`);
      setScanFeedback(`Error al radicar falla en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  // Hospital & Company Admin Action: Create new user via secondary Firebase App instance
  // User receives email invitation to set their own password. Admin never sees password.
  const createHospitalUser = async (userData: Omit<UserProfile, 'id' | 'createdAt'>): Promise<void> => {
    if (!isAdminHospital && users.length > 0) {
      throw new Error('Solo el Administrador del Hospital puede registrar nuevos usuarios.');
    }

    try {
      setScanFeedback('Creando usuario seguro en Firebase Auth...');
      const uid = await createSecondaryUser(userData.email);

      const newUser: UserProfile = {
        id: uid,
        email: userData.email.trim().toLowerCase(),
        fullName: userData.fullName.trim(),
        role: userData.role,
        institutionId: userData.institutionId,
        cargo: userData.cargo.trim(),
        rh: userData.rh ? userData.rh.trim() : undefined,
        active: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      await setDoc(doc(db, 'users', uid), newUser);
      setScanFeedback(`Guardado: Usuario ${newUser.fullName} creado. Se envió correo a ${newUser.email} para que configure su contraseña.`);
      setTimeout(() => setScanFeedback(null), 4500);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.CREATE, 'users');
      setScanFeedback(`Error al crear usuario: ${errInfo.error}`);
      throw err;
    }
  };

  // Toggle user activation. Deactivated users are instantly disconnected
  const toggleUserActive = async (userId: string): Promise<void> => {
    if (!isAdminHospital && users.length > 0) {
      throw new Error('Solo el Administrador del Hospital puede modificar el estado de las cuentas.');
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.id === currentUserProfile?.id) {
      throw new Error('No puedes desactivar tu propia cuenta administradora.');
    }

    try {
      const newActive = !targetUser.active;
      await updateDoc(doc(db, 'users', userId), {
        active: newActive,
      });
      setScanFeedback(`Guardado: Cuenta de ${targetUser.fullName} ${newActive ? 'activada' : 'desactivada'}.`);
      setTimeout(() => setScanFeedback(null), 3500);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      setScanFeedback(`Error al actualizar estado en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  const createInstitution = async (instData: Omit<Institution, 'id'>): Promise<string> => {
    const newId = `inst-${Date.now()}`;
    const newInst: Institution = {
      ...instData,
      id: newId,
    };

    try {
      await setDoc(doc(db, 'institutions', newId), newInst);
      setScanFeedback(`Guardado: Hospital ${newInst.name} registrado en Firestore.`);
      setTimeout(() => setScanFeedback(null), 3000);
      return newId;
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.CREATE, `institutions/${newId}`);
      setScanFeedback(`Error al crear hospital en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  const updateHospitalSettings = async (
    institutionId: string,
    settings: { requireLoginForScan?: boolean }
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, 'institutions', institutionId), settings);
      setScanFeedback('Guardado: Configuración del hospital actualizada en Firestore.');
      setTimeout(() => setScanFeedback(null), 3000);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.UPDATE, `institutions/${institutionId}`);
      setScanFeedback(`Error al actualizar configuración en Firestore: ${errInfo.error}`);
      throw err;
    }
  };

  // First-time registration of the buyer company and its master administrator
  const completeCompanyAndAdminRegistration = async (
    companyData: Partial<CompanyProfile>,
    instData: { name: string; city: string; department: string; address: string; phone: string; nextConsecutive: number },
    adminData: { fullName: string; email: string; pass: string; cargo?: string; rh?: string }
  ): Promise<void> => {
    // 1. Company
    const newCompany: CompanyProfile = {
      ...INITIAL_COMPANY_PROFILE,
      ...companyData,
      id: 'main',
      colorPrincipal: companyData.colorPrincipal || '#0f2942',
      updatedAt: new Date().toISOString(),
    };

    // 2. Primary Institution
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

    // 3. Create Real Firebase Auth Account for Master Administrator
    const userCred = await createUserWithEmailAndPassword(
      auth,
      adminData.email.trim().toLowerCase(),
      adminData.pass
    );
    const authUid = userCred.user.uid;

    const adminUser: UserProfile = {
      id: authUid,
      fullName: adminData.fullName.trim(),
      email: adminData.email.trim().toLowerCase(),
      cargo: adminData.cargo?.trim() || 'Director / Administrador Hospitalario',
      rh: adminData.rh?.trim() || undefined,
      role: 'admin_hospital',
      institutionId: newInstId,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    try {
      // Persist to Firestore
      await setDoc(doc(db, 'companies', 'main'), newCompany);
      await setDoc(doc(db, 'company_profile', 'main'), newCompany).catch(() => {});
      await setDoc(doc(db, 'institutions', newInstId), newInst);
      await setDoc(doc(db, 'users', adminUser.id), adminUser);

      setCompanyProfile(newCompany);
      setCurrentUserProfile(adminUser);
      setIsSetupWizardOpen(false);
      setActiveTab('inicio');

      setScanFeedback('¡Cuenta de empresa y administrador creados exitosamente en Firestore!');
      setTimeout(() => setScanFeedback(null), 5000);
    } catch (err) {
      const errInfo = handleFirestoreError(err, OperationType.WRITE, 'company_registration');
      setScanFeedback(`Error al guardar en Firestore: ${errInfo.error}`);
      throw err;
    }
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
    setIsSetupWizardOpen(true);
    setActiveTab('inicio');
    setScanFeedback('Sistema restablecido. Asistente de configuración abierto.');
    setTimeout(() => setScanFeedback(null), 4000);
  };

  return (
    <BiomedicalContext.Provider
      value={{
        isAuthLoading,
        isInitialDataLoaded,
        hasAnyAdmin,
        sessionExpiredMessage,
        setSessionExpiredMessage,
        failedLoginAttempts,
        isLockedOut,
        lockoutRemainingSeconds,
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
        logout,
        sendUserPasswordReset,
        changePassword,
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
        completeCompanyAndAdminRegistration,
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
