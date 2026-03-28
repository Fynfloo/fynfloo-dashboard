// features/products/components/ImageUpload.tsx
'use client';

import { useCallback, useId, useState } from 'react';
import { Upload, X, GripVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/lib/types';

type Props = {
  images: ProductImage[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  // Parent must pass the reverted list on failure — reorder is parent-owned state
  onReorder: (images: { id: string; position: number }[]) => Promise<void>;
  disabled?: boolean;
};

export function ImageUpload({ images, onUpload, onDelete, onReorder, disabled }: Props) {
  // Unique ID per instance — fixes singleton ID bug
  const uid = useId();
  const inputId = `image-upload-${uid}`;

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragItem, setDragItem] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [mainTooltipVisible, setMainTooltipVisible] = useState(false);

  // ─── File handling ────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;
      setError('');

      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError('Only JPEG, PNG and WebP images are allowed');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image must be under 5MB');
          return;
        }
      }

      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          await onUpload(file);
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e?.message ?? 'Upload failed — please try again');
      } finally {
        setUploading(false);
      }
    },
    [onUpload, disabled],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFiles(e.dataTransfer.files);
  }

  // ─── Reorder ──────────────────────────────────────────────────────────────

  function handleDragStart(index: number) {
    setDragItem(index);
  }

  function handleDragEnter(index: number) {
    setDragOver(index);
  }

  async function handleDragEnd() {
    if (dragItem === null || dragOver === null || dragItem === dragOver) {
      setDragItem(null);
      setDragOver(null);
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(dragItem, 1);
    reordered.splice(dragOver, 0, moved);
    const withPositions = reordered.map((img, i) => ({ id: img.id, position: i }));

    setDragItem(null);
    setDragOver(null);

    try {
      await onReorder(withPositions);
      // Parent updates images prop on success — visual order follows
    } catch {
      // Parent did not update images — visual order reverts automatically
      // because images prop is unchanged. No local state to revert.
      setError('Failed to reorder images — please try again');
    }
  }

  // ─── Count helper ─────────────────────────────────────────────────────────

  function getCountText(): string {
    if (images.length === 0) return 'No images yet — add your first image';
    if (images.length === 1) return '1 image — add more to show different angles';
    if (images.length === 2) return '2 images — consider adding a detail shot';
    return `${images.length} images added`;
  }

  return (
    <div className="space-y-3">
      {/* Count context */}
      <p
        className="text-xs"
        style={{ color: images.length === 0 ? 'var(--amber)' : 'var(--text-tertiary)' }}
      >
        {getCountText()}
      </p>

      {/*
        Drop zone — implemented as a <label> pointing to the hidden input.
        This is the correct approach for mobile: <label> receives tap events
        natively and opens the file picker without JS click() tricks.
      */}
      <label
        htmlFor={inputId}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        className={cn(
          'flex flex-col items-center justify-center gap-2',
          'rounded-xl border-2 border-dashed p-8 transition-all duration-150',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        )}
        style={{
          borderColor: isDraggingOver ? 'var(--accent)' : 'var(--bg-border)',
          background: isDraggingOver ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        }}
      >
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          // Reset value so re-selecting same file triggers onChange
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
        />

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-surface)' }}
        >
          {uploading ? (
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          ) : (
            <Upload
              className="h-5 w-5"
              style={{ color: isDraggingOver ? 'var(--accent)' : 'var(--text-tertiary)' }}
            />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {uploading
              ? 'Uploading…'
              : isDraggingOver
                ? 'Drop to upload'
                : 'Drop images here or click to upload'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            JPEG, PNG, WebP — max 5MB each
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Products with images convert significantly better
          </p>
        </div>
      </label>

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--red)' }}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              className="relative group rounded-lg overflow-hidden aspect-square"
              style={{
                border: dragOver === index ? '2px solid var(--accent)' : '2px solid transparent',
                opacity: dragItem === index ? 0.5 : 1,
                background: 'var(--bg-elevated)',
              }}
            >
              <img
                src={image.url}
                alt={image.alt ?? `Product image ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />

              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <div
                  className="p-1.5 rounded-lg cursor-grab active:cursor-grabbing"
                  style={{ color: 'white' }}
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await onDelete(image.id);
                    } catch {
                      setError('Failed to delete image');
                    }
                  }}
                  className="p-1.5 rounded-lg"
                  style={{ color: 'white' }}
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Main badge */}
              {index === 0 && (
                <div className="absolute top-1.5 left-1.5">
                  <div
                    className="px-1.5 py-0.5 rounded text-xs font-medium cursor-help"
                    style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
                    onMouseEnter={() => setMainTooltipVisible(true)}
                    onMouseLeave={() => setMainTooltipVisible(false)}
                  >
                    Main
                  </div>
                  {mainTooltipVisible && (
                    <div
                      className="absolute top-7 left-0 w-44 px-2.5 py-2 rounded-lg text-xs z-10 pointer-events-none"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--bg-border-subtle)',
                        boxShadow: 'var(--shadow-elevated)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Your main product image — shown on the listing page. Drag to reorder.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
