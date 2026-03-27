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

export function InventoryPanel({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      {/* Track stock toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 flex-1">
          <Label>Track quantity</Label>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Turn on to monitor your stock levels. Your store will automatically show &ldquo;Out of
            stock&rdquo; when you run out, preventing overselling. Turn off if you make products to
            order or have unlimited availability.
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
              <Label htmlFor="onHand">Quantity on hand</Label>
              <Input
                id="onHand"
                type="number"
                min={0}
                value={value.onHand}
                onChange={(e) => onChange({ ...value, onHand: Number(e.target.value) })}
                disabled={disabled}
              />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                How many units you have available to ship today. Your store counts down as customers
                purchase.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lowStockThreshold">Low stock alert at</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min={0}
                value={value.lowStockThreshold}
                onChange={(e) => onChange({ ...value, lowStockThreshold: Number(e.target.value) })}
                disabled={disabled}
              />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                You get alerted when stock drops to this number. If reordering takes 2 weeks and you
                sell 2 per day, set this to 28.
              </p>
            </div>
          </div>

          {/* Allow oversell toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 flex-1">
              <Label>Continue selling when out of stock</Label>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Allow customers to buy even when you show zero stock. Turn on for made-to-order
                products. Turn off if you cannot fulfil orders when stock runs out.
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
