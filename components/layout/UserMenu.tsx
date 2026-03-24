// components/layout/UserMenu.tsx
'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { logout } from '@/lib/auth';
import { getInitials } from '@/lib/utils';

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      reset();
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) return null;

  const initials = getInitials(user.email);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-[var(--radius-md)] transition-colors"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          {initials}
        </div>
        <span
          className="text-sm font-medium hidden sm:block max-w-[140px] truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {user.email}
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-1.5 w-52 rounded-[var(--radius-lg)] py-1 z-20"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border-subtle)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            {/* User info */}
            <div
              className="px-3 py-2 mb-1"
              style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
            >
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user.email}
              </p>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-elevated)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
