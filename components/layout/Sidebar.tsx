// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentStore } from '@/hooks/useStore';
import { useUiStore } from '@/store/ui.store';
import { NAV_ITEMS } from '@/lib/constants';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const store = useCurrentStore();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  const base = store ? `/dashboard/${store.id}` : '/dashboard';

  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 h-full transition-all duration-200',
        sidebarOpen ? 'w-56' : 'w-16',
      )}
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--bg-border-subtle)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center h-14 px-4 shrink-0"
        style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
            <path
              d="M6 8C6 6.9 6.9 6 8 6h8l6 6v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8z"
              fill="white"
              fillOpacity="0.9"
            />
            <path d="M16 6l6 6h-4c-1.1 0-2-.9-2-2V6z" fill="white" fillOpacity="0.5" />
          </svg>
        </div>
        {sidebarOpen && (
          <span
            className="ml-2.5 text-base font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
          >
            fynfloo
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const href = `${base}${item.href}`;
          const isActive = item.href === '' ? pathname === base : pathname.startsWith(href);
          const Icon = ICONS[item.icon];

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)]',
                'text-sm font-medium transition-all duration-150',
                'group',
              )}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
