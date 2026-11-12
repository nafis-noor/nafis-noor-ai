import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserStats } from '../types';
import { sanitizeUserText, sanitizeUserStatsPayload } from '../utils/securitySanitizer';

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check if Firebase config is present and possesses real credentials
export const isFirebaseConfigValid = Boolean(
  firebaseConfig &&
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes('dummy') &&
    !firebaseConfig.apiKey.includes('placeholder') &&
    !firebaseConfig.apiKey.startsWith('AIzaSyD-dummy')
);

// Initialize Firebase App singleton only when config is valid
export let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (isFirebaseConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    auth.useDeviceLanguage();
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    testConnection();
  } catch (err) {
    console.warn('Firebase initialization note:', err);
  }
}

export interface UserProfileDocument {
  id: string; // Auth UID
  email: string;
  displayName: string;
  photoURL?: string | null;
  authProvider: string;
  isNewUser: boolean;
  loginCount: number;
  createdAt: string;
  lastLoginAt: string;
  updatedAt: string;
  role: 'user' | 'admin';
  stats: UserStats;
}

export interface AuthResult {
  success: boolean;
  isNewUser?: boolean;
  user?: FirebaseUser;
  profile?: UserProfileDocument;
  stats?: UserStats;
  error?: string;
}

/**
 * Retrieves the current authenticated Firebase User's ID token for Bearer authorization
 */
export async function getCurrentUserIdToken(forceRefresh = false): Promise<string | null> {
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

/**
 * Verifies that the requested UID strictly matches the currently signed-in Firebase user
 */
export function assertOwnUserAccess(targetUid: string): boolean {
  if (!targetUid || !/^[a-zA-Z0-9_\-]{1,128}$/.test(targetUid)) {
    return false;
  }
  if (!auth?.currentUser) {
    return false;
  }
  return auth.currentUser.uid === targetUid;
}

/**
 * Recognizes and syncs every user (new or old) with Firestore.
 * Enforces strict user own-data isolation (request.auth.uid == uid) and schema validation.
 */
export async function syncAndRecognizeUser(
  firebaseUser: FirebaseUser,
  customName?: string,
  initialZeroStats?: UserStats
): Promise<AuthResult> {
  const uid = firebaseUser.uid;
  const email = sanitizeUserText(firebaseUser.email || '', 254);
  const rawName =
    customName ||
    firebaseUser.displayName ||
    (email ? email.split('@')[0] : '') ||
    'Servant of Allah';
  const displayName = sanitizeUserText(rawName, 100) || 'Servant of Allah';
  const photoURL = firebaseUser.photoURL ? sanitizeUserText(firebaseUser.photoURL, 1024) : null;
  const rawProvider = firebaseUser.providerData?.[0]?.providerId || 'password';
  const authProvider =
    rawProvider === 'google.com' || rawProvider === 'password' || rawProvider === 'anonymous'
      ? rawProvider
      : 'password';

  if (!db) {
    const fallbackStats: UserStats = sanitizeUserStatsPayload({
      ...(initialZeroStats || ({} as UserStats)),
      accountId: uid,
      accountEmail: email,
      userName: displayName,
      isLoggedIn: true,
      hasCompletedWelcome: true,
    });
    return {
      success: true,
      isNewUser: false,
      user: firebaseUser,
      stats: fallbackStats,
    };
  }

  const userPath = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    let docSnap;
    try {
      docSnap = await getDoc(userDocRef);
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
      throw err;
    }

    const now = new Date().toISOString().slice(0, 64);

    const isVerifiedFounder =
      Boolean(firebaseUser.emailVerified) &&
      email.trim().toLowerCase() === 'alnoorgroup.n@gmail.com';

    if (docSnap.exists()) {
      // RETURNING USER DETECTED
      const existingData = docSnap.data() as UserProfileDocument;
      const newLoginCount = Math.min(1000000, Math.max(1, (existingData.loginCount || 1) + 1));
      const resolvedRole: 'user' | 'admin' =
        existingData.role === 'admin' || isVerifiedFounder ? 'admin' : 'user';

      const updatedProfile: UserProfileDocument = {
        id: uid,
        email: existingData.email || email,
        displayName: sanitizeUserText(existingData.displayName || displayName, 100) || 'Servant of Allah',
        photoURL: photoURL || existingData.photoURL || null,
        authProvider: existingData.authProvider || authProvider,
        lastLoginAt: now,
        updatedAt: now,
        createdAt: existingData.createdAt || now,
        isNewUser: false,
        loginCount: newLoginCount,
        role: resolvedRole,
        stats: sanitizeUserStatsPayload({
          ...existingData.stats,
          accountId: uid,
          accountEmail: existingData.email || email,
          userName: sanitizeUserText(existingData.displayName || displayName, 100) || 'Servant of Allah',
          role: resolvedRole,
          isLoggedIn: true,
          hasCompletedWelcome: true,
        }),
      };

      // Update returning user metadata matching Action 2 in firestore.rules
      try {
        await updateDoc(userDocRef, {
          lastLoginAt: now,
          updatedAt: now,
          isNewUser: false,
          loginCount: newLoginCount,
          displayName: updatedProfile.displayName,
          photoURL: updatedProfile.photoURL,
        });
      } catch (e: any) {
        if (e?.code === 'permission-denied') {
          try {
            handleFirestoreError(e, OperationType.UPDATE, userPath);
          } catch {
            // logged structured FirestoreErrorInfo
          }
        }
      }

      return {
        success: true,
        isNewUser: false,
        user: firebaseUser,
        profile: updatedProfile,
        stats: updatedProfile.stats,
      };
    } else {
      // BRAND NEW USER DETECTED
      const initialRole: 'user' | 'admin' = isVerifiedFounder ? 'admin' : 'user';
      const cleanZeroStats: UserStats = sanitizeUserStatsPayload({
        ...(initialZeroStats || ({} as UserStats)),
        accountId: uid,
        accountEmail: email,
        userName: displayName,
        role: initialRole,
        isLoggedIn: true,
        hasCompletedWelcome: false,
        overallStreak: 0,
        quranStreak: 0,
        learningStreak: 0,
        dhikrStreak: 0,
        completedLessonIds: [],
        quranPagesRead: 0,
        totalXP: 0,
        lessonsCompleted: 0,
        dhikrCount: 0,
        bookmarks: [],
        savedDuas: [],
        prayerHistory: [],
        unlockedAchievements: [],
        activityHistory: [],
        noorAiConversation: [],
      });

      const newProfile: UserProfileDocument = {
        id: uid,
        email,
        displayName,
        photoURL: photoURL || null,
        authProvider,
        isNewUser: true,
        loginCount: 1,
        createdAt: now,
        lastLoginAt: now,
        updatedAt: now,
        role: initialRole,
        stats: cleanZeroStats,
      };

      try {
        await setDoc(userDocRef, newProfile);
      } catch (e: any) {
        if (e?.code === 'permission-denied') {
          try {
            handleFirestoreError(e, OperationType.CREATE, userPath);
          } catch {
            // logged structured FirestoreErrorInfo
          }
        }
      }

      return {
        success: true,
        isNewUser: true,
        user: firebaseUser,
        profile: newProfile,
        stats: cleanZeroStats,
      };
    }
  } catch (err: any) {
    const isOffline = err?.message?.includes('client is offline') || err?.code === 'unavailable';
    console.warn(`Firestore user lookup notice (${isOffline ? 'offline/cached' : 'warning'}):`, err?.message || err);

    let localStats: UserStats | null = null;
    try {
      const rawAccounts = localStorage.getItem('noor_accounts_cloud_db');
      if (rawAccounts) {
        const parsed = JSON.parse(rawAccounts);
        const match = parsed[uid];
        if (match && match.id === uid && match.stats) {
          localStats = match.stats;
        }
      }
    } catch {
      // ignore
    }

    const fallbackStats: UserStats = sanitizeUserStatsPayload({
      ...(initialZeroStats || ({} as UserStats)),
      ...(localStats || {}),
      accountId: uid,
      accountEmail: email,
      userName: displayName,
      isLoggedIn: true,
    });
    return {
      success: true,
      isNewUser: false,
      user: firebaseUser,
      stats: fallbackStats,
    };
  }
}

/**
 * Sign In with Google via Firebase Auth popup
 */
export async function signInWithGoogle(initialZeroStats?: UserStats): Promise<AuthResult> {
  if (!isFirebaseConfigValid || !auth) {
    return {
      success: false,
      error: 'Google Sign-In is unavailable in preview mode. Please sign in or create an account with Email.',
    };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const userCredential = await signInWithPopup(auth, provider);
    if (!userCredential || !userCredential.user) {
      return { success: false, error: 'Google sign in was not completed.' };
    }

    return await syncAndRecognizeUser(userCredential.user, undefined, initialZeroStats);
  } catch (err: any) {
    if (
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/cancelled-popup-request' ||
      (err.message && err.message.includes('popup-closed-by-user'))
    ) {
      return { success: false, error: 'CANCELLED' };
    }
    if (
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      (err.message && err.message.includes('api-key-not-valid'))
    ) {
      return {
        success: false,
        error: 'Google Sign-In is currently in sandbox mode. Please sign in with Email & Password.',
      };
    }
    if (err.code === 'auth/popup-blocked') {
      return {
        success: false,
        error: 'Sign-in pop-up was blocked by your browser. Please allow pop-ups for this site and try again.',
      };
    }
    if (err.code === 'auth/network-request-failed') {
      return { success: false, error: 'Network connection issue. Please check your internet.' };
    }
    console.warn('Google Sign In notice:', err.message || err);
    return { success: false, error: err.message || 'Failed to sign in with Google.' };
  }
}

/**
 * Sign In with Email & Password via Firebase Auth
 */
export async function signInWithEmail(
  email: string,
  pass: string,
  initialZeroStats?: UserStats
): Promise<AuthResult> {
  if (!isFirebaseConfigValid || !auth) {
    return { success: false, error: 'FIREBASE_NOT_CONFIGURED' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return await syncAndRecognizeUser(userCredential.user, undefined, initialZeroStats);
  } catch (err: any) {
    if (
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      (err.message && err.message.includes('api-key-not-valid'))
    ) {
      return { success: false, error: 'FIREBASE_NOT_CONFIGURED' };
    }
    console.warn('Email Sign In notice:', err.message || err);
    let msg = 'Invalid email or password.';
    if (err.code === 'auth/user-not-found') {
      msg = 'No account found with this email address.';
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'Incorrect password. Please try again.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Invalid email format.';
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
}

/**
 * Register a new user with Email & Password via Firebase Auth
 */
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string,
  initialZeroStats?: UserStats
): Promise<AuthResult> {
  if (!isFirebaseConfigValid || !auth) {
    return { success: false, error: 'FIREBASE_NOT_CONFIGURED' };
  }

  try {
    const cleanName = sanitizeUserText(name, 100) || 'Servant of Allah';
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);

    try {
      await updateProfile(userCredential.user, {
        displayName: cleanName,
      });
    } catch (e) {
      console.warn('Could not update profile display name:', e);
    }

    return await syncAndRecognizeUser(userCredential.user, cleanName, initialZeroStats);
  } catch (err: any) {
    if (
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      (err.message && err.message.includes('api-key-not-valid'))
    ) {
      return { success: false, error: 'FIREBASE_NOT_CONFIGURED' };
    }
    console.warn('Register Email notice:', err.message || err);
    let msg = 'Failed to create account.';
    if (err.code === 'auth/email-already-in-use') {
      msg = 'An account with this email already exists. Please log in.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'Password is too weak. Please use at least 6 characters.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please provide a valid email address.';
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigValid || !auth) return { success: true };
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err: any) {
    if (
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      (err.message && err.message.includes('api-key-not-valid'))
    ) {
      return { success: true };
    }
    console.warn('Password reset notice:', err.message || err);
    return { success: false, error: err.message || 'Could not send reset email.' };
  }
}

/**
 * Sign out user from Firebase Auth
 */
export async function signOutUser(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out error:', err);
  }
}

/**
 * Persist user stats in Firestore document /users/{userId}.
 * Strictly enforces that the signed-in user matches `uid` and only updates allowed fields.
 */
export async function saveUserStatsToFirestore(uid: string, stats: UserStats): Promise<void> {
  if (!uid || !db) return;
  // Block any attempt to write to Firestore if Firebase Auth user doesn't match `uid`
  if (!assertOwnUserAccess(uid)) {
    return;
  }

  const sanitizedStats = sanitizeUserStatsPayload(stats);
  const userPath = `users/${uid}`;

  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      stats: sanitizedStats,
      displayName: sanitizedStats.userName,
      updatedAt: new Date().toISOString().slice(0, 64),
    });
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      try {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
      } catch {
        // Structured error logged
      }
    }
  }
}

/**
 * Real-time listener for user document in Firestore (/users/{uid}).
 * Strictly attaches only when `auth.currentUser.uid === uid`.
 */
export function subscribeToUserDocument(
  uid: string,
  onUpdate: (data: UserProfileDocument) => void
): () => void {
  if (!uid || !db) return () => {};
  if (!assertOwnUserAccess(uid)) {
    return () => {};
  }

  const userPath = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    return onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfileDocument;
          if (data.id === uid) {
            onUpdate(data);
          }
        }
      },
      (error) => {
        if ((error as any)?.code === 'permission-denied') {
          try {
            handleFirestoreError(error, OperationType.GET, userPath);
          } catch {
            // Structured error logged
          }
        } else {
          console.warn('Firestore subscription notice:', error);
        }
      }
    );
  } catch (e) {
    console.warn('Could not setup Firestore listener:', e);
    return () => {};
  }
}

export { onAuthStateChanged };
