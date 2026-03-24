// components/layout/Header.tsx
'use client';

import { Menu } from 'lucide-react';
import { useUiStore } from '@/store/ui.store';
import { UserMenu } from './UserMenu';
import { MfaNudgeBanner } from './MfaNudgeBanner';

export function Header() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <div>
      <header
        className="flex items-center h-14 px-4 gap-3 shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border-subtle)',
        }}
      >
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-[var(--radius-md)] transition-colors"
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
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        <UserMenu />
      </header>
      <MfaNudgeBanner />
    </div>
  );
}
