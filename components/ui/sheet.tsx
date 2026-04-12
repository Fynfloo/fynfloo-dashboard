// components/ui/sheet.tsx
'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
};

export function Sheet({ open, onClose, title, description, children, width = 'md' }: SheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const widths = {
    sm: '400px',
    md: '480px',
    lg: '560px',
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50"
        style={{
          background: 'rgba(13,13,26,0.5)',
          backdropFilter: 'blur(4px)',
          // Fade in/out
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      />

      {/* Sheet panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: widths[width],
          maxWidth: '100vw',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-elevated)',
          borderLeft: '1px solid var(--bg-border-subtle)',
          // Slide in/out
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
        >
          <div className="space-y-0.5 pr-8">
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </>
  );
}
