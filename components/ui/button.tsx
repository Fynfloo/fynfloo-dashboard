// components/ui/button.tsx
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = [
      'inline-flex items-center justify-center gap-2 font-medium',
      'rounded-[var(--radius-md)] border-none cursor-pointer',
      'transition-all duration-150 select-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    ];

    const variants: Record<ButtonVariant, string> = {
      primary: [
        'bg-[var(--accent)] text-white',
        'hover:bg-[var(--accent-hover)] hover:-translate-y-px',
        'hover:shadow-[var(--shadow-accent)]',
        'focus-visible:ring-[var(--accent)]',
      ].join(' '),
      secondary: [
        'bg-[var(--bg-elevated)] text-[var(--text-primary)]',
        'border border-[var(--bg-border-subtle)]',
        'hover:bg-[var(--bg-border-subtle)]',
        'focus-visible:ring-[var(--accent)]',
      ].join(' '),
      ghost: [
        'bg-transparent text-[var(--text-secondary)]',
        'hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
        'focus-visible:ring-[var(--accent)]',
      ].join(' '),
      destructive: [
        'bg-[var(--red)] text-white',
        'hover:opacity-90',
        'focus-visible:ring-[var(--red)]',
      ].join(' '),
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-5 text-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
