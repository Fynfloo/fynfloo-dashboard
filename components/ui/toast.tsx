// components/ui/toast.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss: () => void;
};

export function Toast({ message, variant = 'success', duration = 2500, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--green)' }} />,
    error: <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--red)' }} />,
    info: <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />,
  };

  const borders = {
    success: 'var(--green)',
    error: 'var(--red)',
    info: 'var(--accent)',
  };

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${borders[variant]}`,
        boxShadow: 'var(--shadow-elevated)',
        color: 'var(--text-primary)',
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
        minWidth: '200px',
        maxWidth: '320px',
      }}
    >
      {icons[variant]}
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="p-0.5 rounded"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Toast container ──────────────────────────────────────────────────────────

type ToastItem = {
  id: string;
  message: string;
  variant?: ToastVariant;
};

type ToastContainerProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          variant={t.variant}
          onDismiss={() => onDismiss(t.id)}
        />
      ))}
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
