'use client';

import {
  useEffect,
  useMemo,
  type Dispatch,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type SetStateAction,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertTriangle, CheckCircle2, Eye, LayoutTemplate, RefreshCw, Save } from 'lucide-react';
import type { StorefrontSection } from '@/lib/types';
import {
  applyEditableSectionDraft,
  buildEditableSectionDraft,
  type EditableSectionDraft,
} from '../lib/sectionEditing';
import {
  useSiteEditorDraftSession,
  type SiteEditorSaveState,
} from '../lib/useSiteEditorDraftSession';

type StorefrontSectionInspectorProps = {
  section: StorefrontSection | null;
  sectionLabel: string;
  error: string | null;
  saveDraft: (nextSection: StorefrontSection) => Promise<boolean>;
  onDirtyChange?: (hasUnsavedChanges: boolean) => void;
  onPreviewChange?: (nextSection: StorefrontSection | null) => void;
  onSaveStateChange?: (state: SiteEditorSaveState) => void;
};

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {label}
      </label>
      {children}
      {helper && (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {helper}
        </p>
      )}
    </div>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
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

function TextareaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-[96px] w-full resize-y rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
      }}
    />
  );
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
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

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

function serializeDraft(draft: EditableSectionDraft | null): string {
  return JSON.stringify(draft);
}

function renderDraftFields(
  draft: EditableSectionDraft,
  setDraft: Dispatch<SetStateAction<EditableSectionDraft | null>>,
) {
  switch (draft.type) {
    case 'hero.basic':
      return (
        <>
          <Field label="Eyebrow">
            <TextInput
              value={draft.eyebrow}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'hero.basic'
                    ? { ...current, eyebrow: event.target.value }
                    : current,
                )
              }
              placeholder="Optional short label"
            />
          </Field>
          <Field label="Title">
            <TextInput
              value={draft.title}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'hero.basic'
                    ? { ...current, title: event.target.value }
                    : current,
                )
              }
              placeholder="Page headline"
            />
          </Field>
          <Field label="Subtitle">
            <TextareaInput
              value={draft.subtitle}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'hero.basic'
                    ? { ...current, subtitle: event.target.value }
                    : current,
                )
              }
              placeholder="Add supporting text"
            />
          </Field>
          <Field label="Image URL">
            <TextInput
              value={draft.imageUrl}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'hero.basic'
                    ? { ...current, imageUrl: event.target.value }
                    : current,
                )
              }
              placeholder="https://..."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button text">
              <TextInput
                value={draft.primaryCtaLabel}
                onChange={(event) =>
                  setDraft((current) =>
                    current && current.type === 'hero.basic'
                      ? { ...current, primaryCtaLabel: event.target.value }
                      : current,
                  )
                }
                placeholder="Shop now"
              />
            </Field>
            <Field label="Secondary button text">
              <TextInput
                value={draft.secondaryCtaLabel}
                onChange={(event) =>
                  setDraft((current) =>
                    current && current.type === 'hero.basic'
                      ? { ...current, secondaryCtaLabel: event.target.value }
                      : current,
                  )
                }
                placeholder="Learn more"
              />
            </Field>
          </div>
        </>
      );

    case 'content.textWithMedia':
      return (
        <>
          <Field label="Eyebrow">
            <TextInput
              value={draft.eyebrow}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'content.textWithMedia'
                    ? { ...current, eyebrow: event.target.value }
                    : current,
                )
              }
              placeholder="Optional short label"
            />
          </Field>
          <Field label="Title">
            <TextInput
              value={draft.title}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'content.textWithMedia'
                    ? { ...current, title: event.target.value }
                    : current,
                )
              }
              placeholder="Section heading"
            />
          </Field>
          <Field label="Body">
            <TextareaInput
              value={draft.body}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'content.textWithMedia'
                    ? { ...current, body: event.target.value }
                    : current,
                )
              }
              placeholder="Add the main message for this section"
            />
          </Field>
          <Field label="Image URL">
            <TextInput
              value={draft.imageUrl}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'content.textWithMedia'
                    ? { ...current, imageUrl: event.target.value }
                    : current,
                )
              }
              placeholder="https://..."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Image alt text">
              <TextInput
                value={draft.imageAlt}
                onChange={(event) =>
                  setDraft((current) =>
                    current && current.type === 'content.textWithMedia'
                      ? { ...current, imageAlt: event.target.value }
                      : current,
                  )
                }
                placeholder="Describe the image"
              />
            </Field>
            <Field label="Image position">
              <SelectInput
                value={draft.imagePosition}
                onChange={(event) =>
                  setDraft((current) =>
                    current && current.type === 'content.textWithMedia'
                      ? {
                          ...current,
                          imagePosition:
                            event.target.value === 'left' ? 'left' : 'right',
                        }
                      : current,
                  )
                }
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </SelectInput>
            </Field>
          </div>
        </>
      );

    case 'content.testimonials':
      return (
        <>
          <Field label="Heading">
            <TextInput
              value={draft.heading}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'content.testimonials'
                    ? { ...current, heading: event.target.value }
                    : current,
                )
              }
              placeholder="What customers are saying"
            />
          </Field>
          <Field
            label="Testimonials"
            helper="Use one line per testimonial. Add a name after a | character."
          >
            <TextareaInput
              value={draft.testimonialsText}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'content.testimonials'
                    ? { ...current, testimonialsText: event.target.value }
                    : current,
                )
              }
              placeholder={"Loved it | Ada\nBeautiful quality | Michael"}
            />
          </Field>
        </>
      );

    case 'commerce.categoryGrid':
      return (
        <>
          <Field label="Heading">
            <TextInput
              value={draft.heading}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.categoryGrid'
                    ? { ...current, heading: event.target.value }
                    : current,
                )
              }
              placeholder="Shop by category"
            />
          </Field>
          <Field
            label="Categories"
            helper="Use one line per category in the format Name | handle | optional image URL."
          >
            <TextareaInput
              value={draft.categoriesText}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.categoryGrid'
                    ? { ...current, categoriesText: event.target.value }
                    : current,
                )
              }
              placeholder={"Dresses | dresses\nShoes | shoes | https://..."}
            />
          </Field>
        </>
      );

    case 'commerce.featuredCarousel':
      return (
        <>
          <Field label="Heading">
            <TextInput
              value={draft.heading}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.featuredCarousel'
                    ? { ...current, heading: event.target.value }
                    : current,
                )
              }
              placeholder="Best sellers"
            />
          </Field>
          <Field label="Muted heading">
            <TextInput
              value={draft.headingMuted}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.featuredCarousel'
                    ? { ...current, headingMuted: event.target.value }
                    : current,
                )
              }
              placeholder="Optional second line"
            />
          </Field>
          <Field label="Promo heading">
            <TextInput
              value={draft.promoHeading}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.featuredCarousel'
                    ? { ...current, promoHeading: event.target.value }
                    : current,
                )
              }
              placeholder="Highlight a collection or campaign"
            />
          </Field>
          <Field label="Promo subheading">
            <TextareaInput
              value={draft.promoSubheading}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.featuredCarousel'
                    ? { ...current, promoSubheading: event.target.value }
                    : current,
                )
              }
              placeholder="Add a short supporting message"
            />
          </Field>
          <Field label="Promo button text">
            <TextInput
              value={draft.promoCtaLabel}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.featuredCarousel'
                    ? { ...current, promoCtaLabel: event.target.value }
                    : current,
                )
              }
              placeholder="Browse collection"
            />
          </Field>
        </>
      );

    case 'commerce.productGrid':
      return (
        <>
          <Field label="Heading">
            <TextInput
              value={draft.heading}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.productGrid'
                    ? { ...current, heading: event.target.value }
                    : current,
                )
              }
              placeholder="All products"
            />
          </Field>
          <Field label="Subheading">
            <TextareaInput
              value={draft.subheading}
              onChange={(event) =>
                setDraft((current) =>
                  current && current.type === 'commerce.productGrid'
                    ? { ...current, subheading: event.target.value }
                    : current,
                )
              }
              placeholder="Add a short supporting message"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Collection handle">
              <TextInput
                value={draft.collectionHandle}
                onChange={(event) =>
                  setDraft((current) =>
                    current && current.type === 'commerce.productGrid'
                      ? { ...current, collectionHandle: event.target.value }
                      : current,
                  )
                }
                placeholder="Leave blank for all products"
              />
            </Field>
            <Field label="Columns">
              <TextInput
                type="number"
                min={1}
                max={4}
                value={String(draft.columns)}
                onChange={(event) =>
                  setDraft((current) =>
                    current && current.type === 'commerce.productGrid'
                      ? {
                          ...current,
                          columns: Number.isFinite(event.target.valueAsNumber)
                            ? event.target.valueAsNumber
                            : current.columns,
                        }
                      : current,
                  )
                }
              />
            </Field>
          </div>
        </>
      );
  }
}

export function StorefrontSectionInspector({
  section,
  sectionLabel,
  error,
  saveDraft,
  onDirtyChange,
  onPreviewChange,
  onSaveStateChange,
}: StorefrontSectionInspectorProps) {
  const baseDraft = useMemo(
    () => (section ? buildEditableSectionDraft(section) : null),
    [section],
  );

  const {
    draft,
    setDraft,
    saveState,
    hasPendingChanges,
    saveNow,
  } = useSiteEditorDraftSession({
    resetKey: section?.id ?? sectionLabel,
    initialValue: baseDraft,
    serialize: serializeDraft,
    autosaveMs: 700,
    save: async (nextDraft) => {
      if (!section || !nextDraft) {
        return { ok: false };
      }

      const nextSection = applyEditableSectionDraft(section, nextDraft);
      const saved = await saveDraft(nextSection);
      return saved ? { ok: true, persisted: nextDraft } : { ok: false };
    },
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
    return () => onDirtyChange?.(false);
  }, [hasPendingChanges, onDirtyChange]);

  useEffect(() => {
    onSaveStateChange?.(saveState);
    return () => onSaveStateChange?.('idle');
  }, [onSaveStateChange, saveState]);

  useEffect(() => {
    if (!section || !draft) {
      return;
    }

    onPreviewChange?.(applyEditableSectionDraft(section, draft));
  }, [draft, onPreviewChange, section]);

  if (!section) {
    return (
      <div
        className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-lg)] p-5 text-sm"
        style={{
          border: '1px solid var(--bg-border-subtle)',
          background: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
        }}
      >
        Choose a section to edit it here.
      </div>
    );
  }

  if (!draft) {
    return (
      <div
        className="rounded-[var(--radius-lg)] p-5 space-y-4"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="space-y-1">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {sectionLabel}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This section will become editable here as more layout options are added.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] p-5 space-y-5"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {sectionLabel}
            </h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Update the content and settings for this part of the page.
          </p>
        </div>

        {draft.type === 'hero.basic' && (
          <div
            className="flex items-start gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <LayoutTemplate className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Want a different layout? Open Blocks to choose another hero style.</p>
          </div>
        )}

      {error && (
        <div
          className="flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: 'rgb(153, 27, 27)',
            }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saveState === 'error' && !error && (
          <div
            className="flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: 'rgb(153, 27, 27)',
            }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>We couldn&apos;t save these changes yet. Keep editing or try again.</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Toggle
          checked={draft.visible}
          onChange={(visible) =>
            setDraft((current) => (current ? { ...current, visible } : current))
          }
          label="Show this section"
        />

        {renderDraftFields(draft, setDraft)}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Changes stay in draft until you publish the page.
          </span>
          {saveState === 'saving' && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <RefreshCw className="h-3.5 w-3.5" />
              Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--green)' }}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void saveNow()}
          disabled={saveState === 'saving'}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
          style={{
            background: 'var(--accent)',
            color: 'white',
            opacity: saveState === 'saving' ? 0.7 : 1,
          }}
        >
          <Save className="h-4 w-4" />
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved'
              : saveState === 'error'
                ? 'Retry save'
                : 'Save now'}
        </button>
      </div>
    </div>
  );
}
