// features/settings/components/SettingsNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';

const TABS = [
  { label: 'General', href: '' },
  { label: 'Theme', href: '/theme' },
  { label: 'Storefront', href: '/storefront' },
  { label: 'Payments', href: '/payments' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Domain', href: '/domain' },
  { label: 'Security', href: '/security' },
] as const;

// interface SettingsNavProps {
//   storeId: string;
// }

export function SettingsNav() {
  const params = useParams();
  const storeId = params.storeId as string;
  const pathname = usePathname();
  const base = `/dashboard/${storeId}/settings`;

  return (
    <div
      className="flex gap-0.5 mb-8"
      style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
    >
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);

        return (
          <Link
            key={tab.label}
            href={href}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderBottomColor: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
