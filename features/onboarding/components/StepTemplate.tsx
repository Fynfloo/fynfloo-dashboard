'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import type { TemplateItem } from '../hooks/useTemplates';

type Props = {
  defaultValues: { templateKey: string };
  onNext: (templateKey: string) => void;
  onBack: () => void;
  error?: string;
};

export function StepTemplate({ defaultValues, onNext, onBack, error }: Props) {
  const { templates, isLoading } = useTemplates();
  const [selected, setSelected] = useState(defaultValues.templateKey);
  const [preview, setPreview] = useState<TemplateItem | null>(null);
  const [localError, setLocalError] = useState('');

  function handleNext() {
    if (!selected) {
      setLocalError('Please select a template');
      return;
    }
    onNext(selected);
  }

  const displayError = error || localError;

  return (
    <>
      {preview && (
        <TemplatePreviewModal
          template={preview}
          onClose={() => setPreview(null)}
          onSelect={() => {
            setSelected(preview.key);
            setPreview(null);
          }}
        />
      )}

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

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-[var(--radius-lg)] aspect-video animate-pulse"
                style={{ background: 'var(--bg-elevated)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.key}
                template={template}
                isSelected={selected === template.key}
                onSelect={() => {
                  setSelected(template.key);
                  setLocalError('');
                }}
                onPreview={() => setPreview(template)}
              />
            ))}
          </div>
        )}

        {displayError && (
          <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--red)' }}>
            <AlertCircle className="h-3 w-3 shrink-0" />
            {displayError}
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
    </>
  );
}
