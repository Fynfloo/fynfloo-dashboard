// components/ui/badge.tsx
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'accent';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const styles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--bg-border-subtle)',
  },
  success: {
    background: 'rgba(5,150,105,0.08)',
    color: 'var(--green)',
    border: '1px solid rgba(5,150,105,0.2)',
  },
  warning: {
    background: 'var(--amber-bg)',
    color: 'var(--amber)',
    border: '1px solid var(--amber-border)',
  },
  destructive: {
    background: 'var(--red-bg)',
    color: 'var(--red)',
    border: '1px solid var(--red-border)',
  },
  accent: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(88,81,234,0.2)',
  },
};

export function Badge({ variant = 'default', className, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5',
        'rounded-[var(--radius-full)] text-xs font-medium',
        className,
      )}
      style={{ ...styles[variant], ...style }}
      {...props}
    />
  );
}
