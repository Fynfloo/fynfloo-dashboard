'use client';

import type { StorefrontSection } from '@/lib/types';
import { getHeroVariant, HERO_VARIANT_OPTIONS, type HeroVariantKey } from '../lib/sectionEditing';
import { EmptyStateCard } from './SiteEditorUI';
import type { SiteEditorOutlineNode } from '../lib/siteEditor';

export function BlocksPanel({
  selectedSharedRegionKey,
  selectedOutlineNode,
  selectedSection,
  isSaving,
  onHeroVariantSelect,
}: {
  selectedSharedRegionKey: string | null;
  selectedOutlineNode: SiteEditorOutlineNode | null;
  selectedSection: StorefrontSection | null;
  isSaving: boolean;
  onHeroVariantSelect: (variant: HeroVariantKey) => void;
}) {
  if (selectedSharedRegionKey) {
    return <EmptyStateCard body="Layout choices for this area will appear here as more shared layouts are added." />;
  }

  if (!selectedOutlineNode || !selectedSection) {
    return <EmptyStateCard body="Choose a section in Pages to change its layout." />;
  }

  if (selectedSection.type !== 'hero.basic') {
    return <EmptyStateCard body="Alternate layouts for this section will appear here as they are added." />;
  }

  const currentVariant = getHeroVariant(selectedSection);

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Choose the hero layout that best fits this page.
      </p>
      <div className="space-y-3">
        {HERO_VARIANT_OPTIONS.map((option) => {
          const selected = currentVariant === option.key;
          return (
            <div
              key={option.key}
              className="rounded-[var(--radius-lg)] p-4"
              style={{
                border: selected ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid var(--bg-border-subtle)',
                background: selected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {option.label}
                  </div>
                  {selected && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}
                    >
                      current
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {option.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onHeroVariantSelect(option.key)}
                disabled={isSaving || selected}
                className="mt-4 inline-flex items-center rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
                style={{
                  background: selected ? 'var(--bg-elevated)' : 'var(--accent)',
                  color: selected ? 'var(--text-secondary)' : 'white',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {selected ? 'Current layout' : `Use ${option.label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
