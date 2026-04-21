// features/settings/components/SecurityPanel.tsx
'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Monitor,
  Smartphone,
  Globe,
  Copy,
  Check,
  LogOut,
} from 'lucide-react';
import { useMfa, useSessions } from '../hooks/useSecurity';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return <Globe className="h-4 w-4" />;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
}

function getDeviceLabel(session: { deviceName: string | null; userAgent: string | null }) {
  if (session.deviceName) return session.deviceName;
  if (!session.userAgent) return 'Unknown device';
  const ua = session.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Browser';
}

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  placeholder = '000000',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm font-mono outline-none tracking-widest"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
        letterSpacing: '0.25em',
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border-subtle)')}
    />
  );
}

// ─── Backup codes display ─────────────────────────────────────────────────────

function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyAll() {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-[var(--radius-md)] px-4 py-3 text-sm"
        style={{
          background: 'var(--amber-bg)',
          color: 'var(--amber)',
          border: '1px solid var(--amber-border)',
        }}
      >
        Save these backup codes somewhere safe. Each can only be used once. You will not see them
        again.
      </div>

      <div
        className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] p-4"
        style={{ background: 'var(--bg-elevated)' }}
      >
        {codes.map((code) => (
          <span key={code} className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
            {code}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={copyAll}
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--bg-border-subtle)',
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy all'}
        </button>

        <button
          onClick={onDone}
          className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          I&apos;ve saved these codes
        </button>
      </div>
    </div>
  );
}

// ─── MFA Section ─────────────────────────────────────────────────────────────

function MfaSection() {
  const {
    mfaEnabled,
    setupData,
    backupCodes,
    isLoading,
    error,
    startSetup,
    verifyAndEnable,
    disable,
    resetSetup,
  } = useMfa();

  const [step, setStep] = useState<'idle' | 'qr' | 'verify' | 'backup' | 'disabling'>('idle');
  const [totpCode, setTotpCode] = useState('');

  async function handleStartSetup() {
    await startSetup();
    setStep('qr');
  }

  async function handleVerify() {
    const ok = await verifyAndEnable(totpCode);
    if (ok) {
      setTotpCode('');
      setStep('backup');
    }
  }

  async function handleDisable() {
    const ok = await disable(totpCode);
    if (ok) {
      setTotpCode('');
      setStep('idle');
    }
  }

  function handleDoneBackup() {
    resetSetup();
    setStep('idle');
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] p-5 space-y-4"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Two-factor authentication
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Add an extra layer of security with an authenticator app like Google Authenticator or
            Authy.
          </p>
        </div>
        {mfaEnabled ? (
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
            style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Enabled
          </span>
        ) : (
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
            style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Not enabled
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-3 py-2.5 rounded-[var(--radius-md)] text-sm"
          style={{
            background: 'var(--red-bg)',
            color: 'var(--red)',
            border: '1px solid var(--red-border)',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Setup flow ── */}
      {!mfaEnabled && step === 'idle' && (
        <button
          onClick={handleStartSetup}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
          style={{
            background: 'var(--accent)',
            color: 'white',
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Set up 2FA
        </button>
      )}

      {!mfaEnabled && step === 'qr' && setupData && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setupData.qrCodeUrl}
              alt="MFA QR code"
              className="w-48 h-48 rounded-[var(--radius-md)]"
            />
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            Can&apos;t scan? Enter this code manually:{' '}
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {setupData.secret}
            </span>
          </p>
          <button
            onClick={() => setStep('verify')}
            className="w-full px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            I&apos;ve scanned the code
          </button>
        </div>
      )}

      {!mfaEnabled && step === 'verify' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>
          <OtpInput value={totpCode} onChange={setTotpCode} />
          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={isLoading || totpCode.length !== 6}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
              style={{
                background: 'var(--accent)',
                color: 'white',
                opacity: isLoading || totpCode.length !== 6 ? 0.6 : 1,
                cursor: isLoading || totpCode.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm and enable
            </button>
            <button
              onClick={() => {
                setStep('qr');
                setTotpCode('');
              }}
              className="text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'backup' && backupCodes && (
        <BackupCodes codes={backupCodes} onDone={handleDoneBackup} />
      )}

      {/* ── Disable flow ── */}
      {mfaEnabled && step === 'idle' && (
        <button
          onClick={() => setStep('disabling')}
          className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--bg-border-subtle)',
          }}
        >
          Disable 2FA
        </button>
      )}

      {mfaEnabled && step === 'disabling' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Enter your current 6-digit authenticator code to disable 2FA.
          </p>
          <OtpInput value={totpCode} onChange={setTotpCode} />
          <div className="flex items-center gap-3">
            <button
              onClick={handleDisable}
              disabled={isLoading || totpCode.length !== 6}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
              style={{
                background: 'var(--red)',
                color: 'white',
                opacity: isLoading || totpCode.length !== 6 ? 0.6 : 1,
                cursor: isLoading || totpCode.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Disable 2FA
            </button>
            <button
              onClick={() => {
                setStep('idle');
                setTotpCode('');
              }}
              className="text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sessions Section ─────────────────────────────────────────────────────────

function SessionsSection() {
  const { sessions, isLoading, revokingId, isRevokingAll, error, revokeSession, revokeAllOther } =
    useSessions();

  if (isLoading) {
    return (
      <div
        className="rounded-[var(--radius-lg)] p-5 animate-pulse"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="h-4 w-32 rounded mb-4" style={{ background: 'var(--bg-elevated)' }} />
        {[1, 2].map((i) => (
          <div key={i} className="h-14 rounded mb-2" style={{ background: 'var(--bg-elevated)' }} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] p-5 space-y-4"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Active sessions
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Devices currently logged in to your account.
          </p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={revokeAllOther}
            disabled={isRevokingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-opacity"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--bg-border-subtle)',
              opacity: isRevokingAll ? 0.6 : 1,
            }}
          >
            {isRevokingAll && <Loader2 className="h-3 w-3 animate-spin" />}
            Sign out all other devices
          </button>
        )}
      </div>

      {error && (
        <div
          className="px-3 py-2.5 rounded-[var(--radius-md)] text-sm"
          style={{
            background: 'var(--red-bg)',
            color: 'var(--red)',
            border: '1px solid var(--red-border)',
          }}
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        {sessions.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No active sessions found.
          </p>
        )}
        {sessions.map((session, index) => (
          <div
            key={session.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[var(--radius-md)]"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: 'var(--text-tertiary)' }}>
                {getDeviceIcon(session.userAgent)}
              </span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {getDeviceLabel(session)}
                  {index === 0 && (
                    <span
                      className="ml-2 text-xs font-normal"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      (this device)
                    </span>
                  )}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {session.ip ?? 'Unknown IP'} ·{' '}
                  {session.lastUsedAt
                    ? formatRelativeTime(session.lastUsedAt)
                    : formatDateTime(session.createdAt)}
                </p>
              </div>
            </div>

            {index !== 0 && (
              <button
                onClick={() => revokeSession(session.id)}
                disabled={revokingId === session.id}
                className="flex items-center gap-1.5 text-xs transition-opacity"
                style={{
                  color: 'var(--text-tertiary)',
                  opacity: revokingId === session.id ? 0.5 : 1,
                }}
              >
                {revokingId === session.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SecurityPanel ────────────────────────────────────────────────────────────

export function SecurityPanel() {
  return (
    <div className="max-w-xl space-y-6">
      <MfaSection />
      <SessionsSection />
    </div>
  );
}
