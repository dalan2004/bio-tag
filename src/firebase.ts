import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  Firestore,
  terminate,
  clearIndexedDbPersistence,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Primary Firebase App
export const app = initializeApp(firebaseConfig);

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim();
if (appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

// Initialize Cloud Firestore with offline multi-tab persistent cache
export const db: Firestore = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  firebaseConfig.firestoreDatabaseId
);

// Session persistence limits exposure on shared hospital workstations. The user
// remains signed in across reloads, but not after closing the browser tab.
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn('Firebase Auth persistence setup note:', err);
});

// Firebase Storage for logos and biomedical equipment photos
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

export interface PublicScanResult {
  found: boolean;
  requiresLogin?: boolean;
  institution?: Record<string, unknown>;
  equipment?: Record<string, unknown>;
  latestMaintenance?: Record<string, unknown> | null;
}

async function callFunction<TRequest, TResponse>(name: string, data: TRequest): Promise<TResponse> {
  const callable = httpsCallable<TRequest, TResponse>(functions, name, {
    limitedUseAppCheckTokens: true,
  });
  const response = await callable(data);
  return response.data;
}

export const getBootstrapStatusRemote = () =>
  callFunction<Record<string, never>, { configured: boolean }>('getBootstrapStatus', {});

export const bootstrapAdminRemote = (data: Record<string, unknown>) =>
  callFunction<Record<string, unknown>, { success: boolean; email: string }>('bootstrapAdmin', data);

export const createHospitalUserRemote = (data: Record<string, unknown>) =>
  callFunction<Record<string, unknown>, { uid: string; email: string }>('createHospitalUser', data);

export const setHospitalUserActiveRemote = (userId: string, active: boolean) =>
  callFunction<{ userId: string; active: boolean }, { success: boolean }>(
    'setHospitalUserActive',
    { userId, active }
  );

export const syncMyClaimsRemote = () =>
  callFunction<Record<string, never>, { success: boolean }>('syncMyClaims', {});

export const saveEquipmentRemote = (equipment: Record<string, unknown>) =>
  callFunction<
    { equipment: Record<string, unknown> },
    { equipment: Record<string, unknown> }
  >('saveEquipment', { equipment });

export const setEquipmentTagStateRemote = (
  equipmentId: string,
  operation: 'rotate' | 'deactivate'
) =>
  callFunction<
    { equipmentId: string; operation: 'rotate' | 'deactivate' },
    { token: string; active: boolean }
  >('setEquipmentTagState', { equipmentId, operation });

export const createMaintenanceRemote = (record: Record<string, unknown>) =>
  callFunction<
    { record: Record<string, unknown> },
    { maintenance: Record<string, unknown> }
  >('createMaintenance', { record });

export const createIncidentRemote = (incident: Record<string, unknown>) =>
  callFunction<
    { incident: Record<string, unknown> },
    { incident: Record<string, unknown> }
  >('createIncident', { incident });

export const updateIncidentStatusRemote = (
  incidentId: string,
  status: 'pendiente' | 'en_revision' | 'resuelto'
) =>
  callFunction<
    { incidentId: string; status: 'pendiente' | 'en_revision' | 'resuelto' },
    { success: boolean }
  >('updateIncidentStatus', { incidentId, status });

export const getPublicEquipmentByTokenRemote = (token: string) =>
  callFunction<{ token: string }, PublicScanResult>('getPublicEquipmentByToken', { token });

export function getPublicAppUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  return (configured || window.location.origin).replace(/\/$/, '');
}

/**
 * Uploads a file (photo or logo) directly to Firebase Storage and returns the public HTTPS download URL.
 * Falls back gracefully if offline or in case of temporary storage restriction.
 */
export async function uploadFileToStorage(file: File, folder: string): Promise<string> {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowedTypes.has(file.type)) {
    throw new Error('Solo se permiten imágenes JPEG, PNG o WebP.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar 5 MB.');
  }
  const validFolder =
    folder === 'company_logos/main' ||
    /^institutions\/[a-zA-Z0-9_-]{1,128}\/equipment_photos$/.test(folder);
  if (!validFolder) {
    throw new Error('La ruta de almacenamiento no está autorizada.');
  }

  const uniqueId = crypto.randomUUID();
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const storageRef = ref(storage, `${folder}/${uniqueId}.${extension}`);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=3600',
  });
  return getDownloadURL(snapshot.ref);
}

/**
 * Checks password complexity: minimum 8 characters, letters and numbers.
 */
export interface PasswordStrength {
  isValid: boolean;
  hasMinLength: boolean;
  hasLetters: boolean;
  hasNumbers: boolean;
  hasSpecial: boolean;
  score: number; // 0 to 4
  message: string;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 12;
  const hasLetters = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasLetters) score++;
  if (hasNumbers) score++;
  if (hasSpecial) score++;

  const isValid = hasMinLength && hasLetters && hasNumbers && hasSpecial;
  let message = 'Mínimo 12 caracteres, mayúscula, minúscula, número y símbolo';
  if (!hasMinLength) {
    message = 'Mínimo 12 caracteres requeridos';
  } else if (!hasLetters || !hasNumbers || !hasSpecial) {
    message = 'Debe incluir mayúscula, minúscula, número y símbolo';
  } else if (score >= 4) {
    message = 'Contraseña fuerte y segura';
  } else {
    message = 'Contraseña válida';
  }

  return {
    isValid,
    hasMinLength,
    hasLetters,
    hasNumbers,
    hasSpecial,
    score,
    message,
  };
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

/**
 * Changes the current authenticated user's password, requiring current password verification.
 */
export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.email) {
    throw new Error('No hay una sesión de usuario activa.');
  }

  const strength = checkPasswordStrength(newPassword);
  if (!strength.isValid) {
    throw new Error('La nueva contraseña debe tener 12 caracteres e incluir mayúscula, minúscula, número y símbolo.');
  }

  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);
  await updatePassword(auth.currentUser, newPassword);
}

/**
 * Complete teardown: signs out of Firebase Auth, terminates Firestore listeners,
 * and clears the offline IndexedDB persistence cache.
 */
export async function logoutAndClearCache(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (e) {
    console.warn('Terminate and clear IndexedDb note:', e);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore operation failed', {
    operationType: errInfo.operationType,
    path: errInfo.path,
    error: errInfo.error,
  });
  return errInfo;
}

// Read only the intentionally public branding document for connectivity checks.
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'companies', 'main'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network connecting...');
    }
  }
}
