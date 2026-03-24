import Image from 'next/image';

// app/onboarding/layout.tsx
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <header
        className="flex items-center h-14 px-6 shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <Image src="/logo-1024.png" alt="fynfloo" width={28} height={28} />
          <span
            className="text-base font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
          >
            fynfloo
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
