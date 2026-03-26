// features/products/components/SeoPanel.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SeoData = {
  metaTitle: string;
  metaDescription: string;
  handle: string;
};

type Props = {
  value: SeoData;
  onChange: (value: SeoData) => void;
  disabled?: boolean;
};

const META_DESCRIPTION_MAX = 160;

export function SeoPanel({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="metaTitle">Meta title</Label>
        <Input
          id="metaTitle"
          placeholder="Defaults to product title"
          value={value.metaTitle}
          onChange={(e) => onChange({ ...value, metaTitle: e.target.value })}
          disabled={disabled}
        />
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Shown in search engine results and browser tabs
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="metaDescription">Meta description</Label>
          <span
            className="text-xs"
            style={{
              color:
                value.metaDescription.length > META_DESCRIPTION_MAX
                  ? 'var(--red)'
                  : 'var(--text-tertiary)',
            }}
          >
            {value.metaDescription.length}/{META_DESCRIPTION_MAX}
          </span>
        </div>
        <textarea
          id="metaDescription"
          rows={3}
          placeholder="Brief description for search engines"
          value={value.metaDescription}
          onChange={(e) => onChange({ ...value, metaDescription: e.target.value })}
          disabled={disabled}
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm resize-none outline-none transition-all duration-150"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border:
              value.metaDescription.length > META_DESCRIPTION_MAX
                ? '1px solid var(--red)'
                : '1px solid var(--bg-border)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-dim)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor =
              value.metaDescription.length > META_DESCRIPTION_MAX
                ? 'var(--red)'
                : 'var(--bg-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="handle">URL handle</Label>
        <div className="flex items-center gap-0">
          <div
            className="h-10 px-3 flex items-center text-sm rounded-l-[var(--radius-md)] shrink-0"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              borderRight: 'none',
              color: 'var(--text-tertiary)',
            }}
          >
            /products/
          </div>
          <Input
            id="handle"
            placeholder="product-url-handle"
            value={value.handle}
            onChange={(e) =>
              onChange({
                ...value,
                handle: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '-')
                  .replace(/-+/g, '-'),
              })
            }
            disabled={disabled}
            className="rounded-l-none"
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          The URL of your product page on the storefront
        </p>
      </div>
    </div>
  );
}
