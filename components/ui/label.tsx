// components/ui/label.tsx
import { cn } from '@/lib/utils';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium text-[var(--text-primary)]',
        'leading-none select-none',
        className,
      )}
      style={{ letterSpacing: '-0.01em' }}
      {...props}
    />
  );
}
