'use client';
import { X } from 'lucide-react';
import type { TemplateItem } from '../hooks/useTemplates';

type Props = {
  template: TemplateItem;
  onClose: () => void;
  onSelect: () => void;
};

export function TemplatePreviewModal({ template, onClose, onSelect }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 h-12 shrink-0"
        style={{ borderBottom: '1px solid var(--bg-border)', background: 'var(--bg-surface)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {template.name}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSelect}
            className="text-sm px-4 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Use this template
          </button>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Preview area — iframe will render here once Step 7 ships */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Live preview coming soon
        </p>
      </div>
    </div>
  );
}
