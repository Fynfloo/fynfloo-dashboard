// features/products/components/ProductList.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Package, Camera, MoreHorizontal, Pencil, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProducts } from '@/features/products/hooks/useProducts';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { ProductListItem, ProductStatus } from '@/lib/types';

// ─── Quick Create Modal ───────────────────────────────────────────────────────

function QuickCreateModal({
  open,
  onClose,
  storeId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string;
  onCreated: (productId: string) => void;
}) {
  // Own hook instance — isolated from list
  const { createProduct } = useProducts(storeId);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ProductStatus>('DRAFT');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setTitle('');
      setStatus('DRAFT');
      setError('');
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Product name is required');
      return;
    }
    setIsPending(true);
    setError('');
    try {
      const product = await createProduct({ title: trimmed, status });
      onCreated(product.id);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to create product — please try again');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new product"
      description="Start with the basics — you can add images, pricing and more after saving."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="quick-title">Product name *</Label>
          <Input
            id="quick-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Blue Oxford Shirt"
            error={!!error}
            autoFocus
          />
          {error ? (
            <p className="text-xs" style={{ color: 'var(--red)' }}>
              {error}
            </p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              This is what customers see on your storefront and in their orders
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <div className="space-y-2">
            {(
              [
                {
                  value: 'DRAFT' as ProductStatus,
                  label: 'Draft',
                  desc: 'Save privately — not visible to customers yet.',
                },
                {
                  value: 'ACTIVE' as ProductStatus,
                  label: 'Active',
                  desc: 'Publish immediately — visible on your storefront.',
                },
              ] as const
            ).map((opt) => {
              const selected = status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className="w-full flex items-start gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150"
                  style={{
                    background: selected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    border: selected
                      ? '1px solid rgba(88,81,234,0.3)'
                      : '1px solid var(--bg-border-subtle)',
                  }}
                >
                  <div
                    className="mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                    style={{
                      borderColor: selected ? 'var(--accent)' : 'var(--bg-border)',
                      background: selected ? 'var(--accent)' : 'transparent',
                    }}
                  >
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: selected ? 'var(--accent)' : 'var(--text-primary)' }}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isPending} disabled={isPending}>
            Create product
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({
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
    <Modal open onClose={onCancel} title="Delete product?">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{product.title}</strong> will be
          permanently deleted. This cannot be undone.
        </p>
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
    </Modal>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProductStatus }) {
  const map = {
    ACTIVE: { variant: 'success', label: 'Active' },
    DRAFT: { variant: 'default', label: 'Draft' },
    ARCHIVED: { variant: 'warning', label: 'Archived' },
  } as const;
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Image placeholder ────────────────────────────────────────────────────────

function ImagePlaceholder({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-10 h-10 rounded-lg shrink-0 flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
      style={{
        background: hovered ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        border: `1px solid ${hovered ? 'rgba(88,81,234,0.3)' : 'var(--bg-border-subtle)'}`,
      }}
      title="Add image"
    >
      <Camera
        className="h-3.5 w-3.5"
        style={{ color: hovered ? 'var(--accent)' : 'var(--text-tertiary)' }}
      />
      <span
        className="text-[9px] leading-none"
        style={{ color: hovered ? 'var(--accent)' : 'var(--text-tertiary)' }}
      >
        {hovered ? 'Add →' : 'No image'}
      </span>
    </button>
  );
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

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div
        className="grid px-4 py-3"
        style={{
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px',
          borderBottom: '1px solid var(--bg-border-subtle)',
        }}
      >
        {['PRODUCT', 'STATUS', 'PRICE', 'STOCK', 'UPDATED', ''].map((h) => (
          <div
            key={h}
            className="text-xs font-semibold"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}
          >
            {h}
          </div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid px-4 py-3 animate-pulse"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px',
            borderBottom: i < 4 ? '1px solid var(--bg-border-subtle)' : 'none',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Product cell */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg shrink-0"
              style={{ background: 'var(--bg-elevated)' }}
            />
            <div className="space-y-1.5 flex-1">
              <div
                className="h-3 rounded"
                style={{ background: 'var(--bg-elevated)', width: '60%' }}
              />
              <div
                className="h-2.5 rounded"
                style={{ background: 'var(--bg-elevated)', width: '40%' }}
              />
            </div>
          </div>
          {/* Other cells */}
          {[70, 60, 50, 80].map((w, j) => (
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

// ─── Status tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ProductStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Archived', value: 'ARCHIVED' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductList() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;

  const stores = useAuthStore((s) => s.stores);
  const currentStore = stores.find((s) => s.id === storeId);
  const currency = currentStore?.currency ?? 'GBP';
  // subdomain is typed as string on Store — guard against empty string
  const storeSubdomain = currentStore?.subdomain || null;

  const { listProducts, deleteProduct } = useProducts(storeId);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const LIMIT = 20;

  // listProducts is stable per storeId — safe in deps
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listProducts({
        page,
        limit: LIMIT,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setProducts(res.products);
      setTotal(res.total);
    } catch {
      setError('Failed to load products — please refresh the page');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, page, statusFilter]);
  // Note: listProducts intentionally omitted — it recreates with storeId
  // which IS in deps. Adding it would require useCallback in the hook.

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

  function handleProductCreated(productId: string) {
    setShowCreateModal(false);
    router.push(`/dashboard/${storeId}/products/${productId}`);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}

      <QuickCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        storeId={storeId}
        onCreated={handleProductCreated}
      />

      <PageHeader
        title="Products"
        description={total > 0 ? `${total} product${total !== 1 ? 's' : ''}` : undefined}
        actions={
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add product
          </Button>
        }
      />

      {/* Status tabs */}
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

      {/* Skeleton loading */}
      {loading && <TableSkeleton />}

      {/* Empty state */}
      {!loading && products.length === 0 && !error && (
        <EmptyState onAdd={() => setShowCreateModal(true)} />
      )}

      {/* Table */}
      {!loading && products.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}>
                {[
                  { label: 'Product', width: 'w-auto' },
                  { label: 'Status', width: 'w-24' },
                  { label: 'Price', width: 'w-28' },
                  { label: 'Stock', width: 'w-28' },
                  { label: 'Updated', width: 'w-28' },
                  { label: '', width: 'w-10' },
                ].map(({ label }) => (
                  <th
                    key={label}
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{
                      color: 'var(--text-tertiary)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
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
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onClick={() => router.push(`/dashboard/${storeId}/products/${product.id}`)}
                >
                  {/* Product — stop propagation only on the actions cell */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <div
                          className="w-10 h-10 rounded-lg shrink-0 overflow-hidden"
                          style={{ background: 'var(--bg-elevated)' }}
                        >
                          <img
                            src={product.image.url}
                            alt={product.image.alt ?? product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        // Stop propagation so clicking the placeholder navigates to edit
                        // but doesn't double-fire the row click
                        <span onClick={(e) => e.stopPropagation()}>
                          <ImagePlaceholder
                            onClick={() =>
                              router.push(`/dashboard/${storeId}/products/${product.id}`)
                            }
                          />
                        </span>
                      )}
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

                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(product.price, currency)}
                    </p>
                    {product.compareAtPrice ? (
                      <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
                        {formatCurrency(product.compareAtPrice, currency)}
                      </p>
                    ) : null}
                  </td>

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

                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatRelativeTime(product.updatedAt ?? product.createdAt)}
                    </span>
                  </td>

                  {/* Actions — stop propagation so row click doesn't fire */}
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
                          label: 'Edit product',
                          icon: <Pencil className="h-3.5 w-3.5" />,
                          onClick: () =>
                            router.push(`/dashboard/${storeId}/products/${product.id}`),
                        },
                        {
                          label: 'View on storefront',
                          icon: <Eye className="h-3.5 w-3.5" />,
                          // Disabled with clear reason if no subdomain
                          disabled: !storeSubdomain,
                          onClick: () => {
                            if (storeSubdomain) {
                              window.open(
                                `https://${storeSubdomain}.fynfloo.com/products/${product.handle}`,
                                '_blank',
                              );
                            }
                          },
                        },
                        {
                          label: 'Delete product',
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          onClick: () => setDeleteTarget(product),
                          destructive: true,
                          dividerAbove: true,
                        },
                      ]}
                    />
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
