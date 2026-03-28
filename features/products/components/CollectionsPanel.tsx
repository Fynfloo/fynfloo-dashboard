// features/products/components/CollectionsPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import { useCollections, useProductCollections } from '@/features/products/hooks/useCollections';
import type { Collection } from '@/features/products/hooks/useCollections';
import { Button } from '@/components/ui/button';

function getCollectionDescription(collection: Collection): string {
  if (collection.description) return collection.description;
  const name = collection.name.toLowerCase();
  if (name.includes('featured') || name.includes('feature'))
    return 'Appears in the featured products section on your store homepage';
  if (name.includes('new') || name.includes('arrival'))
    return 'Appears in your new arrivals section';
  if (name.includes('best') || name.includes('popular') || name.includes('top'))
    return 'Appears in your top sellers section';
  if (name.includes('sale') || name.includes('discount')) return 'Appears in your sale section';
  return `Products in this collection are grouped under "${collection.name}"`;
}

function isFeatured(collection: Collection): boolean {
  return (
    collection.name.toLowerCase().includes('featured') ||
    collection.name.toLowerCase().includes('feature')
  );
}

type Props = {
  storeId: string;
  productId: string;
  disabled?: boolean;
  onCollectionChange?: (hasCollections: boolean) => void;
};

export function CollectionsPanel({ storeId, productId, disabled, onCollectionChange }: Props) {
  const { listCollections } = useCollections(storeId);
  const { listProductCollections, addToCollection, removeFromCollection, isTogglePending } =
    useProductCollections(storeId, productId);

  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissedWarning, setDismissedWarning] = useState(false);

  // Ref to avoid calling onCollectionChange inside a state updater (React Strict Mode safe)
  const onCollectionChangeRef = useRef(onCollectionChange);
  onCollectionChangeRef.current = onCollectionChange;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [all, current] = await Promise.all([listCollections(), listProductCollections()]);
        if (cancelled) return;
        setAllCollections(all);
        const ids = new Set(current.map((c) => c.id));
        setMemberIds(ids);
        // Safe to call here — outside state updater, after data has settled
        onCollectionChangeRef.current?.(ids.size > 0);
      } catch {
        if (!cancelled) setError('Failed to load collections');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, storeId]);

  async function handleToggle(collectionId: string) {
    // Block if this specific collection is already toggling
    if (disabled || isTogglePending(collectionId)) return;

    const isMember = memberIds.has(collectionId);

    // Compute next state first — then update state and notify parent separately
    const nextIds = new Set(memberIds);
    if (isMember) {
      nextIds.delete(collectionId);
    } else {
      nextIds.add(collectionId);
    }

    // Optimistic update
    setMemberIds(nextIds);
    // Notify parent outside of state updater — safe here
    onCollectionChangeRef.current?.(nextIds.size > 0);

    try {
      if (isMember) {
        await removeFromCollection(collectionId);
      } else {
        await addToCollection(collectionId);
      }
    } catch {
      // Revert on failure
      setMemberIds(memberIds);
      onCollectionChangeRef.current?.(memberIds.size > 0);
      setError('Failed to update collection — please try again');
    }
  }

  async function handleAddToFeatured() {
    const featured = allCollections.find((c) => isFeatured(c));
    if (!featured) return;
    await handleToggle(featured.id);
    setDismissedWarning(true);
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg animate-pulse"
            style={{ background: 'var(--bg-elevated)' }}
          />
        ))}
      </div>
    );
  }

  if (allCollections.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        No collections available for this store.
      </p>
    );
  }

  const noCollectionSelected = memberIds.size === 0;
  const hasFeaturedCollection = allCollections.some((c) => isFeatured(c));
  const showWarning = noCollectionSelected && !dismissedWarning;

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      {/* Collection checkboxes */}
      <div className="space-y-2">
        {allCollections.map((collection) => {
          const checked = memberIds.has(collection.id);
          const pending = isTogglePending(collection.id);
          const desc = getCollectionDescription(collection);

          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => handleToggle(collection.id)}
              disabled={disabled || pending}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
              style={{
                background: checked ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                border: checked ? '1px solid rgba(88,81,234,0.3)' : '1px solid transparent',
                opacity: disabled || pending ? 0.6 : 1,
                cursor: disabled || pending ? 'not-allowed' : 'pointer',
              }}
            >
              {/* Checkbox or spinner */}
              <div
                className="mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-150"
                style={{
                  background: checked ? 'var(--accent)' : 'var(--bg-surface)',
                  border: checked ? '1px solid var(--accent)' : '1px solid var(--bg-border)',
                }}
              >
                {pending ? (
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-t-transparent animate-spin"
                    style={{
                      borderColor: checked ? 'white' : 'var(--accent)',
                      borderTopColor: 'transparent',
                    }}
                  />
                ) : checked ? (
                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: checked ? 'var(--accent)' : 'var(--text-primary)' }}
                >
                  {collection.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* No collection warning */}
      {showWarning && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)' }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--amber)' }}>
                No collection selected
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Your product will only appear on the /products page, not on your homepage.
              </p>
            </div>
          </div>
          {hasFeaturedCollection && (
            <div className="flex gap-2 pl-6">
              <Button
                type="button"
                size="sm"
                onClick={handleAddToFeatured}
                className="text-xs h-7 px-2.5"
              >
                Add to Featured
              </Button>
              <button
                type="button"
                onClick={() => setDismissedWarning(true)}
                className="text-xs px-2.5 h-7 rounded-md transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Homepage tip */}
      <div className="flex items-start gap-2 pt-1">
        <Lightbulb
          className="h-3.5 w-3.5 shrink-0 mt-0.5"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Tick &ldquo;Featured&rdquo; to show this product on your homepage. Changes save
          automatically.
        </p>
      </div>
    </div>
  );
}
