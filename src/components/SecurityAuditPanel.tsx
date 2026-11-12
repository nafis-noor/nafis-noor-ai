import React, { useState } from 'react';
import { Shield, Lock, CheckCircle2, AlertTriangle, RefreshCw, KeyRound, EyeOff, FileWarning, Globe, MessageSquarePlus, ChevronRight } from 'lucide-react';
import { getCurrentUserIdToken } from '../lib/firebase';

interface SecurityAuditPanelProps {
  isDark: boolean;
  isArabic: boolean;
  isAdmin: boolean;
  accountId?: string;
  onOpenAdminFeedback?: () => void;
}

interface ServerAuditResponse {
  timestamp: string;
  audit: {
    apiKeysHidden: boolean;
    hardcodedSecretsRemoved: boolean;
    exposedFilesBlocked: string[];
    securityHeaders: string[];
    xssProtection: {
      serverPayloadSanitizer: string;
      clientDomPurify: string;
      prototypePollutionGuard: string;
    };
    corsPolicy: {
      strictOriginAllowlist: boolean;
      websocketOriginCheck: boolean;
    };
    authentication: {
      firebaseJwtRsa256Verification: string;
      userOwnDataIsolation: string;
      passwordHashing: string;
      adminSessionBinding: string;
    };
    environmentVariables: Array<{
      variable: string;
      configured: boolean;
      scope: string;
      status: 'secure' | 'warning';
      note: string;
    }>;
  };
}

export const SecurityAuditPanel: React.FC<SecurityAuditPanelProps> = ({
  isDark,
  isArabic,
  isAdmin,
  accountId,
  onOpenAdminFeedback,
}) => {
  const [auditReport, setAuditReport] = useState<ServerAuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const handleRunAdminAudit = async () => {
    setIsLoading(true);
    setAuditError(null);
    try {
      const adminToken = sessionStorage.getItem('noor_admin_token');
      const firebaseToken = await getCurrentUserIdToken().catch(() => null);
      const bearer = adminToken || firebaseToken;

      if (!bearer) {
        setAuditError(
          isArabic
            ? 'يتطلب فحص الأمان المباشر جلسة مسؤول معتمدة.'
            : 'Live server audit requires a verified Administrator session token.'
        );
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/admin/security-audit', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${bearer}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setAuditError(
          data.error ||
            (isArabic
              ? 'تعذر التحقق من صلاحيات المسؤول.'
              : 'Administrator authorization verification failed.')
        );
      } else {
        setAuditReport(data);
      }
    } catch {
      setAuditError(
        isArabic
          ? 'تعذر الاتصال بخادم الفحص الأمني.'
          : 'Could not reach the server security audit endpoint.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const securityPillars = [
    {
      icon: EyeOff,
      title: isArabic ? 'إخفاء مفاتيح API ومتغيرات البيئة' : 'API Keys Hidden & Server-Only Env Vars',
      desc: isArabic
        ? 'مفاتيح Gemini و SMTP معزولة تماماً في الخادم ولا تظهر أبداً في المتصفح.'
        : 'GEMINI_API_KEY, SMTP_PASS & ADMIN_PASSWORD are strictly isolated on the server (envPrefix: VITE_).',
    },
    {
      icon: Lock,
      title: isArabic ? 'عزل بيانات المستخدمين (Zero-Trust ABAC)' : 'Strict User Own-Data Isolation',
      desc: isArabic
        ? 'قواعد Firestore الصارمة والتحقق التشفيري RSA-SHA256 يضمنان وصول كل مستخدم لبياناته فقط.'
        : 'Hardened Firestore rules (request.auth.uid == userId) & RSA-SHA256 JWT checks block cross-user access.',
    },
    {
      icon: KeyRound,
      title: isArabic ? 'حماية مسارات الإدارة والمصادقة' : 'Protected Admin & User Routes',
      desc: isArabic
        ? 'تشفير PBKDF2 بـ 100,000 دورة، وجلسات مسؤول مقيدة بالوقت والمتصفح مع قفل المحاولات.'
        : 'PBKDF2 (100k iterations), timing-safe admin auth, UA-bound 2h tokens, and rate-limited lockouts.',
    },
    {
      icon: Shield,
      title: isArabic ? 'ترويسات الأمان والحماية من XSS' : 'Security Headers (CSP/HSTS) & XSS Blocker',
      desc: isArabic
        ? 'تفعيل Helmet CSP و HSTS وتصفية المدخلات عبر DOMPurify والخادم لمنع هجمات XSS.'
        : 'Helmet CSP, HSTS, X-Content-Type-Options, DOMPurify & recursive server payload sanitization active.',
    },
    {
      icon: Globe,
      title: isArabic ? 'سياسة CORS الصارمة وحماية الملفات' : 'Strict CORS & Exposed File Blocker',
      desc: isArabic
        ? 'حظر الوصول إلى ملفات .env وخرائط المصدر وملفات الخادم، والتحقق من النطاقات المسموحة.'
        : 'Blocks /.env, *.map, /server.cjs, /firestore.rules (403 Forbidden) & enforces CORS/WebSocket origin allowlists.',
    },
  ];

  return (
    <div
      id="profile-security-audit-card"
      className={`rounded-3xl p-5 sm:p-6 border transition-all ${
        isDark
          ? 'liquid-glass border-emerald-500/30 shadow-lg'
          : 'liquid-glass-light border-emerald-600/30 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`text-xs sm:text-sm font-serif-heading font-bold ${
                  isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                }`}
              >
                {isArabic ? 'مركز الأمان وحماية الخصوصية' : 'Security & Data Isolation Audit'}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {isArabic ? 'محمي بالكامل' : 'HARDENED'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-light mt-0.5">
              {isArabic
                ? 'حماية شاملة للمفاتيح، الجلسات، قواعد البيانات، وترويسات الأمان'
                : 'Zero-trust Firestore rules, server-side key isolation, XSS/CORS guards & route protection'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleRunAdminAudit}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isArabic ? 'فحص الخادم' : 'Live Audit'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {securityPillars.map((pillar, idx) => {
          const IconComponent = pillar.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                isDark
                  ? 'bg-[#0E1218]/90 border-white/10'
                  : 'bg-stone-50/90 border-stone-200/80'
              }`}
            >
              <IconComponent className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold ${
                    isDark ? 'text-stone-100' : 'text-stone-900'
                  }`}
                >
                  {pillar.title}
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                  {pillar.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active User Isolation Verification */}
      <div
        className={`mt-3 p-3 rounded-2xl border flex items-center justify-between text-[11px] ${
          isDark
            ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-300'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {isArabic
              ? 'نطاق الوصول للبيانات معزول حصرياً لحسابك النشط'
              : 'Data scope strictly isolated to your authenticated session'}
          </span>
        </div>
        <span className="font-mono text-[10px] opacity-80">
          {accountId ? `UID: ${accountId.slice(0, 12)}…` : isArabic ? 'وضع الزائر المعزول' : 'Isolated Guest'}
        </span>
      </div>

      {/* Private Founder Feedback Management Section (Strictly Admin Only) */}
      {onOpenAdminFeedback && isAdmin && (
        <div
          id="admin-dashboard-feedback-management-section"
          className={`mt-3 p-3.5 rounded-2xl border transition-all ${
            isDark
              ? 'bg-gradient-to-r from-[#101824] to-[#131C2B] border-[#DFBA7F]/40'
              : 'bg-amber-50/90 border-[#C9A063]/45'
          }`}
        >
          <button
            id="open-founder-feedback-management-btn"
            type="button"
            onClick={onOpenAdminFeedback}
            className="w-full flex items-center justify-between gap-3 text-start cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#C9A063]/20 border border-[#C9A063]/35 text-[#DFBA7F] flex items-center justify-center shrink-0">
                <MessageSquarePlus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold ${
                      isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                    }`}
                  >
                    {isArabic
                      ? 'إدارة الملاحظات والاقتراحات (خاص بالمؤسس)'
                      : 'Private Founder Feedback Management'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#C9A063]/20 text-[#DFBA7F] border border-[#C9A063]/35">
                    {isArabic ? 'مُصرح' : 'AUTHORIZED'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">
                  {isArabic
                    ? 'عرض جميع الملاحظات، التصفية، الرد على المستخدمين، وتحديث الحالات'
                    : 'View all submitted feedback, filter by category & status, reply to users & resolve issues'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#DFBA7F] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {auditError && (
        <div className="mt-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{auditError}</span>
        </div>
      )}

      {auditReport && (
        <div
          className={`mt-4 p-4 rounded-2xl border space-y-3 text-xs ${
            isDark ? 'bg-[#090C10] border-emerald-500/30' : 'bg-white border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {isArabic ? 'تقرير فحص الخادم المباشر (خاص بالمسؤول)' : 'Live Server Security Audit (Admin Verified)'}
            </span>
            <span className="font-mono text-[10px] text-stone-400">
              {new Date(auditReport.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[#DFBA7F] uppercase tracking-wider">
              {isArabic ? 'حالة متغيرات البيئة (في الخادم فقط)' : 'Environment Variables Status (Server-Only)'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {auditReport.audit.environmentVariables.map((env) => (
                <div
                  key={env.variable}
                  className={`p-2 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-[#12161F] border-white/5' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div>
                    <div className="font-mono font-bold text-[11px] text-stone-200">
                      {env.variable}
                    </div>
                    <div className="text-[10px] text-stone-400">{env.note}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      env.configured
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {env.configured ? 'SET' : 'DEFAULT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {auditReport.audit.exposedFilesBlocked.map((pattern) => (
              <span
                key={pattern}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1"
              >
                <FileWarning className="w-3 h-3" />
                Blocked: {pattern}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
