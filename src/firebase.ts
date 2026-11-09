import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
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
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Primary Firebase App
export const app = initializeApp(firebaseConfig);

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

// Firebase Auth with local browser persistence (keeps user session across reloads)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase Auth persistence setup note:', err);
});

// Firebase Storage for logos and biomedical equipment photos
export const storage = getStorage(app);

/**
 * Uploads a file (photo or logo) directly to Firebase Storage and returns the public HTTPS download URL.
 * Falls back gracefully if offline or in case of temporary storage restriction.
 */
export async function uploadFileToStorage(file: File, folder: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `${folder}/${timestamp}_${sanitizedName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload warning (falling back to data URL for offline safety):', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
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
  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasLetters) score++;
  if (hasNumbers) score++;
  if (hasSpecial) score++;

  const isValid = hasMinLength && hasLetters && hasNumbers;
  let message = 'Mínimo 8 caracteres con letras y números';
  if (!hasMinLength) {
    message = 'Mínimo 8 caracteres requeridos';
  } else if (!hasLetters || !hasNumbers) {
    message = 'Debe incluir tanto letras como números';
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

/**
 * Creates a new user in Firebase Auth using an isolated secondary Firebase App instance.
 * This guarantees the administrator's active session is NOT interrupted or replaced.
 * Automatically sends a password setup email so the user sets their own private password.
 */
export async function createSecondaryUser(email: string): Promise<string> {
  const apps = getApps();
  let secondaryApp = apps.find((a) => a.name === 'BIO_TAG_SecondaryApp');
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'BIO_TAG_SecondaryApp');
  }
  const secondaryAuth = getAuth(secondaryApp);

  // Cryptographically random 24-character temporary password
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const tempPassword = 'Sec!' + Array.from(randomBytes).map((b) => b.toString(16)).join('') + '9A#';

  const userCred = await createUserWithEmailAndPassword(
    secondaryAuth,
    email.trim().toLowerCase(),
    tempPassword
  );
  const uid = userCred.user.uid;

  // Immediately sign out of secondary auth to release resources
  await fbSignOut(secondaryAuth);

  // Send an invitation / password reset email to the user so they configure their own password
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  } catch (err) {
    console.warn('Note: Could not automatically dispatch password reset email:', err);
  }

  return uid;
}

/**
 * Sends a password reset email via Firebase Auth
 */
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
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres e incluir letras y números.');
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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test as required by skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'institutions', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network connecting...');
    }
  }
}
