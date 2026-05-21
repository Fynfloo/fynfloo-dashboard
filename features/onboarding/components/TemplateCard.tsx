'use client';
import { cn } from '@/lib/utils';
import type { TemplateItem } from '../hooks/useTemplates';
import Image from 'next/image';

type Props = {
  template: TemplateItem;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
};

export function TemplateCard({ template, isSelected, onSelect, onPreview }: Props) {
  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-lg)] border-2 cursor-pointer transition-all duration-150 overflow-hidden',
      )}
      style={{
        border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
        background: 'var(--bg-elevated)',
      }}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="w-full aspect-video" style={{ background: 'var(--bg-border)' }}>
        {template.thumbnail && (
          <Image src={template.thumbnail} alt={template.name} fill className="object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {template.name}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {template.description}
        </p>
        <div className="flex gap-1 flex-wrap pt-1">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-border)', color: 'var(--text-tertiary)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Preview button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md"
        style={{
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--bg-border)',
        }}
      >
        Preview
      </button>
    </div>
  );
}
