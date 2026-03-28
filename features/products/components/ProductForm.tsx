// features/products/components/ProductForm.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Modal } from '@/components/ui/modal';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { ImageUpload } from './ImageUpload';
import { InventoryPanel } from './InventoryPanel';
import { SeoPanel } from './SeoPanel';
import { CollectionsPanel } from './CollectionsPanel';
import { useProduct, useProductImages, useInventory } from '../hooks/useProducts';
import {
  formatCurrency,
  formatRelativeTime,
  formatPriceInput,
  parsePriceInput,
  getCurrencySymbol,
} from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useProductStore } from '@/store/product.store';
import type { Product, ProductImage, ProductStatus } from '@/lib/types';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional(),
  sku: z.string().optional(),
  taxable: z.boolean().optional(),
  weight: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
});

type Fields = z.infer<typeof schema>;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
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

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
      {children}
    </p>
  );
}

// ─── Checklist ────────────────────────────────────────────────────────────────

type ChecklistItem = {
  label: string;
  done: boolean;
  section: string;
};

function CompletionChecklist({
  items,
  onScrollTo,
}: {
  items: ChecklistItem[];
  onScrollTo: (sectionId: string) => void;
}) {
  const allDone = items.every((i) => i.done);
  if (allDone) return null;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border-subtle)' }}
    >
      <h3
        className="text-sm font-semibold"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
      >
        Complete your product
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => !item.done && onScrollTo(item.section)}
            className="w-full flex items-center gap-2.5 text-left text-sm"
            style={{
              color: item.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
              cursor: item.done ? 'default' : 'pointer',
            }}
          >
            <div
              className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
              style={{
                background: item.done ? 'var(--green)' : 'var(--bg-elevated)',
                border: item.done ? 'none' : '1.5px solid var(--bg-border)',
              }}
            >
              {item.done && (
                <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className={item.done ? 'line-through' : 'hover:underline underline-offset-2'}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-5 animate-pulse">
      <div className="col-span-2 space-y-5">
        {[140, 200, 120, 160].map((h, i) => (
          <div
            key={i}
            className="rounded-xl"
            style={{ height: h, background: 'var(--bg-elevated)' }}
          />
        ))}
      </div>
      <div className="space-y-5">
        {[160, 180, 100].map((h, i) => (
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

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductForm({ mode }: { mode: 'edit' }) {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  const productId = params.id as string;

  const stores = useAuthStore((s) => s.stores);
  const store = stores.find((s) => s.id === storeId);
  const currency = store?.currency ?? 'GBP';
  const storeSlug = store?.subdomain;

  // Global dirty flag — read by Sidebar for nav intercept
  const setGlobalDirty = useProductStore((s) => s.setDirty);

  // Hooks — productId is always a real string in edit mode
  const { updateProduct, isPending: isUpdating } = useProduct(storeId, productId);
  const {
    uploadImage,
    deleteImage,
    reorderImages,
    isPending: isImagePending,
  } = useProductImages(storeId, productId);
  const { updateInventory } = useInventory(storeId, productId);

  // Form state
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [status, setStatus] = useState<ProductStatus>('DRAFT');
  const [inventory, setInventory] = useState({
    trackQuantity: false,
    onHand: 0,
    lowStockThreshold: 5,
    allowOversell: false,
  });
  const [seo, setSeo] = useState({ metaTitle: '', metaDescription: '', handle: '' });
  const [priceDisplay, setPriceDisplay] = useState('');
  const [compareDisplay, setCompareDisplay] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showNavWarning, setShowNavWarning] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState<string | null>(null);
  const [inCollections, setInCollections] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  // Track whether the initial load has completed so dirty tracking
  // doesn't fire during form.reset()
  const loadedRef = useRef(false);

  const form = useForm<Fields>({
    resolver: zodResolver(schema) as Resolver<Fields>,
    defaultValues: { title: '', description: '', sku: '', taxable: true, weight: '' },
  });

  // ─── Sync isDirty to global store ────────────────────────────────────────

  useEffect(() => {
    setGlobalDirty(isDirty);
    // Clean up on unmount so sidebar doesn't block navigation after leaving edit page
    return () => setGlobalDirty(false);
  }, [isDirty, setGlobalDirty]);

  // ─── Load product ─────────────────────────────────────────────────────────
  // Note: getProduct is stable per hook instance (no useCallback needed here)
  // because we call it inside the effect directly.

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/${storeId}/products/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${(await import('@/lib/api')).getAccessToken() ?? ''}`,
              Accept: 'application/json',
            },
            credentials: 'include',
          },
        );
        if (!res.ok) throw new Error('Failed to load product');
        const p: Product = await res.json();
        if (cancelled) return;

        setProduct(p);
        setImages(p.images);
        setStatus(p.status);
        setPriceDisplay(formatPriceInput(p.price));
        setCompareDisplay(formatPriceInput(p.compareAtPrice ?? 0));
        setLastSaved(p.updatedAt ?? null);

        if (p.inventory) {
          setInventory({
            trackQuantity: p.inventory.trackQuantity,
            onHand: p.inventory.onHand,
            lowStockThreshold: p.inventory.lowStockThreshold,
            allowOversell: p.inventory.allowOversell,
          });
        }

        // Safe metadata access — no unsafe cast
        setSeo({
          metaTitle:
            p.metadata && typeof p.metadata.metaTitle === 'string' ? p.metadata.metaTitle : '',
          metaDescription:
            p.metadata && typeof p.metadata.metaDescription === 'string'
              ? p.metadata.metaDescription
              : '',
          handle: p.handle,
        });

        // Reset form BEFORE enabling dirty tracking
        form.reset({
          title: p.title,
          description: p.description ?? '',
          sku: p.sku ?? '',
          taxable: p.taxable,
          weight: p.weight ?? '',
        });

        // Mark load complete — dirty tracking now enabled
        loadedRef.current = true;
      } catch {
        if (!cancelled) setError('Failed to load product — please refresh the page');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [storeId, productId]); // storeId + productId are the correct deps

  // ─── Dirty tracking — only after load completes ───────────────────────────

  useEffect(() => {
    const sub = form.watch(() => {
      if (loadedRef.current) setIsDirty(true);
    });
    return () => sub.unsubscribe();
  }, [form]);

  // ─── Browser unload warning ───────────────────────────────────────────────

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

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.style.outline = '2px solid var(--accent)';
    el.style.outlineOffset = '2px';
    setTimeout(() => {
      el.style.outline = 'none';
      el.style.outlineOffset = '0';
    }, 1500);
  }

  function markDirty() {
    if (loadedRef.current) setIsDirty(true);
  }

  function navigateAway(target: string) {
    if (isDirty) {
      setPendingNavTarget(target);
      setShowNavWarning(true);
    } else {
      router.push(target);
    }
  }

  // ─── Status change ────────────────────────────────────────────────────────
  // No confirmation modal — status is just a field.
  // The product is not published until Save is clicked.
  // The "Live" link appears after save when status === ACTIVE.

  function handleStatusChange(newStatus: ProductStatus) {
    if (newStatus === status) return;
    setStatus(newStatus);
    markDirty();
  }

  // ─── Image handlers ───────────────────────────────────────────────────────

  async function handleImageUpload(file: File) {
    const image = await uploadImage(file);
    setImages((prev) => [...prev, image]);
    addToast('Image uploaded');
  }

  async function handleImageDelete(imageId: string) {
    await deleteImage(imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    addToast('Image removed');
  }

  async function handleImageReorder(reordered: { id: string; position: number }[]) {
    // Optimistically reorder locally
    const sorted = [...reordered].sort((a, b) => a.position - b.position);
    const prevImages = images;
    const map = new Map(images.map((img) => [img.id, img]));
    setImages(sorted.map((r) => ({ ...map.get(r.id)!, position: r.position })));

    try {
      await reorderImages(reordered);
    } catch {
      // Revert to previous order on failure
      setImages(prevImages);
      addToast('Failed to reorder images', 'error');
    }
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  // product update and inventory update fire in parallel.
  // Both must succeed for the UI to show "saved".

  async function onSubmit(data: Fields) {
    setError('');
    try {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        price: parsePriceInput(priceDisplay),
        compareAtPrice: compareDisplay ? parsePriceInput(compareDisplay) : undefined,
        sku: data.sku || undefined,
        taxable: data.taxable ?? true,
        weight: data.weight ? Number(data.weight) : undefined,
        status,
        metaTitle: seo.metaTitle || undefined,
        metaDescription: seo.metaDescription || undefined,
        handle: seo.handle || undefined,
      };

      // Fire both in parallel — both must succeed
      const [updated] = await Promise.all([updateProduct(payload), updateInventory(inventory)]);

      // Only mark clean and show success after BOTH resolve
      setIsDirty(false);
      setLastSaved(updated.updatedAt ?? new Date().toISOString());
      setProduct(updated);
      addToast('Changes saved');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Something went wrong — please try again');
    }
  }

  const isPending = isUpdating;
  const taxable = form.watch('taxable') ?? true;

  // ─── Checklist ────────────────────────────────────────────────────────────

  const priceSet = parsePriceInput(priceDisplay) > 0;
  const checklistItems: ChecklistItem[] = [
    { label: 'Product name added', done: true, section: 'section-details' },
    { label: 'Set a price', done: priceSet, section: 'section-pricing' },
    { label: 'Add at least one image', done: images.length > 0, section: 'section-images' },
    { label: 'Choose a collection', done: inCollections, section: 'section-collections' },
    { label: 'Set to Active to publish', done: status === 'ACTIVE', section: 'section-status' },
  ];

  // Show checklist only when product exists and at least one item is incomplete
  const showChecklist = product !== null && checklistItems.some((item) => !item.done);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return <FormSkeleton />;

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Nav intercept modal */}
      <Modal
        open={showNavWarning}
        onClose={() => {
          setShowNavWarning(false);
          setPendingNavTarget(null);
        }}
        title="Leave without saving?"
        description={`You have unsaved changes to "${form.watch('title') || 'this product'}". If you leave now your changes will be lost.`}
      >
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              setShowNavWarning(false);
              setPendingNavTarget(null);
            }}
          >
            Stay and save
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => {
              setIsDirty(false);
              setGlobalDirty(false);
              setShowNavWarning(false);
              if (pendingNavTarget) router.push(pendingNavTarget);
            }}
          >
            Leave anyway
          </Button>
        </div>
      </Modal>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* ── Header ────────────────────────────────────────────────────────
            Unsaved state: subtitle turns amber, save button turns primary.
            No floating banner — one signal, one place.
        ──────────────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-0.5">
            <h1
              className="text-xl font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              {product?.title ?? 'Edit product'}
            </h1>
            <p
              className="text-sm transition-colors duration-200"
              style={{ color: isDirty ? 'var(--amber)' : 'var(--text-secondary)' }}
            >
              {isDirty
                ? 'Unsaved changes'
                : lastSaved
                  ? `Last saved ${formatRelativeTime(lastSaved)}`
                  : 'No changes'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigateAway(`/dashboard/${storeId}/products`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={isDirty ? 'primary' : 'secondary'}
              loading={isPending}
              disabled={isPending}
            >
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>

        {/* Error banner */}
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
          {/* ── Left column ──────────────────────────────────────────── */}
          <div className="col-span-2 space-y-5">
            {/* Product details */}
            <Section id="section-details" title="Product details">
              <div className="space-y-1.5">
                <Label htmlFor="title">Product name *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Blue Oxford Shirt"
                  error={!!form.formState.errors.title}
                  {...form.register('title')}
                />
                {form.formState.errors.title ? (
                  <p className="text-xs" style={{ color: 'var(--red)' }}>
                    {form.formState.errors.title.message}
                  </p>
                ) : (
                  <HelperText>
                    Shown on your storefront, in orders and receipts. Be specific — &ldquo;Blue
                    Oxford Shirt&rdquo; sells better than &ldquo;Shirt&rdquo;
                  </HelperText>
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
                <HelperText>
                  Help customers decide to buy. Include material, fit, care instructions and size
                  guide.
                </HelperText>
              </div>
            </Section>

            {/* Images */}
            <Section id="section-images" title="Images">
              <ImageUpload
                images={images}
                onUpload={handleImageUpload}
                onDelete={handleImageDelete}
                onReorder={handleImageReorder}
                disabled={isImagePending}
              />
            </Section>

            {/* Pricing */}
            <Section id="section-pricing" title="Pricing">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price *</Label>
                  <CurrencyInput
                    id="price"
                    value={priceDisplay}
                    onChange={(v) => {
                      setPriceDisplay(v);
                      markDirty();
                    }}
                    currency={currency}
                    helperText={`Enter in ${getCurrencySymbol(currency)} — e.g. ${getCurrencySymbol(currency)}49.99`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="compareAtPrice">Compare at price</Label>
                  <CurrencyInput
                    id="compareAtPrice"
                    value={compareDisplay}
                    onChange={(v) => {
                      setCompareDisplay(v);
                      markDirty();
                    }}
                    currency={currency}
                    helperText="Original price before discount — shows crossed-out. Leave blank if not on sale."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Charge tax on this product</Label>
                  <HelperText>
                    Most physical products are taxable. Check with your accountant if unsure.
                  </HelperText>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={taxable}
                  onClick={() => {
                    form.setValue('taxable', !taxable);
                    markDirty();
                  }}
                  className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4"
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
            <Section id="section-inventory" title="Inventory">
              <div className="space-y-1.5 mb-4">
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input id="sku" placeholder="e.g. SHIRT-BLU-M" {...form.register('sku')} />
                <HelperText>
                  Your internal product code. Customers never see this. Leave blank if you
                  don&apos;t use product codes.
                </HelperText>
              </div>
              <InventoryPanel
                value={inventory}
                onChange={(v) => {
                  setInventory(v);
                  markDirty();
                }}
                disabled={isPending}
              />
            </Section>

            {/* Shipping */}
            <Section id="section-shipping" title="Shipping">
              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight (grams)</Label>
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...form.register('weight')}
                />
                <HelperText>
                  Product weight including packaging. Used for real-time carrier rate calculations.
                  Leave blank if you use flat rate shipping.
                </HelperText>
              </div>
            </Section>

            {/* SEO */}
            <Section id="section-seo" title="Search engine optimisation">
              <SeoPanel
                value={seo}
                onChange={(v) => {
                  setSeo(v);
                  markDirty();
                }}
                disabled={isPending}
              />
            </Section>
          </div>

          {/* ── Right column ─────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Status
                No confirmation modal. Status is a field.
                Save with status=ACTIVE publishes the product.
                The live link appears after the product is saved as Active.
            */}
            <Section id="section-status" title="Status">
              <div className="space-y-1.5">
                {(
                  [
                    {
                      value: 'DRAFT' as ProductStatus,
                      label: 'Draft',
                      desc: 'Not visible to customers. Publish when ready.',
                    },
                    {
                      value: 'ACTIVE' as ProductStatus,
                      label: 'Active',
                      desc: 'Live on your storefront. Customers can find and buy this product.',
                    },
                    {
                      value: 'ARCHIVED' as ProductStatus,
                      label: 'Archived',
                      desc: 'Hidden from your storefront. Use for discontinued products.',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusChange(opt.value)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                    style={{
                      background: status === opt.value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border:
                        status === opt.value
                          ? '1px solid rgba(88,81,234,0.3)'
                          : '1px solid transparent',
                    }}
                  >
                    <div
                      className="mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: status === opt.value ? 'var(--accent)' : 'var(--bg-border)',
                        background: status === opt.value ? 'var(--accent)' : 'transparent',
                      }}
                    >
                      {status === opt.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: status === opt.value ? 'var(--accent)' : 'var(--text-primary)',
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

              {/* Live link — only shown after save, when product IS actually live */}
              {status === 'ACTIVE' && !isDirty && storeSlug && seo.handle && (
                <a
                  href={`https://${storeSlug}.fynfloo.com/products/${seo.handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs mt-3 transition-opacity hover:opacity-75"
                  style={{ color: 'var(--green)' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--green)' }}
                  />
                  Live · View on storefront
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {/* Pending save message when Active but dirty */}
              {status === 'ACTIVE' && isDirty && (
                <p className="text-xs mt-3" style={{ color: 'var(--amber)' }}>
                  Save to publish these changes to your storefront
                </p>
              )}

              {status === 'DRAFT' && (
                <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
                  Not published — set to Active and save to publish
                </p>
              )}
            </Section>

            {/* Checklist — right below Status, order matches checklist items */}
            {showChecklist && (
              <CompletionChecklist items={checklistItems} onScrollTo={scrollToSection} />
            )}

            {/* Collections */}
            <Section id="section-collections" title="Collections">
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Choose where this product appears on your storefront pages
              </p>
              <CollectionsPanel
                storeId={storeId}
                productId={productId}
                disabled={isPending}
                onCollectionChange={setInCollections}
              />
            </Section>

            {/* Summary */}
            {product && (
              <Section title="Summary">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Price</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(parsePriceInput(priceDisplay), currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Images</span>
                    <span
                      className="font-medium"
                      style={{
                        color: images.length === 0 ? 'var(--amber)' : 'var(--text-primary)',
                      }}
                    >
                      {images.length === 0 ? 'None — add images' : images.length}
                    </span>
                  </div>
                  {inventory.trackQuantity && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Stock</span>
                      <span
                        className="font-medium"
                        style={{
                          color:
                            inventory.onHand <= inventory.lowStockThreshold
                              ? 'var(--amber)'
                              : 'var(--text-primary)',
                        }}
                      >
                        {inventory.onHand} units
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Handle</span>
                    <span
                      className="font-mono text-xs truncate max-w-[120px]"
                      style={{ color: 'var(--text-tertiary)' }}
                      title={seo.handle}
                    >
                      {seo.handle}
                    </span>
                  </div>
                </div>
              </Section>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
