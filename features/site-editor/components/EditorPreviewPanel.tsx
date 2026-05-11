'use client';

import type { RefObject } from 'react';

export function EditorPreviewPanel({
  previewUrl,
  previewSessionNote,
  previewSessionError,
  previewStateTitle,
  previewStateReason,
  previewRefreshKey,
  previewFrameRef,
  onFrameLoad,
}: {
  previewUrl: { url: string | null; note: string | null };
  previewSessionNote: string | null;
  previewSessionError: string | null;
  previewStateTitle: string;
  previewStateReason: string | null;
  previewRefreshKey: number;
  previewFrameRef: RefObject<HTMLIFrameElement | null>;
  onFrameLoad: () => void;
}) {
  const hasNotes = previewStateReason || previewSessionNote || previewUrl.note;

  return (
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
            Site view
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Draft changes appear here as you edit.
          </div>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {previewStateTitle}
        </div>
      </div>

      {hasNotes && (
        <div className="space-y-2 px-4 pt-4">
          {previewStateReason && (
            <div
              className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
              style={{
                borderColor: 'rgba(245, 158, 11, 0.25)',
                background: 'rgba(245, 158, 11, 0.08)',
                color: 'var(--text-primary)',
              }}
            >
              {previewStateReason}
            </div>
          )}
          {previewSessionNote && (
            <div
              className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
              style={{
                borderColor: previewSessionError
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'var(--bg-border-subtle)',
                background: previewSessionError ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-elevated)',
                color: previewSessionError ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {previewSessionNote}
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
              key={`${previewUrl.url}:${previewRefreshKey}`}
              ref={previewFrameRef}
              title="Site editor preview"
              src={previewUrl.url}
              onLoad={onFrameLoad}
              className="h-full w-full bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <div className="max-w-md space-y-3">
                <div className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Site view unavailable
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Finish the site setup for this environment and reload the editor.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
