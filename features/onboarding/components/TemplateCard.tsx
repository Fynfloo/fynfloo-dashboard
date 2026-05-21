'use client';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TemplateItem } from '../hooks/useTemplates';

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
        'group rounded-[var(--radius-lg)] overflow-hidden cursor-pointer transition-all duration-150',
      )}
      style={{
        border: isSelected ? '2px solid var(--accent)' : '2px solid var(--bg-border)',
        background: 'var(--bg-surface)',
      }}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full aspect-video overflow-hidden"
        style={{ background: 'var(--bg-elevated)' }}
      >
        {template.thumbnail ? (
          <Image src={template.thumbnail} alt={template.name} fill className="object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, var(--bg-border) 0%, var(--bg-elevated) 100%)',
            }}
          />
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ background: '#fff', color: '#111' }}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Select
          </button>
        </div>
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
    </div>
  );
}
