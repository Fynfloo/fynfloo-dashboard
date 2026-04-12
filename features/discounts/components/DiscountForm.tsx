// features/discounts/components/DiscountForm.tsx
'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useDiscounts, useDiscount } from '../hooks/useDiscounts';
import { formatPriceInput, parsePriceInput, getCurrencySymbol } from '@/lib/utils';
import type { DiscountCode, DiscountType, CreateDiscountInput } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (discount: DiscountCode) => void;
  onDeleted?: (discountId: string) => void;
  storeId: string;
  currency: string;
  discount?: DiscountCode | null; // null = create mode, set = edit mode
};

// ─── Discount type options ────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: DiscountType; label: string; desc: string }[] = [
  {
    value: 'PERCENTAGE',
    label: 'Percentage off',
    desc: 'e.g. 20% off the order subtotal',
  },
  {
    value: 'FIXED_AMOUNT',
    label: 'Fixed amount off',
    desc: 'e.g. £10 off the order subtotal',
  },
  {
    value: 'FREE_SHIPPING',
    label: 'Free shipping',
    desc: 'Removes the shipping cost at checkout',
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
      {children}
    </p>
  );
}

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

// ─── Main component ───────────────────────────────────────────────────────────

export function DiscountForm({
  open,
  onClose,
  onSaved,
  onDeleted,
  storeId,
  currency,
  discount,
}: Props) {
  const isEdit = !!discount;

  const { createDiscount, deleteDiscount, isPending: isListPending } = useDiscounts(storeId);
  const { updateDiscount, isPending: isUpdatePending } = useDiscount(storeId, discount?.id ?? '');

  const isPending = isListPending || isUpdatePending;

  // ─── Form state ─────────────────────────────────────────────────────────────

  // Replace all the individual useState calls with these:

  const [code, setCode] = useState(() => discount?.code ?? '');
  const [type, setType] = useState<DiscountType>(() => discount?.type ?? 'PERCENTAGE');
  const [valueDisplay, setValueDisplay] = useState(() => {
    if (!discount) return '';
    if (discount.type === 'PERCENTAGE') return String(discount.value);
    if (discount.type === 'FIXED_AMOUNT') return formatPriceInput(discount.value);
    return '';
  });
  const [minOrderDisplay, setMinOrderDisplay] = useState(() =>
    discount?.minOrderValue ? formatPriceInput(discount.minOrderValue) : '',
  );
  const [usageLimit, setUsageLimit] = useState(() =>
    discount?.usageLimit ? String(discount.usageLimit) : '',
  );
  const [expiresAt, setExpiresAt] = useState(() =>
    discount?.expiresAt ? new Date(discount.expiresAt).toISOString().split('T')[0] : '',
  );
  const [active, setActive] = useState(() => discount?.active ?? true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  // ─── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    setError('');

    // Build value in correct units
    let value = 0;
    if (type === 'PERCENTAGE') {
      value = Number(valueDisplay);
    } else if (type === 'FIXED_AMOUNT') {
      value = parsePriceInput(valueDisplay);
    }
    // FREE_SHIPPING → value stays 0

    const minOrderValue = minOrderDisplay ? parsePriceInput(minOrderDisplay) : undefined;
    const usageLimitNum = usageLimit ? Number(usageLimit) : undefined;
    const expiresAtIso = expiresAt ? new Date(expiresAt).toISOString() : undefined;

    try {
      if (isEdit) {
        const updated = await updateDiscount({
          value: type !== 'FREE_SHIPPING' ? value : undefined,
          minOrderValue,
          usageLimit: usageLimitNum,
          expiresAt: expiresAtIso,
          active,
        });
        onSaved(updated);
      } else {
        const input: CreateDiscountInput = {
          code,
          type,
          value,
          minOrderValue,
          usageLimit: usageLimitNum,
          expiresAt: expiresAtIso,
        };
        const created = await createDiscount(input);
        onSaved(created);
      }
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Something went wrong — please try again');
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!discount) return;
    setError('');
    try {
      await deleteDiscount(discount.id);
      onDeleted?.(discount.id);
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to delete discount code');
      setShowDeleteConfirm(false);
    }
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const title = isEdit ? 'Edit discount' : 'Create discount';
  const description = isEdit
    ? `${discount!.code} · ${discount!.usageCount} use${discount!.usageCount !== 1 ? 's' : ''}`
    : 'Set up a discount code for your customers';

  const saveLabel = isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create discount';
  const canDelete = isEdit && discount!.usageCount === 0;
  const hasUsage = isEdit && discount!.usageCount > 0;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onClose={onClose} title={title} description={description} width="md">
      <div className="space-y-5">
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm"
            style={{
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
              color: 'var(--red)',
            }}
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Code — read-only in edit mode */}
        <div className="space-y-1.5">
          <Label htmlFor="code">Discount code</Label>
          <Input
            id="code"
            placeholder="e.g. SUMMER20"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isEdit || isPending}
            style={isEdit ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          />
          {isEdit ? (
            <HelperText>Code cannot be changed after creation.</HelperText>
          ) : (
            <HelperText>
              Letters, numbers, hyphens and underscores only. Customers enter this at checkout —
              keep it short and memorable.
            </HelperText>
          )}
        </div>

        {/* Type — read-only in edit mode */}
        <div className="space-y-1.5">
          <Label>Discount type</Label>
          <div className="space-y-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (isEdit) return;
                  setType(opt.value);
                  setValueDisplay('');
                }}
                disabled={isEdit}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                style={{
                  background: type === opt.value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  border:
                    type === opt.value ? '1px solid rgba(88,81,234,0.3)' : '1px solid transparent',
                  opacity: isEdit && type !== opt.value ? 0.4 : 1,
                  cursor: isEdit ? 'default' : 'pointer',
                }}
              >
                <div
                  className="mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: type === opt.value ? 'var(--accent)' : 'var(--bg-border)',
                    background: type === opt.value ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {type === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: type === opt.value ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {opt.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {isEdit && <HelperText>Discount type cannot be changed after creation.</HelperText>}
        </div>

        {/* Value — hidden for FREE_SHIPPING */}
        {type !== 'FREE_SHIPPING' && (
          <div className="space-y-1.5">
            <Label htmlFor="value">{type === 'PERCENTAGE' ? 'Percentage off' : 'Amount off'}</Label>
            {type === 'PERCENTAGE' ? (
              <div className="relative flex items-center">
                <Input
                  id="value"
                  type="number"
                  min={1}
                  max={100}
                  placeholder="20"
                  value={valueDisplay}
                  onChange={(e) => setValueDisplay(e.target.value)}
                  disabled={isPending}
                  style={{ paddingRight: '36px' }}
                />
                <span
                  className="absolute right-3 text-sm font-medium select-none pointer-events-none"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  %
                </span>
              </div>
            ) : (
              <CurrencyInput
                id="value"
                value={valueDisplay}
                onChange={setValueDisplay}
                currency={currency}
                disabled={isPending}
              />
            )}
            <HelperText>
              {type === 'PERCENTAGE'
                ? 'Enter a whole number between 1 and 100.'
                : `Enter the amount in ${getCurrencySymbol(currency)} — e.g. ${getCurrencySymbol(currency)}10.00`}
            </HelperText>
          </div>
        )}

        {/* Optional fields — divider */}
        <div style={{ borderTop: '1px solid var(--bg-border-subtle)', paddingTop: '4px' }}>
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-4"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Optional conditions
          </p>

          <div className="space-y-4">
            {/* Minimum order value */}
            <div className="space-y-1.5">
              <Label htmlFor="minOrder">Minimum order value</Label>
              <CurrencyInput
                id="minOrder"
                value={minOrderDisplay}
                onChange={setMinOrderDisplay}
                currency={currency}
                placeholder="0.00"
                disabled={isPending}
              />
              <HelperText>
                Leave blank for no minimum. Customer&apos;s cart subtotal must meet this threshold
                before the code applies.
              </HelperText>
            </div>

            {/* Usage limit */}
            <div className="space-y-1.5">
              <Label htmlFor="usageLimit">Usage limit</Label>
              <Input
                id="usageLimit"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                disabled={isPending}
              />
              <HelperText>
                Leave blank for unlimited uses. Enter a number to cap how many times this code can
                be redeemed across all customers.
              </HelperText>
            </div>

            {/* Expiry date */}
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Expiry date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={isPending}
                min={new Date().toISOString().split('T')[0]}
              />
              <HelperText>
                Leave blank for no expiry. Code will be rejected after midnight on this date.
              </HelperText>
            </div>
          </div>
        </div>

        {/* Active toggle — edit mode only */}
        {isEdit && (
          <div
            className="flex items-center justify-between gap-4 pt-1"
            style={{ borderTop: '1px solid var(--bg-border-subtle)' }}
          >
            <div className="space-y-0.5">
              <Label>Active</Label>
              <HelperText>
                Inactive codes are rejected at checkout — customers see an &ldquo;invalid or
                expired&rdquo; message. Use this to pause a code without deleting it.
              </HelperText>
            </div>
            <Toggle
              checked={active}
              onChange={() => setActive((prev) => !prev)}
              disabled={isPending}
            />
          </div>
        )}

        {/* Usage note — edit mode, has been used */}
        {hasUsage && (
          <div
            className="rounded-lg px-3.5 py-3 text-xs"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            This code has been used {discount!.usageCount} time
            {discount!.usageCount !== 1 ? 's' : ''} and cannot be deleted — deactivate it instead to
            stop new redemptions.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {/* Delete — only shown in edit mode with zero usage */}
          {canDelete && !showDeleteConfirm && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
            >
              Delete
            </Button>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: 'var(--red-bg)',
                border: '1px solid var(--red-border)',
              }}
            >
              <p className="text-xs flex-1" style={{ color: 'var(--red)' }}>
                Delete this code permanently?
              </p>
              <button
                type="button"
                className="text-xs font-medium px-2 py-1 rounded"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                loading={isPending}
                disabled={isPending}
              >
                Delete
              </Button>
            </div>
          )}

          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              loading={isPending}
              disabled={isPending}
            >
              {saveLabel}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
