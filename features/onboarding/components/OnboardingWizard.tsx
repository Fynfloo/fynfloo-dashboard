// features/onboarding/components/OnboardingWizard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepStoreName } from './StepStoreName';
import { StepTemplate } from './StepTemplate';
import { StepCurrency } from './StepCurrency';
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';

export type OnboardingData = {
  storeName: string;
  subdomain: string;
  templateKey: string;
  businessType: string;
  currency: string;
};

const TOTAL_STEPS = 3;

export function OnboardingWizard() {
  const router = useRouter();
  const { createStore, isPending } = useOnboarding();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    storeName: '',
    subdomain: '',
    templateKey: '',
    businessType: '',
    currency: '',
  });
  const [error, setError] = useState('');

  function next(updates: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...updates }));
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => s - 1);
    setError('');
  }

  async function finish(updates: Partial<OnboardingData>) {
    const final = { ...data, ...updates };
    setData(final);
    setError('');
    try {
      const tenantId = await createStore(final);
      router.replace(`/dashboard/${tenantId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Something went wrong — please try again');
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Step {step} of {TOTAL_STEPS}
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </p>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(step / TOTAL_STEPS) * 100}%`,
              background: 'var(--accent)',
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {step === 1 && (
          <StepStoreName
            defaultValues={{ storeName: data.storeName, subdomain: data.subdomain }}
            onNext={next}
          />
        )}
        {step === 2 && (
          <StepTemplate
            defaultValues={{ templateKey: data.templateKey, businessType: data.businessType }}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepCurrency
            defaultValues={{ currency: data.currency }}
            onFinish={finish}
            onBack={back}
            isPending={isPending}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
