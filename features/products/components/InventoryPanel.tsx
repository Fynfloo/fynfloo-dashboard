// features/products/components/InventoryPanel.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type InventoryData = {
  trackQuantity: boolean;
  onHand: number;
  lowStockThreshold: number;
  allowOversell: boolean;
};

type Props = {
  value: InventoryData;
  onChange: (value: InventoryData) => void;
  disabled?: boolean;
  productType?: 'PHYSICAL' | 'SERVICE';
  hasVariants?: boolean; // ← added — collapses panel when true
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{
        background: checked ? 'var(--accent)' : 'var(--bg-border)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// ─── Copy per product type ────────────────────────────────────────────────────

const COPY = {
  PHYSICAL: {
    toggleLabel: 'Track quantity',
    toggleHelper:
      'Turn on to monitor your stock levels. Your store will automatically show \u201cOut of stock\u201d when you run out, preventing overselling. Turn off if you make products to order or have unlimited availability.',
    onHandLabel: 'Quantity on hand',
    onHandHelper:
      'How many units you currently have in stock. Your store counts down as customers purchase.',
    lowStockLabel: 'Low stock alert at',
    lowStockHelper:
      'You will be alerted when stock drops to this number — giving you time to reorder before you run out.',
    oversellLabel: 'Continue selling when out of stock',
    oversellHelper:
      'Allow customers to buy even when stock reaches zero. Turn on for made-to-order products. Turn off if you cannot fulfil orders when stock runs out.',
  },
  SERVICE: {
    toggleLabel: 'Track units available',
    toggleHelper:
      'Turn on if you have a limited number of units available — for example, equipment for hire. Your store counts down as customers book. Turn off if you have unlimited availability.',
    onHandLabel: 'Units available',
    onHandHelper:
      'How many units you own and can make available. For example, if you own 3 vans enter 3. Your store counts down as customers book.',
    lowStockLabel: 'Low availability alert at',
    lowStockHelper:
      'You will be alerted when available units drop to this number — giving you time to plan ahead.',
    oversellLabel: 'Allow bookings when fully booked',
    oversellHelper:
      'Allow customers to book even when all units show as unavailable. Turn on if you can accommodate extra demand. Turn off if you cannot take on more bookings.',
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function InventoryPanel({
  value,
  onChange,
  disabled,
  productType = 'PHYSICAL',
  hasVariants = false, // ← added
}: Props) {
  const copy = COPY[productType];

  // ── Variant mode — inventory managed per variant ───────────────────────────
  // When the product has variants, stock is tracked per variant row
  // in the VariantBuilder (SKU + stock fields in expanded variant row).
  // The product-level quantity input is hidden — it has no meaning
  // when each variant tracks its own stock independently.
  // The track quantity toggle is still shown — turning it off disables
  // stock tracking entirely across all variants.
  if (hasVariants) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-lg px-3.5 py-3 text-sm"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          Stock is tracked per variant. Set quantity and SKU for each variant in the Variants
          section above.
        </div>

        {/* Track quantity toggle still relevant — turns off tracking entirely */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 flex-1">
            <Label>{copy.toggleLabel}</Label>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Turn off to disable stock tracking across all variants entirely.
            </p>
          </div>
          <Toggle
            checked={value.trackQuantity}
            onChange={() => onChange({ ...value, trackQuantity: !value.trackQuantity })}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  // ── Standard mode — no variants ───────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Track stock toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 flex-1">
          <Label>{copy.toggleLabel}</Label>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {copy.toggleHelper}
          </p>
        </div>
        <Toggle
          checked={value.trackQuantity}
          onChange={() => onChange({ ...value, trackQuantity: !value.trackQuantity })}
          disabled={disabled}
        />
      </div>

      {/* Conditional fields */}
      {value.trackQuantity && (
        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--bg-border-subtle)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="onHand">{copy.onHandLabel}</Label>
              <Input
                id="onHand"
                type="number"
                min={0}
                value={value.onHand}
                onChange={(e) => onChange({ ...value, onHand: Number(e.target.value) })}
                disabled={disabled}
              />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {copy.onHandHelper}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lowStockThreshold">{copy.lowStockLabel}</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min={0}
                value={value.lowStockThreshold}
                onChange={(e) => onChange({ ...value, lowStockThreshold: Number(e.target.value) })}
                disabled={disabled}
              />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {copy.lowStockHelper}
              </p>
            </div>
          </div>

          {/* Allow oversell toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 flex-1">
              <Label>{copy.oversellLabel}</Label>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {copy.oversellHelper}
              </p>
            </div>
            <Toggle
              checked={value.allowOversell}
              onChange={() => onChange({ ...value, allowOversell: !value.allowOversell })}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
