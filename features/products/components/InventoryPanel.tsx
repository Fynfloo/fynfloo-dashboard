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

export function InventoryPanel({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      {/* Track stock toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Track quantity</Label>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Monitor stock levels and show low stock warnings
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value.trackQuantity}
          onClick={() => onChange({ ...value, trackQuantity: !value.trackQuantity })}
          disabled={disabled}
          className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
          style={{
            background: value.trackQuantity ? 'var(--accent)' : 'var(--bg-border)',
          }}
        >
          <span
            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
            style={{
              transform: value.trackQuantity ? 'translateX(16px)' : 'translateX(0)',
            }}
          />
        </button>
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min={0}
                value={value.lowStockThreshold}
                onChange={(e) => onChange({ ...value, lowStockThreshold: Number(e.target.value) })}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Allow oversell toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Continue selling when out of stock</Label>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Allow customers to purchase even if stock reaches zero
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={value.allowOversell}
              onClick={() => onChange({ ...value, allowOversell: !value.allowOversell })}
              disabled={disabled}
              className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
              style={{
                background: value.allowOversell ? 'var(--accent)' : 'var(--bg-border)',
              }}
            >
              <span
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{
                  transform: value.allowOversell ? 'translateX(16px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
