// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  PanelsTopLeft,
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
import { useOrders } from '@/features/orders/hooks/useOrders';
import Image from 'next/image';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  PanelsTopLeft,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Settings,
};

const POLL_INTERVAL_MS = 30_000;

export function Sidebar() {
  const pathname = usePathname();
  const store = useCurrentStore();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const [unfulfilledCount, setUnfulfilledCount] = useState(0);

  const base = store ? `/dashboard/${store.id}` : '/dashboard';

  // ── Unfulfilled badge ──────────────────────────────────────────────────────
  // Polls every 30 seconds. Silently fails — badge simply shows 0 on error.
  // Skipped entirely if no store is loaded yet.

  const { getOrderSummary } = useOrders(store?.id ?? '');

  useEffect(() => {
    if (!store?.id) return;

    async function fetchSummary() {
      try {
        const summary = await getOrderSummary();
        setUnfulfilledCount(summary.unfulfilledCount);
      } catch {
        // Silent — badge shows stale count until next successful poll
      }
    }

    fetchSummary();
    const interval = setInterval(fetchSummary, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

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
        <Image src="/logo-1024.png" alt="fynfloo" width={28} height={28} />
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
          const isOrders = item.label === 'Orders';
          const showBadge = isOrders && unfulfilledCount > 0;

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
              {sidebarOpen && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none"
                      style={{
                        background: isActive ? 'var(--accent)' : 'var(--amber)',
                        color: 'white',
                        fontSize: '10px',
                      }}
                    >
                      {unfulfilledCount > 99 ? '99+' : unfulfilledCount}
                    </span>
                  )}
                </>
              )}
              {/* Collapsed sidebar — badge as dot */}
              {!sidebarOpen && showBadge && (
                <span
                  className="absolute right-2 top-2 w-2 h-2 rounded-full"
                  style={{ background: 'var(--amber)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
