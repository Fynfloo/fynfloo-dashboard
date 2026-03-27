// features/products/components/ProductList.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Package, Camera, MoreHorizontal, Pencil, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useProducts } from '@/features/products/hooks/useProducts';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { ProductListItem, ProductStatus } from '@/lib/types';
import { useAuthStore } from '@/store/auth.store';

// ─── Quick Create Modal ────────────────────────────────────────────────────────

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const { createProduct } = useProducts(storeId);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ProductStatus>('DRAFT');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Product name is required');
      return;
    }
    setIsPending(true);
    setError('');
    try {
      const product = await createProduct({ title: title.trim(), status });
      setTitle('');
      setStatus('DRAFT');
      onCreated(product.id);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to create product — please try again');
    } finally {
      setIsPending(false);
    }
  }

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTitle('');
      setStatus('DRAFT');
      setError('');
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new product"
      description="Start with the basics — you can add images, pricing and more after saving."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
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

        {/* Visibility */}
        <div className="space-y-2">
          <Label>Visibility</Label>
          <div className="space-y-2">
            {(
              [
                {
                  value: 'DRAFT' as ProductStatus,
                  label: 'Draft',
                  desc: 'Save privately — not visible to customers yet. Publish when you are ready.',
                },
                {
                  value: 'ACTIVE' as ProductStatus,
                  label: 'Active',
                  desc: 'Publish immediately — visible on your storefront as soon as you save.',
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
                  {/* Radio dot */}
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

        {/* Buttons */}
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
            {isPending ? 'Creating…' : 'Create product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProductStatus }) {
  const variants = {
    ACTIVE: 'success',
    DRAFT: 'default',
    ARCHIVED: 'warning',
  } as const;
  const labels = { ACTIVE: 'Active', DRAFT: 'Draft', ARCHIVED: 'Archived' };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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
        cursor: 'pointer',
      }}
      title="Add image"
    >
      <Camera
        className="h-3.5 w-3.5"
        style={{ color: hovered ? 'var(--accent)' : 'var(--text-tertiary)' }}
      />
      {!hovered && (
        <span className="text-[9px] leading-none" style={{ color: 'var(--text-tertiary)' }}>
          No image
        </span>
      )}
      {hovered && (
        <span className="text-[9px] leading-none font-medium" style={{ color: 'var(--accent)' }}>
          Add →
        </span>
      )}
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
  const { listProducts, deleteProduct } = useProducts(storeId);

  const stores = useAuthStore((s) => s.stores);
  const currency = stores.find((s) => s.id === storeId)?.currency ?? 'GBP';

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  function handleProductCreated(productId: string) {
    setShowCreateModal(false);
    router.push(`/dashboard/${storeId}/products/${productId}`);
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
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && <EmptyState onAdd={() => setShowCreateModal(true)} />}

      {/* Table */}
      {!loading && products.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}>
                {['Product', 'Status', 'Price', 'Stock', 'Updated', ''].map((h) => (
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
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  className="group"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onClick={() => router.push(`/dashboard/${storeId}/products/${product.id}`)}
                >
                  {/* Product */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      {/* Thumbnail / placeholder */}
                      {product.image ? (
                        <div
                          className="w-10 h-10 rounded-lg shrink-0 overflow-hidden"
                          style={{ background: 'var(--bg-elevated)' }}
                          onClick={() =>
                            router.push(`/dashboard/${storeId}/products/${product.id}`)
                          }
                        >
                          <img
                            src={product.image.url}
                            alt={product.image.alt ?? product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <ImagePlaceholder
                          onClick={() =>
                            router.push(`/dashboard/${storeId}/products/${product.id}`)
                          }
                        />
                      )}
                      <div
                        onClick={() => router.push(`/dashboard/${storeId}/products/${product.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
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
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(product.price, currency)}
                    </p>
                    {product.compareAtPrice && (
                      <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
                        {formatCurrency(product.compareAtPrice, currency)}
                      </p>
                    )}
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

                  {/* Last edited */}
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatRelativeTime(product.updatedAt ?? product.createdAt)}
                    </span>
                  </td>

                  {/* Three dots menu */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu
                      align="right"
                      trigger={
                        <button
                          className="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-border-subtle)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                          onClick={(e) => e.stopPropagation()}
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
                          onClick: () => {
                            const slug = stores.find((s) => s.id === storeId)?.subdomain;
                            if (slug) {
                              window.open(
                                `https://${slug}.fynfloo.com/products/${product.handle}`,
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
