// features/products/components/VariantBuilder.tsx
'use client';

import { useState } from 'react';
import { Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useVariants } from '../hooks/useProducts';
import { parsePriceInput, formatPriceInput, getCurrencySymbol } from '@/lib/utils';
import type {
  ProductOption,
  ProductVariant,
  CreateOptionInput,
  UpdateVariantInput,
} from '@/lib/types';

// ─── Colour swatch helper ─────────────────────────────────────────────────────

const COLOUR_NAMES: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  grey: '#6b7280',
  gray: '#6b7280',
  navy: '#1e3a5f',
  brown: '#92400e',
  beige: '#d4b896',
  cream: '#fffdd0',
  gold: '#d4a017',
  silver: '#c0c0c0',
};

function isColourOption(name: string) {
  return name.toLowerCase() === 'colour' || name.toLowerCase() === 'color';
}

function ColourSwatch({ value }: { value: string }) {
  const hex = COLOUR_NAMES[value.toLowerCase()];
  if (!hex)
    return (
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    );
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-4 h-4 rounded-full border"
        style={{ background: hex, borderColor: 'var(--bg-border)' }}
      />
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </span>
  );
}

// ─── Option editor ────────────────────────────────────────────────────────────

type DraftOption = {
  name: string;
  values: string[];
  valueInput: string; // current tag input value
};

function OptionRow({
  option,
  index,
  onChange,
  onRemove,
  disabled,
}: {
  option: DraftOption;
  index: number;
  onChange: (updated: DraftOption) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  function addValue(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    // Allow comma-separated entry
    const parts = trimmed
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const unique = parts.filter((p) => !option.values.includes(p));
    if (unique.length === 0) return;
    onChange({ ...option, values: [...option.values, ...unique], valueInput: '' });
  }

  function removeValue(val: string) {
    onChange({ ...option, values: option.values.filter((v) => v !== val) });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addValue(option.valueInput);
    }
    if (e.key === 'Backspace' && option.valueInput === '' && option.values.length > 0) {
      removeValue(option.values[option.values.length - 1]);
    }
  }

  const colour = isColourOption(option.name);

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border-subtle)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`opt-name-${index}`}>Option name</Label>
          <Input
            id={`opt-name-${index}`}
            value={option.name}
            placeholder="e.g. Size"
            disabled={disabled}
            onChange={(e) => onChange({ ...option, name: e.target.value })}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="mt-5 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--red)', opacity: disabled ? 0.4 : 1 }}
          title="Remove option"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <Label>Values</Label>
        <div
          className="flex flex-wrap gap-1.5 min-h-[38px] px-2.5 py-2 rounded-[var(--radius-md)] cursor-text"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
          }}
          onClick={() => {
            const el = document.getElementById(`opt-val-${index}`);
            el?.focus();
          }}
        >
          {option.values.map((val) => (
            <span
              key={val}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                border: '1px solid rgba(88,81,234,0.2)',
              }}
            >
              {colour ? <ColourSwatch value={val} /> : val}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeValue(val);
                }}
                disabled={disabled}
                className="ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <input
            id={`opt-val-${index}`}
            value={option.valueInput}
            placeholder={option.values.length === 0 ? 'e.g. S, M, L — press Enter to add' : ''}
            disabled={disabled}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
            onChange={(e) => onChange({ ...option, valueInput: e.target.value })}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (option.valueInput) addValue(option.valueInput);
            }}
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Press Enter or comma to add a value
        </p>
      </div>
    </div>
  );
}

// ─── Variant row ──────────────────────────────────────────────────────────────

function VariantRow({
  variant,
  currency,
  onUpdate,
  onDelete,
  disabled,
}: {
  variant: ProductVariant;
  currency: string;
  onUpdate: (variantId: string, updates: UpdateVariantInput) => void;
  onDelete: (variantId: string) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState(formatPriceInput(variant.price));

  const optionValues = Object.values(variant.options);
  const hasColour = Object.keys(variant.options).some(isColourOption);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--bg-border-subtle)' }}
    >
      {/* Row summary */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <span className="flex flex-wrap gap-1.5">
            {optionValues.map((val) =>
              hasColour &&
              isColourOption(
                Object.keys(variant.options).find((k) => variant.options[k] === val) ?? '',
              ) ? (
                <ColourSwatch key={val} value={val} />
              ) : (
                <span
                  key={val}
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {val}
                </span>
              ),
            )}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {variant.title}
          </span>
          {expanded ? (
            <ChevronUp
              className="w-4 h-4 ml-auto shrink-0"
              style={{ color: 'var(--text-tertiary)' }}
            />
          ) : (
            <ChevronDown
              className="w-4 h-4 ml-auto shrink-0"
              style={{ color: 'var(--text-tertiary)' }}
            />
          )}
        </button>

        {/* Inline price */}
        <div className="w-28 shrink-0">
          <CurrencyInput
            value={priceDisplay}
            currency={currency}
            onChange={(v) => {
              setPriceDisplay(v);
              onUpdate(variant.id, { price: parsePriceInput(v) });
            }}
            disabled={disabled}
          />
        </div>

        <button
          type="button"
          onClick={() => onDelete(variant.id)}
          disabled={disabled}
          className="p-1.5 rounded-lg shrink-0"
          style={{ color: 'var(--red)', opacity: disabled ? 0.4 : 1 }}
          title="Delete variant"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="grid grid-cols-2 gap-4 px-4 pb-4 pt-3"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--bg-border-subtle)',
          }}
        >
          <div className="space-y-1.5">
            <Label>SKU</Label>
            <Input
              value={variant.sku ?? ''}
              placeholder="e.g. SHIRT-BLU-M"
              disabled={disabled}
              onChange={(e) => onUpdate(variant.id, { sku: e.target.value.trim() || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Stock (units)</Label>
            <Input
              type="number"
              min={0}
              value={variant.onHand ?? ''}
              placeholder="0"
              disabled={disabled}
              onChange={(e) =>
                onUpdate(variant.id, {
                  onHand: e.target.value ? Number(e.target.value) : undefined,
                  trackQuantity: !!e.target.value,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  storeId: string;
  productId: string;
  options: ProductOption[];
  variants: ProductVariant[];
  currency: string;
  onOptionsChange: (options: ProductOption[], variants: ProductVariant[]) => void;
  onVariantUpdate: (variantId: string, updates: UpdateVariantInput) => void;
  onVariantDelete: (variantId: string) => void;
  disabled?: boolean;
};

export function VariantBuilder({
  storeId,
  productId,
  options,
  variants,
  currency,
  onOptionsChange,
  onVariantUpdate,
  onVariantDelete,
  disabled,
}: Props) {
  const { setOptions, bulkUpdatePrices, deleteVariant, updateVariant, isPending } = useVariants(
    storeId,
    productId,
  );

  // Draft options state — edited before generating
  const [draftOptions, setDraftOptions] = useState<DraftOption[]>(() =>
    options.length > 0
      ? options.map((o) => ({ name: o.name, values: o.values, valueInput: '' }))
      : [],
  );

  const [optionsDirty, setOptionsDirty] = useState(false);
  const [error, setError] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkDirty, setBulkDirty] = useState(false);

  const hasVariants = variants.length > 0;
  const busy = isPending || !!disabled;

  // ─── Option management ─────────────────────────────────────────────────────

  function addOption() {
    setDraftOptions((prev) => [...prev, { name: '', values: [], valueInput: '' }]);
    setOptionsDirty(true);
  }

  function updateOption(index: number, updated: DraftOption) {
    setDraftOptions((prev) => prev.map((o, i) => (i === index ? updated : o)));
    setOptionsDirty(true);
  }

  function removeOption(index: number) {
    setDraftOptions((prev) => prev.filter((_, i) => i !== index));
    setOptionsDirty(true);
  }

  async function handleGenerateVariants() {
    setError('');

    // Validate
    for (const opt of draftOptions) {
      if (!opt.name.trim()) {
        setError('Option name cannot be empty');
        return;
      }
      if (opt.values.length === 0) {
        setError(`Option "${opt.name}" needs at least one value`);
        return;
      }
    }

    const input: CreateOptionInput[] = draftOptions.map((o, i) => ({
      name: o.name.trim(),
      values: o.values,
      position: i,
    }));

    try {
      const result = await setOptions(input);
      onOptionsChange(result.options, result.variants);
      setOptionsDirty(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to generate variants');
    }
  }

  // ─── Variant actions ───────────────────────────────────────────────────────

  async function handleVariantUpdate(variantId: string, updates: UpdateVariantInput) {
    try {
      await updateVariant(variantId, updates);
      onVariantUpdate(variantId, updates);
    } catch {
      setError('Failed to update variant');
    }
  }

  async function handleVariantDelete(variantId: string) {
    try {
      await deleteVariant(variantId);
      onVariantDelete(variantId);
    } catch {
      setError('Failed to delete variant');
    }
  }

  // ─── Bulk price ────────────────────────────────────────────────────────────

  async function handleBulkPrice() {
    const price = parsePriceInput(bulkPrice);
    if (!price) return;
    setError('');
    try {
      await bulkUpdatePrices(price);
      // Update local variant state
      onOptionsChange(
        options,
        variants.map((v) => ({ ...v, price })),
      );
      setBulkDirty(false);
      setBulkPrice('');
    } catch {
      setError('Failed to update prices');
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {error && (
        <p
          className="text-xs px-3 py-2 rounded-lg"
          style={{
            color: 'var(--red)',
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
          }}
        >
          {error}
        </p>
      )}

      {/* Option editors */}
      {draftOptions.length > 0 && (
        <div className="space-y-3">
          {draftOptions.map((opt, i) => (
            <OptionRow
              key={i}
              option={opt}
              index={i}
              onChange={(updated) => updateOption(i, updated)}
              onRemove={() => removeOption(i)}
              disabled={busy}
            />
          ))}
        </div>
      )}

      {/* Add option / Generate */}
      <div className="flex items-center gap-2">
        {draftOptions.length < 3 && (
          <Button type="button" variant="secondary" size="sm" onClick={addOption} disabled={busy}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add option
          </Button>
        )}
        {draftOptions.length > 0 && optionsDirty && (
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateVariants}
            loading={isPending}
            disabled={busy}
          >
            {hasVariants ? 'Regenerate variants' : 'Generate variants'}
          </Button>
        )}
      </div>

      {draftOptions.length > 0 && optionsDirty && hasVariants && (
        <p className="text-xs" style={{ color: 'var(--amber)' }}>
          ⚠ Regenerating will wipe existing variants and prices — this cannot be undone
        </p>
      )}

      {/* Variant grid */}
      {hasVariants && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {variants.length} variant{variants.length !== 1 ? 's' : ''}
            </p>

            {/* Bulk price */}
            <div className="flex items-center gap-2">
              <div className="w-28">
                <CurrencyInput
                  value={bulkPrice}
                  currency={currency}
                  placeholder="Bulk price"
                  onChange={(v) => {
                    setBulkPrice(v);
                    setBulkDirty(true);
                  }}
                  disabled={busy}
                />
              </div>
              {bulkDirty && bulkPrice && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleBulkPrice}
                  loading={isPending}
                  disabled={busy}
                >
                  Set all
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {variants.map((v) => (
              <VariantRow
                key={v.id}
                variant={v}
                currency={currency}
                onUpdate={handleVariantUpdate}
                onDelete={handleVariantDelete}
                disabled={busy}
              />
            ))}
          </div>

          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Click a variant row to expand SKU and stock fields. Prices auto-save on change.
          </p>
        </div>
      )}
    </div>
  );
}
