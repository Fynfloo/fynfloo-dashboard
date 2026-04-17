// features/analytics/components/OverviewDashboard.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';
import type {
  AnalyticsPeriod,
  AnalyticsOverview,
  AnalyticsRevenue,
  AnalyticsTopProducts,
} from '@/lib/types';

// ─── Period selector ──────────────────────────────────────────────────────────

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

function PeriodSelector({
  value,
  onChange,
}: {
  value: AnalyticsPeriod;
  onChange: (p: AnalyticsPeriod) => void;
}) {
  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--bg-border-subtle)' }}
    >
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className="px-3 py-1.5 text-sm font-medium transition-colors"
          style={{
            background: value === p.value ? 'var(--accent)' : 'var(--bg-surface)',
            color: value === p.value ? '#fff' : 'var(--text-secondary)',
            borderRight: p.value !== 90 ? '1px solid var(--bg-border-subtle)' : 'none',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) return null;

  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div
      className="flex items-center gap-1 text-xs font-medium mt-1"
      style={{
        color: isNeutral ? 'var(--text-tertiary)' : isPositive ? 'var(--green)' : 'var(--red)',
      }}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>
        {isPositive ? '+' : ''}
        {change}% vs prev period
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  sub,
}: {
  label: string;
  value: string;
  change?: number | null;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border-subtle)',
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {change !== undefined && <ChangeIndicator change={change ?? null} />}
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div
      className="rounded-xl p-5 animate-pulse"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border-subtle)',
      }}
    >
      <div
        className="h-3 rounded mb-3"
        style={{ background: 'var(--bg-elevated)', width: '50%' }}
      />
      <div
        className="h-7 rounded mb-2"
        style={{ background: 'var(--bg-elevated)', width: '70%' }}
      />
      <div className="h-3 rounded" style={{ background: 'var(--bg-elevated)', width: '40%' }} />
    </div>
  );
}

// ─── Revenue chart ────────────────────────────────────────────────────────────

function RevenueChart({
  data,
  currency,
  loading,
}: {
  data: AnalyticsRevenue['data'];
  currency: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        className="rounded-xl p-5 animate-pulse"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border-subtle)',
          height: 280,
        }}
      >
        <div
          className="h-4 rounded mb-4"
          style={{ background: 'var(--bg-elevated)', width: '30%' }}
        />
        <div className="h-52 rounded" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl p-5 flex items-center justify-center"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border-subtle)',
          height: 280,
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No revenue data for this period
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    revenue: d.revenuePence / 100,
    orders: d.orders,
  }));

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border-subtle)',
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Revenue over time
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border-subtle)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v * 100, currency)}
            width={60}
          />

          <Tooltip
            formatter={(v) => [formatCurrency((Number(v) || 0) * 100, currency), 'Revenue']}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border-subtle)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--accent)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Top products table ───────────────────────────────────────────────────────

function TopProductsTable({
  title,
  products,
  valueKey,
  valueLabel,
  currency,
  loading,
}: {
  title: string;
  products: AnalyticsTopProducts['byRevenue'];
  valueKey: 'revenuePence' | 'unitsSold';
  valueLabel: string;
  currency: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border-subtle)',
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}>
          <div
            className="h-3 rounded animate-pulse"
            style={{ background: 'var(--bg-elevated)', width: '40%' }}
          />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 animate-pulse"
            style={{ borderBottom: i < 4 ? '1px solid var(--bg-border-subtle)' : 'none' }}
          >
            <div
              className="h-3 rounded"
              style={{ background: 'var(--bg-elevated)', width: '60%' }}
            />
            <div
              className="h-3 rounded"
              style={{ background: 'var(--bg-elevated)', width: '20%' }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border-subtle)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {title}
        </p>
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {valueLabel}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No data for this period
          </p>
        </div>
      ) : (
        products.map((p, i) => (
          <div
            key={p.productId}
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: i < products.length - 1 ? '1px solid var(--bg-border-subtle)' : 'none',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="text-xs font-semibold w-5 shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {i + 1}
              </span>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {p.name}
              </p>
            </div>
            <p
              className="text-sm font-semibold shrink-0 ml-4"
              style={{ color: 'var(--text-primary)' }}
            >
              {valueKey === 'revenuePence'
                ? formatCurrency(p.revenuePence, currency)
                : `${p.unitsSold} sold`}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OverviewDashboard() {
  const params = useParams();
  const storeId = params.storeId as string;

  const stores = useAuthStore((s) => s.stores);
  const currentStore = stores.find((s) => s.id === storeId);
  const currency = currentStore?.currency ?? 'GBP';

  const { fetchOverview, fetchRevenue, fetchTopProducts } = useAnalytics(storeId);

  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenue, setRevenue] = useState<AnalyticsRevenue | null>(null);
  const [topProducts, setTopProducts] = useState<AnalyticsTopProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (p: AnalyticsPeriod) => {
      setLoading(true);
      setError('');
      try {
        const [ov, rev, top] = await Promise.all([
          fetchOverview(p),
          fetchRevenue(p),
          fetchTopProducts(p),
        ]);
        setOverview(ov);
        setRevenue(rev);
        setTopProducts(top);
      } catch {
        setError('Failed to load analytics — please refresh the page');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeId],
  );

  useEffect(() => {
    load(period);
  }, [load, period]);

  function handlePeriodChange(p: AnalyticsPeriod) {
    setPeriod(p);
  }

  return (
    <>
      <PageHeader
        title="Overview"
        actions={<PeriodSelector value={period} onChange={handlePeriodChange} />}
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

      {/* Metric cards */}
      <div
        className="grid grid-cols-2 gap-4 mb-6"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        {loading || !overview ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Revenue"
              value={formatCurrency(overview.revenuePence, currency)}
              change={overview.revenueChange}
            />
            <MetricCard
              label="Orders"
              value={String(overview.orders)}
              change={overview.ordersChange}
            />
            <MetricCard
              label="Avg order value"
              value={formatCurrency(overview.avgOrderValuePence, currency)}
            />
            <MetricCard
              label="Customers"
              value={String(overview.customers)}
              sub={`${overview.newCustomers} new · ${overview.returningCustomers} returning`}
            />
          </>
        )}
      </div>

      {/* Revenue chart */}
      <div className="mb-6">
        <RevenueChart data={revenue?.data ?? []} currency={currency} loading={loading} />
      </div>

      {/* Top products */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <TopProductsTable
          title="Top products by revenue"
          products={topProducts?.byRevenue ?? []}
          valueKey="revenuePence"
          valueLabel="Revenue"
          currency={currency}
          loading={loading}
        />
        <TopProductsTable
          title="Top products by units"
          products={topProducts?.byUnits ?? []}
          valueKey="unitsSold"
          valueLabel="Units"
          currency={currency}
          loading={loading}
        />
      </div>
    </>
  );
}
