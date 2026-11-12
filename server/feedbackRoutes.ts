import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import firebaseConfig from '../firebase-applet-config.json';
import {
  requireAdminAuth,
  adminRateLimiter,
  authRateLimiter,
  createVerifiedFounderReviewSession,
  isRequestAdminAuthorized,
} from './securityMiddleware';

const router = express.Router();

export type FeedbackCategory =
  | 'General Feedback'
  | 'Feature Request'
  | 'Bug Report'
  | 'Quran Experience'
  | 'Tasme3 Experience'
  | 'Other';

export type FeedbackStatus = 'Pending' | 'Under Review' | 'Answered';

export interface FeedbackSubmissionRecord {
  id: string;
  category: FeedbackCategory;
  title: string;
  message: string;
  email: string;
  userId: string;
  userName: string;
  language: string;
  status: FeedbackStatus;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
}

const ALLOWED_CATEGORIES: FeedbackCategory[] = [
  'General Feedback',
  'Feature Request',
  'Bug Report',
  'Quran Experience',
  'Tasme3 Experience',
  'Other',
];

const ALLOWED_STATUSES: FeedbackStatus[] = ['Pending', 'Under Review', 'Answered'];

const FIRESTORE_PROJECT_ID = firebaseConfig.projectId || 'uplifted-bulwark-txjsq';
const FIRESTORE_DB_ID = firebaseConfig.firestoreDatabaseId || 'ai-studio-nafisnoor-c329a449-ebd9-48c8-a471-96901bb4cc12';
const FOUNDER_PRIMARY_EMAIL = 'alnoorgroup.n@gmail.com';

// Persistent file path for server-side feedback storage
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const FEEDBACK_STORE_PATH = path.join(DATA_DIR, 'feedback-submissions.json');

// Server-only HMAC key for signing Founder Email Review Links
const REVIEW_LINK_SECRET =
  process.env.ADMIN_PASSWORD ||
  process.env.GEMINI_API_KEY ||
  'nafis-noor-founder-review-hmac-key-2026';

function generateFounderReviewToken(submissionId: string): string {
  return crypto
    .createHmac('sha256', REVIEW_LINK_SECRET)
    .update(`founder-review:${submissionId}`)
    .digest('hex');
}

function verifyFounderReviewToken(submissionId: string, token: string): boolean {
  if (!submissionId || !token || typeof token !== 'string' || token.length !== 64) {
    return false;
  }
  const expected = generateFounderReviewToken(submissionId);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch {
    return false;
  }
}

function ensureStoreDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAllFeedbackFromDisk(): FeedbackSubmissionRecord[] {
  try {
    ensureStoreDirectory();
    if (!fs.existsSync(FEEDBACK_STORE_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(FEEDBACK_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[Feedback Store Read Error]:', err);
    return [];
  }
}

function writeAllFeedbackToDisk(records: FeedbackSubmissionRecord[]): void {
  ensureStoreDirectory();
  const tmpPath = `${FEEDBACK_STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(records, null, 2), 'utf-8');
  fs.renameSync(tmpPath, FEEDBACK_STORE_PATH);
}

function upsertFeedbackOnDisk(record: FeedbackSubmissionRecord): FeedbackSubmissionRecord {
  const all = readAllFeedbackFromDisk();
  const idx = all.findIndex((item) => item.id === record.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...record };
  } else {
    all.unshift(record);
  }
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  writeAllFeedbackToDisk(all);
  return record;
}

/**
 * Also persists new feedback submission to Firestore via REST API (matching firestore.rules for /feedback/{id})
 * so even if a client's browser blocks WebSockets, the submission is stored in the user's Firestore database.
 */
async function syncCreateFeedbackToFirestoreRest(record: FeedbackSubmissionRecord): Promise<boolean> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/feedback?documentId=${encodeURIComponent(
      record.id
    )}`;

    // Note: For server-side REST calls without a user token, request.auth is null so firestore.rules requires userId == 'guest'
    const restUserId = 'guest';
    const body = {
      fields: {
        id: { stringValue: record.id },
        category: { stringValue: record.category },
        title: { stringValue: record.title },
        message: { stringValue: record.message },
        email: { stringValue: record.email || '' },
        userId: { stringValue: restUserId },
        userName: { stringValue: record.userName || 'Guest' },
        language: { stringValue: record.language || 'en' },
        status: { stringValue: 'Pending' },
        isResolved: { booleanValue: false },
        createdAt: { stringValue: record.createdAt },
        updatedAt: { stringValue: record.updatedAt },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // 200 Created or 409 Already Exists (when client SDK already created it) both mean it is in Firestore!
    return res.ok || res.status === 409;
  } catch {
    return false;
  }
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || 'nafisnoor.support@gmail.com';
  const pass = (process.env.SMTP_PASS || '').trim();
  const from = process.env.SMTP_FROM || 'Nafis Noor <nafisnoor.support@gmail.com>';
  const founderEmail = (process.env.FOUNDER_EMAIL || FOUNDER_PRIMARY_EMAIL).trim();

  return { host, port, user, pass, from, founderEmail };
}

function createTransporter() {
  const { host, port, user, pass } = getSmtpConfig();
  if (!pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  });
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sends a real email notification to the Founder whenever feedback is submitted
 */
async function sendFounderFeedbackNotification(
  record: FeedbackSubmissionRecord,
  reviewUrl: string
): Promise<{ sent: boolean; note: string }> {
  const transporter = createTransporter();
  const { from, founderEmail, user } = getSmtpConfig();

  const recipients = Array.from(
    new Set([founderEmail, FOUNDER_PRIMARY_EMAIL, user].filter((e) => e && e.includes('@')))
  );

  if (!transporter) {
    return {
      sent: false,
      note: 'Saved to database & Founder dashboard (SMTP_PASS not set for outbound email relay)',
    };
  }

  try {
    const safeTitle = escapeHtml(record.title);
    const safeCategory = escapeHtml(record.category);
    const safeMessage = escapeHtml(record.message).replace(/\n/g, '<br/>');
    const safeEmail = escapeHtml(record.email || 'Not provided');
    const safeUser = escapeHtml(record.userName || 'Guest');
    const safeId = escapeHtml(record.id);
    const safeDate = new Date(record.createdAt).toUTCString();

    await transporter.sendMail({
      from,
      to: recipients.join(', '),
      replyTo: record.email && record.email.includes('@') ? record.email : undefined,
      subject: `[Nafis Noor Feedback] [${record.category}] ${record.title}`,
      text: [
        `New Feedback Submission on Nafis Noor`,
        `=====================================`,
        `Submission ID: ${record.id}`,
        `Category: ${record.category}`,
        `Title: ${record.title}`,
        `Submitted By: ${record.userName} (${record.userId})`,
        `Reply Email: ${record.email || 'Not provided'}`,
        `Date: ${safeDate}`,
        `Status: ${record.status}`,
        ``,
        `Message:`,
        `${record.message}`,
        ``,
        `Secure Founder Review Link:`,
        `${reviewUrl}`,
      ].join('\n'),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080a0e; color: #f5efe6; padding: 36px 18px;">
          <div style="max-width: 580px; margin: 0 auto; background: #10141d; border: 1px solid rgba(201,160,99,0.35); border-radius: 24px; padding: 32px; box-shadow: 0 12px 36px rgba(0,0,0,0.6);">
            <div style="border-bottom: 1px solid rgba(201,160,99,0.2); padding-bottom: 16px; margin-bottom: 20px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #dfba7f; font-weight: 700;">Nafis Noor · Founder Notification</div>
              <h1 style="color: #f5efe6; font-family: Georgia, serif; font-size: 22px; margin: 6px 0 0;">${safeTitle}</h1>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #d6d3d1; margin-bottom: 20px;">
              <tr>
                <td style="padding: 6px 0; color: #a8a29e; width: 130px;">Submission ID:</td>
                <td style="padding: 6px 0; font-family: monospace; color: #dfba7f; font-weight: 600;">${safeId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a8a29e;">Category:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #f5efe6;">${safeCategory}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a8a29e;">Submitted By:</td>
                <td style="padding: 6px 0;">${safeUser}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a8a29e;">User Email:</td>
                <td style="padding: 6px 0; color: #dfba7f;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a8a29e;">Submitted At:</td>
                <td style="padding: 6px 0;">${safeDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a8a29e;">Status:</td>
                <td style="padding: 6px 0; color: #fbbf24; font-weight: 600;">${record.status}</td>
              </tr>
            </table>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(201,160,99,0.25); border-radius: 16px; padding: 18px; margin-bottom: 24px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #dfba7f; margin-bottom: 8px; font-weight: 700;">Detailed Message</div>
              <div style="font-size: 14px; line-height: 1.7; color: #f5efe6;">${safeMessage}</div>
            </div>

            <div style="text-align: center; margin: 28px 0 12px;">
              <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(90deg, #c9a063, #dfba7f); color: #090b0e; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 14px;">
                Open &amp; Review Submission in Nafis Noor
              </a>
            </div>
            <p style="text-align: center; color: #78716c; font-size: 11px; margin-top: 16px;">
              This secure link authenticates your Founder session to review, update status, or reply to this submission.
            </p>
          </div>
        </div>
      `,
    });

    return { sent: true, note: `Founder notification email sent to ${founderEmail}` };
  } catch (err: any) {
    console.warn('[Feedback Notification Email Warning]:', err?.code || err?.message);
    return {
      sent: false,
      note: 'Submission saved permanently in database and Founder dashboard.',
    };
  }
}

/**
 * Sends a real email reply to the user when the Founder/Admin replies to their feedback
 */
async function sendUserFeedbackReplyEmail(
  record: FeedbackSubmissionRecord,
  replyMessage: string
): Promise<{ sent: boolean; note: string }> {
  if (!record.email || !record.email.includes('@')) {
    return { sent: false, note: 'No user email provided on this submission; reply saved in database.' };
  }

  const transporter = createTransporter();
  const { from } = getSmtpConfig();

  if (!transporter) {
    return {
      sent: false,
      note: 'Reply saved in database (SMTP_PASS not set for outbound email delivery).',
    };
  }

  try {
    const safeTitle = escapeHtml(record.title);
    const safeOriginal = escapeHtml(record.message).replace(/\n/g, '<br/>');
    const safeReply = escapeHtml(replyMessage).replace(/\n/g, '<br/>');

    await transporter.sendMail({
      from,
      to: record.email,
      subject: `Re: Your Nafis Noor Feedback — ${record.title} (${record.id})`,
      text: [
        `Assalamu Alaikum ${record.userName || ''},`,
        ``,
        `Thank you for sharing your feedback with Nafis Noor.`,
        ``,
        `Response from the Nafis Noor Founder & Team:`,
        `--------------------------------------------`,
        `${replyMessage}`,
        ``,
        `Your Original Submission (${record.id} - ${record.category}):`,
        `${record.title}`,
        `${record.message}`,
        ``,
        `Jazakum Allahu Khairan,`,
        `Nafis Noor Team (ALNOOR GROUP)`,
      ].join('\n'),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #080a0e; color: #f5efe6; padding: 36px 18px;">
          <div style="max-width: 560px; margin: 0 auto; background: #10141d; border: 1px solid rgba(201,160,99,0.35); border-radius: 24px; padding: 32px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #dfba7f; font-weight: 700;">Nafis Noor · Official Response</div>
            <h2 style="color: #f5efe6; font-family: Georgia, serif; margin: 8px 0 16px;">Assalamu Alaikum,</h2>
            <p style="color: #d6d3d1; font-size: 14px; line-height: 1.6;">
              Thank you for sharing your feedback regarding <strong style="color: #dfba7f;">${safeTitle}</strong>. Here is the response from the Nafis Noor team:
            </p>
            <div style="background: rgba(201,160,99,0.12); border: 1px solid rgba(223,186,127,0.4); border-radius: 16px; padding: 18px; margin: 20px 0; color: #f5efe6; font-size: 14px; line-height: 1.7;">
              ${safeReply}
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px; margin-top: 22px; font-size: 12px; color: #a8a29e;">
              <div style="font-weight: 600; margin-bottom: 4px;">Your Original Submission (${escapeHtml(record.id)} · ${escapeHtml(record.category)}):</div>
              <div>${safeOriginal}</div>
            </div>
          </div>
        </div>
      `,
    });

    return { sent: true, note: `Email reply dispatched to ${record.email}` };
  } catch (err: any) {
    console.warn('[Feedback User Reply Email Warning]:', err?.code || err?.message);
    return { sent: false, note: 'Reply saved permanently in database.' };
  }
}

// ============================================================================
// 1. PUBLIC ENDPOINT: Submit Feedback (Works for both Guest & Registered Users)
// ============================================================================
router.post('/', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const {
      id: clientProvidedId,
      category,
      title,
      message,
      email,
      userId,
      userName,
      language,
    } = req.body || {};

    const cleanCategory = String(category || '').trim() as FeedbackCategory;
    if (!ALLOWED_CATEGORIES.includes(cleanCategory)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid feedback category.',
      });
    }

    const cleanTitle = String(title || '').trim();
    if (cleanTitle.length < 2 || cleanTitle.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Feedback title must be between 2 and 200 characters.',
      });
    }

    const cleanMessage = String(message || '').trim();
    if (cleanMessage.length < 5 || cleanMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Detailed message must be between 5 and 5,000 characters.',
      });
    }

    const cleanEmail = String(email || '').trim().slice(0, 254);
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address or leave the optional email field blank.',
      });
    }

    const nowIso = new Date().toISOString().slice(0, 64);
    const dateStamp = nowIso.slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const validClientId =
      typeof clientProvidedId === 'string' &&
      /^[a-zA-Z0-9_\-]{4,128}$/.test(clientProvidedId.trim())
        ? clientProvidedId.trim()
        : `FB-${dateStamp}-${randomSuffix}`;

    const cleanUserId =
      typeof userId === 'string' && /^[a-zA-Z0-9_\-]{1,128}$/.test(userId.trim())
        ? userId.trim()
        : 'guest';
    const cleanUserName =
      typeof userName === 'string' && userName.trim().length > 0
        ? userName.trim().slice(0, 100)
        : 'Guest';
    const cleanLang =
      typeof language === 'string' && language.trim().length >= 2
        ? language.trim().slice(0, 16)
        : 'en';

    const newRecord: FeedbackSubmissionRecord = {
      id: validClientId,
      category: cleanCategory,
      title: cleanTitle,
      message: cleanMessage,
      email: cleanEmail,
      userId: cleanUserId,
      userName: cleanUserName,
      language: cleanLang,
      status: 'Pending',
      isResolved: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 1. Permanently save to server disk store
    upsertFeedbackOnDisk(newRecord);

    // 2. Also ensure it exists in Firestore (in case client was in guest mode or offline)
    await syncCreateFeedbackToFirestoreRest(newRecord);

    // 3. Generate secure HMAC-signed Founder Review Link and send real Founder Notification Email
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const origin = process.env.APP_URL || `${protocol}://${host}`;
    const reviewToken = generateFounderReviewToken(newRecord.id);
    const reviewUrl = `${origin.replace(/\/$/, '')}/?reviewFeedback=${encodeURIComponent(
      newRecord.id
    )}&reviewToken=${encodeURIComponent(reviewToken)}`;

    const emailNotification = await sendFounderFeedbackNotification(newRecord, reviewUrl);

    return res.status(201).json({
      success: true,
      submission: {
        id: newRecord.id,
        category: newRecord.category,
        title: newRecord.title,
        message: newRecord.message,
        email: newRecord.email,
        status: newRecord.status,
        isResolved: newRecord.isResolved,
        createdAt: newRecord.createdAt,
        updatedAt: newRecord.updatedAt,
      },
      notification: emailNotification,
    });
  } catch (err: any) {
    console.error('[Feedback Submit Error]:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: 'Could not save your feedback submission right now. Please try again.',
    });
  }
});

// ============================================================================
// 2. SECURE FOUNDER EMAIL REVIEW LINK VERIFICATION
// ============================================================================
router.post('/verify-review-link', adminRateLimiter, async (req: Request, res: Response) => {
  const { submissionId, reviewToken } = req.body || {};
  const cleanId = String(submissionId || '').trim();
  const cleanToken = String(reviewToken || '').trim();

  if (!verifyFounderReviewToken(cleanId, cleanToken)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired Founder review token.',
    });
  }

  // Issue a verified 2-hour Founder Admin Session bound to this User-Agent
  const adminSessionToken = createVerifiedFounderReviewSession(req, FOUNDER_PRIMARY_EMAIL);
  const allSubmissions = readAllFeedbackFromDisk();
  const targetSubmission = allSubmissions.find((item) => item.id === cleanId) || null;

  return res.json({
    success: true,
    adminToken: adminSessionToken,
    targetSubmissionId: cleanId,
    submission: targetSubmission,
    submissions: allSubmissions,
  });
});

// ============================================================================
// 3. PRIVATE ADMIN ENDPOINTS: List, Sync, Filter, Update Status, Resolve & Reply
// ============================================================================
router.get('/admin', adminRateLimiter, requireAdminAuth, (req: Request, res: Response) => {
  const categoryFilter = typeof req.query.category === 'string' ? req.query.category.trim() : 'all';
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : 'all';

  let list = readAllFeedbackFromDisk();

  if (categoryFilter && categoryFilter !== 'all') {
    list = list.filter((item) => item.category === categoryFilter);
  }
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'Resolved') {
      list = list.filter((item) => item.isResolved);
    } else {
      list = list.filter((item) => item.status === statusFilter);
    }
  }

  return res.json({
    success: true,
    count: list.length,
    submissions: list,
  });
});

// Sync Firestore items fetched by authenticated Founder client into server store
router.post('/admin/sync', adminRateLimiter, requireAdminAuth, (req: Request, res: Response) => {
  const { items } = req.body || {};
  if (Array.isArray(items)) {
    const existing = readAllFeedbackFromDisk();
    const byId = new Map<string, FeedbackSubmissionRecord>();
    for (const item of existing) {
      byId.set(item.id, item);
    }
    for (const incoming of items) {
      if (incoming && typeof incoming.id === 'string' && incoming.title && incoming.message) {
        const current = byId.get(incoming.id);
        if (!current || new Date(incoming.updatedAt || 0) >= new Date(current.updatedAt || 0)) {
          byId.set(incoming.id, incoming);
        }
      }
    }
    const merged = Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    writeAllFeedbackToDisk(merged);
    return res.json({ success: true, count: merged.length, submissions: merged });
  }
  return res.json({ success: true, submissions: readAllFeedbackFromDisk() });
});

router.patch('/admin/:id', adminRateLimiter, requireAdminAuth, async (req: Request, res: Response) => {
  const submissionId = String(req.params.id || '').trim();
  if (!submissionId) {
    return res.status(400).json({ success: false, error: 'Submission ID is required.' });
  }

  const all = readAllFeedbackFromDisk();
  const existingIdx = all.findIndex((item) => item.id === submissionId);

  // If the item was created only in Firestore and not yet in disk store, allow upserting from body.fallbackItem
  let target: FeedbackSubmissionRecord | null = existingIdx >= 0 ? all[existingIdx] : null;
  if (!target && req.body?.fallbackItem && req.body.fallbackItem.id === submissionId) {
    target = req.body.fallbackItem as FeedbackSubmissionRecord;
  }

  if (!target) {
    return res.status(404).json({
      success: false,
      error: 'Feedback submission not found.',
    });
  }

  const { status, isResolved, adminReply } = req.body || {};
  const nowIso = new Date().toISOString().slice(0, 64);

  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be Pending, Under Review, or Answered.',
      });
    }
    target.status = status;
  }

  if (typeof isResolved === 'boolean') {
    target.isResolved = isResolved;
  }

  let emailReplyStatus: { sent: boolean; note: string } | null = null;
  if (typeof adminReply === 'string' && adminReply.trim().length > 0) {
    const cleanReply = adminReply.trim().slice(0, 5000);
    const adminStatus = await isRequestAdminAuthorized(req);
    target.adminReply = cleanReply;
    target.repliedAt = nowIso;
    target.repliedBy = adminStatus.email || FOUNDER_PRIMARY_EMAIL;
    target.status = 'Answered';

    emailReplyStatus = await sendUserFeedbackReplyEmail(target, cleanReply);
  }

  target.updatedAt = nowIso;
  upsertFeedbackOnDisk(target);

  return res.json({
    success: true,
    submission: target,
    emailReply: emailReplyStatus,
  });
});

export default router;
