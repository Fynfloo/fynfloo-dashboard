// features/settings/components/ThemeSettingsForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

const FONT_OPTIONS = ['Inter', 'Geist', 'DM Sans', 'Playfair Display', 'Fraunces'] as const;

const RADIUS_OPTIONS = [
  { value: '0px', label: 'Sharp' },
  { value: '4px', label: 'Slight' },
  { value: '8px', label: 'Rounded' },
  { value: '12px', label: 'Extra rounded' },
] as const;

const BUTTON_OPTIONS = [
  { value: 'filled', label: 'Filled' },
  { value: 'outline', label: 'Outline' },
  { value: 'pill', label: 'Pill' },
] as const;

interface Props {
  storeId: string;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 py-2 text-xs font-medium rounded-[var(--radius-md)] transition-colors"
            style={{
              background: active ? 'var(--accent)' : 'var(--bg-elevated)',
              color: active ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--bg-border-subtle)'}`,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeSettingsForm({ storeId }: Props) {
  const { settings, isLoading, isSaving, error, saveTheme } = useSettings(storeId);

  const [primaryColour, setPrimaryColour] = useState('#000000');
  const [secondaryColour, setSecondaryColour] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [borderRadius, setBorderRadius] = useState('8px');
  const [buttonStyle, setButtonStyle] = useState('filled');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings?.themeSettings) {
      const t = settings.themeSettings as Record<string, string>;
      if (t.primaryColour) setPrimaryColour(t.primaryColour);
      if (t.secondaryColour) setSecondaryColour(t.secondaryColour);
      if (t.fontFamily) setFontFamily(t.fontFamily);
      if (t.borderRadius) setBorderRadius(t.borderRadius);
      if (t.buttonStyle) setButtonStyle(t.buttonStyle);
    }
  }, [settings]);

  async function handleSave() {
    const ok = await saveTheme({
      primaryColour,
      secondaryColour,
      fontFamily,
      borderRadius,
      buttonStyle,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-md">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-14 rounded-[var(--radius-md)]"
            style={{ background: 'var(--bg-elevated)' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-10 items-start">
      {/* Controls */}
      <div className="flex-1 max-w-md space-y-6">
        {error && (
          <div
            className="px-4 py-3 rounded-[var(--radius-md)] text-sm"
            style={{
              background: 'var(--red-bg)',
              color: 'var(--red)',
              border: '1px solid var(--red-border)',
            }}
          >
            {error}
          </div>
        )}

        {/* Primary colour */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Primary colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColour}
              onChange={(e) => setPrimaryColour(e.target.value)}
              className="w-10 h-10 rounded-[var(--radius-md)] cursor-pointer p-0.5"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border-subtle)',
              }}
            />
            <input
              value={primaryColour}
              onChange={(e) => setPrimaryColour(e.target.value)}
              className="flex-1 px-3 py-2 rounded-[var(--radius-md)] text-sm font-mono outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border-subtle)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border-subtle)')}
            />
          </div>
        </div>

        {/* Secondary colour */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Secondary colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondaryColour}
              onChange={(e) => setSecondaryColour(e.target.value)}
              className="w-10 h-10 rounded-[var(--radius-md)] cursor-pointer p-0.5"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border-subtle)',
              }}
            />
            <input
              value={secondaryColour}
              onChange={(e) => setSecondaryColour(e.target.value)}
              className="flex-1 px-3 py-2 rounded-[var(--radius-md)] text-sm font-mono outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border-subtle)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border-subtle)')}
            />
          </div>
        </div>

        {/* Font */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Font
          </label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Corner style */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Corner style
          </label>
          <SegmentedControl
            options={RADIUS_OPTIONS}
            value={borderRadius as any}
            onChange={setBorderRadius}
          />
        </div>

        {/* Button style */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Button style
          </label>
          <SegmentedControl
            options={BUTTON_OPTIONS}
            value={buttonStyle as any}
            onChange={setButtonStyle}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
            style={{
              background: 'var(--accent)',
              color: 'white',
              opacity: isSaving ? 0.6 : 1,
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? 'Saving…' : 'Save theme'}
          </button>
          {saved && (
            <span className="text-sm" style={{ color: 'var(--green)' }}>
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="hidden lg:block w-72 shrink-0">
        <p
          className="text-xs font-semibold mb-3 tracking-widest uppercase"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Preview
        </p>
        <div
          className="rounded-[var(--radius-lg)] p-6 space-y-4"
          style={{
            background: secondaryColour,
            border: '1px solid var(--bg-border-subtle)',
            fontFamily,
          }}
        >
          <p className="text-lg font-bold" style={{ color: primaryColour }}>
            Sample Product
          </p>
          <p className="text-sm" style={{ color: primaryColour, opacity: 0.65 }}>
            A beautiful product for your store
          </p>
          <p className="text-xl font-semibold" style={{ color: primaryColour }}>
            £49.99
          </p>
          <button
            className="w-full py-2.5 text-sm font-medium"
            style={{
              background: buttonStyle === 'outline' ? 'transparent' : primaryColour,
              color: buttonStyle === 'outline' ? primaryColour : secondaryColour,
              border: `2px solid ${primaryColour}`,
              borderRadius: buttonStyle === 'pill' ? '9999px' : borderRadius,
            }}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
