'use client';
import { useState } from 'react';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import type { TemplateItem } from '../hooks/useTemplates';

type Props = {
  templates: TemplateItem[];
  isLoading: boolean;
  selectedKey: string;
  onSelect: (template: TemplateItem) => void;
  onBack: () => void;
  error?: string;
};

export function TemplateGalleryModal({
  templates,
  isLoading,
  selectedKey,
  onSelect,
  onBack,
  error,
}: Props) {
  const [activeTag, setActiveTag] = useState('All');
  const [preview, setPreview] = useState<TemplateItem | null>(null);

  const allTags = ['All', ...Array.from(new Set(templates.flatMap((t) => t.tags)))];
  const filtered =
    activeTag === 'All' ? templates : templates.filter((t) => t.tags.includes(activeTag));

  return (
    <>
      {preview && (
        <TemplatePreviewModal
          template={preview}
          onClose={() => setPreview(null)}
          onSelect={() => {
            onSelect(preview);
            setPreview(null);
          }}
        />
      )}

      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg-base)' }}>
        {/* Header */}
        <div
          className="flex items-center gap-4 px-6 h-14 shrink-0"
          style={{ borderBottom: '1px solid var(--bg-border)', background: 'var(--bg-surface)' }}
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex-1 text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Choose a template
            </p>
          </div>

          {/* Step indicator — balances the back button */}
          <p className="text-xs w-16 text-right" style={{ color: 'var(--text-tertiary)' }}>
            Step 2 of 2
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="flex items-center gap-2 px-6 py-2 text-xs"
            style={{ background: 'var(--red-dim, #fee2e2)', color: 'var(--red)' }}
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Tag filter */}
        <div
          className="flex items-center gap-2 px-6 py-3 overflow-x-auto shrink-0"
          style={{ borderBottom: '1px solid var(--bg-border)' }}
        >
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all"
              style={{
                background: activeTag === tag ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeTag === tag ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius-lg)] aspect-video animate-pulse"
                  style={{ background: 'var(--bg-elevated)' }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {filtered.map((template) => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  isSelected={selectedKey === template.key}
                  onSelect={() => onSelect(template)}
                  onPreview={() => setPreview(template)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
