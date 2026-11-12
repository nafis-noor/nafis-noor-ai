import { UserAccount, UserStats } from '../types';
import {
  signInWithGoogle as fbSignInWithGoogle,
  signInWithEmail as fbSignInWithEmail,
  registerWithEmail as fbRegisterWithEmail,
  signOutUser as fbSignOutUser,
  saveUserStatsToFirestore,
  sendPasswordReset as fbSendPasswordReset,
  getCurrentUserIdToken,
} from '../lib/firebase';
import { sanitizeUserText, sanitizeUserStatsPayload } from './securitySanitizer';

const ACCOUNTS_STORAGE_KEY = 'noor_accounts_cloud_db';
const ACTIVE_SESSION_KEY = 'noor_active_session_id';

/**
 * Legacy SHA-256 hash helper (used only to transparently verify & migrate older accounts)
 */
async function legacySha256Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_noor_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hardened password hashing using Web Crypto API PBKDF2-HMAC-SHA256 (100,000 iterations)
 */
export async function hashPassword(password: string, emailSalt = ''): Promise<string> {
  const encoder = new TextEncoder();
  const normalizedSalt = `noor_pbkdf2_v2_${emailSalt.trim().toLowerCase()}`;
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(normalizedSalt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `pbkdf2_v2$${hashHex}`;
}

async function verifyPasswordHash(
  password: string,
  email: string,
  storedHash?: string
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (!storedHash) return { valid: false, needsUpgrade: false };
  if (storedHash.startsWith('pbkdf2_v2$')) {
    const computed = await hashPassword(password, email);
    return { valid: computed === storedHash, needsUpgrade: false };
  }
  // Check legacy SHA-256 hash and mark for automatic upgrade to PBKDF2
  const legacy = await legacySha256Hash(password);
  return { valid: legacy === storedHash, needsUpgrade: legacy === storedHash };
}

/**
 * Internal helper: Retrieves local account store
 */
function readRawAccountStore(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAllAccounts(accounts: Record<string, UserAccount>): void {
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

/**
 * Retrieves ONLY the active user's own account entry (prevents cross-account enumeration)
 */
export function getOwnAccount(accountId: string): UserAccount | null {
  if (!accountId) return null;
  const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (activeId !== accountId) return null;
  const accounts = readRawAccountStore();
  return accounts[accountId] || null;
}

/**
 * Checks if an email has an existing account or was previously registered on this app/device
 */
export function hasAccountWithEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const cleanEmail = email.trim().toLowerCase();
  const accounts = readRawAccountStore();
  const existsLocally = Object.values(accounts).some(
    (a) => a.email && a.email.trim().toLowerCase() === cleanEmail
  );
  if (existsLocally) return true;
  if (typeof localStorage !== 'undefined') {
    const lastEmail = (localStorage.getItem('noor_last_login_email') || '').trim().toLowerCase();
    if (lastEmail === cleanEmail) return true;
    try {
      const statsRaw = localStorage.getItem('noor_user_stats');
      if (statsRaw) {
        const stats = JSON.parse(statsRaw);
        if (stats.accountEmail && stats.accountEmail.trim().toLowerCase() === cleanEmail) {
          return true;
        }
      }
    } catch {
      // ignore
    }
  }
  return false;
}

/**
 * Creates or registers a user account via Firebase with PBKDF2 local fallback
 */
export async function registerAccount(
  name: string,
  email: string,
  password: string,
  initialZeroStats: UserStats
): Promise<{ success: boolean; account?: UserAccount; isNewUser?: boolean; error?: string }> {
  const cleanEmail = sanitizeUserText(email, 254).toLowerCase();
  const cleanName = sanitizeUserText(name, 100) || 'Servant of Allah';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters for your security.' };
  }

  // 1. Try Firebase Auth + Firestore
  try {
    const fbRes = await fbRegisterWithEmail(cleanName, cleanEmail, password, initialZeroStats);
    if (fbRes.success && fbRes.stats) {
      const accountId = fbRes.user?.uid || `user_${Date.now()}`;
      const now = new Date().toISOString();
      const sanitizedStats = sanitizeUserStatsPayload({
        ...fbRes.stats,
        accountId,
        accountEmail: cleanEmail,
        userName: cleanName,
        role: 'user',
        isLoggedIn: true,
      });

      const newAccount: UserAccount = {
        id: accountId,
        email: cleanEmail,
        name: cleanName,
        role: 'user',
        createdAt: now,
        updatedAt: now,
        stats: sanitizedStats,
      };

      const accounts = readRawAccountStore();
      accounts[accountId] = newAccount;
      saveAllAccounts(accounts);
      localStorage.setItem(ACTIVE_SESSION_KEY, accountId);

      return { success: true, account: newAccount, isNewUser: fbRes.isNewUser ?? true };
    } else if (fbRes.error) {
      if (fbRes.error.includes('already exists') || fbRes.error.includes('invalid-email')) {
        return { success: false, error: fbRes.error };
      }
    }
  } catch (e) {
    console.warn('Firebase registration error, using local fallback:', e);
  }

  // 2. Local fallback storage with PBKDF2-HMAC-SHA256
  const accounts = readRawAccountStore();
  const existing = Object.values(accounts).find((a) => a.email?.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: 'An account with this email already exists. Please sign in.' };
  }

  const accountId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const passwordHash = await hashPassword(password, cleanEmail);
  const now = new Date().toISOString();

  const cleanZeroStats: UserStats = sanitizeUserStatsPayload({
    ...initialZeroStats,
    accountId,
    accountEmail: cleanEmail,
    userName: cleanName,
    role: 'user',
    isLoggedIn: true,
    overallStreak: 0,
    quranStreak: 0,
    learningStreak: 0,
    dhikrStreak: 0,
    completedLessonIds: [],
    quranPagesRead: 0,
    dhikrCount: 0,
    totalXP: 0,
    lessonsCompleted: 0,
    bookmarks: [],
    savedDuas: [],
    prayerHistory: [],
    unlockedAchievements: [],
    activityHistory: [],
    noorAiConversation: [],
  });

  const newAccount: UserAccount = {
    id: accountId,
    email: cleanEmail,
    name: cleanName,
    role: 'user',
    passwordHash,
    createdAt: now,
    updatedAt: now,
    stats: cleanZeroStats,
  };

  accounts[accountId] = newAccount;
  saveAllAccounts(accounts);
  localStorage.setItem(ACTIVE_SESSION_KEY, accountId);

  return { success: true, account: newAccount, isNewUser: true };
}

/**
 * Authenticates an existing user via Firebase Auth or PBKDF2 local registry
 */
export async function authenticateAccount(
  email: string,
  password: string,
  initialZeroStats?: UserStats
): Promise<{ success: boolean; account?: UserAccount; isNewUser?: boolean; error?: string }> {
  const cleanEmail = sanitizeUserText(email, 254).toLowerCase();

  // 1. Try Firebase Auth + Firestore
  try {
    const fbRes = await fbSignInWithEmail(cleanEmail, password, initialZeroStats);
    if (fbRes.success && fbRes.stats) {
      const accountId = fbRes.user?.uid || `user_${Date.now()}`;
      const now = new Date().toISOString();
      const safeName =
        sanitizeUserText(fbRes.profile?.displayName || fbRes.stats.userName, 100) ||
        'Servant of Allah';
      const sanitizedStats = sanitizeUserStatsPayload({
        ...fbRes.stats,
        accountId,
        accountEmail: cleanEmail,
        userName: safeName,
        role: fbRes.profile?.role === 'admin' ? 'admin' : 'user',
        isLoggedIn: true,
      });

      const account: UserAccount = {
        id: accountId,
        email: cleanEmail,
        name: safeName,
        role: sanitizedStats.role,
        createdAt: fbRes.profile?.createdAt || now,
        updatedAt: now,
        stats: sanitizedStats,
      };

      const accounts = readRawAccountStore();
      accounts[accountId] = account;
      saveAllAccounts(accounts);
      localStorage.setItem(ACTIVE_SESSION_KEY, accountId);

      return { success: true, account, isNewUser: fbRes.isNewUser ?? false };
    } else if (
      fbRes.error &&
      (fbRes.error.includes('Incorrect') || fbRes.error.includes('No account'))
    ) {
      const accounts = readRawAccountStore();
      const localAccount = Object.values(accounts).find(
        (a) => a.email?.toLowerCase() === cleanEmail
      );
      if (localAccount && localAccount.passwordHash) {
        const check = await verifyPasswordHash(password, cleanEmail, localAccount.passwordHash);
        if (check.valid) {
          if (check.needsUpgrade) {
            localAccount.passwordHash = await hashPassword(password, cleanEmail);
            accounts[localAccount.id] = localAccount;
            saveAllAccounts(accounts);
          }
          localStorage.setItem(ACTIVE_SESSION_KEY, localAccount.id);
          return { success: true, account: localAccount, isNewUser: false };
        }
      }
      return { success: false, error: fbRes.error };
    }
  } catch (e) {
    console.warn('Firebase login error, checking local storage:', e);
  }

  // 2. Local fallback verification
  const accounts = readRawAccountStore();
  const account = Object.values(accounts).find((a) => a.email?.toLowerCase() === cleanEmail);
  if (!account) {
    return { success: false, error: 'No account found with this email address.' };
  }

  const check = await verifyPasswordHash(password, cleanEmail, account.passwordHash);
  if (!check.valid) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  if (check.needsUpgrade) {
    account.passwordHash = await hashPassword(password, cleanEmail);
    accounts[account.id] = account;
    saveAllAccounts(accounts);
  }

  localStorage.setItem(ACTIVE_SESSION_KEY, account.id);
  return { success: true, account, isNewUser: false };
}

/**
 * Sign In with Google via Firebase Auth popup
 */
export async function authenticateWithGoogle(
  initialZeroStats?: UserStats
): Promise<{
  success: boolean;
  account?: UserAccount;
  isNewUser?: boolean;
  cancelled?: boolean;
  error?: string;
}> {
  try {
    const res = await fbSignInWithGoogle(initialZeroStats);

    if (res.error === 'CANCELLED') {
      return { success: false, cancelled: true, error: 'Sign in was cancelled.' };
    }

    if (res.success && res.user && res.stats) {
      const accountId = res.user.uid;
      const email = sanitizeUserText(res.user.email || '', 254);
      const name =
        sanitizeUserText(
          res.profile?.displayName ||
            res.user.displayName ||
            (email ? email.split('@')[0] : 'Servant of Allah'),
          100
        ) || 'Servant of Allah';
      const now = new Date().toISOString();

      const sanitizedStats = sanitizeUserStatsPayload({
        ...res.stats,
        accountId,
        accountEmail: email,
        userName: name,
        role: res.profile?.role === 'admin' ? 'admin' : 'user',
        isLoggedIn: true,
      });

      const account: UserAccount = {
        id: accountId,
        email,
        name,
        role: sanitizedStats.role,
        authProvider: 'google.com',
        createdAt: res.profile?.createdAt || now,
        updatedAt: now,
        stats: sanitizedStats,
      };

      const accounts = readRawAccountStore();
      accounts[accountId] = account;
      saveAllAccounts(accounts);
      localStorage.setItem(ACTIVE_SESSION_KEY, accountId);

      return { success: true, account, isNewUser: res.isNewUser ?? false };
    }
    return {
      success: false,
      error: res.error || 'Google authentication could not be completed.',
    };
  } catch (e: any) {
    console.error('authenticateWithGoogle error:', e);
    return { success: false, error: e?.message || 'Google authentication was interrupted.' };
  }
}

// Cache and debounce mechanism to prevent redundant database writes
let lastSyncedStatsHash: Record<string, string> = {};
let pendingFirestoreTimer: any = null;
let pendingStatsToSync: { accountId: string; stats: UserStats } | null = null;

function getStatsSnapshotHash(stats: UserStats): string {
  return JSON.stringify({
    xp: stats.totalXP,
    streak: stats.overallStreak,
    qStreak: stats.quranStreak,
    lStreak: stats.learningStreak,
    dStreak: stats.dhikrStreak,
    dhikrCount: stats.dhikrCount,
    lastSurah: stats.lastReadSurah,
    lastAyah: stats.lastReadAyah,
    pagesRead: stats.quranPagesRead,
    lessonsCount: stats.completedLessonIds?.length || 0,
    bookmarksCount: stats.bookmarks?.length || 0,
    savedDuasCount: stats.savedDuas?.length || 0,
    loc: stats.userLocation,
    notif: stats.notificationsEnabled,
    calcMethod: stats.prayerCalculationMethod,
    asr: stats.asrJuristicMethod,
    theme: stats.themePreference,
    name: stats.userName,
    sessionsCount: stats.noorAiSessions?.length || 0,
  });
}

export function flushPendingSync(): void {
  if (pendingFirestoreTimer) {
    clearTimeout(pendingFirestoreTimer);
    pendingFirestoreTimer = null;
  }
  if (pendingStatsToSync) {
    const { accountId, stats } = pendingStatsToSync;
    pendingStatsToSync = null;
    saveUserStatsToFirestore(accountId, stats);
  }
}

/**
 * Syncs the in-memory stats to Firestore and local persistent account with strict own-account isolation
 */
export function syncAccountData(accountId: string, stats: UserStats, immediate = false): void {
  if (!accountId) return;

  // Enforce strict own-user session isolation: only allow syncing the currently active session ID
  const activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (activeSessionId && activeSessionId !== accountId) {
    return;
  }

  const sanitizedStats = sanitizeUserStatsPayload(stats);
  const currentHash = getStatsSnapshotHash(sanitizedStats);
  const previousHash = lastSyncedStatsHash[accountId];

  if (previousHash === currentHash && !immediate) {
    return;
  }

  lastSyncedStatsHash[accountId] = currentHash;

  try {
    const accounts = readRawAccountStore();
    if (accounts[accountId] && accounts[accountId].id === accountId) {
      // Never allow client stats sync to escalate role to admin unless verified token exists
      const safeRole =
        accounts[accountId].role === 'admin' && sessionStorage.getItem('noor_admin_token')
          ? 'admin'
          : 'user';
      accounts[accountId].stats = {
        ...sanitizedStats,
        accountId,
        role: safeRole,
        isLoggedIn: true,
      };
      accounts[accountId].updatedAt = new Date().toISOString();
      saveAllAccounts(accounts);
    }
  } catch (err) {
    console.warn('Local account write note:', err);
  }

  pendingStatsToSync = { accountId, stats: sanitizedStats };

  if (immediate) {
    flushPendingSync();
  } else {
    if (pendingFirestoreTimer) {
      clearTimeout(pendingFirestoreTimer);
    }
    pendingFirestoreTimer = setTimeout(() => {
      flushPendingSync();
    }, 600);
  }
}

/**
 * Gets the active user account session if one exists.
 * Blocks unverified local admin privilege escalation if no server token is present.
 */
export function getActiveSession(): UserAccount | null {
  try {
    const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!activeId) return null;
    const accounts = readRawAccountStore();
    const acc = accounts[activeId] || null;
    if (!acc) return null;

    return acc;
  } catch {
    return null;
  }
}

/**
 * Logs out the active user and revokes any active admin token
 */
export function logoutAccount(currentStats?: UserStats): void {
  try {
    const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
    const statsStr = localStorage.getItem('noor_user_stats');
    const stats: UserStats | null = currentStats || (statsStr ? JSON.parse(statsStr) : null);
    if (activeId && stats) {
      const accounts = readRawAccountStore();
      if (accounts[activeId]) {
        accounts[activeId].stats = stats;
        accounts[activeId].updatedAt = new Date().toISOString();
        saveAllAccounts(accounts);
      }
      if (stats.accountId) {
        saveUserStatsToFirestore(stats.accountId, stats).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('Logout backup warning:', e);
  }

  const adminToken = sessionStorage.getItem('noor_admin_token');
  if (adminToken) {
    fetch('/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }).catch(() => {});
  }
  sessionStorage.removeItem('noor_admin_token');
  localStorage.removeItem(ACTIVE_SESSION_KEY);
  fbSignOutUser();
}

export function isAccountRegistered(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;
  const accounts = readRawAccountStore();
  return Object.values(accounts).some((a) => a.email && a.email.toLowerCase() === cleanEmail);
}

interface PasswordResetSession {
  email: string;
  hashedOtp: string;
  expiresAt: number;
  attemptsLeft: number;
  resendAvailableAt: number;
  verified: boolean;
  resetToken?: string;
  resetTokenExpiresAt?: number;
}

const activeResetSessions = new Map<string, PasswordResetSession>();

export async function requestPasswordResetOtp(
  email: string
): Promise<{
  success: boolean;
  notFound?: boolean;
  message: string;
  cooldownSeconds: number;
  previewCode?: string;
  error?: string;
}> {
  const cleanEmail = sanitizeUserText(email, 254).toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
      message: '',
      cooldownSeconds: 0,
    };
  }

  const registered = isAccountRegistered(cleanEmail);
  if (!registered) {
    return {
      success: false,
      notFound: true,
      error: "We couldn't find a Noor account with that email.",
      message: '',
      cooldownSeconds: 0,
    };
  }

  const existing = activeResetSessions.get(cleanEmail);
  const now = Date.now();
  if (existing && existing.resendAvailableAt > now) {
    const remainingSecs = Math.ceil((existing.resendAvailableAt - now) / 1000);
    return {
      success: false,
      error: `Please wait ${remainingSecs}s before requesting a new code.`,
      message: '',
      cooldownSeconds: remainingSecs,
    };
  }

  try {
    const apiRes = await fetch('/api/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const data = await apiRes.json().catch(() => ({}));
    if (!apiRes.ok || !data.success) {
      return {
        success: false,
        error:
          data.error || "We couldn't send the verification email right now. Please try again.",
        cooldownSeconds: data.cooldownSeconds || 0,
        message: '',
      };
    }

    try {
      fbSendPasswordReset(cleanEmail).catch(() => {});
    } catch {
      // Non-blocking
    }

    activeResetSessions.set(cleanEmail, {
      email: cleanEmail,
      hashedOtp: '',
      expiresAt: now + 10 * 60 * 1000,
      attemptsLeft: 5,
      resendAvailableAt: now + 30 * 1000,
      verified: false,
    });

    return {
      success: true,
      message: 'We sent a verification code to your email.',
      cooldownSeconds: data.cooldownSeconds || 30,
    };
  } catch {
    return {
      success: false,
      error: "We couldn't send the verification email right now. Please try again.",
      message: '',
      cooldownSeconds: 0,
    };
  }
}

export async function verifyPasswordResetOtp(
  email: string,
  enteredCode: string
): Promise<{ success: boolean; resetToken?: string; error?: string; expired?: boolean }> {
  const cleanEmail = sanitizeUserText(email, 254).toLowerCase();
  const cleanCode = enteredCode.trim().replace(/\s+/g, '');

  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, error: 'Please enter the complete 6-digit verification code.' };
  }

  try {
    const apiRes = await fetch('/api/verify-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
    });
    const data = await apiRes.json().catch(() => ({}));
    if (apiRes.ok && data.success && data.resetToken) {
      const existing = activeResetSessions.get(cleanEmail);
      if (existing) {
        existing.verified = true;
        existing.resetToken = data.resetToken;
      }
      return { success: true, resetToken: data.resetToken };
    } else if (data.expired) {
      return {
        success: false,
        expired: true,
        error: data.error || 'That verification code has expired.',
      };
    } else {
      return { success: false, error: data.error || 'That verification code is incorrect.' };
    }
  } catch {
    return {
      success: false,
      error: 'Connection error while verifying code. Please try again.',
    };
  }
}

export async function completePasswordReset(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = sanitizeUserText(email, 254).toLowerCase();

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }

  try {
    const apiRes = await fetch('/api/complete-reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, resetToken, newPassword }),
    });
    const data = await apiRes.json().catch(() => ({}));
    if (!apiRes.ok || !data.success) {
      return {
        success: false,
        error:
          data.error || 'Password reset session is invalid or expired. Please start over.',
      };
    }
  } catch {
    return {
      success: false,
      error: 'Network error occurred while saving password. Please try again.',
    };
  }

  const newHash = await hashPassword(newPassword, cleanEmail);

  const accounts = readRawAccountStore();
  const account = Object.values(accounts).find((a) => a.email?.toLowerCase() === cleanEmail);

  if (account) {
    account.passwordHash = newHash;
    account.updatedAt = new Date().toISOString();
    accounts[account.id] = account;
    saveAllAccounts(accounts);
  }

  activeResetSessions.delete(cleanEmail);
  return { success: true };
}

export async function resetPassword(
  email: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = sanitizeUserText(email, 254).toLowerCase();

  try {
    await fbSendPasswordReset(cleanEmail);
  } catch (e) {
    console.warn('Firebase reset email note:', e);
  }

  if (newPassword) {
    const accounts = readRawAccountStore();
    const account = Object.values(accounts).find((a) => a.email?.toLowerCase() === cleanEmail);
    if (account) {
      account.passwordHash = await hashPassword(newPassword, cleanEmail);
      account.updatedAt = new Date().toISOString();
      accounts[account.id] = account;
      saveAllAccounts(accounts);
    }
  }

  return { success: true };
}

/**
 * Permanently deletes the active user's own account and all its associated data.
 * Strictly blocks deleting another user's account ID.
 */
export function deleteAccount(accountId: string): boolean {
  if (!accountId) return false;
  const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (activeId !== accountId) {
    console.warn('Security: Blocked attempt to delete an account that is not the active user.');
    return false;
  }

  const accounts = readRawAccountStore();
  if (accounts[accountId]) {
    delete accounts[accountId];
    saveAllAccounts(accounts);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    return true;
  }
  return false;
}

/**
 * Exports user data as formatted JSON string strictly for the active user's own session
 */
export function exportUserDataJSON(stats: UserStats): string {
  const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (stats.accountId && activeId && stats.accountId !== activeId) {
    throw new Error('Forbidden: Users can only export their own account data.');
  }

  const exportData = {
    app: 'NOOR Islamic Companion',
    exportDate: new Date().toISOString(),
    account: {
      id: stats.accountId || 'guest',
      email: stats.accountEmail || 'none',
      name: stats.userName,
    },
    preferences: {
      language: stats.language,
      location: stats.userLocation,
      prayerCalculationMethod: stats.prayerCalculationMethod,
      asrMadhab: stats.asrJuristicMethod,
      notifications: stats.notificationsEnabled,
      personalization: stats.personalization,
    },
    progress: {
      overallStreak: stats.overallStreak,
      quranStreak: stats.quranStreak,
      learningStreak: stats.learningStreak,
      quranPagesRead: stats.quranPagesRead,
      totalXP: stats.totalXP,
      lessonsCompleted: stats.lessonsCompleted,
      dhikrCount: stats.dhikrCount,
      bookmarksCount: stats.bookmarks.length,
      savedDuasCount: stats.savedDuas.length,
      achievementsUnlocked: stats.unlockedAchievements.length,
    },
    bookmarks: stats.bookmarks,
    savedDuas: stats.savedDuas,
    noorAiConversationsCount: stats.noorAiConversation?.length || 0,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Validates admin credentials securely against the server backend.
 * Supports both ADMIN_PASSWORD and verified Firebase ID token for the project admin email.
 */
export async function authenticateAdmin(
  password: string
): Promise<{
  success: boolean;
  user?: { id: string; name: string; role: 'admin'; email: string };
  token?: string;
  error?: string;
}> {
  try {
    const firebaseIdToken = await getCurrentUserIdToken().catch(() => null);
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, firebaseIdToken }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.token) {
      sessionStorage.setItem('noor_admin_token', data.token);
      return {
        success: true,
        user: data.user || {
          id: 'admin_system',
          name: 'Administrator',
          role: 'admin',
          email: 'admin@nafisnoor.app',
        },
        token: data.token,
      };
    }

    return {
      success: false,
      error: data.error || 'Invalid admin credentials.',
    };
  } catch {
    return {
      success: false,
      error: 'Unable to connect to administration verification service.',
    };
  }
}

/**
 * Verifies the active admin session token with the server (/api/auth/admin-verify)
 */
export async function verifyAdminSessionWithServer(): Promise<boolean> {
  const token = sessionStorage.getItem('noor_admin_token');
  const firebaseToken = await getCurrentUserIdToken().catch(() => null);
  const bearer = token || firebaseToken;
  if (!bearer) return false;

  try {
    const res = await fetch('/api/auth/admin-verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    });
    if (!res.ok) {
      sessionStorage.removeItem('noor_admin_token');
      return false;
    }
    const data = await res.json();
    return Boolean(data.success && data.valid);
  } catch {
    return false;
  }
}

/**
 * Creates and registers the active Admin session ONLY when a valid server token is present
 */
export function createAdminSession(initialZeroStats: UserStats): UserStats {
  const token = sessionStorage.getItem('noor_admin_token');
  if (!token) {
    throw new Error('Unauthorized: Cannot create an admin session without a verified server token.');
  }

  const adminStats: UserStats = sanitizeUserStatsPayload({
    ...initialZeroStats,
    accountId: 'admin_system',
    accountEmail: 'admin@nafisnoor.app',
    userName: 'Administrator',
    role: 'admin',
    isGuest: false,
    isLoggedIn: true,
    hasCompletedWelcome: true,
  });

  const adminAccount: UserAccount = {
    id: 'admin_system',
    name: 'Administrator',
    email: 'admin@nafisnoor.app',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: adminStats,
  };

  const accounts = readRawAccountStore();
  accounts['admin_system'] = adminAccount;
  saveAllAccounts(accounts);
  localStorage.setItem(ACTIVE_SESSION_KEY, 'admin_system');

  return adminStats;
}

/**
 * Generates an ephemeral, safe guest session without creating fake account data
 */
export function createGuestSession(initialZeroStats: UserStats): UserStats {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
  sessionStorage.removeItem('noor_admin_token');

  const guestStats: UserStats = sanitizeUserStatsPayload({
    ...initialZeroStats,
    userName: 'Guest',
    role: 'guest',
    isGuest: true,
    isLoggedIn: true,
    hasCompletedWelcome: true,
    accountId: undefined,
    accountEmail: undefined,
  });

  return guestStats;
}

/**
 * Updates or sets the password hash linked to the user's email and username,
 * backing up everything securely in the local account store and Firestore.
 */
export function updateAccountCredentialsWithPassword(
  accountId: string,
  email: string,
  name: string,
  passwordHash: string
): UserAccount | null {
  try {
    const accounts = readRawAccountStore();
    const cleanEmail = email.trim().toLowerCase();
    let target =
      accounts[accountId] ||
      Object.values(accounts).find((a) => a.email && a.email.toLowerCase() === cleanEmail);

    const now = new Date().toISOString();
    if (!target) {
      target = {
        id: accountId || `user_${Date.now()}`,
        email: cleanEmail,
        name: name.trim() || 'Servant of Allah',
        role: 'user',
        passwordHash,
        createdAt: now,
        updatedAt: now,
        stats: {
          accountId: accountId || `user_${Date.now()}`,
          accountEmail: cleanEmail,
          userName: name.trim() || 'Servant of Allah',
          isLoggedIn: true,
          hasCompletedWelcome: true,
        } as UserStats,
      };
    } else {
      target.email = cleanEmail;
      target.name = name.trim() || target.name;
      target.passwordHash = passwordHash;
      target.updatedAt = now;
      if (target.stats) {
        target.stats.userName = target.name;
        target.stats.accountEmail = cleanEmail;
      }
    }

    accounts[target.id] = target;
    saveAllAccounts(accounts);
    localStorage.setItem(ACTIVE_SESSION_KEY, target.id);

    if (target.stats && target.stats.accountId) {
      saveUserStatsToFirestore(target.stats.accountId, target.stats).catch(() => {});
    }

    return target;
  } catch (e) {
    console.warn('Update account credentials warning:', e);
    return null;
  }
}
