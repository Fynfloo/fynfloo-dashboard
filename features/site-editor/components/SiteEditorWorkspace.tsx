'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  FilePlus2,
  Files,
  FolderTree,
  LayoutTemplate,
  ListTree,
  Palette,
} from 'lucide-react';
import { UserMenu } from '@/components/layout/UserMenu';
import { useCurrentStore } from '@/hooks/useStore';
import { StorefrontPageInspector } from '@/features/settings/components/StorefrontPageInspector';
import { buildStorefrontPreviewUrl, getDefaultStorefrontEditorSelection, resolveStorefrontPreviewState } from '@/features/settings/lib/storefrontEditor';
import { useStorefrontPages } from '@/features/settings/hooks/useStorefrontPages';
import { useStorefrontRegions } from '@/features/settings/hooks/useStorefrontRegions';
import {
  buildSiteEditorOutlineGroups,
  buildSiteEditorPageGroups,
  type SiteEditorOutlineNode,
  type SiteEditorPanelKey,
} from '../lib/siteEditor';

const CONFIGURED_PREVIEW_ORIGIN = process.env.NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN;

function subscribeToLocationOrigin(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getLocationOriginSnapshot(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location.origin;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
      }}
    />
  );
}

const PANELS: Array<{
  key: SiteEditorPanelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'pages', label: 'Pages', icon: Files },
  { key: 'outline', label: 'Outline', icon: ListTree },
  { key: 'blocks', label: 'Blocks', icon: LayoutTemplate },
  { key: 'theme', label: 'Theme', icon: Palette },
];

function PanelButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-md)] px-2 py-3 text-[11px] font-medium transition-colors"
      style={{
        background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function EmptyStateCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] p-5"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {body}
      </p>
    </div>
  );
}

export function SiteEditorWorkspace() {
  const params = useParams();
  const storeId = params.storeId as string;
  const currentStore = useCurrentStore();
  const pageState = useStorefrontPages(storeId);
  const regionState = useStorefrontRegions(storeId);

  const [activePanel, setActivePanel] = useState<SiteEditorPanelKey>('pages');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedOutlineNodeId, setSelectedOutlineNodeId] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPath, setCreatePath] = useState('');

  const currentOrigin = useSyncExternalStore(
    subscribeToLocationOrigin,
    getLocationOriginSnapshot,
    () => null,
  );

  const defaultSelection = useMemo(
    () => getDefaultStorefrontEditorSelection(pageState.pages),
    [pageState.pages],
  );

  const effectivePageId =
    selectedPageId ??
    (defaultSelection.type === 'page' ? defaultSelection.pageId : null);

  const selectedPage = useMemo(
    () =>
      effectivePageId
        ? pageState.pages.find((page) => page.id === effectivePageId) ?? null
        : null,
    [effectivePageId, pageState.pages],
  );

  const pageGroups = useMemo(
    () => buildSiteEditorPageGroups(pageState.pages),
    [pageState.pages],
  );

  const outlineGroups = useMemo(
    () => buildSiteEditorOutlineGroups(selectedPage, regionState.regions?.draft ?? null),
    [regionState.regions, selectedPage],
  );

  const selectedOutlineNode = useMemo<SiteEditorOutlineNode | null>(() => {
    if (!selectedOutlineNodeId) return null;

    for (const group of outlineGroups) {
      const node = group.nodes.find((entry) => entry.id === selectedOutlineNodeId);
      if (node) return node;
    }

    return null;
  }, [outlineGroups, selectedOutlineNodeId]);

  const previewState = useMemo(
    () =>
      resolveStorefrontPreviewState(
        effectivePageId
          ? { type: 'page', pageId: effectivePageId }
          : defaultSelection,
        pageState.pages,
      ),
    [defaultSelection, effectivePageId, pageState.pages],
  );

  const previewUrl = useMemo(
    () =>
      buildStorefrontPreviewUrl({
        subdomain: currentStore?.subdomain ?? null,
        path: previewState.path,
        currentOrigin,
        configuredOrigin: CONFIGURED_PREVIEW_ORIGIN,
      }),
    [currentOrigin, currentStore?.subdomain, previewState.path],
  );

  async function handleCreatePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const page = await pageState.createPage({
      name: createName,
      path: createPath,
    });

    if (!page) return;

    setCreateName('');
    setCreatePath('');
    setIsCreatingPage(false);
    setSelectedPageId(page.id);
    setActivePanel('pages');
  }

  function renderPagesPanel() {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Pages
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Switch between editable pages and templates. Shared shell items will live in the outline, not here.
          </p>
        </div>

        <div className="rounded-[var(--radius-md)]" style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}>
          <button
            type="button"
            onClick={() => setIsCreatingPage((current) => !current)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FilePlus2 className="h-4 w-4" />
              New content page
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {isCreatingPage ? 'Hide' : 'Show'}
            </span>
          </button>

          {isCreatingPage && (
            <form
              onSubmit={handleCreatePage}
              className="space-y-3 border-t px-4 py-4"
              style={{ borderColor: 'var(--bg-border-subtle)' }}
            >
              <TextInput
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Page name"
                disabled={pageState.isCreating}
              />
              <TextInput
                value={createPath}
                onChange={(event) => setCreatePath(event.target.value)}
                placeholder="/about-us"
                disabled={pageState.isCreating}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pageState.isCreating}
                  className="rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    opacity: pageState.isCreating ? 0.7 : 1,
                  }}
                >
                  {pageState.isCreating ? 'Creating…' : 'Create page'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingPage(false)}
                  className="rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                  style={{
                    border: '1px solid var(--bg-border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {pageGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-tertiary)' }}>
                  {group.label}
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {group.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-[var(--radius-md)]" style={{ border: '1px solid var(--bg-border-subtle)' }}>
                {group.nodes.length === 0 ? (
                  <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No pages here yet.
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                    {group.nodes.map((node) => {
                      const selected = selectedPage?.id === node.pageId;

                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            setSelectedPageId(node.pageId);
                            setSelectedOutlineNodeId(null);
                          }}
                          className="w-full px-4 py-3 text-left transition-colors"
                          style={{
                            background: selected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {node.label}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {node.path}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {!node.isPublished && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                  style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'rgb(180, 83, 9)' }}
                                >
                                  draft only
                                </span>
                              )}
                              {node.hasUnpublishedChanges && node.isPublished && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                  style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' }}
                                >
                                  draft changes
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderOutlinePanel() {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Outline
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Shared shell groups now sit around the current page structure instead of appearing as fake top-level pages.
          </p>
        </div>

        <div className="space-y-4">
          {outlineGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  <FolderTree className="h-4 w-4" />
                  {group.label}
                  {group.shared && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    >
                      shared
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {group.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-[var(--radius-md)]" style={{ border: '1px solid var(--bg-border-subtle)' }}>
                {group.nodes.length === 0 ? (
                  <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {group.id === 'template'
                      ? 'No sections on this page yet.'
                      : 'No shared nodes in this group yet.'}
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                    {group.nodes.map((node) => {
                      const isSelected = node.id === selectedOutlineNodeId;

                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedOutlineNodeId(node.id)}
                          className="w-full px-4 py-3 text-left transition-colors"
                          style={{
                            background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {node.label}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {node.type === 'shared' ? 'Shared shell item' : 'Template section'}
                              </div>
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
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderBlocksPanel() {
    return (
      <EmptyStateCard
        title="Blocks"
        body="This panel will become the searchable insert library. It will be filtered by template, capability set, and the selected outline drop zone before sections and blocks can be added."
      />
    );
  }

  function renderThemePanel() {
    return (
      <EmptyStateCard
        title="Theme"
        body="Theme controls move here next. The goal is to edit global visual tokens and template options in the editor instead of bouncing back to standard settings screens."
      />
    );
  }

  function renderLeftPanel() {
    switch (activePanel) {
      case 'pages':
        return renderPagesPanel();
      case 'outline':
        return renderOutlinePanel();
      case 'blocks':
        return renderBlocksPanel();
      case 'theme':
        return renderThemePanel();
    }
  }

  function renderInspector() {
    if (activePanel === 'pages') {
      return (
        <StorefrontPageInspector
          page={selectedPage}
          isLoading={pageState.isLoading}
          isSaving={pageState.isSaving}
          isPublishing={pageState.isPublishing}
          isDiscarding={pageState.isDiscarding}
          error={pageState.error}
          saveDraft={pageState.saveDraft}
          publish={pageState.publish}
          discard={pageState.discard}
        />
      );
    }

    if (activePanel === 'outline') {
      if (!selectedOutlineNode) {
        return (
          <EmptyStateCard
            title="Outline Inspector"
            body="Select a node from the outline to inspect it. Shared nodes will later expose shell controls here, and template sections will expose section fields and actions."
          />
        );
      }

      return (
        <EmptyStateCard
          title={selectedOutlineNode.label}
          body={
            selectedOutlineNode.type === 'shared'
              ? 'This is a shared shell item. In the next step, its real fields will be editable here and the change will apply across all pages.'
              : 'This is a page section. In the next step, section fields, visibility, variant controls, and drag-and-drop actions will be edited here.'
          }
        />
      );
    }

    if (activePanel === 'blocks') {
      return (
        <EmptyStateCard
          title="Blocks Inspector"
          body="The insert library lands here next with searchable, template-aware block entries and capability-aware filtering."
        />
      );
    }

    return (
      <EmptyStateCard
        title="Theme Inspector"
        body="Theme tokens and template-level controls will move into this panel once the dedicated Site editor owns theme editing."
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header
        className="flex h-14 items-center gap-4 px-4"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${storeId}`}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentStore?.name ?? 'Site'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Site editor workspace
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {selectedPage?.name?.trim() || selectedPage?.path || 'Select a page'}
          </div>
          <div className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {activePanel === 'pages'
              ? 'Pages'
              : activePanel === 'outline'
                ? 'Outline'
                : activePanel === 'blocks'
                  ? 'Blocks'
                  : 'Theme'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {previewUrl.url && (
            <a
              href={previewUrl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
              style={{
                border: '1px solid var(--bg-border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Open page
            </a>
          )}
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className="flex w-[76px] flex-col items-stretch gap-2 px-2 py-3"
          style={{
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--bg-border-subtle)',
          }}
        >
          {PANELS.map((panel) => (
            <PanelButton
              key={panel.key}
              active={panel.key === activePanel}
              icon={panel.icon}
              label={panel.label}
              onClick={() => setActivePanel(panel.key)}
            />
          ))}
        </aside>

        <section
          className="w-[340px] shrink-0 overflow-y-auto px-5 py-5"
          style={{
            background: 'var(--bg-base)',
            borderRight: '1px solid var(--bg-border-subtle)',
          }}
        >
          {renderLeftPanel()}
        </section>

        <main className="min-w-0 flex-1 overflow-hidden p-5" style={{ background: 'var(--bg-base)' }}>
          <div
            className="flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)]"
            style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Preview
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Real storefront iframe inside the new Site editor layout
                </div>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {previewState.title}
              </div>
            </div>

            {(previewState.reason || previewUrl.note) && (
              <div className="space-y-2 px-4 pt-4">
                {previewState.reason && (
                  <div
                    className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
                    style={{
                      borderColor: 'rgba(245, 158, 11, 0.25)',
                      background: 'rgba(245, 158, 11, 0.08)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {previewState.reason}
                  </div>
                )}
                {previewUrl.note && (
                  <div
                    className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
                    style={{
                      borderColor: 'var(--bg-border-subtle)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {previewUrl.note}
                  </div>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 p-4">
              <div
                className="h-full overflow-hidden rounded-[var(--radius-lg)]"
                style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-elevated)' }}
              >
                {previewUrl.url ? (
                  <iframe
                    key={previewUrl.url}
                    title="Site editor preview"
                    src={previewUrl.url}
                    className="h-full w-full bg-white"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-8 text-center">
                    <div className="max-w-md space-y-3">
                      <div className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Preview not configured yet
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Set <code>NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN</code> to your running storefront origin, for example <code>http://{'{subdomain}'}.localhost:3001</code>, and this workspace will use the real storefront renderer here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <aside
          className="w-[360px] shrink-0 overflow-y-auto px-5 py-5"
          style={{
            background: 'var(--bg-base)',
            borderLeft: '1px solid var(--bg-border-subtle)',
          }}
        >
          {renderInspector()}
        </aside>
      </div>
    </div>
  );
}
