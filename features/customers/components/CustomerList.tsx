// features/customers/components/CustomerList.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCustomers } from '../hooks/useCustomers';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { CustomerListItem } from '@/lib/types';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-xl"
      style={{ border: '1px dashed var(--bg-border)', background: 'var(--bg-surface)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <Users className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        No customers yet
      </p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Customers will appear here after their first order
      </p>
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
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}>
        <div className="flex gap-4">
          {[35, 25, 15, 15, 10].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded animate-pulse"
              style={{ background: 'var(--bg-elevated)', width: `${w}%` }}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 animate-pulse"
          style={{ borderBottom: i < 7 ? '1px solid var(--bg-border-subtle)' : 'none' }}
        >
          {[35, 25, 15, 15, 10].map((w, j) => (
            <div
              key={j}
              className="h-3 rounded"
              style={{ background: 'var(--bg-elevated)', width: `${w}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  pages,
  total,
  limit,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        {from}–{to} of {total} customers
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border-subtle)',
            color: page <= 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            opacity: page <= 1 ? 0.5 : 1,
          }}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border-subtle)',
            color: page >= pages ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: page >= pages ? 'not-allowed' : 'pointer',
            opacity: page >= pages ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CustomerList() {
  const params = useParams();
  const storeId = params.storeId as string;

  const stores = useAuthStore((s) => s.stores);
  const currentStore = stores.find((s) => s.id === storeId);
  const currency = currentStore?.currency ?? 'GBP';

  const { fetchCustomers } = useCustomers(storeId);

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchCustomers(p, limit);
        setCustomers(result.customers);
        setTotal(result.total);
        setPages(result.pages);
        setPage(result.page);
      } catch {
        setError('Failed to load customers — please refresh the page');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeId],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  function handlePage(p: number) {
    load(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description={total > 0 ? `${total} customer${total !== 1 ? 's' : ''}` : undefined}
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

      {!loading && customers.length === 0 && !error && <EmptyState />}

      {!loading && customers.length > 0 && (
        <>
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
                  {['Customer', 'Email', 'Orders', 'Total spent', 'Joined'].map((h) => (
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
                {customers.map((customer, i) => (
                  <tr
                    key={customer.id}
                    style={{
                      borderBottom:
                        i < customers.length - 1 ? '1px solid var(--bg-border-subtle)' : 'none',
                      background: hoveredId === customer.id ? 'var(--bg-elevated)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={() => setHoveredId(customer.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {customer.name ?? '—'}
                      </p>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {customer.email}
                      </p>
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {customer.orderCount}
                      </p>
                    </td>

                    {/* Total spent */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(customer.totalSpentPence, currency)}
                      </p>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(customer.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pages} total={total} limit={limit} onPage={handlePage} />
        </>
      )}
    </>
  );
}
