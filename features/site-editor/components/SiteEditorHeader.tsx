'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import { UserMenu } from '@/components/layout/UserMenu';
import type { SiteEditorOutlineNode, SiteEditorPanelKey } from '../lib/siteEditor';

const PANEL_LABELS: Record<SiteEditorPanelKey, string> = {
  navigator: 'Pages',
  siteWide: 'Shared',
  blocks: 'Blocks',
  theme: 'Theme',
};

export function SiteEditorHeader({
  storeName,
  selectedOutlineNode,
  selectedPage,
  activePanel,
  inspectorSaveBadge,
  previewUrl,
  onBack,
  onOpenPage,
}: {
  storeName: string | undefined;
  selectedOutlineNode: SiteEditorOutlineNode | null;
  selectedPage: { name?: string | null; path?: string } | null;
  activePanel: SiteEditorPanelKey;
  inspectorSaveBadge: { label: string; style: React.CSSProperties } | null;
  previewUrl: string | null;
  onBack: () => void;
  onOpenPage: () => void;
}) {
  const pageTitle =
    selectedOutlineNode?.type === 'shared'
      ? selectedOutlineNode.label
      : selectedPage?.name?.trim() || selectedPage?.path || 'Select a page';

  return (
    <header
      className="flex h-14 items-center gap-4 px-4"
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-border-subtle)' }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {storeName ?? 'Site'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Site editor
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 text-center">
        <div className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {pageTitle}
        </div>
        <div className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {PANEL_LABELS[activePanel]}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {inspectorSaveBadge && (
          <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={inspectorSaveBadge.style}>
            {inspectorSaveBadge.label}
          </span>
        )}
        {previewUrl && (
          <button
            type="button"
            onClick={onOpenPage}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
            style={{ border: '1px solid var(--bg-border-subtle)', color: 'var(--text-primary)' }}
          >
            <ExternalLink className="h-4 w-4" />
            Open page
          </button>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
