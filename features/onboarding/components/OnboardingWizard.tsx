'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepStoreName } from './StepStoreName';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { BuildingScreen } from './BuildingScreen';
import { useOnboarding } from '../hooks/useOnboarding';
import { useTemplates } from '../hooks/useTemplates';
import type { TemplateItem } from '../hooks/useTemplates';

type OnboardingData = {
  storeName: string;
  subdomain: string;
  templateKey: string;
};

type Step = 'name' | 'template' | 'building';

export function OnboardingWizard() {
  const router = useRouter();
  const { createBusiness } = useOnboarding();
  const { templates, isLoading: templatesLoading } = useTemplates();

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

  async function finish(template: TemplateItem) {
    const final = { ...data, templateKey: template.key };
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

  if (step === 'template') {
    return (
      <TemplateGalleryModal
        templates={templates}
        isLoading={templatesLoading}
        selectedKey={data.templateKey}
        onSelect={finish}
        onBack={() => setStep('name')}
        error={error}
      />
    );
  }

  if (step === 'building') return <BuildingScreen businessName={data.storeName} />;

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Step 1 of 2
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            50%
          </p>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: '50%', background: 'var(--accent)' }}
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
        <StepStoreName
          defaultValues={{ storeName: data.storeName, subdomain: data.subdomain }}
          onNext={goToTemplate}
        />
      </div>
    </div>
  );
}
