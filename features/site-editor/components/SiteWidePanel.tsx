'use client';

import { EmptyStateCard } from './SiteEditorUI';
import type { SiteEditorNavigatorSharedNode } from '../lib/siteEditor';

export function SiteWidePanel({
  nodes,
  selectedNodeId,
  onSelectNode,
}: {
  nodes: SiteEditorNavigatorSharedNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: SiteEditorNavigatorSharedNode) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Edit the areas that can appear across your site.
      </p>
      <div className="space-y-3">
        {nodes.length === 0 ? (
          <EmptyStateCard body="There are no shared areas ready to edit yet." />
        ) : (
          nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectNode(node)}
                className="w-full rounded-[var(--radius-lg)] p-4 text-left transition-colors"
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid rgba(59, 130, 246, 0.28)' : '1px solid var(--bg-border-subtle)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {node.label}
                  </div>
                  {node.meta && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    >
                      {node.meta}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
