'use client';

import { AlertTriangle } from 'lucide-react';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
      }}
    />
  );
}

export function EmptyStateCard({ title, body }: { title?: string; body: string }) {
  return (
    <div
      className="rounded-[var(--radius-lg)] p-5"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      {title && (
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <p
        className={title ? 'mt-2 text-sm' : 'text-sm'}
        style={{ color: 'var(--text-secondary)' }}
      >
        {body}
      </p>
    </div>
  );
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center px-6"
      style={{ background: 'rgba(15, 23, 42, 0.22)' }}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-xl)] p-5 shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border-subtle)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 rounded-full p-2"
            style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'rgb(180, 83, 9)' }}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Unsaved changes
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              You have changes that haven&apos;t been saved yet. Stay here to save them first, or
              leave without saving.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onStay}
            className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
            style={{ border: '1px solid var(--bg-border-subtle)', color: 'var(--text-secondary)' }}
          >
            Stay here
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            Leave without saving
          </button>
        </div>
      </div>
    </div>
  );
}
