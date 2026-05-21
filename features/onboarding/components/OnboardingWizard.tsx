'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepStoreName } from './StepStoreName';
import { StepTemplate } from './StepTemplate';
import { BuildingScreen } from './BuildingScreen';
import { useOnboarding } from '../hooks/useOnboarding';

type OnboardingData = {
  storeName: string;
  subdomain: string;
  templateKey: string;
};

type Step = 'name' | 'template' | 'building';

export function OnboardingWizard() {
  const router = useRouter();
  const { createBusiness } = useOnboarding();
  const [step, setStep] = useState<Step>('name');
  const [data, setData] = useState<OnboardingData>({
    storeName: '',
    subdomain: '',
    templateKey: '',
  });
  const [error, setError] = useState('');

  function goToTemplate(updates: Pick<OnboardingData, 'storeName' | 'subdomain'>) {
    setData((prev) => ({ ...prev, ...updates }));
    setStep('template');
  }

  function goBack() {
    setStep('name');
    setError('');
  }

  async function finish(templateKey: string) {
    const final = { ...data, templateKey };
    setData(final);
    setStep('building');
    setError('');
    try {
      const tenantId = await createBusiness(final);
      router.replace(`/dashboard/${tenantId}/editor`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Something went wrong — please try again');
      setStep('template');
    }
  }

  if (step === 'building') return <BuildingScreen businessName={data.storeName} />;

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Step {step === 'name' ? 1 : 2} of 2
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {step === 'name' ? 50 : 100}%
          </p>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: step === 'name' ? '50%' : '100%', background: 'var(--accent)' }}
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
        {step === 'name' && (
          <StepStoreName
            defaultValues={{ storeName: data.storeName, subdomain: data.subdomain }}
            onNext={goToTemplate}
          />
        )}
        {step === 'template' && (
          <StepTemplate
            defaultValues={{ templateKey: data.templateKey }}
            onNext={finish}
            onBack={goBack}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
