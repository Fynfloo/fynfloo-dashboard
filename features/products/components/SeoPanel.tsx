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

const META_TITLE_IDEAL_MIN = 50;
const META_TITLE_IDEAL_MAX = 60;
const META_DESC_IDEAL_MIN = 120;
const META_DESC_IDEAL_MAX = 160;

function CharCount({
  current,
  idealMin,
  idealMax,
}: {
  current: number;
  idealMin: number;
  idealMax: number;
}) {
  const isOver = current > idealMax;
  const isIdeal = current >= idealMin && current <= idealMax;

  const color = isOver ? 'var(--red)' : isIdeal ? 'var(--green)' : 'var(--text-tertiary)';

  const label = isOver
    ? `Too long — Google will shorten this`
    : isIdeal
      ? 'Good length ✓'
      : `${current}/${idealMax}`;

  return (
    <span className="text-xs font-medium" style={{ color }}>
      {isIdeal ? label : isOver ? `${current}/${idealMax} — ${label}` : label}
    </span>
  );
}

export function SeoPanel({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      {/* Panel description */}
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Help customers find your product on Google. These fields are optional but recommended — good
        SEO brings free traffic to your store.
      </p>

      {/* Meta title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="metaTitle">Meta title</Label>
          {value.metaTitle.length > 0 && (
            <CharCount
              current={value.metaTitle.length}
              idealMin={META_TITLE_IDEAL_MIN}
              idealMax={META_TITLE_IDEAL_MAX}
            />
          )}
        </div>
        <Input
          id="metaTitle"
          placeholder="Defaults to your product title"
          value={value.metaTitle}
          onChange={(e) => onChange({ ...value, metaTitle: e.target.value })}
          disabled={disabled}
        />
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Shown in Google search results. Include your main keyword and a reason to click. Example:
          &ldquo;Premium Oxford Shirt — Free UK Delivery&rdquo;. Leave blank to use your product
          title. Maximum 60 characters.
        </p>
      </div>

      {/* Meta description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="metaDescription">Meta description</Label>
          {value.metaDescription.length > 0 && (
            <CharCount
              current={value.metaDescription.length}
              idealMin={META_DESC_IDEAL_MIN}
              idealMax={META_DESC_IDEAL_MAX}
            />
          )}
        </div>
        <textarea
          id="metaDescription"
          rows={3}
          placeholder="Brief description shown in Google search results"
          value={value.metaDescription}
          onChange={(e) => onChange({ ...value, metaDescription: e.target.value })}
          disabled={disabled}
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm resize-none outline-none transition-all duration-150"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border:
              value.metaDescription.length > META_DESC_IDEAL_MAX
                ? '1px solid var(--red)'
                : '1px solid var(--bg-border)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-dim)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor =
              value.metaDescription.length > META_DESC_IDEAL_MAX
                ? 'var(--red)'
                : 'var(--bg-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Shown under your title in Google search results. A good description increases how often
          people click. Include what the product is and a reason to buy. Maximum 160 characters.
        </p>
      </div>

      {/* URL handle */}
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
          The web address of your product page. Auto-generated from your title — you rarely need to
          change this.{' '}
          <span style={{ color: 'var(--amber)' }}>
            ⚠️ Warning: changing this after launch breaks existing links and hurts your Google
            ranking.
          </span>
        </p>
      </div>
    </div>
  );
}
