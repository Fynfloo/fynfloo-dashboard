// features/products/components/ImageUpload.tsx
'use client';

import { useCallback, useState } from 'react';
import { Upload, X, GripVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/lib/types';

type Props = {
  images: ProductImage[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  onReorder: (images: { id: string; position: number }[]) => Promise<void>;
  disabled?: boolean;
};

export function ImageUpload({ images, onUpload, onDelete, onReorder, disabled }: Props) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragItem, setDragItem] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // ─── File drop / select ──────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || disabled) return;
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

  // ─── Image reorder ───────────────────────────────────────────────────────

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
    } catch {
      setError('Failed to reorder images');
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2',
          'rounded-xl border-2 border-dashed p-8 transition-all duration-150',
          'cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={{
          borderColor: isDraggingOver ? 'var(--accent)' : 'var(--bg-border)',
          background: isDraggingOver ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        }}
        onClick={() => {
          if (disabled) return;
          document.getElementById('image-upload-input')?.click();
        }}
      >
        <input
          id="image-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-surface)' }}
        >
          <Upload
            className="h-5 w-5"
            style={{ color: isDraggingOver ? 'var(--accent)' : 'var(--text-tertiary)' }}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {uploading ? 'Uploading…' : 'Drop images here or click to upload'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            JPEG, PNG, WebP — max 5MB each
          </p>
        </div>
      </div>

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
              />

              {/* Overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <div
                  className="p-1 rounded cursor-grab"
                  style={{ color: 'white' }}
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await onDelete(image.id);
                    } catch {
                      setError('Failed to delete image');
                    }
                  }}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'white' }}
                  title="Delete image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Position badge */}
              {index === 0 && (
                <div
                  className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                  }}
                >
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
