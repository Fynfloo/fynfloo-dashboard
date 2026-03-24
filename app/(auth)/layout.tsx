// app/(auth)/layout.tsx
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'var(--text-primary)' }}
    >
      <div className="w-full max-w-[480px] space-y-8">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          {/* <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 8C6 6.9 6.9 6 8 6h8l6 6v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8z"
                fill="white"
                fillOpacity="0.9"
              />
              <path d="M16 6l6 6h-4c-1.1 0-2-.9-2-2V6z" fill="white" fillOpacity="0.5" />
            </svg>
          </div> */}
          <Image src="/logo-1024.png" alt="fynfloo" width={56} height={56} />
          <span
            className="text-2xl font-bold"
            style={{ color: '#ffffff', letterSpacing: '-0.03em' }}
          >
            fynfloo
          </span>
        </div>

        {children}

        {/* Footer */}
        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          By continuing, you agree to our{' '}
          <span
            className="font-medium cursor-not-allowed"
            style={{ color: 'rgba(255,255,255,0.8)' }}
            title="Coming soon"
          >
            Terms
          </span>{' '}
          and{' '}
          <span
            className="font-medium cursor-not-allowed"
            style={{ color: 'rgba(255,255,255,0.8)' }}
            title="Coming soon"
          >
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
}
