// features/onboarding/components/StepCurrency.tsx
'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ALL_CURRENCIES, deriveGateway } from '@/lib/constants';
import type { OnboardingData } from './OnboardingWizard';

type Props = {
  defaultValues: Pick<OnboardingData, 'currency'>;
  onFinish: (data: Pick<OnboardingData, 'currency'>) => void;
  onBack: () => void;
  isPending: boolean;
  error: string;
};

export function StepCurrency({ defaultValues, onFinish, onBack, isPending, error }: Props) {
  const [selected, setSelected] = useState(defaultValues.currency);
  const [validationError, setValidationError] = useState('');

  const gateway = selected ? deriveGateway(selected) : null;

  function handleFinish() {
    if (!selected) {
      setValidationError('Please select a currency');
      return;
    }
    setValidationError('');
    onFinish({ currency: selected });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2
          className="text-xl font-bold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
        >
          Select your currency
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This determines your payment gateway and cannot be changed after your first order.
        </p>
      </div>

      {/* Currency grid */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {ALL_CURRENCIES.map((currency) => {
          const isSelected = selected === currency.code;
          return (
            <button
              key={currency.code}
              type="button"
              onClick={() => {
                setSelected(currency.code);
                setValidationError('');
              }}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-3',
                'rounded-[var(--radius-md)] border transition-all duration-150',
                'focus-visible:outline-none text-left',
              )}
              style={{
                background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-base font-mono font-semibold w-6 text-center"
                  style={{ color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)' }}
                >
                  {currency.symbol}
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {currency.code}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {currency.name}
                  </p>
                </div>
              </div>
              <Badge variant={currency.gateway === 'Stripe' ? 'accent' : 'default'}>
                {currency.gateway}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Gateway info */}
      {gateway && (
        <div
          className="flex items-start gap-2.5 rounded-[var(--radius-md)] px-3.5 py-3 text-sm"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid rgba(88,81,234,0.2)',
            color: 'var(--accent)',
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Your store will use <strong>{gateway}</strong> to process payments. You can connect it
            after creating your store.
          </span>
        </div>
      )}

      {/* Errors */}
      {(validationError || error) && (
        <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--red)' }}>
          <AlertCircle className="h-3 w-3 shrink-0" />
          {validationError || error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="flex-1 h-11"
          onClick={onBack}
          disabled={isPending}
        >
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 h-11"
          onClick={handleFinish}
          disabled={!selected || isPending}
          loading={isPending}
        >
          {isPending ? 'Creating store…' : 'Create store'}
        </Button>
      </div>
    </div>
  );
}
