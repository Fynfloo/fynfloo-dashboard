// features/orders/components/OrderDetail.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Package, Truck, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrder } from '@/features/orders/hooks/useOrders';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { getAccessToken } from '@/lib/api';
import type { OrderDetail as OrderDetailType, OrderStatus, FulfilmentStatus } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COURIERS = ['Royal Mail', 'Evri', 'DHL', 'FedEx', 'UPS', 'Other'];

const EVENT_LABELS: Record<string, string> = {
  ORDER_PLACED: 'Order placed',
  PAYMENT_CONFIRMED: 'Payment confirmed',
  ORDER_FULFILLED: 'Order fulfilled',
  TRACKING_ADDED: 'Tracking added',
  NOTE_ADDED: 'Note added',
  ORDER_REFUNDED: 'Refund processed',
};

function StatusBadge({
  status,
  fulfilmentStatus,
}: {
  status: OrderStatus;
  fulfilmentStatus: FulfilmentStatus;
}) {
  if (status === 'REFUNDED') return <Badge variant="warning">Refunded</Badge>;
  if (status === 'PARTIALLY_REFUNDED') return <Badge variant="warning">Part refunded</Badge>;
  if (status === 'CANCELLED') return <Badge variant="default">Cancelled</Badge>;
  if (status === 'PENDING') return <Badge variant="default">Pending payment</Badge>;
  if (fulfilmentStatus === 'FULFILLED') return <Badge variant="success">Fulfilled</Badge>;
  return <Badge variant="warning">Unfulfilled</Badge>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border-subtle)' }}
    >
      <h2
        className="text-sm font-semibold"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm shrink-0" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span className="text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-3 gap-5 animate-pulse">
      <div className="col-span-2 space-y-5">
        {[180, 200, 160].map((h, i) => (
          <div
            key={i}
            className="rounded-xl"
            style={{ height: h, background: 'var(--bg-elevated)' }}
          />
        ))}
      </div>
      <div className="space-y-5">
        {[140, 160, 120].map((h, i) => (
          <div
            key={i}
            className="rounded-xl"
            style={{ height: h, background: 'var(--bg-elevated)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Fulfil modal ─────────────────────────────────────────────────────────────

function FulfilModal({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: (trackingNumber?: string, courierName?: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border-subtle)' }}
      >
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Mark as fulfilled
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            The customer will receive a dispatch email. Tracking is optional.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Tracking number (optional)
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. JD000000000000000000"
              className="w-full px-3 py-2 text-sm rounded-lg outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Courier (optional)
            </label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                color: courierName ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <option value="">Select courier…</option>
              {COURIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1"
            loading={isPending}
            disabled={isPending}
            onClick={() => onConfirm(trackingNumber || undefined, courierName || undefined)}
          >
            Mark as fulfilled
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrderDetail() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  const orderId = params.id as string;

  const stores = useAuthStore((s) => s.stores);
  const store = stores.find((s) => s.id === storeId);
  const currency = store?.currency ?? 'GBP';

  const { getOrder, fulfilOrder, addNote, getPackingSlipUrl, isPending } = useOrder(
    storeId,
    orderId,
  );

  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFulfilModal, setShowFulfilModal] = useState(false);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOrder();
      setOrder(data);
    } catch {
      setError('Failed to load order — please refresh the page');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFulfil(trackingNumber?: string, courierName?: string) {
    try {
      await fulfilOrder({ trackingNumber, courierName });
      setShowFulfilModal(false);
      setSuccessMessage('Order marked as fulfilled');
      setTimeout(() => setSuccessMessage(''), 3000);
      load();
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to fulfil order');
      setShowFulfilModal(false);
    }
  }

  async function handleAddNote() {
    if (!note.trim()) return;
    setAddingNote(true);
    setNoteError('');
    try {
      await addNote(note.trim());
      setNote('');
      load();
    } catch {
      setNoteError('Failed to add note — please try again');
    } finally {
      setAddingNote(false);
    }
  }

  async function handleDownloadPackingSlip() {
    const token = getAccessToken();
    const url = getPackingSlipUrl();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `packing-slip-${order?.orderNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (loading) return <Skeleton />;

  if (error && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-8 w-8 mb-3" style={{ color: 'var(--red)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {error}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  if (!order) return null;

  const canFulfil = order.status === 'PAID' && order.fulfilmentStatus === 'UNFULFILLED';
  const address = [
    order.addressLine1,
    order.addressLine2,
    order.city,
    order.postCode,
    order.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      {showFulfilModal && (
        <FulfilModal
          onConfirm={handleFulfil}
          onCancel={() => setShowFulfilModal(false)}
          isPending={isPending}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-0.5">
          <div className="flex items-center gap-3">
            <h1
              className="text-xl font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Order #{order.orderNumber}
            </h1>
            <StatusBadge status={order.status} fulfilmentStatus={order.fulfilmentStatus} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/dashboard/${storeId}/orders`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Orders
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownloadPackingSlip}>
            <FileText className="h-4 w-4 mr-1.5" />
            Packing slip
          </Button>
          {canFulfil && (
            <Button size="sm" onClick={() => setShowFulfilModal(true)}>
              <Truck className="h-4 w-4 mr-1.5" />
              Fulfil order
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <div
          className="mb-5 px-4 py-3 rounded-lg text-sm"
          style={{
            background: 'var(--green-bg, #f0fdf4)',
            border: '1px solid var(--green-border, #bbf7d0)',
            color: 'var(--green)',
          }}
        >
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5 items-start">
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-5">
          {/* Items */}
          <Section title="Items">
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      style={{ background: 'var(--bg-elevated)' }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <Package className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                      {item.variantTitle && (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {' '}
                          — {item.variantTitle}
                        </span>
                      )}
                    </p>
                    {item.sku && (
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        SKU: {item.sku}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(item.pricePence * item.quantity, currency)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatCurrency(item.pricePence, currency)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              className="space-y-2 pt-4"
              style={{ borderTop: '1px solid var(--bg-border-subtle)' }}
            >
              <Row label="Subtotal" value={formatCurrency(order.subtotalPence, currency)} />
              {order.discountCode && order.discountPence && (
                <Row
                  label={`Discount (${order.discountCode})`}
                  value={`-${formatCurrency(order.discountPence, currency)}`}
                />
              )}
              <Row
                label="Shipping"
                value={
                  order.shippingPence > 0 ? formatCurrency(order.shippingPence, currency) : 'Free'
                }
              />
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: '1px solid var(--bg-border-subtle)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total
                </span>
                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(order.totalPence, currency)}
                </span>
              </div>
              {order.refunds.length > 0 && (
                <div className="pt-2 space-y-1">
                  {order.refunds.map((refund) => (
                    <Row
                      key={refund.id}
                      label={`Refund · ${formatDate(refund.createdAt)}`}
                      value={`-${formatCurrency(refund.amountPence, currency)}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Fulfilment */}
          {order.fulfilmentStatus === 'FULFILLED' && (
            <Section title="Fulfilment">
              <div className="space-y-2">
                {order.fulfilledAt && (
                  <Row label="Fulfilled" value={formatDate(order.fulfilledAt)} />
                )}
                {order.courierName && <Row label="Courier" value={order.courierName} />}
                {order.trackingNumber && <Row label="Tracking" value={order.trackingNumber} />}
              </div>
            </Section>
          )}

          {/* Internal notes */}
          <Section title="Internal notes">
            {order.notes && (
              <div className="space-y-2 mb-3">
                {order.notes.split('\n').map((line, i) => (
                  <p
                    key={i}
                    className="text-sm px-3 py-2 rounded-lg"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <textarea
                rows={3}
                placeholder="Add an internal note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
              />
              {noteError && (
                <p className="text-xs" style={{ color: 'var(--red)' }}>
                  {noteError}
                </p>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddNote}
                loading={addingNote}
                disabled={!note.trim() || addingNote}
              >
                Add note
              </Button>
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            {order.events.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No events yet
              </p>
            ) : (
              <div className="space-y-4">
                {[...order.events].reverse().map((event, i) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{
                        background:
                          event.type === 'ORDER_REFUNDED'
                            ? 'var(--amber)'
                            : event.type === 'PAYMENT_CONFIRMED'
                              ? 'var(--green)'
                              : 'var(--accent)',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {EVENT_LABELS[event.type] ?? event.type}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {event.description}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDateTime(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Customer */}
          <Section title="Customer">
            <div className="space-y-2">
              <Row label="Name" value={order.customerName ?? '—'} />
              <Row label="Email" value={order.email ?? '—'} />
              {order.phone && <Row label="Phone" value={order.phone} />}
            </div>
          </Section>

          {/* Shipping address */}
          <Section title="Shipping address">
            {address ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {[order.addressLine1, order.addressLine2, order.city, order.postCode, order.country]
                  .filter(Boolean)
                  .join('\n')
                  .split('\n')
                  .map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No address provided
              </p>
            )}
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <div className="space-y-2">
              <Row label="Status" value={order.status === 'PAID' ? 'Paid' : order.status} />
              {order.paidAt && <Row label="Paid at" value={formatDate(order.paidAt)} />}
              {order.paymentIntentId && (
                <Row
                  label="Reference"
                  value={
                    <span
                      className="font-mono text-xs truncate max-w-[120px] block"
                      title={order.paymentIntentId}
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {order.paymentIntentId}
                    </span>
                  }
                />
              )}
            </div>
          </Section>

          {/* Customer note */}
          {order.customerNote && (
            <Section title="Customer note">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {order.customerNote}
              </p>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
