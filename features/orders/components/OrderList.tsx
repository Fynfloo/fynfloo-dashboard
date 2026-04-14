// features/orders/components/OrderList.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ShoppingBag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { OrderListItem, OrderStatus, FulfilmentStatus } from '@/lib/types';

// ─── Status badge ─────────────────────────────────────────────────────────────

function OrderStatusBadge({
  status,
  fulfilmentStatus,
}: {
  status: OrderStatus;
  fulfilmentStatus: FulfilmentStatus;
}) {
  if (status === 'REFUNDED') return <Badge variant="warning">Refunded</Badge>;
  if (status === 'PARTIALLY_REFUNDED') return <Badge variant="warning">Part refunded</Badge>;
  if (status === 'CANCELLED') return <Badge variant="default">Cancelled</Badge>;
  if (status === 'PENDING') return <Badge variant="default">Pending</Badge>;
  if (fulfilmentStatus === 'FULFILLED') return <Badge variant="success">Fulfilled</Badge>;
  return <Badge variant="warning">Unfulfilled</Badge>;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-xl"
      style={{ border: '1px dashed var(--bg-border)', background: 'var(--bg-surface)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <ShoppingBag className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        {filtered ? 'No orders match your filter' : 'No orders yet'}
      </p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {filtered
          ? 'Try changing the filter or search term'
          : 'Orders will appear here when customers purchase from your store'}
      </p>
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3"
          style={{ borderBottom: i < 5 ? '1px solid var(--bg-border-subtle)' : 'none' }}
        >
          <div className="h-3 rounded flex-1" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-3 rounded w-20" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-3 rounded w-16" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-3 rounded w-24" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-3 rounded w-16" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      ))}
    </div>
  );
}

// ─── Status tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: 'Unfulfilled', value: 'unfulfilled' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'All', value: 'all' },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]['value'];

// ─── Main component ───────────────────────────────────────────────────────────

export function OrderList() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;

  const stores = useAuthStore((s) => s.stores);
  const store = stores.find((s) => s.id === storeId);
  const currency = store?.currency ?? 'GBP';

  const { listOrders } = useOrders(storeId);

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>('unfulfilled');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listOrders({
        status: statusTab,
        search: debouncedSearch || undefined,
        page,
        limit: LIMIT,
      });
      setOrders(res.orders);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setError('Failed to load orders — please refresh the page');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, statusTab, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [statusTab, debouncedSearch]);

  const isFiltered = statusTab !== 'all' || !!debouncedSearch;

  return (
    <>
      <PageHeader
        title="Orders"
        description={total > 0 ? `${total} order${total !== 1 ? 's' : ''}` : undefined}
      />

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
          {STATUS_TABS.map((tab) => {
            const isActive = statusTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
                style={{
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Search by name, email or #number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
          />
        </div>
      </div>

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

      {!loading && orders.length === 0 && !error && <EmptyState filtered={isFiltered} />}

      {!loading && orders.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}>
                {['Order', 'Customer', 'Status', 'Items', 'Total', 'Date'].map((h) => (
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
              {orders.map((order, i) => (
                <tr
                  key={order.id}
                  style={{
                    borderBottom:
                      i < orders.length - 1 ? '1px solid var(--bg-border-subtle)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => router.push(`/dashboard/${storeId}/orders/${order.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      #{order.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {order.customerName ?? '—'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {order.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge
                      status={order.status}
                      fulfilmentStatus={order.fulfilmentStatus}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(order.totalPence, currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatRelativeTime(order.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid var(--bg-border-subtle)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
