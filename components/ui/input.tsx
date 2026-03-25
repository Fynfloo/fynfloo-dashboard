// components/ui/input.tsx
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full h-10 px-3 rounded-[var(--radius-md)] text-sm',
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
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
