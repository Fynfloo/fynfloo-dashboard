// features/onboarding/components/StepStoreName.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';
import { useDebounce } from '@/hooks/useDebounce';
const schema = z.object({
  storeName: z.string().min(2, 'Business name must be at least 2 characters').max(60),
  subdomain: z
    .string()
    .min(2, 'Subdomain must be at least 2 characters')
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and dashes'),
});

type Fields = z.infer<typeof schema>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

type StepOneData = { storeName: string; subdomain: string };

type Props = {
  defaultValues: StepOneData;
  onNext: (data: StepOneData) => void;
};

export function StepStoreName({ defaultValues, onNext }: Props) {
  const { checkSubdomain } = useOnboarding();
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle',
  );

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const subdomain = form.watch('subdomain');
  const debouncedSubdomain = useDebounce(subdomain, 500);

  // Auto-generate subdomain from store name
  function handleStoreNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    form.setValue('storeName', e.target.value);
    const auto = slugify(e.target.value);
    if (auto) form.setValue('subdomain', auto, { shouldValidate: true });
  }

  // Check availability on debounced subdomain change
  useEffect(() => {
    if (!debouncedSubdomain || debouncedSubdomain.length < 2) {
      setAvailability('idle');
      return;
    }

    const isValid = /^[a-z0-9-]+$/.test(debouncedSubdomain);
    if (!isValid) {
      setAvailability('idle');
      return;
    }

    setAvailability('checking');
    checkSubdomain(debouncedSubdomain).then((available) => {
      setAvailability(available ? 'available' : 'taken');
    });
  }, [debouncedSubdomain]);

  function onSubmit(values: Fields) {
    if (availability !== 'available') return;
    onNext(values);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2
          className="text-xl font-bold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
        >
          Name your business
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This is how visitors will find you. You can change the name later.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="storeName" className="block mb-2">
            Business name
          </Label>
          <Input
            id="storeName"
            autoFocus
            placeholder="My Awesome Business"
            error={!!form.formState.errors.storeName}
            {...form.register('storeName')}
            onChange={handleStoreNameChange}
          />
          {form.formState.errors.storeName && (
            <p className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'var(--red)' }}>
              <AlertCircle className="h-3 w-3 shrink-0" />
              {form.formState.errors.storeName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="subdomain" className="block mb-2">
            Website address
          </Label>
          <div className="flex items-center gap-0">
            <Input
              id="subdomain"
              placeholder="my-store"
              error={!!form.formState.errors.subdomain || availability === 'taken'}
              className="rounded-r-none"
              {...form.register('subdomain')}
            />
            <div
              className="h-10 px-3 flex items-center text-sm rounded-r-[var(--radius-md)] shrink-0"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                borderLeft: 'none',
                color: 'var(--text-tertiary)',
              }}
            >
              .fynfloo.com
            </div>
          </div>

          {/* Availability indicator */}
          <div className="mt-1.5 h-5 flex items-center">
            {availability === 'checking' && (
              <p
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking availability…
              </p>
            )}
            {availability === 'available' && (
              <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--green)' }}>
                <CheckCircle className="h-3 w-3" />
                {subdomain}.fynfloo.com is available
              </p>
            )}
            {availability === 'taken' && (
              <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--red)' }}>
                <XCircle className="h-3 w-3" />
                {subdomain}.fynfloo.com is already taken
              </p>
            )}
            {form.formState.errors.subdomain && availability === 'idle' && (
              <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--red)' }}>
                <AlertCircle className="h-3 w-3 shrink-0" />
                {form.formState.errors.subdomain.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-11"
          disabled={availability !== 'available'}
        >
          Continue
        </Button>
      </form>
    </div>
  );
}
