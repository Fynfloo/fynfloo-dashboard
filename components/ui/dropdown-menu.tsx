// components/ui/dropdown-menu.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

type MenuPosition = {
  top: number;
  left?: number;
  right?: number;
};

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position from trigger's bounding rect — escapes all overflow contexts
  function openMenu() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    if (align === 'right') {
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        right: viewportWidth - rect.right - window.scrollX,
      });
    } else {
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
    setOpen(true);
  }

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    // Use capture phase so we catch clicks before they bubble
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    function reposition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      if (align === 'right') {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          right: viewportWidth - rect.right - window.scrollX,
        });
      } else {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    }
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, align]);

  const menu =
    open && position
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] min-w-[160px] rounded-xl overflow-hidden py-1"
            style={{
              top: position.top,
              ...(position.left !== undefined ? { left: position.left } : {}),
              ...(position.right !== undefined ? { right: position.right } : {}),
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
                  type="button"
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
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div ref={triggerRef} className="inline-block" onClick={openMenu}>
        {trigger}
      </div>
      {menu}
    </>
  );
}
