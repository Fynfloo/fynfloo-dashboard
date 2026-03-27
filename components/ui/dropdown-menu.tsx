// components/ui/dropdown-menu.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type DropdownMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  dividerAbove?: boolean;
};

type DropdownMenuProps = {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
};

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-1 z-50 min-w-[160px] rounded-xl overflow-hidden py-1',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border-subtle)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.dividerAbove && (
                <div
                  className="my-1 mx-2"
                  style={{ borderTop: '1px solid var(--bg-border-subtle)' }}
                />
              )}
              <button
                onClick={() => {
                  if (item.disabled) return;
                  setOpen(false);
                  item.onClick();
                }}
                disabled={item.disabled}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-100"
                style={{
                  color: item.destructive ? 'var(--red)' : 'var(--text-primary)',
                  opacity: item.disabled ? 0.5 : 1,
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (item.disabled) return;
                  e.currentTarget.style.background = item.destructive
                    ? 'var(--red-bg)'
                    : 'var(--bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.icon && (
                  <span className="shrink-0" style={{ opacity: 0.7 }}>
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
