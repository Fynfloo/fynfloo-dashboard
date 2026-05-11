'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FilePlus2 } from 'lucide-react';
import type { StorefrontPage } from '@/lib/types';
import { TextInput } from './SiteEditorUI';
import type {
  SiteEditorNavigatorPageNode,
  SiteEditorOutlineNode,
} from '../lib/siteEditor';

export function NavigatorPanel({
  navigatorPages,
  selectedPage,
  selectedOutlineNodeId,
  expandedPageIds,
  isCreating,
  onToggleExpand,
  onSelectPage,
  onSelectSection,
  onCreatePage,
}: {
  navigatorPages: SiteEditorNavigatorPageNode[];
  selectedPage: StorefrontPage | null;
  selectedOutlineNodeId: string | null;
  expandedPageIds: string[];
  isCreating: boolean;
  onToggleExpand: (pageId: string) => void;
  onSelectPage: (pageId: string) => void;
  onSelectSection: (
    pageNode: SiteEditorNavigatorPageNode,
    node: Extract<SiteEditorOutlineNode, { type: 'section' }>,
  ) => void;
  onCreatePage: (name: string, path: string) => Promise<unknown>;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPath, setCreatePath] = useState('');

  async function handleSubmit() {
    await onCreatePage(createName, createPath);
    setCreateName('');
    setCreatePath('');
    setIsFormOpen(false);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Choose a page and open the parts you want to edit.
      </p>

      <div className="rounded-[var(--radius-md)]" style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}>
        <button
          type="button"
          onClick={() => setIsFormOpen((c) => !c)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          style={{ color: 'var(--text-primary)' }}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <FilePlus2 className="h-4 w-4" />
            New content page
          </div>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {isFormOpen ? 'Hide' : 'Show'}
          </span>
        </button>

        {isFormOpen && (
          <div className="space-y-3 border-t px-4 py-4" style={{ borderColor: 'var(--bg-border-subtle)' }}>
            <TextInput
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Page name"
              disabled={isCreating}
            />
            <TextInput
              value={createPath}
              onChange={(e) => setCreatePath(e.target.value)}
              placeholder="/about-us"
              disabled={isCreating}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isCreating}
                className="rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                style={{ background: 'var(--accent)', color: 'white', opacity: isCreating ? 0.7 : 1 }}
              >
                {isCreating ? 'Creating…' : 'Create page'}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                style={{ border: '1px solid var(--bg-border-subtle)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className="overflow-hidden rounded-[var(--radius-md)]"
        style={{ border: '1px solid var(--bg-border-subtle)' }}
        role="tree"
        aria-label="Pages"
      >
        {navigatorPages.length === 0 ? (
          <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            No pages here yet.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--bg-border-subtle)' }}>
            {navigatorPages.map((node) => {
              const isSelectedPage = selectedPage?.id === node.pageId && !selectedOutlineNodeId;
              const isExpanded = expandedPageIds.includes(node.pageId);

              return (
                <div key={node.id} className="bg-[var(--bg-surface)]" role="treeitem" aria-expanded={isExpanded} aria-selected={isSelectedPage}>
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
                      onClick={() => onToggleExpand(node.pageId)}
                      className="px-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPage(node.pageId)}
                      className="flex-1 px-4 py-3 text-left transition-colors"
                      style={{ background: isSelectedPage ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{node.label}</div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{node.path}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {!node.isPublished && (
                            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'rgb(180, 83, 9)' }}>
                              draft only
                            </span>
                          )}
                          {node.hasUnpublishedChanges && node.isPublished && (
                            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' }}>
                              draft changes
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                  {isExpanded && (
                    <div role="group" className="space-y-1 px-4 pb-3 pt-1" style={{ borderTop: '1px solid var(--bg-border-subtle)' }}>
                      {node.sections.length === 0 ? (
                        <div className="py-2 pl-8 text-sm" style={{ color: 'var(--text-secondary)' }}>No sections on this page yet.</div>
                      ) : (
                        node.sections.map((section) => {
                          const isSelectedSection = selectedPage?.id === node.pageId && section.id === selectedOutlineNodeId;
                          return (
                            <button
                              key={`${node.pageId}:${section.id}`}
                              type="button"
                              role="treeitem"
                              aria-selected={isSelectedSection}
                              onClick={() => onSelectSection(node, section)}
                              className="flex w-full items-center justify-between rounded-[var(--radius-md)] py-2 pl-8 pr-3 text-left transition-colors"
                              style={{ background: isSelectedSection ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}
                            >
                              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{section.label}</div>
                              {section.meta && (
                                <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                                  {section.meta}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
