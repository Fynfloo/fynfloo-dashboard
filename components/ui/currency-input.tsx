// components/ui/currency-input.tsx
'use client';

import { useRef } from 'react';
import { getCurrencySymbol } from '@/lib/utils';
import { cn } from '@/lib/utils';

type CurrencyInputProps = {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
};

export function CurrencyInput({
  value,
  onChange,
  currency,
  placeholder = '0.00',
  helperText,
  error,
  disabled,
  id,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const symbol = getCurrencySymbol(currency);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowed = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];
    if (allowed.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return; // allow copy/paste/select-all

    // Allow digits
    if (/^\d$/.test(e.key)) return;

    // Allow one decimal point
    if (e.key === '.') {
      if (value.includes('.')) {
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;

    // Strip non-numeric except decimal
    val = val.replace(/[^0-9.]/g, '');

    // Only one decimal point
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }

    // Max 2 decimal places
    if (parts[1] !== undefined && parts[1].length > 2) {
      val = parts[0] + '.' + parts[1].slice(0, 2);
    }

    onChange(val);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    // Strip currency symbols, commas, spaces
    const cleaned = pasted.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    let val = parts[0];
    if (parts[1] !== undefined) {
      val += '.' + parts[1].slice(0, 2);
    }
    onChange(val);
  }

  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center">
        {/* Currency symbol prefix */}
        <div
          className="absolute left-3 text-sm font-medium select-none pointer-events-none"
          style={{ color: 'var(--text-secondary)' }}
        >
          {symbol}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-10 rounded-[var(--radius-md)] text-sm',
            'bg-[var(--bg-surface)] text-[var(--text-primary)]',
            'border transition-all duration-150 outline-none',
            'placeholder:text-[var(--text-tertiary)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-[var(--red)] focus:ring-2 focus:ring-[var(--red-bg)]'
              : [
                  'border-[var(--bg-border)]',
                  'focus:border-[var(--accent)]',
                  'focus:ring-2 focus:ring-[var(--accent-dim)]',
                ].join(' '),
          )}
          style={{
            paddingLeft: `${symbol.length > 1 ? symbol.length * 9 + 12 : 28}px`,
            paddingRight: '12px',
          }}
        />
      </div>

      {helperText && !error && (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {helperText}
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
