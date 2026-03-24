// features/onboarding/components/StepTemplate.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TEMPLATES } from '@/lib/constants';
import type { OnboardingData } from './OnboardingWizard';
import { AlertCircle } from 'lucide-react';

type Props = {
  defaultValues: Pick<OnboardingData, 'templateKey' | 'businessType'>;
  onNext: (data: Pick<OnboardingData, 'templateKey' | 'businessType'>) => void;
  onBack: () => void;
};

export function StepTemplate({ defaultValues, onNext, onBack }: Props) {
  const [selected, setSelected] = useState(defaultValues.templateKey);
  const [error, setError] = useState('');

  function handleNext() {
    if (!selected) {
      setError('Please select a template');
      return;
    }
    const template = TEMPLATES.find((t) => t.key === selected)!;
    onNext({ templateKey: template.key, businessType: template.businessType });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2
          className="text-xl font-bold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
        >
          Choose a template
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Pick the style that fits your brand. You can customise everything later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((template) => {
          const isSelected = selected === template.key;
          return (
            <button
              key={template.key}
              type="button"
              onClick={() => {
                setSelected(template.key);
                setError('');
              }}
              className={cn(
                'text-left p-4 rounded-[var(--radius-lg)] border transition-all duration-150',
                'focus-visible:outline-none',
              )}
              style={{
                background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {/* Template preview dot */}
              <div
                className="w-8 h-8 rounded-lg mb-3"
                style={{ background: isSelected ? 'var(--accent)' : 'var(--bg-border)' }}
              />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {template.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {template.description}
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                Ref: {template.reference}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--red)' }}>
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="flex-1 h-11"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 h-11"
          onClick={handleNext}
          disabled={!selected}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
