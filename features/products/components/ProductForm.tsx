// features/products/components/ProductForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { ImageUpload } from './ImageUpload';
import { InventoryPanel } from './InventoryPanel';
import { SeoPanel } from './SeoPanel';
import {
  useProduct,
  useProducts,
  useProductImages,
  useInventory,
} from '@/features/products/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { Product, ProductImage, ProductStatus } from '@/lib/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  compareAtPrice: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  sku: z.string().optional(),
  taxable: z.boolean().optional(),
  weight: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
});

type Fields = z.infer<typeof schema>;

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border-subtle)',
      }}
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

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductForm({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  const productId = params.id as string | undefined;

  // Store currency for formatting
  const stores = useAuthStore((s) => s.stores);
  const currency = stores.find((s) => s.id === storeId)?.currency ?? 'GBP';

  const { createProduct, isPending: isCreating } = useProducts(storeId);
  const { getProduct, updateProduct, isPending: isUpdating } = useProduct(storeId, productId ?? '');
  const {
    uploadImage,
    deleteImage,
    reorderImages,
    isPending: isImagePending,
  } = useProductImages(storeId, productId ?? '');
  const { updateInventory } = useInventory(storeId, productId ?? '');

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [status, setStatus] = useState<ProductStatus>('DRAFT');
  const [inventory, setInventory] = useState({
    trackQuantity: false,
    onHand: 0,
    lowStockThreshold: 5,
    allowOversell: false,
  });
  const [seo, setSeo] = useState({
    metaTitle: '',
    metaDescription: '',
    handle: '',
  });
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const form = useForm<Fields>({
    resolver: zodResolver(schema) as Resolver<Fields>,
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      compareAtPrice: '',
      sku: '',
      taxable: true,
      weight: '',
    },
  });

  // ─── Load product for edit ───────────────────────────────────────────────

  useEffect(() => {
    if (mode !== 'edit' || !productId) return;

    async function load() {
      try {
        const p = await getProduct();
        setProduct(p);
        setImages(p.images);
        setStatus(p.status);
        form.reset({
          title: p.title,
          description: p.description ?? '',
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? '',
          sku: p.sku ?? '',
          taxable: p.taxable,
          weight: p.weight ?? '',
        });
        if (p.inventory) {
          setInventory({
            trackQuantity: p.inventory.trackQuantity,
            onHand: p.inventory.onHand,
            lowStockThreshold: p.inventory.lowStockThreshold,
            allowOversell: p.inventory.allowOversell,
          });
        }
        setSeo({
          metaTitle: (p.metadata?.metaTitle as string) ?? '',
          metaDescription: (p.metadata?.metaDescription as string) ?? '',
          handle: p.handle,
        });
      } catch {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [mode, productId]);

  // ─── Auto-generate handle from title ────────────────────────────────────

  const watchedTitle = form.watch('title');
  useEffect(() => {
    if (mode !== 'create' || !watchedTitle) return;
    const handle = watchedTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSeo((prev) => ({ ...prev, handle }));
  }, [watchedTitle, mode]);

  // ─── Unsaved changes warning ─────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    const sub = form.watch(() => setIsDirty(true));
    return () => sub.unsubscribe();
  }, [form]);

  // ─── Image handlers ──────────────────────────────────────────────────────

  async function handleImageUpload(file: File) {
    const image = await uploadImage(file);
    setImages((prev) => [...prev, image]);
  }

  async function handleImageDelete(imageId: string) {
    await deleteImage(imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  async function handleImageReorder(reordered: { id: string; position: number }[]) {
    await reorderImages(reordered);
    setImages((prev) => {
      const map = new Map(prev.map((img) => [img.id, img]));
      return reordered
        .sort((a, b) => a.position - b.position)
        .map((r) => ({ ...map.get(r.id)!, position: r.position }));
    });
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  async function onSubmit(data: Fields) {
    setError('');
    try {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        price: data.price,
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
        sku: data.sku || undefined,
        taxable: data.taxable ?? true,
        weight: data.weight ? Number(data.weight) : undefined,
        status,
        metaTitle: seo.metaTitle || undefined,
        metaDescription: seo.metaDescription || undefined,
        handle: seo.handle || undefined,
      };

      if (mode === 'create') {
        const created = await createProduct(payload);
        setIsDirty(false);
        // Redirect to edit so merchant can add images + update inventory
        router.push(`/dashboard/${storeId}/products/${created.id}`);
      } else if (productId) {
        await updateProduct(payload);
        await updateInventory(inventory);
        setIsDirty(false);
        router.push(`/dashboard/${storeId}/products`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Something went wrong — please try again');
    }
  }

  const isPending = isCreating || isUpdating;
  const taxable = form.watch('taxable') ?? true;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <PageHeader
        title={mode === 'create' ? 'Add product' : (product?.title ?? 'Edit product')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/dashboard/${storeId}/products`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
              {isPending
                ? mode === 'create'
                  ? 'Creating…'
                  : 'Saving…'
                : mode === 'create'
                  ? 'Create product'
                  : 'Save changes'}
            </Button>
          </div>
        }
      />

      {error && (
        <div
          className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm mb-5"
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

      <div className="grid grid-cols-3 gap-5">
        {/* ── Left column ───────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-5">
          {/* Product details */}
          <Section title="Product details">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Blue Running Shoes"
                error={!!form.formState.errors.title}
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs" style={{ color: 'var(--red)' }}>
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              {(() => {
                const { onBlur: descOnBlur, ...descRest } = form.register('description');
                return (
                  <textarea
                    id="description"
                    rows={5}
                    placeholder="Describe your product…"
                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm resize-y outline-none"
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--bg-border)',
                      minHeight: '120px',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-dim)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--bg-border)';
                      e.currentTarget.style.boxShadow = 'none';
                      descOnBlur(e);
                    }}
                    {...descRest}
                  />
                );
              })()}
            </div>
          </Section>

          {/* Images */}
          <Section title="Images">
            <ImageUpload
              images={images}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              onReorder={handleImageReorder}
              disabled={mode === 'create' || isImagePending}
            />
            {mode === 'create' && (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Save the product first, then add images
              </p>
            )}
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  error={!!form.formState.errors.price}
                  {...form.register('price')}
                />
                {form.formState.errors.price && (
                  <p className="text-xs" style={{ color: 'var(--red)' }}>
                    {form.formState.errors.price.message}
                  </p>
                )}
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  In minor units — pence (GBP), kobo (NGN) etc.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compareAtPrice">Compare at price</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  {...form.register('compareAtPrice')}
                />
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Shows as original price — optional
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label>Charge tax on this product</Label>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={taxable}
                onClick={() => form.setValue('taxable', !taxable)}
                className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
                style={{ background: taxable ? 'var(--accent)' : 'var(--bg-border)' }}
              >
                <span
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: taxable ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          </Section>

          {/* Inventory */}
          <Section title="Inventory">
            <div className="space-y-1.5 mb-4">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="e.g. BRS-001-BLUE" {...form.register('sku')} />
            </div>
            <InventoryPanel value={inventory} onChange={setInventory} disabled={isPending} />
          </Section>

          {/* Shipping */}
          <Section title="Shipping">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight (grams)</Label>
              <Input
                id="weight"
                type="number"
                min={0}
                placeholder="0"
                {...form.register('weight')}
              />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Used for calculated shipping rates
              </p>
            </div>
          </Section>

          {/* SEO */}
          <Section title="Search engine optimisation">
            <SeoPanel value={seo} onChange={setSeo} disabled={isPending} />
          </Section>
        </div>

        {/* ── Right column ──────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Status */}
          <Section title="Status">
            <div className="space-y-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
                  style={{
                    background: status === opt.value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    border:
                      status === opt.value
                        ? '1px solid rgba(88,81,234,0.3)'
                        : '1px solid transparent',
                    color: status === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: status === opt.value ? 500 : 400,
                  }}
                >
                  {opt.label}
                  {status === opt.value && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {status === 'ACTIVE'
                ? 'Visible on your storefront'
                : status === 'DRAFT'
                  ? 'Not published — only visible to you'
                  : 'Hidden from storefront and search'}
            </p>
          </Section>

          {/* Summary — edit mode only */}
          {mode === 'edit' && product && (
            <Section title="Summary">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Price</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(product.price, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Images</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {images.length}
                  </span>
                </div>
                {product.inventory?.trackQuantity && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Stock</span>
                    <span
                      className="font-medium"
                      style={{
                        color:
                          product.inventory.onHand <= product.inventory.lowStockThreshold
                            ? 'var(--amber)'
                            : 'var(--text-primary)',
                      }}
                    >
                      {product.inventory.onHand} units
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Handle</span>
                  <span
                    className="font-mono text-xs truncate max-w-[120px]"
                    style={{ color: 'var(--text-tertiary)' }}
                    title={product.handle}
                  >
                    {product.handle}
                  </span>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </form>
  );
}
