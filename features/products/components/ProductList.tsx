// features/products/components/ProductList.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProducts } from '@/features/products/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import type { ProductListItem, ProductStatus } from '@/lib/types';
import { useAuthStore } from '@/store/auth.store';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProductStatus }) {
  const variants = {
    ACTIVE: 'success',
    DRAFT: 'default',
    ARCHIVED: 'warning',
  } as const;

  const labels = {
    ACTIVE: 'Active',
    DRAFT: 'Draft',
    ARCHIVED: 'Archived',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-xl"
      style={{
        border: '1px dashed var(--bg-border)',
        background: 'var(--bg-surface)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <Package className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        No products yet
      </p>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Add your first product to start selling
      </p>
      <Button size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add product
      </Button>
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirm({
  product,
  onConfirm,
  onCancel,
  isPending,
}: {
  product: ProductListItem;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-sm space-y-4"
        style={{
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        <div className="space-y-1">
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Delete product?
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{product.title}</strong> will be
            permanently deleted. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
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
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            loading={isPending}
            disabled={isPending}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ProductStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Archived', value: 'ARCHIVED' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductList() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  const { listProducts, deleteProduct, isPending } = useProducts(storeId);

  const stores = useAuthStore((s) => s.stores);
  const store = stores.find((s) => s.id === storeId);
  const currency = store?.currency ?? 'GBP';

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listProducts({
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setProducts(res.products);
      setTotal(res.total);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      setError('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      {deleteTarget && (
        <DeleteConfirm
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}

      <PageHeader
        title="Products"
        description={total > 0 ? `${total} product${total !== 1 ? 's' : ''}` : undefined}
        actions={
          <Button size="sm" onClick={() => router.push(`/dashboard/${storeId}/products/new`)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add product
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div
        className="flex gap-0.5 mb-5 p-1 rounded-lg w-fit"
        style={{ background: 'var(--bg-elevated)' }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
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

      {/* Error */}
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{
              borderColor: 'var(--accent)',
              borderTopColor: 'transparent',
            }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <EmptyState onAdd={() => router.push(`/dashboard/${storeId}/products/new`)} />
      )}

      {/* Table */}
      {!loading && products.length > 0 && (
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
                {['Product', 'Status', 'Price', 'Stock', ''].map((h) => (
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
              {products.map((product, i) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom:
                      i < products.length - 1 ? '1px solid var(--bg-border-subtle)' : 'none',
                  }}
                  className="group"
                >
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div
                        className="w-10 h-10 rounded-lg shrink-0 overflow-hidden"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        {product.image ? (
                          <img
                            src={product.image.url}
                            alt={product.image.alt ?? product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package
                              className="h-4 w-4"
                              style={{ color: 'var(--text-tertiary)' }}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {product.title}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {product.handle}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(product.price, currency)}
                      </p>
                      {product.compareAtPrice && (
                        <p
                          className="text-xs line-through"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {formatCurrency(product.compareAtPrice, currency)}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3">
                    {product.inventory?.trackQuantity ? (
                      <span
                        className="text-sm"
                        style={{
                          color:
                            product.inventory.onHand <= product.inventory.lowStockThreshold
                              ? 'var(--amber)'
                              : 'var(--text-secondary)',
                        }}
                      >
                        {product.inventory.onHand} in stock
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        —
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => router.push(`/dashboard/${storeId}/products/${product.id}`)}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-elevated)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--red-bg)';
                          e.currentTarget.style.color = 'var(--red)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
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
