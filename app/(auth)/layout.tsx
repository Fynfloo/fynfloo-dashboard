// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg-base)' }}
    >
      <div className="w-full max-w-[400px] space-y-6">
        {/* Wordmark */}
        <div className="text-center">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}
          >
            fynfloo
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
