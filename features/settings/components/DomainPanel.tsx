// features/settings/components/DomainPanel.tsx
'use client';

import { Globe } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface Props {
  storeId: string;
}

export function DomainPanel({ storeId }: Props) {
  const { settings, isLoading } = useSettings(storeId);

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Storefront URL
        </label>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border-subtle)' }}
        >
          <Globe className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLoading ? '…' : `${settings?.slug ?? ''}.fynfloo.com`}
          </span>
        </div>
      </div>

      <div
        className="rounded-[var(--radius-lg)] p-5"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Custom domain
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Connect your own domain like{' '}
              <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                shop.yourbrand.com
              </span>
            </p>
          </div>
          <span
            className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            Step 17
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Custom domain configuration will be available in an upcoming update. Your store is
          accessible at{' '}
          <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
            {settings?.slug ?? '…'}.fynfloo.com
          </span>{' '}
          in the meantime.
        </p>
      </div>
    </div>
  );
}
