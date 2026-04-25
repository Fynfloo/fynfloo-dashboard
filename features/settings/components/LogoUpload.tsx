'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadLogo, deleteLogo } from '../hooks/useSettings';
import type { StoreSettings } from '@/lib/types';

type Props = {
  tenantId: string;
  settings: StoreSettings;
  onUpdate: (updated: StoreSettings) => void;
};

export function LogoUpload({ tenantId, settings, onUpdate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setError('Only JPEG, PNG, WebP and SVG images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be under 2MB');
      return;
    }

    setError('');
    setIsUploading(true);
    try {
      const updated = await uploadLogo(tenantId, file);
      onUpdate(updated);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Upload failed — please try again');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete() {
    setError('');
    setIsDeleting(true);
    try {
      const updated = await deleteLogo(tenantId);
      onUpdate(updated);
    } catch {
      setError('Failed to remove logo');
    } finally {
      setIsDeleting(false);
    }
  }

  const isPending = isUploading || isDeleting;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Logo preview or placeholder */}
        <div
          className="w-16 h-16 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border-subtle)',
          }}
        >
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="Store logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-xl font-bold" style={{ color: 'var(--text-tertiary)' }}>
              {settings.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border-subtle)',
              color: 'var(--text-primary)',
              opacity: isPending ? 0.6 : 1,
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {settings.logoUrl ? 'Replace' : 'Upload logo'}
          </button>

          {settings.logoUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border-subtle)',
                color: 'var(--red)',
                opacity: isPending ? 0.6 : 1,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Remove
            </button>
          )}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        JPEG, PNG, WebP or SVG — max 2MB. Recommended: square, at least 512×512px.
      </p>

      {error && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
