// features/discounts/components/DiscountList.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Tag, MoreHorizontal, Pencil, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { DiscountForm } from './DiscountForm';
import { useDiscounts } from '../hooks/useDiscounts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { DiscountCode, DiscountType } from '@/lib/types';
import { apiRequest } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDiscountValue(discount: DiscountCode, currency: string): string {
  if (discount.type === 'PERCENTAGE') return `${discount.value}% off`;
  if (discount.type === 'FIXED_AMOUNT') return `${formatCurrency(discount.value, currency)} off`;
  return 'Free shipping';
}

function formatConditions(discount: DiscountCode, currency: string): string {
  const parts: string[] = [];
  if (discount.minOrderValue) {
    parts.push(`Min. ${formatCurrency(discount.minOrderValue, currency)}`);
  }
  if (discount.usageLimit) {
    parts.push(`${discount.usageCount}/${discount.usageLimit} uses`);
  } else {
    parts.push(`${discount.usageCount} use${discount.usageCount !== 1 ? 's' : ''}`);
  }
  if (discount.expiresAt) {
    parts.push(`Expires ${formatDate(discount.expiresAt)}`);
  }
  return parts.join(' · ');
}

const TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Percentage',
  FIXED_AMOUNT: 'Fixed amount',
  FREE_SHIPPING: 'Free shipping',
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function DiscountStatusBadge({
  discount,
  isToggling,
}: {
  discount: DiscountCode;
  isToggling: boolean;
}) {
  if (isToggling) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Saving…
        </span>
      </div>
    );
  }

  const now = new Date();
  const expired = discount.expiresAt && new Date(discount.expiresAt) < now;
  const limitReached = discount.usageLimit !== null && discount.usageCount >= discount.usageLimit;

  if (!discount.active) return <Badge variant="default">Inactive</Badge>;
  if (expired) return <Badge variant="warning">Expired</Badge>;
  if (limitReached) return <Badge variant="warning">Limit reached</Badge>;
  return <Badge variant="success">Active</Badge>;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-xl"
      style={{ border: '1px dashed var(--bg-border)', background: 'var(--bg-surface)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <Tag className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        No discount codes yet
      </p>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Create a code to offer discounts to your customers
      </p>
      <Button size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" />
        Create discount
      </Button>
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div
        className="grid px-4 py-3"
        style={{
          gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
          borderBottom: '1px solid var(--bg-border-subtle)',
        }}
      >
        {['CODE', 'TYPE', 'VALUE', 'STATUS', ''].map((h) => (
          <div
            key={h}
            className="text-xs font-semibold"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}
          >
            {h}
          </div>
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="grid px-4 py-3 animate-pulse"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
            borderBottom: i < 3 ? '1px solid var(--bg-border-subtle)' : 'none',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div className="space-y-1.5">
            <div
              className="h-3 rounded"
              style={{ background: 'var(--bg-elevated)', width: '40%' }}
            />
            <div
              className="h-2.5 rounded"
              style={{ background: 'var(--bg-elevated)', width: '60%' }}
            />
          </div>
          {[50, 60, 70].map((w, j) => (
            <div
              key={j}
              className="h-3 rounded"
              style={{ background: 'var(--bg-elevated)', width: `${w}%` }}
            />
          ))}
          <div />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DiscountList() {
  const params = useParams();
  const storeId = params.storeId as string;

  const stores = useAuthStore((s) => s.stores);
  const currentStore = stores.find((s) => s.id === storeId);
  const currency = currentStore?.currency ?? 'GBP';

  const { listDiscounts } = useDiscounts(storeId);

  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);

  // ─── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listDiscounts();
      setDiscounts(result);
    } catch {
      setError('Failed to load discount codes — please refresh the page');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Sheet handlers ────────────────────────────────────────────────────────

  function openCreate() {
    setEditingDiscount(null);
    setSheetOpen(true);
  }

  function openEdit(discount: DiscountCode) {
    setEditingDiscount(discount);
    setSheetOpen(true);
  }

  function handleClose() {
    setSheetOpen(false);
    setEditingDiscount(null);
  }

  function handleSaved(saved: DiscountCode) {
    setDiscounts((prev) => {
      const exists = prev.find((d) => d.id === saved.id);
      if (exists) {
        return prev.map((d) => (d.id === saved.id ? saved : d));
      }
      return [saved, ...prev];
    });
  }

  function handleDeleted(discountId: string) {
    setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
  }

  // ─── Inline deactivate ─────────────────────────────────────────────────────

  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleActive(discount: DiscountCode) {
    setTogglingId(discount.id);
    try {
      const updated = await apiRequest<DiscountCode>(
        `/api/tenant/${storeId}/discounts/${discount.id}`,
        { method: 'PATCH', body: { active: !discount.active } },
      );
      setDiscounts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch {
      setError('Failed to update discount — please try again');
    } finally {
      setTogglingId(null);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <DiscountForm
        key={editingDiscount?.id ?? 'new'}
        open={sheetOpen}
        onClose={handleClose}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        storeId={storeId}
        currency={currency}
        discount={editingDiscount}
      />

      <PageHeader
        title="Discount codes"
        description={
          discounts.length > 0
            ? `${discounts.length} code${discounts.length !== 1 ? 's' : ''}`
            : undefined
        }
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create discount
          </Button>
        }
      />

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            color: 'var(--red)',
          }}
        >
          {error}
        </div>
      )}

      {loading && <TableSkeleton />}

      {!loading && discounts.length === 0 && !error && <EmptyState onAdd={openCreate} />}

      {!loading && discounts.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: '1px solid var(--bg-border-subtle)',
            background: 'var(--bg-surface)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}>
                {['Code', 'Type', 'Value', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{
                      color: 'var(--text-tertiary)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount, i) => {
                const isToggling = togglingId === discount.id;

                return (
                  <tr
                    key={discount.id}
                    style={{
                      borderBottom:
                        i < discounts.length - 1 ? '1px solid var(--bg-border-subtle)' : 'none',
                      cursor: isToggling ? 'default' : 'pointer',
                      transition: 'background 0.1s, opacity 0.15s',
                      opacity: isToggling ? 0.6 : 1, // ← dim the row
                      pointerEvents: isToggling ? 'none' : 'auto', // ← block clicks while saving
                    }}
                    onMouseEnter={(e) => {
                      if (!isToggling) e.currentTarget.style.background = 'var(--bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isToggling) e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={() => {
                      if (!isToggling) openEdit(discount);
                    }}
                  >
                    {/* Code + conditions */}
                    <td className="px-4 py-3">
                      <p
                        className="text-sm font-semibold font-mono"
                        style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}
                      >
                        {discount.code}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {formatConditions(discount, currency)}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {TYPE_LABELS[discount.type]}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatDiscountValue(discount, currency)}
                      </span>
                    </td>

                    {/* Status — shows spinner while toggling */}
                    <td className="px-4 py-3">
                      <DiscountStatusBadge discount={discount} isToggling={isToggling} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu
                        align="right"
                        trigger={
                          <button
                            type="button"
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--bg-border-subtle)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          {
                            label: 'Edit',
                            icon: <Pencil className="h-3.5 w-3.5" />,
                            onClick: () => openEdit(discount),
                          },
                          {
                            label: discount.active ? 'Deactivate' : 'Activate',
                            icon: <ToggleLeft className="h-3.5 w-3.5" />,
                            onClick: () => handleToggleActive(discount),
                            disabled: isToggling,
                            dividerAbove: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
