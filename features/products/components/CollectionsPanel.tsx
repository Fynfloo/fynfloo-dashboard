// features/products/components/CollectionsPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { useCollections, useProductCollections } from '@/features/products/hooks/useCollections';
import type { Collection } from '@/features/products/hooks/useCollections';

type Props = {
  storeId: string;
  productId: string;
  disabled?: boolean;
};

export function CollectionsPanel({ storeId, productId, disabled }: Props) {
  const { listCollections } = useCollections(storeId);
  const { listProductCollections, addToCollection, removeFromCollection, isPending } =
    useProductCollections(storeId, productId);

  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [all, current] = await Promise.all([listCollections(), listProductCollections()]);
        setAllCollections(all);
        setMemberIds(new Set(current.map((c) => c.id)));
      } catch {
        setError('Failed to load collections');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId, storeId]);

  async function handleToggle(collectionId: string) {
    if (disabled || isPending) return;
    const isMember = memberIds.has(collectionId);

    // Optimistic update
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (isMember) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });

    try {
      if (isMember) {
        await removeFromCollection(collectionId);
      } else {
        await addToCollection(collectionId);
      }
    } catch {
      // Revert optimistic update on failure
      setMemberIds((prev) => {
        const next = new Set(prev);
        if (isMember) {
          next.add(collectionId);
        } else {
          next.delete(collectionId);
        }
        return next;
      });
      setError('Failed to update collection — please try again');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div
          className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Loading collections…
        </span>
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

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      {allCollections.map((collection) => {
        const checked = memberIds.has(collection.id);
        return (
          <button
            key={collection.id}
            type="button"
            onClick={() => handleToggle(collection.id)}
            disabled={disabled || isPending}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
            style={{
              background: checked ? 'var(--accent-dim)' : 'var(--bg-elevated)',
              border: checked ? '1px solid rgba(88,81,234,0.3)' : '1px solid transparent',
              opacity: disabled || isPending ? 0.6 : 1,
              cursor: disabled || isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {/* Checkbox */}
            <div
              className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-150"
              style={{
                background: checked ? 'var(--accent)' : 'var(--bg-surface)',
                border: checked ? '1px solid var(--accent)' : '1px solid var(--bg-border)',
              }}
            >
              {checked && (
                <svg
                  className="w-2.5 h-2.5"
                  viewBox="0 0 10 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
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

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{
                  color: checked ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                {collection.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {collection._count.products} product{collection._count.products !== 1 ? 's' : ''}
              </p>
            </div>
          </button>
        );
      })}

      <p className="text-xs pt-1" style={{ color: 'var(--text-tertiary)' }}>
        Changes save immediately — no need to click Save changes
      </p>
    </div>
  );
}
