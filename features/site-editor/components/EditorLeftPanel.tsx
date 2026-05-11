'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { SiteEditorPanelKey } from '../lib/siteEditor';

export function EditorLeftPanel({
  isPanelOpen,
  isPanelPinned,
  panelKey,
  panelLabel,
  children,
  onClose,
  onPin,
  onUnpin,
}: {
  isPanelOpen: boolean;
  isPanelPinned: boolean;
  panelKey: SiteEditorPanelKey;
  panelLabel: string;
  children: ReactNode;
  onClose: () => void;
  onPin: () => void;
  onUnpin: () => void;
}) {
  if (!isPanelOpen) return null;

  if (isPanelPinned) {
    return (
      <section
        id={`${panelKey}-panel`}
        aria-label={`${panelLabel} panel`}
        className="w-[340px] shrink-0 overflow-hidden"
        style={{ background: 'var(--bg-base)', borderRight: '1px solid var(--bg-border-subtle)' }}
      >
        <div className="flex h-full flex-col">
          <div
            className="flex items-center justify-between gap-3 px-5 py-4"
            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-border-subtle)' }}
          >
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {panelLabel}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Unpin panel"
                onClick={onUnpin}
                className="rounded-[var(--radius-md)] px-2.5 py-2 text-xs font-medium"
                style={{ border: '1px solid var(--bg-border-subtle)', color: 'var(--text-secondary)' }}
              >
                Unpin
              </button>
              <button
                type="button"
                aria-label="Close panel"
                onClick={onClose}
                className="rounded-[var(--radius-md)] p-2"
                style={{ border: '1px solid var(--bg-border-subtle)', color: 'var(--text-secondary)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close overlay panel"
        className="absolute inset-0 z-10 cursor-default"
        style={{ background: 'rgba(13, 13, 26, 0.08)' }}
        onClick={onClose}
      />
      <section
        id={`${panelKey}-panel`}
        aria-label={`${panelLabel} panel`}
        className="absolute left-5 top-5 bottom-5 z-20 w-[340px] overflow-hidden rounded-[var(--radius-xl)]"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border-subtle)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div className="flex h-full flex-col">
          <div
            className="flex items-center justify-between gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
          >
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {panelLabel}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Pin panel"
                onClick={onPin}
                className="rounded-[var(--radius-md)] px-2.5 py-2 text-xs font-medium"
                style={{ border: '1px solid var(--bg-border-subtle)', color: 'var(--text-secondary)' }}
              >
                Pin
              </button>
              <button
                type="button"
                aria-label="Close panel"
                onClick={onClose}
                className="rounded-[var(--radius-md)] p-2"
                style={{ border: '1px solid var(--bg-border-subtle)', color: 'var(--text-secondary)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </div>
      </section>
    </>
  );
}
