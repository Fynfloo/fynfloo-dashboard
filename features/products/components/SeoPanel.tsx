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
    ? `${current}/${idealMax} — Too long`
    : isIdeal
      ? 'Good length ✓'
      : `${current}/${idealMax}`;

  return (
    <span className="text-xs font-medium" style={{ color }}>
      {label}
    </span>
  );
}

function getDescBorderColor(length: number, focused: boolean): string {
  if (length > META_DESC_IDEAL_MAX) return 'var(--red)';
  if (focused) return 'var(--accent)';
  return 'var(--bg-border)';
}

function getDescBoxShadow(length: number, focused: boolean): string {
  if (!focused) return 'none';
  if (length > META_DESC_IDEAL_MAX) return '0 0 0 2px var(--red-bg)';
  return '0 0 0 2px var(--accent-dim)';
}

export function SeoPanel({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Help customers find your product on Google. Optional but recommended — good SEO brings free
        traffic to your store.
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
          error={value.metaTitle.length > META_TITLE_IDEAL_MAX}
        />
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Shown in Google search results. Include your main keyword and a reason to click. Leave
          blank to use your product title. Maximum 60 characters.
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
        {/*
          Border and shadow derived from length + focus state — no inline mutation.
          Focus/blur update a local focused state so we can compute the correct
          border colour without the bug where focus unconditionally overwrites
          the error border.
        */}
        {(() => {
          // We need a stateful textarea — use a controlled approach via CSS
          // that derives border from value alone, not from focus events
          const isOver = value.metaDescription.length > META_DESC_IDEAL_MAX;
          return (
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
                // Border colour is data-driven — error state always wins over focus
                border: `1px solid ${isOver ? 'var(--red)' : 'var(--bg-border)'}`,
              }}
              onFocus={(e) => {
                // Only apply accent focus ring if not in error state
                if (!isOver) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-dim)';
                } else {
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--red-bg)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = isOver ? 'var(--red)' : 'var(--bg-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          );
        })()}
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Shown under your title in Google search results. Include what the product is and a reason
          to buy. Maximum 160 characters.
        </p>
      </div>

      {/* URL handle */}
      <div className="space-y-1.5">
        <Label htmlFor="handle">URL handle</Label>
        <div className="flex items-center">
          <div
            className="h-10 px-3 flex items-center text-sm rounded-l-[var(--radius-md)] shrink-0 select-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              borderRight: 'none',
              color: 'var(--text-tertiary)',
              whiteSpace: 'nowrap',
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
          Auto-generated from your product title — you rarely need to change this.{' '}
          <span style={{ color: 'var(--amber)' }}>
            Changing this after launch breaks existing links and hurts your Google ranking.
          </span>
        </p>
      </div>
    </div>
  );
}
