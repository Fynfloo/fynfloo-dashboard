'use client';

import type { SiteEditorPanelKey } from '../lib/siteEditor';

function PanelButton({
  active,
  controlsId,
  expanded,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  controlsId: string;
  expanded: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-controls={controlsId}
      aria-expanded={expanded}
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

export function SiteEditorSidebar({
  panels,
  activePanel,
  isPanelOpen,
  onPanelClick,
}: {
  panels: Array<{ key: SiteEditorPanelKey; label: string; icon: React.ComponentType<{ className?: string }> }>;
  activePanel: SiteEditorPanelKey;
  isPanelOpen: boolean;
  onPanelClick: (key: SiteEditorPanelKey) => void;
}) {
  return (
    <aside
      className="flex w-[76px] flex-col items-stretch gap-2 px-2 py-3"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-border-subtle)' }}
    >
      {panels.map((panel) => (
        <PanelButton
          key={panel.key}
          active={panel.key === activePanel}
          controlsId={`${panel.key}-panel`}
          expanded={panel.key === activePanel && isPanelOpen}
          icon={panel.icon}
          label={panel.label}
          onClick={() => onPanelClick(panel.key)}
        />
      ))}
    </aside>
  );
}
