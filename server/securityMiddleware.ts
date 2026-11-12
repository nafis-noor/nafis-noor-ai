import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// ============================================================================
// 1. ENVIRONMENT VARIABLES AUDIT & VALIDATION (ZERO SECRET EXPOSURE)
// ============================================================================
const FIREBASE_PROJECT_ID = 'gen-lang-client-0461750116';
const DEFAULT_ADMIN_EMAILS = ['alnoorgroup.n@gmail.com'];

export interface EnvAuditStatus {
  variable: string;
  configured: boolean;
  scope: 'server-only';
  status: 'secure' | 'warning';
  note: string;
}

export function getAdminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS || '';
  const custom = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...custom]));
}

export function auditEnvironmentVariables(): EnvAuditStatus[] {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 10 &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY !== 'dummy-key'
  );
  const hasAdminPassword = Boolean(
    process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length >= 8
  );
  const hasSmtpPass = Boolean(
    process.env.SMTP_PASS && process.env.SMTP_PASS.trim().length > 0
  );
  const hasAppUrl = Boolean(
    process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
  );

  return [
    {
      variable: 'GEMINI_API_KEY',
      configured: hasGeminiKey,
      scope: 'server-only',
      status: hasGeminiKey ? 'secure' : 'warning',
      note: hasGeminiKey
        ? 'Loaded on server only; hidden from client bundle'
        : 'Not set; server using verified offline fallbacks',
    },
    {
      variable: 'ADMIN_PASSWORD',
      configured: hasAdminPassword,
      scope: 'server-only',
      status: hasAdminPassword ? 'secure' : 'secure',
      note: hasAdminPassword
        ? 'Server-side timing-safe password hash active'
        : 'Password login disabled; verified Firebase Admin JWT required',
    },
    {
      variable: 'ADMIN_EMAILS',
      configured: getAdminEmailAllowlist().length > 0,
      scope: 'server-only',
      status: 'secure',
      note: `Verified admin email allowlist active (${getAdminEmailAllowlist().length} configured)`,
    },
    {
      variable: 'SMTP_PASS',
      configured: hasSmtpPass,
      scope: 'server-only',
      status: hasSmtpPass ? 'secure' : 'warning',
      note: hasSmtpPass
        ? 'SMTP credentials isolated on server'
        : 'SMTP_PASS not set; Firebase Auth password reset active',
    },
    {
      variable: 'APP_URL',
      configured: hasAppUrl,
      scope: 'server-only',
      status: 'secure',
      note: 'Origin allowlist and callback verification enabled',
    },
  ];
}

// ============================================================================
// 2. EXPOSED FILES & DOTFILE BLOCKER MIDDLEWARE
// ============================================================================
const BLOCKED_PATH_PATTERNS: RegExp[] = [
  /^\/\.(?!well-known)/i, // Block all dotfiles (.env, .git, .DS_Store, etc.)
  /\.map$/i, // Block all source maps
  /\.ts$/i, // Block raw TypeScript files in production
  /\.cjs$/i, // Block compiled server bundles (server.cjs)
  /^\/(server|scripts|dist-server)(\/|$)/i,
  /^\/(package(-lock)?\.json|bun\.lock|tsconfig\.json|vite\.config\.ts|eslint\.config\.mjs)$/i,
  /^\/(firestore\.rules|DRAFT_firestore\.rules|firebase-blueprint\.json|firebase-applet-config\.json|security_spec\.md)$/i,
];

export function blockExposedFilesMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let decodedPath = req.path;
  try {
    decodedPath = decodeURIComponent(req.path);
  } catch {
    return res.status(400).json({ success: false, error: 'Malformed URL path' });
  }

  // Block path traversal sequences
  if (decodedPath.includes('..') || decodedPath.includes('\0')) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Path traversal blocked',
    });
  }

  const isDev = process.env.NODE_ENV !== 'production';

  for (const pattern of BLOCKED_PATH_PATTERNS) {
    // In Vite dev mode, allow Vite to serve client modules and required config imports
    if (isDev) {
      if (pattern.source === '\\.ts$' && decodedPath.startsWith('/src/')) {
        continue;
      }
      if (
        decodedPath === '/firebase-applet-config.json' &&
        (req.query.import !== undefined || req.url.includes('import') || req.headers.accept?.includes('application/javascript'))
      ) {
        continue;
      }
    }
    if (pattern.test(decodedPath)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Access to internal configuration or source file is denied.',
      });
    }
  }

  next();
}

// ============================================================================
// 3. STRICT CORS CONFIGURATION & WEBSOCKET ORIGIN VERIFICATION
// ============================================================================
export function isAllowedOrigin(origin: string | undefined): boolean {
  // Same-origin requests, non-browser server-to-server, or Android WebViews have no Origin or 'null'
  if (!origin || origin === 'null') return true;

  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();

    // Official production domains and all subdomains
    if (
      hostname === 'nafisnoor.site' ||
      hostname === 'www.nafisnoor.site' ||
      hostname.endsWith('.nafisnoor.site')
    ) {
      return true;
    }

    // AI Studio Cloud Run preview & shared environments
    if (hostname.endsWith('.run.app') || hostname.endsWith('.google.com')) {
      return true;
    }

    // Local development & Capacitor/Android native containers
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      parsed.protocol === 'capacitor:' ||
      parsed.protocol === 'ionic:' ||
      parsed.protocol === 'file:'
    ) {
      return true;
    }

    // Configured APP_URL
    if (process.env.APP_URL) {
      try {
        const appUrlHost = new URL(process.env.APP_URL).hostname.toLowerCase();
        if (hostname === appUrlHost) return true;
      } catch {
        // ignore invalid APP_URL
      }
    }

    // Custom ALLOWED_ORIGINS list
    if (process.env.ALLOWED_ORIGINS) {
      const allowedList = process.env.ALLOWED_ORIGINS.split(',')
        .map((o) => o.trim().toLowerCase())
        .filter(Boolean);
      if (allowedList.includes(origin.toLowerCase()) || allowedList.includes(hostname)) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      // Gracefully disallow without unhandled exception
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-App-Language',
    'X-Language',
    'X-Requested-With',
  ],
  credentials: true,
  maxAge: 86400,
});

// ============================================================================
// 4. SECURITY HEADERS MIDDLEWARE (HELMET + CSP + PERMISSIONS POLICY)
// ============================================================================
export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://apis.google.com',
        'https://*.firebaseapp.com',
        'https://*.googleapis.com',
        'https://www.gstatic.com',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://*.googleusercontent.com',
        'https://*.googleapis.com',
        'https://*.gstatic.com',
        'https://nafisnoor.site',
      ],
      mediaSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://everyayah.com',
        'https://*.everyayah.com',
        'https://*.qurancdn.com',
        'https://*.alquran.cloud',
      ],
      connectSrc: [
        "'self'",
        'ws:',
        'wss:',
        'https://*.googleapis.com',
        'https://*.google.com',
        'https://*.firebaseio.com',
        'https://*.firebaseapp.com',
        'https://api.alquran.cloud',
        'https://api.quran.com',
        'https://api.qurancdn.com',
        'https://everyayah.com',
        'https://api.aladhan.com',
        'https://nafisnoor.site',
        'https://*.nafisnoor.site',
        'https://*.run.app',
      ],
      frameSrc: [
        "'self'",
        'https://*.firebaseapp.com',
        'https://accounts.google.com',
        'https://apis.google.com',
      ],
      frameAncestors: [
        "'self'",
        'https://*.google.com',
        'https://*.run.app',
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
  crossOriginEmbedderPolicy: false,
  // Required for Firebase Google signInWithPopup to communicate back to the parent window
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: false, // Controlled via CSP frame-ancestors to support AI Studio preview iframe
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

export function extraSecurityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), magnetometer=(self), gyroscope=(self), accelerometer=(self)'
  );
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin') || req.path.startsWith('/api/users')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
}

// ============================================================================
// 5. XSS & MALICIOUS PAYLOAD SANITIZATION MIDDLEWARE
// ============================================================================
const BINARY_EXEMPT_KEYS = new Set(['audioBase64', 'data', 'audio', 'wavUrl']);

export function sanitizeInputString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // Strip null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?(?:script|iframe|object|embed|applet|meta|link|style|svg|math|base|form)\b[^>]*>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '');
}

function sanitizePayloadRecursive(value: any, keyName = '', depth = 0): any {
  if (depth > 8 || value === null || value === undefined) return value;
  if (BINARY_EXEMPT_KEYS.has(keyName) && typeof value === 'string') {
    // Only strip script tags if someone injected HTML into a base64 field
    return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
  if (typeof value === 'string') {
    return sanitizeInputString(value);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 300).map((item) => sanitizePayloadRecursive(item, keyName, depth + 1));
  }
  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      // Block prototype pollution keys
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue;
      }
      cleaned[k] = sanitizePayloadRecursive(v, k, depth + 1);
    }
    return cleaned;
  }
  return value;
}

export function xssSanitizeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizePayloadRecursive(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInputString(req.query[key] as string);
      }
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeInputString(req.params[key]);
      }
    }
  }
  next();
}

// ============================================================================
// 6. RATE LIMITERS (ANTI-BRUTE-FORCE & ANTI-DOS)
// ============================================================================
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 140,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please wait a moment before trying again.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please wait 15 minutes.',
  },
});

export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many administrator authentication requests. Please wait 15 minutes.',
  },
});

// ============================================================================
// 7. CRYPTOGRAPHIC FIREBASE ID TOKEN VERIFICATION & USER ISOLATION
// ============================================================================
export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  iss: string;
  aud: string;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: VerifiedFirebaseToken;
      isAdminAuthenticated?: boolean;
    }
  }
}

let googleCertsCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (googleCertsCache && googleCertsCache.expiresAt > now) {
    return googleCertsCache.certs;
  }

  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error('Failed to fetch Google SecureToken public certificates');
  }

  const certs = (await res.json()) as Record<string, string>;
  googleCertsCache = {
    certs,
    expiresAt: now + 60 * 60 * 1000, // Cache for 1 hour
  };
  return certs;
}

function base64UrlDecodeToBuffer(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, 'base64');
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedFirebaseToken | null> {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64UrlDecodeToBuffer(parts[0]).toString('utf8'));
    const payload = JSON.parse(base64UrlDecodeToBuffer(parts[1]).toString('utf8'));

    if (header.alg !== 'RS256' || !header.kid) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec) return null;
    if (!payload.iat || payload.iat > nowSec + 300) return null;
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) {
      return null;
    }

    const certs = await getGooglePublicCerts();
    const certPem = certs[header.kid];
    if (!certPem) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();

    const signatureBuf = base64UrlDecodeToBuffer(parts[2]);
    const isValidSig = verifier.verify(certPem, signatureBuf);
    if (!isValidSig) return null;

    return {
      uid: payload.sub,
      email: payload.email,
      email_verified: Boolean(payload.email_verified),
      name: payload.name,
      iss: payload.iss,
      aud: payload.aud,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Middleware: Requires a valid, cryptographically verified Firebase ID token
 */
export async function requireUserAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Bearer token.',
    });
  }

  const token = authHeader.slice(7).trim();
  const verified = await verifyFirebaseIdToken(token);
  if (!verified) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
  }

  req.authUser = verified;
  next();
}

/**
 * Middleware: Enforces that an authenticated user can ONLY access their own :userId resource
 */
export async function requireOwnUserAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  await requireUserAuth(req, res, () => {
    const requestedUserId = req.params.userId;
    if (!requestedUserId || !/^[a-zA-Z0-9_\-]{1,128}$/.test(requestedUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID parameter.',
      });
    }

    const adminEmails = getAdminEmailAllowlist();
    const isVerifiedAdminUser =
      Boolean(req.authUser?.email_verified) &&
      Boolean(req.authUser?.email) &&
      adminEmails.includes(req.authUser!.email!.toLowerCase());

    if (req.authUser?.uid !== requestedUserId && !isVerifiedAdminUser) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Users are strictly permitted to access only their own data.',
      });
    }

    next();
  });
}

// ============================================================================
// 8. HARDENED ADMIN SESSION & ROUTE PROTECTION (NO HARDCODED PASSWORDS)
// ============================================================================
interface AdminSessionRecord {
  token: string;
  createdAt: number;
  expiresAt: number;
  uaHash: string;
  email: string;
}

const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const activeAdminSessions = new Map<string, AdminSessionRecord>();
const adminLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function hashUserAgent(req: Request): string {
  const ua = String(req.headers['user-agent'] || 'unknown');
  return crypto.createHash('sha256').update(ua).digest('hex').slice(0, 16);
}

function cleanupExpiredAdminSessions() {
  const now = Date.now();
  for (const [token, session] of activeAdminSessions.entries()) {
    if (session.expiresAt <= now) {
      activeAdminSessions.delete(token);
    }
  }
}

export async function handleAdminLogin(req: Request, res: Response) {
  cleanupExpiredAdminSessions();
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const now = Date.now();

  const attempts = adminLoginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (attempts.lockedUntil > now) {
    const remainingSec = Math.ceil((attempts.lockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      error: `Security lockout active. Please wait ${remainingSec}s before retrying.`,
    });
  }

  const { password, firebaseIdToken } = req.body || {};

  // Option A: Cryptographically verified Firebase ID Token for project owner / admin email
  if (firebaseIdToken && typeof firebaseIdToken === 'string') {
    const verified = await verifyFirebaseIdToken(firebaseIdToken);
    const allowedEmails = getAdminEmailAllowlist();
    if (
      verified &&
      verified.email_verified &&
      verified.email &&
      allowedEmails.includes(verified.email.toLowerCase())
    ) {
      adminLoginAttempts.delete(ip);
      const token = crypto.randomBytes(32).toString('hex');
      activeAdminSessions.set(token, {
        token,
        createdAt: now,
        expiresAt: now + ADMIN_SESSION_TTL_MS,
        uaHash: hashUserAgent(req),
        email: verified.email.toLowerCase(),
      });

      return res.json({
        success: true,
        token,
        expiresInSeconds: ADMIN_SESSION_TTL_MS / 1000,
        user: {
          id: verified.uid,
          name: verified.name || 'Administrator',
          role: 'admin',
          email: verified.email,
          isAdmin: true,
        },
      });
    }
  }

  // Option B: Dedicated Server-Side Admin Password (strictly from process.env.ADMIN_PASSWORD)
  const configuredAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (!configuredAdminPassword) {
    return res.status(503).json({
      success: false,
      error:
        'ADMIN_PASSWORD is not configured in server environment variables. Configure ADMIN_PASSWORD in AI Studio Secrets or sign in with your verified Google Admin account.',
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Administration password is required.',
    });
  }

  const expectedHash = crypto.createHash('sha256').update(configuredAdminPassword).digest();
  const providedHash = crypto.createHash('sha256').update(password).digest();
  const isMatch = crypto.timingSafeEqual(expectedHash, providedHash);

  if (!isMatch) {
    attempts.count = (attempts.count || 0) + 1;
    if (attempts.count >= 5) {
      attempts.lockedUntil = now + 5 * 60 * 1000; // 5-minute lockout after 5 failed attempts
      attempts.count = 0;
    }
    adminLoginAttempts.set(ip, attempts);
    return res.status(401).json({
      success: false,
      error: 'Invalid administration credentials.',
    });
  }

  adminLoginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  activeAdminSessions.set(token, {
    token,
    createdAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_MS,
    uaHash: hashUserAgent(req),
    email: 'admin@nafisnoor.app',
  });

  return res.json({
    success: true,
    token,
    expiresInSeconds: ADMIN_SESSION_TTL_MS / 1000,
    user: {
      id: 'admin_system',
      name: 'Administrator',
      role: 'admin',
      email: 'admin@nafisnoor.app',
      isAdmin: true,
    },
  });
}

export async function isRequestAdminAuthorized(req: Request): Promise<{
  authorized: boolean;
  email?: string;
  uid?: string;
}> {
  cleanupExpiredAdminSessions();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false };
  }

  const token = authHeader.slice(7).trim();
  if (!token) return { authorized: false };

  // 1. Check active server admin session token + User-Agent binding
  const session = activeAdminSessions.get(token);
  if (session && session.expiresAt > Date.now() && session.uaHash === hashUserAgent(req)) {
    return { authorized: true, email: session.email, uid: 'admin_system' };
  }

  // 2. Check if Bearer token is a verified Firebase ID token for an allowlisted admin email
  const verifiedFirebase = await verifyFirebaseIdToken(token);
  const allowedEmails = getAdminEmailAllowlist();
  if (
    verifiedFirebase &&
    verifiedFirebase.email_verified &&
    verifiedFirebase.email &&
    allowedEmails.includes(verifiedFirebase.email.toLowerCase())
  ) {
    return {
      authorized: true,
      email: verifiedFirebase.email.toLowerCase(),
      uid: verifiedFirebase.uid,
    };
  }

  return { authorized: false };
}

export async function handleAdminVerify(req: Request, res: Response) {
  const status = await isRequestAdminAuthorized(req);
  if (!status.authorized) {
    return res.status(401).json({ success: false, valid: false });
  }
  return res.json({
    success: true,
    valid: true,
    user: {
      id: status.uid || 'admin_system',
      name: 'Administrator',
      role: 'admin',
      email: status.email || 'admin@nafisnoor.app',
      isAdmin: true,
    },
  });
}

export function handleAdminLogout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    activeAdminSessions.delete(token);
  }
  return res.json({ success: true, message: 'Admin session terminated.' });
}

export function createVerifiedFounderReviewSession(req: Request, email = 'alnoorgroup.n@gmail.com'): string {
  cleanupExpiredAdminSessions();
  const now = Date.now();
  const token = crypto.randomBytes(32).toString('hex');
  activeAdminSessions.set(token, {
    token,
    createdAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_MS,
    uaHash: hashUserAgent(req),
    email: email.toLowerCase(),
  });
  return token;
}

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = await isRequestAdminAuthorized(req);
  if (!status.authorized) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Verified administrator authentication is required for this route.',
    });
  }
  req.isAdminAuthenticated = true;
  next();
}
