// features/products/components/DigitalAssetPanel.tsx
'use client';

import { useRef, useState } from 'react';
import { Upload, File, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDigitalAsset } from '../hooks/useProducts';
import type { DigitalAsset } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'video/mp4',
  'application/epub+zip',
  'application/octet-stream',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
].join(',');

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  storeId: string;
  productId: string;
  asset: DigitalAsset | null;
  onChange: (asset: DigitalAsset | null) => void;
  disabled?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DigitalAssetPanel({ storeId, productId, asset, onChange, disabled }: Props) {
  const { uploadAsset, updateSettings, deleteAsset, isPending } = useDigitalAsset(
    storeId,
    productId,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  // Local settings state — synced from asset prop, editable inline
  const [maxDownloads, setMaxDownloads] = useState(asset?.maxDownloads ?? 5);
  const [expiryHours, setExpiryHours] = useState(asset?.expiryHours ?? 48);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ─── Upload ───────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setError('');

    if (file.size > 500 * 1024 * 1024) {
      setError('File must be under 500MB');
      return;
    }

    try {
      const uploaded = await uploadAsset(file);
      onChange(uploaded);
      // Reset settings to defaults from new asset
      setMaxDownloads(uploaded.maxDownloads);
      setExpiryHours(uploaded.expiryHours);
      setSettingsDirty(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Upload failed — please try again');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected (replace flow)
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    setError('');
    try {
      await deleteAsset();
      onChange(null);
      setMaxDownloads(5);
      setExpiryHours(48);
      setSettingsDirty(false);
    } catch {
      setError('Failed to delete file — please try again');
    }
  }

  // ─── Settings save ────────────────────────────────────────────────────────

  async function handleSaveSettings() {
    setError('');
    setSettingsSaving(true);
    try {
      const updated = await updateSettings({ maxDownloads, expiryHours });
      onChange(updated);
      setSettingsDirty(false);
    } catch {
      setError('Failed to save settings — please try again');
    } finally {
      setSettingsSaving(false);
    }
  }

  const busy = isPending || disabled;

  // ─── Render: no asset yet ─────────────────────────────────────────────────

  if (!asset) {
    return (
      <div className="space-y-3">
        {error && (
          <p
            className="text-xs px-3 py-2 rounded-lg"
            style={{
              color: 'var(--red)',
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
            }}
          >
            {error}
          </p>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !busy && fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors duration-150"
          style={{
            borderColor: dragOver ? 'var(--accent)' : 'var(--bg-border)',
            background: dragOver ? 'var(--accent-dim)' : 'var(--bg-elevated)',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {isPending ? (
            <>
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
              />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Uploading…
              </p>
            </>
          ) : (
            <>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-surface)' }}
              >
                <Upload className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Drop your file here, or <span style={{ color: 'var(--accent)' }}>browse</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  PDF, ZIP, MP3, MP4, EPUB and more — max 500MB
                </p>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleInputChange}
          disabled={busy}
        />
      </div>
    );
  }

  // ─── Render: asset exists ─────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {error && (
        <p
          className="text-xs px-3 py-2 rounded-lg"
          style={{
            color: 'var(--red)',
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
          }}
        >
          {error}
        </p>
      )}

      {/* File card */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border-subtle)' }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-dim)' }}
        >
          <File className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
            title={asset.fileName}
          >
            {asset.fileName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {formatBytes(asset.fileSize)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => !busy && fileInputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
            style={{
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              opacity: busy ? 0.5 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
            title="Replace file"
          >
            <RefreshCw className="w-3 h-3" />
            Replace
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="p-1.5 rounded-lg transition-colors duration-150"
            style={{
              color: 'var(--red)',
              background: 'transparent',
              opacity: busy ? 0.5 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
            title="Delete file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleInputChange}
        disabled={busy}
      />

      {/* Download settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="maxDownloads">Max downloads</Label>
          <Input
            id="maxDownloads"
            type="number"
            min={1}
            max={100}
            value={maxDownloads}
            onChange={(e) => {
              setMaxDownloads(Number(e.target.value));
              setSettingsDirty(true);
            }}
            disabled={busy}
          />
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            How many times the link can be used
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiryHours">Link expiry (hours)</Label>
          <Input
            id="expiryHours"
            type="number"
            min={1}
            max={720}
            value={expiryHours}
            onChange={(e) => {
              setExpiryHours(Number(e.target.value));
              setSettingsDirty(true);
            }}
            disabled={busy}
          />
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Hours until the download link expires
          </p>
        </div>
      </div>

      {settingsDirty && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={settingsSaving}
          disabled={settingsSaving || busy}
          onClick={handleSaveSettings}
        >
          Save download settings
        </Button>
      )}
    </div>
  );
}
