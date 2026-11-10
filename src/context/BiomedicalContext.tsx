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
} from '../data/initialData';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
  sendPasswordReset,
  changeUserPassword,
  logoutAndClearCache,
  getBootstrapStatusRemote,
  bootstrapAdminRemote,
  createHospitalUserRemote,
  setHospitalUserActiveRemote,
  syncMyClaimsRemote,
  saveEquipmentRemote,
  setEquipmentTagStateRemote,
  createMaintenanceRemote,
  createIncidentRemote,
  getPublicEquipmentByTokenRemote,
} from '../firebase';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  updateDoc,
  getDocFromServer,
  query,
  where,
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
    adminData: { fullName: string; email: string; pass: string; bootstrapCode: string; cargo?: string; rh?: string }
  ) => Promise<void>;

  // Direct Mobile Scan Mode (/e/[TOKEN])
  isDirectScanMode: boolean;
  scannedToken: string | null;
  scannedEquipment: BiomedicalEquipment | null;
  isTagInvalidOrDeactivated: boolean;
  requiresLoginToScan: boolean;
  isPublicScanLoading: boolean;
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
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [equipments, setEquipments] = useState<BiomedicalEquipment[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
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

  const [hasAnyAdmin, setHasAnyAdmin] = useState<boolean>(true);
  const [isPublicScanLoading, setIsPublicScanLoading] = useState(false);
  const [publicScanFound, setPublicScanFound] = useState<boolean | null>(null);
  const [publicScanRequiresLogin, setPublicScanRequiresLogin] = useState(false);

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
    getBootstrapStatusRemote()
      .then(({ configured }) => setHasAnyAdmin(configured))
      .catch(() => {
        // Fail closed: never expose initial setup merely because the status
        // endpoint is unavailable.
        setHasAnyAdmin(true);
      });
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

  // Public company branding is the only Firestore listener opened before login.
  useEffect(() => {
    return onSnapshot(
      doc(db, 'companies', 'main'),
      (snap) => {
        if (snap.exists()) setCompanyProfile(snap.data() as CompanyProfile);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'companies/main')
    );
  }, []);

  // Resolve Firebase Auth first, then fetch the profile strictly by UID.
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      setIsAuthLoading(true);
      setFbUser(user);

      if (!user) {
        setCurrentUserProfile(null);
        setIsAuthLoading(false);
        return;
      }

      try {
        const profileSnap = await getDocFromServer(doc(db, 'users', user.uid));
        if (!profileSnap.exists() || profileSnap.data().active !== true) {
          await firebaseSignOut(auth);
          setCurrentUserProfile(null);
          setSessionExpiredMessage(
            profileSnap.exists()
              ? 'Tu cuenta ha sido desactivada por el administrador.'
              : 'La cuenta no tiene un perfil autorizado en BIO-TAG.'
          );
          return;
        }
        try {
          await syncMyClaimsRemote();
          await user.getIdToken(true);
        } catch (claimError: any) {
          console.warn('No se pudieron actualizar los permisos del token:', claimError?.code);
        }
        if (!cancelled) setCurrentUserProfile(profileSnap.data() as UserProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        await firebaseSignOut(auth).catch(() => undefined);
        if (!cancelled) {
          setCurrentUserProfile(null);
          setSessionExpiredMessage('No fue posible validar los permisos de la cuenta.');
        }
      } finally {
        if (!cancelled) setIsAuthLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Watch the signed-in profile so account deactivation takes effect without
  // waiting for the Auth token to expire.
  useEffect(() => {
    if (!fbUser || !currentUserProfile) return;

    const forceLogout = async () => {
      await logoutAndClearCache();
      window.location.href = '/?reason=account-disabled';
    };
    return onSnapshot(
      doc(db, 'users', fbUser.uid),
      (snapshot) => {
        if (!snapshot.exists() || snapshot.data().active !== true) {
          void forceLogout();
          return;
        }
        setCurrentUserProfile(snapshot.data() as UserProfile);
      },
      () => {
        // An inactive profile loses permission to read itself under the rules.
        void forceLogout();
      }
    );
  }, [fbUser?.uid, currentUserProfile?.id]);

  // Close unattended sessions on shared hospital workstations after 30 minutes.
  useEffect(() => {
    if (!currentUserProfile) return;

    const idleMilliseconds = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    const expireSession = async () => {
      setSessionExpiredMessage('La sesión se cerró por 30 minutos de inactividad.');
      setCurrentUserProfile(null);
      setFbUser(null);
      await logoutAndClearCache();
      window.location.href = '/?reason=idle';
    };
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(expireSession, idleMilliseconds);
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    document.addEventListener('visibilitychange', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      document.removeEventListener('visibilitychange', resetTimer);
    };
  }, [currentUserProfile?.id]);

  // Protected real-time listeners are created only after a valid profile is loaded
  // and every query is constrained to the user's institution.
  useEffect(() => {
    if (!currentUserProfile?.active) {
      setInstitutions([]);
      setUsers([]);
      setEquipments([]);
      setMaintenances([]);
      setIncidents([]);
      setAuditLogs([]);
      setIsInitialDataLoaded(false);
      return;
    }

    const institutionId = currentUserProfile.institutionId;
    const unsubscribers: Array<() => void> = [];
    let coreCollectionsLoaded = 0;
    const markLoaded = () => {
      coreCollectionsLoaded += 1;
      if (coreCollectionsLoaded >= 3) setIsInitialDataLoaded(true);
    };

    unsubscribers.push(onSnapshot(
      doc(db, 'institutions', institutionId),
      (snap) => {
        setInstitutions(snap.exists() ? [snap.data() as Institution] : []);
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.GET, `institutions/${institutionId}`)
    ));

    unsubscribers.push(onSnapshot(
      query(collection(db, 'equipments'), where('institutionId', '==', institutionId)),
      (snapshot) => {
        setEquipments(snapshot.docs.map((item) => item.data() as BiomedicalEquipment));
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'equipments')
    ));

    unsubscribers.push(onSnapshot(
      query(collection(db, 'maintenances'), where('institutionId', '==', institutionId)),
      (snapshot) => {
        setMaintenances(snapshot.docs.map((item) => item.data() as MaintenanceRecord));
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'maintenances')
    ));

    unsubscribers.push(onSnapshot(
      query(collection(db, 'incidents'), where('institutionId', '==', institutionId)),
      (snapshot) => setIncidents(snapshot.docs.map((item) => item.data() as IncidentReport)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'incidents')
    ));

    if (currentUserProfile.role === 'admin_hospital') {
      unsubscribers.push(onSnapshot(
        query(collection(db, 'users'), where('institutionId', '==', institutionId)),
        (snapshot) => setUsers(snapshot.docs.map((item) => item.data() as UserProfile)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      ));
    } else {
      setUsers([currentUserProfile]);
    }

    if (currentUserProfile.role === 'admin_hospital' || currentUserProfile.role === 'ingeniero') {
      unsubscribers.push(onSnapshot(
        query(collection(db, 'audit_logs'), where('institutionId', '==', institutionId)),
        (snapshot) => setAuditLogs(snapshot.docs.map((item) => item.data() as AuditLog)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
      ));
    } else {
      setAuditLogs([]);
    }

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [currentUserProfile?.id, currentUserProfile?.institutionId, currentUserProfile?.role, currentUserProfile?.active]);

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

  // A public QR/NFC lookup is performed through a rate-limited callable
  // function. The browser never lists the equipment collection.
  useEffect(() => {
    if (!scannedToken) {
      setPublicScanFound(null);
      setPublicScanRequiresLogin(false);
      return;
    }

    let cancelled = false;
    setIsPublicScanLoading(true);
    setPublicScanFound(null);
    getPublicEquipmentByTokenRemote(scannedToken)
      .then((result) => {
        if (cancelled) return;
        setPublicScanFound(result.found);
        setPublicScanRequiresLogin(Boolean(result.requiresLogin));

        if (result.found && result.institution) {
          const institution = result.institution as unknown as Institution;
          setInstitutions((current) => {
            const withoutCurrent = current.filter((item) => item.id !== institution.id);
            return [institution, ...withoutCurrent];
          });
        }
        if (result.found && result.equipment) {
          const equipment = result.equipment as unknown as BiomedicalEquipment;
          setEquipments((current) => {
            const withoutCurrent = current.filter((item) => item.id !== equipment.id);
            return [equipment, ...withoutCurrent];
          });
          setActiveEquipmentId(equipment.id);
        }
        if (result.latestMaintenance) {
          const maintenance = result.latestMaintenance as unknown as MaintenanceRecord;
          setMaintenances((current) => {
            const withoutCurrent = current.filter((item) => item.id !== maintenance.id);
            return [maintenance, ...withoutCurrent];
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPublicScanFound(false);
          setScanFeedback('No fue posible validar la etiqueta. Verifica la conexión e intenta nuevamente.');
        }
        console.warn('Public tag lookup failed:', err instanceof Error ? err.message : 'unknown');
      })
      .finally(() => {
        if (!cancelled) setIsPublicScanLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scannedToken, isAuthenticated]);

  // Scanned Equipment Logic
  const scannedEquipment = scannedToken
    ? equipments.find((e) => e.tagToken.toLowerCase() === scannedToken.toLowerCase()) || null
    : null;

  const isTagInvalidOrDeactivated =
    Boolean(scannedToken) && publicScanFound === false && !isPublicScanLoading;

  const scannedInstitution = scannedEquipment
    ? institutions.find((i) => i.id === scannedEquipment.institutionId)
    : undefined;

  const requiresLoginToScan = publicScanRequiresLogin && !isAuthenticated;

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
    if (!isAdminHospital) {
      throw new Error('Solo el administrador del hospital puede modificar la empresa.');
    }
    const updated: CompanyProfile = {
      ...companyProfile,
      ...data,
      id: 'main',
      updatedAt: new Date().toISOString(),
    };

    setCompanyProfile(updated);

    try {
      await setDoc(doc(db, 'companies', 'main'), updated);
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

      const profileSnap = await getDocFromServer(doc(db, 'users', user.uid));
      if (!profileSnap.exists() || profileSnap.data().active !== true) {
        await firebaseSignOut(auth);
        setLoginError(
          profileSnap.exists()
            ? 'Tu cuenta ha sido desactivada por el administrador.'
            : 'Esta cuenta no tiene acceso autorizado a BIO-TAG.'
        );
        return false;
      }

      const userProfile = profileSnap.data() as UserProfile;

      await syncMyClaimsRemote();
      await user.getIdToken(true);

      // Successful login resets rate-limiting counter
      setFailedLoginAttempts(0);
      setLockoutEndTime(null);

      setCurrentUserProfile(userProfile);

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
    } catch (err: any) {
      // Keep the response identical for registered and unregistered addresses.
      console.warn('Password reset request result:', err?.code || 'unknown');
    }
    setScanFeedback('Si la cuenta existe, recibirás un correo para restablecer la contraseña.');
    setTimeout(() => setScanFeedback(null), 4000);
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
      const targetMonthIndex = month - 1 + months;
      const lastDayOfTargetMonth = new Date(year, targetMonthIndex + 1, 0).getDate();
      const date = new Date(year, targetMonthIndex, Math.min(day, lastDayOfTargetMonth));
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

  // Secure operations used by the provider.
  const addEquipment = async (eq: BiomedicalEquipment) => {
    if (!isIngeniero) throw new Error('Solo un ingeniero biomédico activo puede registrar equipos.');
    const response = await saveEquipmentRemote(eq as unknown as Record<string, unknown>);
    const saved = response.equipment as unknown as BiomedicalEquipment;
    setActiveEquipmentId(saved.id);
    setScanFeedback(`Equipo ${saved.nombre} registrado de forma segura.`);
    setTimeout(() => setScanFeedback(null), 3500);
  };

  const updateEquipment = async (eq: BiomedicalEquipment, _changeSummary?: string) => {
    if (!isIngeniero) throw new Error('Solo un ingeniero biomédico activo puede editar equipos.');
    const response = await saveEquipmentRemote(eq as unknown as Record<string, unknown>);
    const saved = response.equipment as unknown as BiomedicalEquipment;
    setScanFeedback(`Hoja de vida de ${saved.nombre} actualizada de forma segura.`);
    setTimeout(() => setScanFeedback(null), 3500);
  };

  const bindNewTag = async (equipmentId: string): Promise<string> => {
    if (!isIngeniero) throw new Error('Solo un ingeniero biomédico activo puede rotar etiquetas.');
    const response = await setEquipmentTagStateRemote(equipmentId, 'rotate');
    setScanFeedback('Nueva etiqueta vinculada. La anterior quedó invalidada.');
    setTimeout(() => setScanFeedback(null), 3500);
    return response.token;
  };

  const deactivateTag = async (equipmentId: string): Promise<void> => {
    if (!isIngeniero) throw new Error('Solo un ingeniero biomédico activo puede desactivar etiquetas.');
    await setEquipmentTagStateRemote(equipmentId, 'deactivate');
    setScanFeedback('Etiqueta desactivada de forma segura.');
    setTimeout(() => setScanFeedback(null), 3500);
  };

  const addMaintenance = async (
    record: Omit<MaintenanceRecord, 'id' | 'consecutivo' | 'numeroReporte'>
  ): Promise<string> => {
    if (!isIngeniero) throw new Error('Solo un ingeniero biomédico activo puede radicar mantenimientos.');
    const response = await createMaintenanceRemote(record as unknown as Record<string, unknown>);
    const saved = response.maintenance as unknown as MaintenanceRecord;
    setScanFeedback(`Reporte ${saved.numeroReporte} registrado con transacción segura.`);
    setTimeout(() => setScanFeedback(null), 4000);
    return saved.id;
  };

  const addIncident = async (
    incident: Omit<IncidentReport, 'id' | 'createdAt'>
  ): Promise<void> => {
    if (!currentUserProfile || isConsulta) {
      throw new Error('Tu cuenta no está autorizada para reportar incidentes.');
    }
    await createIncidentRemote(incident as unknown as Record<string, unknown>);
    setScanFeedback('Reporte de falla remitido a Ingeniería Biomédica.');
    setTimeout(() => setScanFeedback(null), 4000);
  };

  const createHospitalUser = async (
    userData: Omit<UserProfile, 'id' | 'createdAt'>
  ): Promise<void> => {
    if (!isAdminHospital) throw new Error('Solo el administrador puede registrar usuarios.');
    const response = await createHospitalUserRemote(userData as unknown as Record<string, unknown>);
    try {
      await sendPasswordReset(response.email);
    } catch {
      throw new Error(
        `La cuenta fue creada, pero no se pudo enviar la invitación a ${response.email}. ` +
        'Reintenta mediante “Restablecer contraseña”.'
      );
    }
    setScanFeedback(`Usuario creado. Invitación enviada a ${response.email}.`);
    setTimeout(() => setScanFeedback(null), 4500);
  };

  const toggleUserActive = async (userId: string): Promise<void> => {
    if (!isAdminHospital) throw new Error('Solo el administrador puede modificar cuentas.');
    const target = users.find((user) => user.id === userId);
    if (!target) throw new Error('Usuario no encontrado en tu institución.');
    const active = !target.active;
    await setHospitalUserActiveRemote(userId, active);
    setScanFeedback(`Cuenta de ${target.fullName} ${active ? 'activada' : 'desactivada'}.`);
    setTimeout(() => setScanFeedback(null), 3500);
  };

  const createInstitution = async (instData: Omit<Institution, 'id'>): Promise<string> => {
    if (!isAdminHospital) throw new Error('Solo el administrador puede crear instituciones.');
    const id = `inst-${crypto.randomUUID()}`;
    await setDoc(doc(db, 'institutions', id), { ...instData, id });
    return id;
  };

  const updateHospitalSettings = async (
    institutionId: string,
    settings: { requireLoginForScan?: boolean }
  ): Promise<void> => {
    if (!isAdminHospital || institutionId !== currentUserProfile?.institutionId) {
      throw new Error('No estás autorizado para modificar esta institución.');
    }
    await updateDoc(doc(db, 'institutions', institutionId), settings);
    setScanFeedback('Configuración de seguridad del hospital actualizada.');
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const completeCompanyAndAdminRegistration = async (
    companyData: Partial<CompanyProfile>,
    instData: { name: string; city: string; department: string; address: string; phone: string; nextConsecutive: number },
    adminData: { fullName: string; email: string; pass: string; bootstrapCode: string; cargo?: string; rh?: string }
  ): Promise<void> => {
    await bootstrapAdminRemote({
      bootstrapCode: adminData.bootstrapCode,
      company: companyData,
      institution: instData,
      admin: {
        fullName: adminData.fullName,
        email: adminData.email,
        password: adminData.pass,
        cargo: adminData.cargo,
        rh: adminData.rh,
      },
    });
    await signInWithEmailAndPassword(auth, adminData.email.trim().toLowerCase(), adminData.pass);
    setHasAnyAdmin(true);
    setIsSetupWizardOpen(false);
    setActiveTab('inicio');
    setScanFeedback('Empresa y administrador creados mediante configuración segura.');
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
    setScanFeedback('Alerta registrada. El envío de correo requiere configurar un proveedor transaccional en el backend.');
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
        isPublicScanLoading,
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
